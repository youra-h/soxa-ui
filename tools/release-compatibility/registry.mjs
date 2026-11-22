import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export async function metadata(name, version) {
	if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version))
		throw new Error('Expected exact package version')
	const response = await fetch(
		'https://registry.npmjs.org/' + encodeURIComponent(name) + '/' + version,
		{ signal: AbortSignal.timeout(60000) },
	)
	if (!response.ok)
		throw new Error(
			'Cannot read published baseline ' + name + '@' + version + ': ' + response.status,
		)
	const result = await response.json()
	if (
		result.name !== name ||
		result.version !== version ||
		!result.dist?.integrity?.startsWith('sha512-')
	)
		throw new Error('Unexpected registry metadata for ' + name)
	return { name, version, integrity: result.dist.integrity, tarball: result.dist.tarball }
}

export function verifyIntegrity(bytes, integrity) {
	if ('sha512-' + createHash('sha512').update(bytes).digest('base64') !== integrity)
		throw new Error('Published baseline integrity mismatch')
}

/** Cache verified archives, never a mutable extracted contract or npm latest. */
export async function publishedPackage(record, cache, destination) {
	if (!/^sha512-[A-Za-z0-9+/]+=*$/.test(record.integrity))
		throw new Error('Expected sha512 baseline integrity')
	const url = new URL(record.tarball)
	if (url.protocol !== 'https:' || url.hostname !== 'registry.npmjs.org')
		throw new Error('Unexpected published baseline host')
	const filename = createHash('sha256').update(record.integrity).digest('hex') + '.tgz'
	mkdirSync(cache, { recursive: true })
	const archive = join(cache, filename)
	let bytes
	if (existsSync(archive)) bytes = readFileSync(archive)
	else {
		const response = await fetch(url, { signal: AbortSignal.timeout(60000) })
		if (!response.ok)
			throw new Error('Cannot download baseline ' + record.name + ': ' + response.status)
		bytes = Buffer.from(await response.arrayBuffer())
	}
	verifyIntegrity(bytes, record.integrity)
	if (!existsSync(archive)) writeFileSync(archive, bytes)
	mkdirSync(destination, { recursive: true })
	const names = execFileSync('tar', ['-tzf', archive], {
		encoding: 'utf8',
		maxBuffer: 20 * 1024 * 1024,
	})
		.trim()
		.split(/\r?\n/)
	if (
		names.some(
			(name) =>
				!name.startsWith('package/') ||
				name.split('/').includes('..') ||
				name.includes('\\'),
		)
	)
		throw new Error('Unexpected archive path')
	execFileSync('tar', ['-xzf', archive, '-C', destination])
	const directory = join(destination, 'package')
	const manifest = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))
	if (manifest.name !== record.name || manifest.version !== record.version)
		throw new Error('Extracted baseline identity mismatch')
	return directory
}
