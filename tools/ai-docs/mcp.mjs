#!/usr/bin/env node
import { openCatalog } from './mcp-catalog.mjs'
import { tools, callTool, readResource, resourceTemplates } from './mcp-tools.mjs'

const versions = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05']
const send = (message) => process.stdout.write(JSON.stringify(message) + '\n')
const reply = (id, result) => send({ jsonrpc: '2.0', id, result })
const error = (id, code, message) => send({ jsonrpc: '2.0', id, error: { code, message } })
const args = process.argv.slice(2)
const directories = []
for (let i = 0; i < args.length; i += 2) {
	if (args[i] !== '--corpus' || !args[i + 1]) {
		process.stderr.write(
			'Usage: node mcp.mjs --corpus <built-corpus-dir> [--corpus <another-version-dir>]\n',
		)
		process.exit(1)
	}
	directories.push(args[i + 1])
}

let catalog
try {
	catalog = openCatalog(directories)
} catch {
	// Keep local filesystem paths out of protocol errors and startup diagnostics.
	process.stderr.write(
		'Soxa MCP: cannot open corpus; check schema, metadata and configured directories.\n',
	)
	process.exit(1)
}

let initialized = false
let ready = false
function handle(message) {
	if (
		!message ||
		Array.isArray(message) ||
		message.jsonrpc !== '2.0' ||
		typeof message.method !== 'string' ||
		(message.id !== undefined &&
			typeof message.id !== 'string' &&
			!(typeof message.id === 'number' && Number.isSafeInteger(message.id)))
	)
		return error(null, -32600, 'Invalid JSON-RPC request')
	const { id, method } = message
	if (
		message.params !== undefined &&
		(!message.params || typeof message.params !== 'object' || Array.isArray(message.params))
	) {
		if (id !== undefined) error(id, -32602, 'Expected object parameters')
		return
	}
	const params = message.params ?? {}
	if (id === undefined) {
		if (method === 'notifications/initialized' && initialized) ready = true
		return
	}
	if (method === 'ping') return reply(id, {})
	if (method === 'initialize') {
		if (initialized) return error(id, -32600, 'Already initialized')
		if (
			typeof params.protocolVersion !== 'string' ||
			!params.clientInfo ||
			!params.capabilities
		)
			return error(id, -32602, 'Missing initialization parameters')
		initialized = true
		return reply(id, {
			protocolVersion: versions.includes(params.protocolVersion)
				? params.protocolVersion
				: versions[0],
			capabilities: { tools: {}, resources: {} },
			serverInfo: { name: 'soxa-ui-docs', version: '1.0.0' },
			instructions:
				'Start with list_versions. Select an exact version, audience and adapter; sample is limited verified coverage. Read paged records explicitly. No latest fallback or user project access.',
		})
	}
	if (!ready) return error(id, -32000, 'Initialize and send notifications/initialized first')
	if (method === 'tools/list') return reply(id, { tools })
	if (method === 'resources/list')
		return reply(id, {
			resources: [
				{
					uri: 'soxa://versions',
					name: 'Soxa versions and coverage',
					mimeType: 'application/json',
				},
			],
		})
	if (method === 'resources/templates/list')
		return reply(id, { resourceTemplates: resourceTemplates() })
	if (method === 'tools/call') {
		if (typeof params.name !== 'string' || !tools.some((entry) => entry.name === params.name))
			return error(id, -32602, 'Unknown tool')
		try {
			const result = callTool(catalog, params.name, params.arguments ?? {})
			return reply(id, { content: [{ type: 'text', text: JSON.stringify(result) }] })
		} catch (failure) {
			return reply(id, {
				isError: true,
				content: [{ type: 'text', text: safeMessage(failure) }],
			})
		}
	}
	if (method === 'resources/read') {
		if (typeof params.uri !== 'string') return error(id, -32602, 'Expected a resource URI')
		try {
			return reply(id, {
				contents: [
					{
						uri: params.uri,
						mimeType: 'application/json',
						text: JSON.stringify(readResource(catalog, params.uri)),
					},
				],
			})
		} catch (failure) {
			return error(id, -32002, safeMessage(failure))
		}
	}
	return error(id, -32601, 'Unsupported method')
}

function safeMessage(failure) {
	return failure.code || failure instanceof SyntaxError
		? 'Corpus record unavailable or invalid'
		: failure.message
}

// Discard oversized lines through their delimiter, then resume without desynchronizing stdio.
const maxRequestBytes = 64 * 1024
let pending = Buffer.alloc(0)
let discarding = false
for await (const bytes of process.stdin) {
	let start = 0
	for (let end = 0; end <= bytes.length; end++) {
		if (end < bytes.length && bytes[end] !== 10) continue
		const piece = bytes.subarray(start, end)
		if (!discarding) {
			if (pending.length + piece.length > maxRequestBytes) {
				pending = Buffer.alloc(0)
				discarding = true
				error(null, -32600, 'Request exceeds 64 KiB')
			} else pending = Buffer.concat([pending, piece])
		}
		if (end < bytes.length) {
			if (!discarding) processLine(pending)
			pending = Buffer.alloc(0)
			discarding = false
		}
		start = end + 1
	}
}
if (pending.length && !discarding) processLine(pending)

function processLine(bytes) {
	const line = bytes.toString('utf8').trim()
	if (!line) return
	let message
	try {
		message = JSON.parse(line)
	} catch {
		return error(null, -32700, 'Invalid JSON')
	}
	handle(message)
}
