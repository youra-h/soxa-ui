import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import * as setup from '@soxa-ui/setup'
import {
	TSurface,
	underscorePropNaming,
	type IPluginDefinition,
	type IComponentDescriptor,
} from '@soxa-ui/setup'
import { useInputs } from '../../packages/ui/angular/src/adapter/common/useInputs'
import ts from 'typescript'
import { discoverManifests, filesIn } from './discover'
import { frameworks } from './frameworks'
import { TypeReader } from './type-reader'
import type {
	TApi,
	TBindings,
	TComponent,
	TContract,
	TContractTypes,
	TFramework,
	TPlugin,
	TProp,
} from './types'

const frameworkNames = Object.keys(frameworks).filter(isFramework)

function isFramework(name: string): name is TFramework {
	return Object.hasOwn(frameworks, name)
}

function isPlugin(value: unknown): value is IPluginDefinition {
	return (
		typeof value === 'object' &&
		value !== null &&
		'getProps' in value &&
		'getEvents' in value &&
		'ctor' in value &&
		'with' in value
	)
}

/** Defaults are display expressions, never executed or converted through lossy JSON.stringify. */
export function defaultText(value: unknown, ancestors = new Set<object>()): string {
	if (value === undefined) return 'undefined'
	if (value === null) return 'null'
	if (typeof value === 'string') return JSON.stringify(value)
	if (typeof value === 'number' || typeof value === 'boolean') return String(value)
	if (typeof value === 'bigint') return `${value}n`
	if (typeof value === 'symbol') return String(value)
	if (typeof value === 'function') return `[Function${value.name ? ` ${value.name}` : ''}]`
	if (typeof value !== 'object') throw new Error('Unsupported default value')
	if (ancestors.has(value)) throw new Error('Circular default value')
	const next = new Set(ancestors).add(value)
	if (Array.isArray(value)) return `[${value.map((item) => defaultText(item, next)).join(', ')}]`
	if (value instanceof Date) return `new Date(${JSON.stringify(value.toISOString())})`
	return `{ ${Object.entries(value)
		.map(([key, item]) => `${JSON.stringify(key)}: ${defaultText(item, next)}`)
		.join(', ')} }`
}

function requiredMember(
	types: Map<string, { type: string; required: boolean; description?: string }>,
	name: string,
	context: string,
) {
	const member = types.get(name)
	if (!member || member.type === 'any')
		throw new Error(
			`Missing precise ${context} type: ${name}; found: ${[...types.keys()].join(', ')}`,
		)
	return member
}

/** Only declared inputs/events/slots are documented; triggers only contribute model bindings. */
export function contractOf(
	source: IComponentDescriptor | IPluginDefinition,
	types: TContractTypes,
	file: string,
): TContract {
	const props: TProp[] = source
		.getProps()
		.filter((spec) => !spec.protected)
		.map((spec) => {
			const name = underscorePropNaming(spec.name)
			return {
				name,
				canonicalName: spec.name.getName(),
				...requiredMember(types.props, name, `property in ${file}`),
				hasDefault: spec.hasDefault,
				...(spec.hasDefault ? { default: defaultText(spec.default) } : {}),
			}
		})
	const events = [
		...new Map(source.getEvents().map((name) => [name.getName(), name])).values(),
	].map((name) => {
		const member = requiredMember(types.events, name.getName(), 'event')
		return {
			name: name.getName(),
			type: member.type,
			...(member.description ? { description: member.description } : {}),
		}
	})
	const slots = ('slots' in source ? source.slots : []).map((slot) => ({
		name: slot.name,
		...(slot.description ? { description: slot.description } : {}),
		scope: Object.fromEntries(
			Object.keys(slot.scope ?? {}).map((name) => [
				name,
				requiredMember(types.slots.get(slot.name) ?? new Map(), name, `slot ${slot.name}`),
			]),
		),
	}))
	const bindings = (framework: TFramework): TBindings => {
		const spec = frameworks[framework]
		const surface = TSurface.of(source, spec.profile)
		const inputs =
			framework === 'angular' && 'slots' in source
				? new Set(['ctrl', ...useInputs(source)])
				: undefined
		return {
			props: Object.fromEntries(
				surface.props
					.filter(
						({ spec, exportName }) =>
							!spec.protected && (!inputs || inputs.has(exportName)),
					)
					.map(({ spec: prop, exportName }) => [
						underscorePropNaming(prop.name),
						spec.property(exportName),
					]),
			),
			events: Object.fromEntries(
				surface.events.map(({ name, exportName }) => [
					name.getName(),
					spec.event(exportName),
				]),
			),
			models: Object.fromEntries(
				surface.props.flatMap(({ spec: prop, model }) =>
					model === undefined
						? []
						: [[underscorePropNaming(prop.name), spec.event(model)]],
				),
			),
			slots: Object.fromEntries(
				slots.map((slot) => [
					slot.name,
					{
						name: setup.resolveSlotName(
							slot.name,
							spec.profile.defaultSlot ?? 'default',
						),
						syntax: spec.slot(slot.name, Object.keys(slot.scope).length > 0),
					},
				]),
			),
		}
	}
	return {
		source: file,
		props,
		events,
		slots,
		frameworks: {
			vue: bindings('vue'),
			react: bindings('react'),
			angular: bindings('angular'),
			solid: bindings('solid'),
			svelte: bindings('svelte'),
			webc: bindings('webc'),
		},
	}
}

