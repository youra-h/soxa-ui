#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

let catalog
try {
	catalog = JSON.parse(readFileSync(new URL('./catalog.json', import.meta.url), 'utf8'))
	if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.versions)) throw new Error()
	for (const entry of catalog.versions)
		if (
			!/^\d+\.\d+\.\d+$/.test(entry.libraryVersion) ||
			entry.directory !== 'corpora/' + entry.libraryVersion
		)
			throw new Error()
} catch {
	process.stderr.write('Soxa MCP: bundled catalog unavailable or invalid.\n')
	process.exit(1)
}
if (process.argv.length === 2) {
	for (const entry of catalog.versions)
		process.argv.push(
			'--corpus',
			fileURLToPath(new URL(entry.directory + '/', import.meta.url)),
		)
}
await import('./mcp.mjs')
