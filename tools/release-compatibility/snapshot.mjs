import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { createHash } from 'node:crypto'
import ts from 'typescript'

export const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex')
const json = (file) => JSON.parse(readFileSync(file, 'utf8'))
const portable = (file) => file.replaceAll('\\', '/')

/** Exclude source witnesses; a repository move is not a consumer contract change. */
export function publicJson(value) {
	if (Array.isArray(value)) return value.map(publicJson)
	if (!value || typeof value !== 'object') return value
	return Object.fromEntries(
		Object.entries(value)
			.filter(([key, item]) => {
				if (key === 'libraryVersion' && typeof item === 'string') return false
				if (
					['source', 'file'].includes(key) &&
					typeof item === 'string' &&
					item.startsWith('packages/')
				)
					return false
				if (
					key === 'sources' &&
					Array.isArray(item) &&
					item.every((source) =>
						typeof source === 'string'
							? source.startsWith('packages/')
							: source &&
								typeof source === 'object' &&
								typeof source.source === 'string' &&
								source.source.startsWith('packages/'),
					)
				)
					return false
				return true
			})
			.map(([key, item]) => [key, publicJson(item)]),
	)
}

function typeTargets(value) {
	if (!value || typeof value !== 'object') return []
	return Object.entries(value).flatMap(([key, item]) =>
		key === 'types' && typeof item === 'string' ? [item] : typeTargets(item),
	)
}

/** Resolve only declarations inside the package; frameworks are checked by their own tests. */
function declarationFile(directory, specifier) {
	const base = resolve(directory, specifier)
	const candidates = [
		base.replace(/\.mjs$/, '.d.mts').replace(/\.js$/, '.d.ts'),
		base + '.d.ts',
		base + '.d.mts',
		join(base, 'index.d.ts'),
	]
	const file = candidates.find(
		(candidate) => /\.d\.[cm]?ts$/.test(candidate) && existsSync(candidate),
	)
	if (!file) throw new Error('Missing published declaration: ' + base)
	return file
}

const printer = ts.createPrinter({ removeComments: true, newLine: ts.NewLineKind.LineFeed })

/** Private storage is implementation; protected members remain subclass contracts. */
function signature(node, source) {
	const aliases = new Map()
	for (const statement of source.statements) {
		if (!ts.isImportDeclaration(statement)) continue

		const bindings = statement.importClause?.namedBindings
		if (!bindings || !ts.isNamedImports(bindings)) continue

		const setupImport =
			ts.isStringLiteral(statement.moduleSpecifier) &&
			statement.moduleSpecifier.text === '@soxa-ui/setup'

		for (const binding of bindings.elements) {
			const name = binding.name.text
			// Angular emits the first collection alias as facade and numbers the rest.
			if (binding.propertyName && (/\$\d+$/.test(name) || (setupImport && name === 'facade')))
				aliases.set(name, binding.propertyName.text)
		}
	}
	const result = ts.transform(node, [
		(context) => {
			const visit = (child) => {
				if (
					ts.isClassElement(child) &&
					!ts.isConstructorDeclaration(child) &&
					(ts.isPrivateIdentifier(child.name ?? ts.factory.createIdentifier('_')) ||
						child.modifiers?.some(
							(modifier) => modifier.kind === ts.SyntaxKind.PrivateKeyword,
						))
				)
					return undefined
				if (
					ts.isIdentifier(child) &&
					aliases.has(child.text) &&
					child.parent?.name !== child &&
					!(ts.isQualifiedName(child.parent) && child.parent.right === child)
				)
					return ts.factory.createIdentifier(aliases.get(child.text))
				const updated = ts.visitEachChild(child, visit, context)
				if (ts.isTypeLiteralNode(updated) && updated.members.every(ts.isPropertySignature))
					return ts.factory.updateTypeLiteralNode(
						updated,
						[...updated.members].sort((a, b) =>
							(a.name?.getText(source) ?? '').localeCompare(
								b.name?.getText(source) ?? '',
							),
						),
					)
				return updated
			}
			return (root) => ts.visitNode(root, visit)
		},
	])
	const printed = printer.printNode(ts.EmitHint.Unspecified, result.transformed[0], source)
	result.dispose()
	// Tokenize rather than strip whitespace: string literal contents are significant.
	const scanner = ts.createScanner(
		ts.ScriptTarget.Latest,
		true,
		ts.LanguageVariant.Standard,
		printed,
	)
	const tokens = []
	while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
		const kind = scanner.getToken()
		const token = scanner.getTokenText()
		tokens.push(
			kind === ts.SyntaxKind.StringLiteral ? JSON.stringify(scanner.getTokenValue()) : token,
		)
	}
	return tokens.join(' ')
}

