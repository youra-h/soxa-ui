import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import type { IComponentDescriptor } from '@soxa-ui/setup'
import type { TManifest, TSourceRole } from './types'

export const root = resolve(import.meta.dirname, '../..')

export function sourcePath(file: string): string {
	return relative(root, file).split(sep).join('/')
}

export function filesIn(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true })
		.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
		.flatMap((entry) => {
			const file = join(directory, entry.name)
			return entry.isDirectory() ? filesIn(file) : [file]
		})
}

function isDescriptor(value: unknown): value is IComponentDescriptor {
	return (
		typeof value === 'object' &&
		value !== null &&
		'getProps' in value &&
		'getEvents' in value &&
		'slots' in value
	)
}

/** Manifests already identify component/facade wiring, without executing framework components. */
export async function discoverManifests(): Promise<TManifest[]> {
	const directory = resolve(root, 'packages/ui/angular/src/components')
	const manifests: TManifest[] = []

	for (const file of filesIn(directory).filter((file) => file.endsWith(`${sep}manifest.ts`))) {
		const source = ts.createSourceFile(
			file,
			readFileSync(file, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		)
		const module: Record<string, unknown> = await import(pathToFileURL(file).href)
		const sources: TManifest['sources'] = []

		for (const statement of source.statements) {
			if (
				!ts.isExportDeclaration(statement) ||
				!statement.exportClause ||
				!ts.isNamedExports(statement.exportClause)
			)
				continue
			for (const entry of statement.exportClause.elements) {
				const role = entry.name.text
				if (!isSourceRole(role)) continue
				const factory = module[role]
				if (typeof factory !== 'function')
					throw new Error(`Missing descriptor factory: ${file}:${role}`)
				const descriptor: unknown = factory()
				if (!isDescriptor(descriptor))
					throw new Error(`Invalid descriptor: ${file}:${role}`)
				sources.push({ role, name: (entry.propertyName ?? entry.name).text, descriptor })
			}
		}

		if (!sources.some((source) => source.role === 'descriptor'))
			throw new Error(`Missing primary descriptor: ${file}`)
		const id = relative(directory, resolve(file, '..')).split(sep).join('-')
		const name = id
			.split('-')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join('')
		manifests.push({ id, name, file, sources })
	}

	return manifests
}

function isSourceRole(value: string): value is TSourceRole {
	return value === 'descriptor' || value === 'facade' || value === 'ownerFacade'
}
