import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Select an exact published corpus; never substitute latest or another release. */
export function documentationRelease(root, version = process.env.SOXA_DOCS_VERSION ?? '0.3.0') {
	if (!/^\d+\.\d+\.\d+$/.test(version)) throw new Error('Expected an exact documentation version')
	const manifest = JSON.parse(
		readFileSync(join(root, 'docs/ai', version, 'manifest.json'), 'utf8'),
	)
	if (manifest.libraryVersion !== version || manifest.api.version !== version)
		throw new Error('Documentation version mismatch')
	return { version, packages: manifest.packages, legacy: version === '0.3.0', manifest }
}