export function snapshotPackage(directory) {
	const manifest = json(join(directory, 'package.json'))
	const records = {}
	const put = (key, value) => {
		if (key in records) {
			records[key] = [...records[key], value]
		} else records[key] = [value]
	}
	const entries = manifest.exports
		? Object.keys(manifest.exports).some((key) => key.startsWith('.'))
			? manifest.exports
			: { '.': manifest.exports }
		: { '.': { types: manifest.types ?? manifest.typings, default: manifest.main } }
	put('module-contract', {
		type: manifest.type ?? null,
		sideEffects: manifest.sideEffects ?? null,
		typesVersions: manifest.typesVersions ?? null,
	})
	put('environments', {
		engines: manifest.engines ?? null,
		peers: Object.fromEntries(
			Object.entries(manifest.peerDependencies ?? {}).filter(
				([name]) => !name.startsWith('@soxa-ui/'),
			),
		),
		optionalPeers: manifest.peerDependenciesMeta ?? null,
	})
	const pending = []
	for (const [entry, target] of Object.entries(entries)) {
		// Entry conditions are significant, but emitted filenames alone are not an API.
		const conditions = (value) =>
			typeof value === 'string'
				? 'target'
				: value === null
					? null
					: Object.fromEntries(
							Object.entries(value ?? {}).map(([key, item]) => [
								key,
								conditions(item),
							]),
						)
		put('entry:' + entry, conditions(target))
		for (const file of typeTargets(target)) {
			const targets = file.includes('*')
				? readdirSync(dirname(join(directory, file)))
						.filter((name) => name.endsWith('.d.ts'))
						.map((name) => join(dirname(file), name))
				: [file]
			for (const target of targets) pending.push(declarationFile(directory, target))
		}
	}
	for (const [name, range] of Object.entries(manifest.peerDependencies ?? {}))
		if (!name.startsWith('@soxa-ui/')) put('peer:' + name, range)
	if (manifest.engines) put('engines', manifest.engines)
	if (manifest.bin)
		put(
			'bin',
			typeof manifest.bin === 'string' ? manifest.name : Object.keys(manifest.bin).sort(),
		)

	const visited = new Set()
	while (pending.length) {
		const file = pending.pop()
		if (visited.has(file)) continue
		if (!portable(relative(directory, file)).startsWith('../')) visited.add(file)
		else throw new Error('Declaration escapes package: ' + file)
		const text = readFileSync(file, 'utf8')
		const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true)
		if (source.parseDiagnostics.length) throw new Error('Cannot parse declaration: ' + file)
		const module = portable(relative(directory, file))
		for (const statement of source.statements) {
			const specifier = statement.moduleSpecifier?.text
			if (specifier?.startsWith('.')) pending.push(declarationFile(dirname(file), specifier))
			// import() types also form part of the declaration graph.
			const visit = (node) => {
				if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
					const name = node.argument.literal.text
					if (name?.startsWith('.')) pending.push(declarationFile(dirname(file), name))
				}
				ts.forEachChild(node, visit)
			}
			visit(statement)
			if (ts.isImportDeclaration(statement)) {
				const clause = statement.importClause
				const bindings = clause?.namedBindings
				if (bindings && ts.isNamedImports(bindings)) {
					for (const binding of bindings.elements) {
						const name = binding.propertyName?.text ?? binding.name.text
						put('import:' + module + ':' + name, {
							from: specifier,
							typeOnly: clause.isTypeOnly || binding.isTypeOnly,
						})
					}
				} else
					put(
						'import:' + module + ':' + (clause?.getText(source) ?? specifier),
						signature(statement, source),
					)
				continue
			}
			if (ts.isExportDeclaration(statement)) {
				if (!statement.exportClause) {
					put(
						'reexport:' + module + ':' + (specifier ?? ''),
						signature(statement, source),
					)
				} else if (ts.isNamedExports(statement.exportClause)) {
					for (const member of statement.exportClause.elements)
						put('export:' + module + ':' + member.name.text, {
							typeOnly: statement.isTypeOnly || member.isTypeOnly,
							from: specifier ?? null,
							name: member.propertyName?.text ?? member.name.text,
						})
				} else
					put(
						'export:' + module + ':' + statement.exportClause.name.text,
						signature(statement, source),
					)
			} else if (ts.isVariableStatement(statement)) {
				for (const declaration of statement.declarationList.declarations)
					put(
						'type:' + module + ':' + declaration.name.getText(source),
						signature(declaration, source),
					)
			} else {
				const name = statement.name?.getText(source) ?? 'default'
				put('type:' + module + ':' + name, signature(statement, source))
			}
		}
	}
	const apiFile = join(directory, 'dist/api.json')
	if (existsSync(apiFile)) {
		const api = publicJson(json(apiFile))
		if (api.schemaVersion !== 1) throw new Error('Unsupported component API schema')
		for (const component of api.components) put('component:' + component.id, component)
		for (const [group, contracts] of Object.entries({
			contract: api.contracts,
			plugin: api.plugins,
		})) {
			for (const [name, contract] of Object.entries(contracts)) {
				for (const category of ['props', 'events', 'slots'])
					for (const item of contract[category])
						put(group + ':' + name + ':' + category + ':' + item.name, item)
				put(group + ':' + name + ':frameworks', contract.frameworks)
			}
		}
	}
	for (const name of ['theme-contract.json', 'theme-variables.json']) {
		const file = join(directory, name)
		if (!existsSync(file)) continue
		for (const [group, values] of Object.entries(publicJson(json(file)))) {
			if (Array.isArray(values)) {
				for (const value of values)
					put(name + ':' + group + ':' + (value.name ?? hash(value)), value)
			} else if (values && typeof values === 'object') {
				for (const [key, value] of Object.entries(values))
					put(name + ':' + group + ':' + key, value)
			} else put(name + ':' + group, values)
		}
	}
	for (const [key, values] of Object.entries(records))
		// Overload declaration order affects TypeScript resolution and ReturnType.
		if (!key.startsWith('type:'))
			values.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
	return { name: manifest.name, version: manifest.version, records }
}

export function compareSnapshots(previous, current) {
	if (previous.name !== current.name) throw new Error('Package identity mismatch')
	return Object.entries(previous.records).flatMap(([key, before]) => {
		const after = current.records[key] ?? null
		if (hash(before) === hash(after)) return []
		const change = {
			package: previous.name,
			key,
			before,
			after,
			kind: after === null ? 'removed' : 'changed',
		}
		return [{ id: hash(change), ...change }]
	})
}