function angularSelector(manifest: string, exportName: string): string {
	for (const file of filesIn(dirname(manifest)).filter(
		(file) => dirname(file) === dirname(manifest) && file.endsWith('.component.ts'),
	)) {
		const source = ts.createSourceFile(
			file,
			readFileSync(file, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		)
		for (const statement of source.statements) {
			if (!ts.isClassDeclaration(statement) || statement.name?.text !== exportName) continue
			for (const decorator of ts.getDecorators(statement) ?? []) {
				const call = decorator.expression
				if (
					!ts.isCallExpression(call) ||
					!['Component', 'Directive'].includes(call.expression.getText(source))
				)
					continue
				const argument = call.arguments[0]
				if (!argument || !ts.isObjectLiteralExpression(argument)) continue
				for (const prop of argument.properties) {
					if (
						ts.isPropertyAssignment(prop) &&
						prop.name.getText(source) === 'selector' &&
						ts.isStringLiteral(prop.initializer)
					)
						return prop.initializer.text
				}
			}
		}
	}
	throw new Error(`Missing Angular selector for ${exportName} in ${manifest}`)
}

function webcSelector(manifest: string, exportName: string): string | undefined {
	const directory = resolve(dirname(manifest).replace(/[\\/]angular[\\/]/, '/webc/'))
	let selector: string | undefined
	for (const file of filesIn(directory).filter(
		(file) => dirname(file) === directory && file.endsWith('.element.ts'),
	)) {
		const source = ts.createSourceFile(
			file,
			readFileSync(file, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		)
		const visit = (node: ts.Node): void => {
			if (ts.isCallExpression(node) && node.expression.getText(source) === 'defineElement') {
				const [name, ctor, tag] = node.arguments
				if (name && ts.isStringLiteral(name) && ctor?.getText(source) === exportName) {
					selector =
						tag && ts.isStringLiteral(tag)
							? `${tag.text}[is="${name.text}"]`
							: name.text
				}
			}
			ts.forEachChild(node, visit)
		}
		visit(source)
	}
	return selector
}

function unique<T>(items: readonly T[], key: (item: T) => string): T[] {
	const result = new Map<string, T>()
	for (const item of items) if (!result.has(key(item))) result.set(key(item), item)
	return [...result.values()]
}

export async function generateApi(): Promise<TApi> {
	const manifests = await discoverManifests()
	const plugins: TPlugin[] = Object.entries(setup)
		.filter((entry): entry is [string, IPluginDefinition] => isPlugin(entry[1]))
		.map(([name, definition]) => ({ name, definition }))
	const descriptorNames = [
		...new Set(manifests.flatMap((manifest) => manifest.sources.map((source) => source.name))),
	].sort()
	const reader = new TypeReader(
		descriptorNames,
		plugins.map((plugin) => plugin.name),
	)
	const exports = new Map(
		frameworkNames.map((framework) => [framework, reader.exports(framework)]),
	)
	const components: TComponent[] = []
	const contracts: Record<string, TContract> = {}

	for (const manifest of manifests) {
		const available: TComponent['frameworks'] = {}
		for (const framework of frameworkNames) {
			const exportName = frameworks[framework].exportName(manifest.name)
			if (exports.get(framework)?.has(exportName))
				available[framework] = {
					exportName,
					...(framework === 'angular'
						? { selector: angularSelector(manifest.file, exportName) }
						: {}),
					...(framework === 'webc'
						? { selector: webcSelector(manifest.file, exportName) }
						: {}),
				}
		}
		if (Object.keys(available).length === 0) continue
		components.push({
			id: manifest.id,
			name: manifest.name,
			contract: manifest.id,
			sources: manifest.sources.map((source) => ({
				role: source.role,
				descriptor: source.name,
				source: reader.declaration(source.name),
			})),
			frameworks: available,
		})
		const primary = manifest.sources.find((source) => source.role === 'descriptor')
		if (!primary) throw new Error(`Missing primary descriptor: ${manifest.name}`)
		const descriptors = manifest.sources.map((source) => source.descriptor)
		const props = unique(
			descriptors.flatMap((descriptor) => descriptor.getProps()),
			(prop) => prop.key,
		)
		const events = unique(
			descriptors.flatMap((descriptor) => descriptor.getEvents()),
			(event) => event.getName(),
		)
		const merged: IComponentDescriptor = {
			ctor: primary.descriptor.ctor,
			props,
			events,
			plugins: [],
			slots: primary.descriptor.slots,
			getProps: () => props,
			getEvents: () => events,
		}
		const typeSets = manifest.sources.map((source) => reader.contract(source.name)).reverse()
		contracts[manifest.id] = contractOf(
			merged,
			{
				props: new Map(typeSets.flatMap((types) => [...types.props])),
				events: new Map(typeSets.flatMap((types) => [...types.events])),
				slots: reader.contract(primary.name).slots,
			},
			reader.declaration(primary.name),
		)
	}

	return {
		schemaVersion: 1,
		typeContext: 'library-without-theme',
		components,
		contracts,
		plugins: Object.fromEntries(
			plugins
				.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
				.map(({ name, definition }) => [
					name,
					contractOf(definition, reader.contract(name, true), reader.declaration(name)),
				]),
		),
	}
}
