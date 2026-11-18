const text = (description) => ({ type: 'string', description })
const boundary = {
	version: text('Exact library version from list_versions; no latest or ranges.'),
	audience: { type: 'string', enum: ['consumer', 'contributor'] },
	framework: {
		type: 'string',
		enum: ['vue', 'react', 'angular', 'solid', 'svelte', 'webc', 'all'],
	},
}
const pagination = {
	offset: { type: 'integer', minimum: 0, description: 'Zero-based offset; default 0.' },
	limit: { type: 'integer', minimum: 1, maximum: 50, description: 'Page size; default 20.' },
}
const chunking = {
	offset: {
		type: 'integer',
		minimum: 0,
		description: 'UTF-16 offset into serialized record/example; default 0.',
	},
	limit: {
		type: 'integer',
		minimum: 1,
		maximum: 16000,
		description:
			'Maximum UTF-16 units per chunk; default 12000. Concatenate chunks before JSON.parse.',
	},
}
const filters = {
	component: text('Component ID, e.g. select or date-picker.'),
	topic: text('Exact indexed topic.'),
}

function tool(name, description, properties, required = Object.keys(boundary)) {
	return {
		name,
		description,
		annotations: {
			readOnlyHint: true,
			destructiveHint: false,
			idempotentHint: true,
			openWorldHint: false,
		},
		inputSchema: { type: 'object', properties, required, additionalProperties: false },
	}
}

export const tools = [
	tool(
		'list_versions',
		'Discover exact versions, provenance and honest per-adapter guide/API coverage. Start here.',
		{},
		[],
	),
	tool(
		'list_components',
		'Page component IDs with generated API for the selected adapter and audience. API presence does not imply complete recipes.',
		{ ...boundary, ...pagination },
	),
	tool(
		'get_component',
		'Read one generated component contract as paged JSON, including actual adapter bindings and source. Concatenate chunks before parsing.',
		{ ...boundary, component: filters.component, ...chunking },
		[...Object.keys(boundary), 'component'],
	),
	tool(
		'list_documents',
		'Page document metadata; includes shared guides. No bulk content. Follow related IDs explicitly.',
		{ ...boundary, ...filters, ...pagination },
	),
	tool(
		'get_document',
		'Read one document as paged JSON with prose, sources, coverage, hashes and attached examples.',
		{ ...boundary, id: text('Exact ID from list_documents.'), ...chunking },
		[...Object.keys(boundary), 'id'],
	),
	tool(
		'list_examples',
		'Page attached example metadata; documentId + exampleId uniquely identifies an example.',
		{ ...boundary, ...filters, ...pagination },
	),
	tool(
		'get_example',
		'Read one attached example as paged JSON with exact source code, language, path and digest. Paths are descriptive; this tool does not read a user project.',
		{
			...boundary,
			id: text('Parent document ID.'),
			example: text('Example ID within the parent.'),
			...chunking,
		},
		[...Object.keys(boundary), 'id', 'example'],
	),
	tool(
		'get_installation',
		'Find installation records for the selected version/adapter. Read a returned ID with get_document; package pins are in provenance.',
		{ ...boundary, ...pagination },
	),
	tool(
		'styling_guide',
		'Find shared theme and icon styling records. Read returned IDs with get_document; status describes the verified scope.',
		{ ...boundary, ...pagination },
	),
]

function validate(schema, args) {
	if (!args || typeof args !== 'object' || Array.isArray(args))
		throw new Error('Expected object arguments')
	for (const key of schema.required)
		if (!Object.hasOwn(args, key)) throw new Error('Missing argument: ' + key)
	for (const [key, value] of Object.entries(args)) {
		if (!Object.hasOwn(schema.properties, key)) throw new Error('Unknown argument: ' + key)
		const rule = schema.properties[key]
		if (rule.type === 'string' && (typeof value !== 'string' || !value.length))
			throw new Error('Expected nonempty string: ' + key)
		if (rule.enum && !rule.enum.includes(value)) throw new Error('Unknown ' + key)
		if (
			rule.type === 'integer' &&
			(!Number.isSafeInteger(value) ||
				value < rule.minimum ||
				value > (rule.maximum ?? Number.MAX_SAFE_INTEGER))
		)
			throw new Error('Invalid integer: ' + key)
	}
}

function page(items, args) {
	const offset = args.offset ?? 0
	if (offset > items.length) throw new Error('Offset exceeds result length')
	let end = Math.min(items.length, offset + (args.limit ?? 20))
	while (end > offset && JSON.stringify(items.slice(offset, end)).length > 24000) end--
	if (end === offset && offset < items.length)
		throw new Error('Index entry exceeds response budget')
	return {
		total: items.length,
		offset,
		items: items.slice(offset, end),
		nextOffset: end < items.length ? end : null,
	}
}

/** JSON chunks preserve the complete contract without silently truncating large records. */
function chunk(value, args) {
	const serialized = JSON.stringify(value)
	const offset = args.offset ?? 0
	if (offset > serialized.length) throw new Error('Offset exceeds content length')
	let end = Math.min(serialized.length, offset + (args.limit ?? 12000))
	while (JSON.stringify(serialized.slice(offset, end)).length > 24000)
		end = offset + Math.floor((end - offset) / 2)
	return {
		encoding: 'json',
		total: serialized.length,
		offset,
		text: serialized.slice(offset, end),
		nextOffset: end < serialized.length ? end : null,
	}
}

export function callTool(catalog, name, args) {
	const definition = tools.find((entry) => entry.name === name)
	if (!definition) throw new Error('Unknown tool: ' + name)
	validate(definition.inputSchema, args)
	if (name === 'list_versions') return { versions: catalog.versions() }
	const { version, audience, framework, component, topic, id } = args
	const query = { version, audience, framework }
	if (component) query.component = component
	if (topic) query.topic = topic
	if (id) query.id = id
	if (name === 'get_component') query.topic = 'api'
	if (name === 'get_installation') query.topic = 'installation'
	const selected = catalog.select(query)
	const { provenance } = selected
	let entries = selected.documents
	if (['get_document', 'get_example', 'get_component'].includes(name)) {
		if (name === 'get_component') {
			if (entries.length !== 1)
				throw new Error('Choose one adapter with a generated component API')
			query.id = entries[0].id
		}
		const { record } = catalog.document(query)
		let value = record
		if (name === 'get_example') {
			value = record.examples.find((example) => example.id === args.example)
			if (!value) throw new Error('Requested example is unavailable in this document')
		}
		return { provenance, documentId: record.id, ...chunk(value, args) }
	}
	if (name === 'styling_guide')
		entries = entries.filter((entry) => ['theming', 'themes', 'icons'].includes(entry.topic))
	if (name === 'list_components')
		entries = entries
			.filter((entry) => entry.topic === 'api')
			.map((entry) => ({
				component: entry.component,
				title: entry.title,
				documentId: entry.id,
				status: entry.status,
			}))
	if (name === 'list_examples')
		entries = entries.flatMap((entry) =>
			entry.examples.map((example) => ({
				...example,
				documentId: entry.id,
				status: entry.status,
				sources: entry.sources,
				origin: entry.origin,
			})),
		)
	if (['list_documents', 'get_installation', 'styling_guide'].includes(name))
		entries = entries.map(
			({ id, title, framework, audience, topic, component, status, examples }) => ({
				id,
				title,
				framework,
				audience,
				topic,
				component,
				status,
				exampleCount: examples.length,
			}),
		)
	if (!entries.length) throw new Error('No records match the requested coverage')
	return { provenance, ...page(entries, args) }
}

export function resourceTemplates() {
	return [
		{
			uriTemplate:
				'soxa://docs/{version}/{audience}/{framework}/{id}?offset={offset}&limit={limit}',
			name: 'Soxa documentation record',
			description:
				'Exact corpus boundary and paged JSON. Discover IDs with list_documents; offset=0, limit=12000.',
			mimeType: 'application/json',
		},
	]
}

export function readResource(catalog, uri) {
	if (uri === 'soxa://versions') return { versions: catalog.versions() }
	const url = new URL(uri)
	const parts = url.pathname.split('/').slice(1)
	if (
		url.protocol !== 'soxa:' ||
		url.hostname !== 'docs' ||
		url.username ||
		url.password ||
		url.port ||
		url.hash ||
		parts.length !== 4 ||
		[...url.searchParams.keys()].some((key) => !['offset', 'limit'].includes(key)) ||
		[...url.searchParams.keys()].length !== new Set(url.searchParams.keys()).size
	)
		throw new Error('Unknown documentation URI')
	const [version, audience, framework, id] = parts
	const args = { version, audience, framework, id }
	for (const key of ['offset', 'limit'])
		if (url.searchParams.has(key)) {
			if (!/^\d+$/.test(url.searchParams.get(key)))
				throw new Error('Invalid resource pagination')
			args[key] = Number(url.searchParams.get(key))
		}
	return callTool(catalog, 'get_document', args)
}
