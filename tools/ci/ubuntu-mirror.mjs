import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Keep an independent first choice for Ubuntu DNS outages, with a signed canonical fallback.
export const CI_UBUNTU_MIRRORS = [
	'https://mirrors.edge.kernel.org/ubuntu',
	'https://archive.ubuntu.com/ubuntu',
]
const PROBE_TIMEOUT = 8000
const UBUNTU_SOURCE =
	/mirror\+file:\/{1,3}etc\/apt\/apt-mirrors\.txt\/?(?=\s|$)|https?:\/\/(?:(?:azure\.archive|archive|security)\.ubuntu\.com|mirrors\.edge\.kernel\.org)\/ubuntu\/?(?=\s|$)/g

/** Bypass unavailable hosts without changing suites, components or signing keys. */
export function ciUbuntuSources(source, mirror = CI_UBUNTU_MIRRORS[0]) {
	const deb822 = source.replace(
		/^(URIs:\s*)(.*)$/gm,
		(_line, field, uris) => field + uris.replace(UBUNTU_SOURCE, mirror),
	)

	return deb822.replace(
		/^(deb(?:-src)?\s+(?:\[[^\]]*\]\s+)?)(\S+)(\s+.*)$/gm,
		(_line, prefix, uri, suffix) => prefix + uri.replace(UBUNTU_SOURCE, mirror) + suffix,
	)
}

/** Only active Ubuntu entries participate; third-party suites are unrelated to this mirror. */
export function ubuntuSuites(sources) {
	const suites = new Set()

	for (const source of sources) {
		for (const stanza of source.split(/\r?\n\s*\r?\n/)) {
			const fields = stanza.replace(/\r?\n[ \t]+/g, ' ')
			if (/^Enabled:[ \t]*no[ \t]*$/im.test(fields)) continue
			const uris = /^URIs:[ \t]*(.*)$/im.exec(fields)?.[1]
			const declared = /^Suites:[ \t]*(.*)$/im.exec(fields)?.[1]
			if (uris?.match(UBUNTU_SOURCE) && declared)
				for (const suite of declared.trim().split(/\s+/)) suites.add(suite)
		}

		for (const match of source.matchAll(/^deb(?:-src)?\s+(?:\[[^\]]*\]\s+)?(\S+)\s+(\S+)/gm)) {
			if (match[1].match(UBUNTU_SOURCE)) suites.add(match[2])
		}
	}

	return [...suites]
}

/** Probe every active suite before any source file changes. Apt still verifies all signatures. */
export async function selectUbuntuMirror(
	suites,
	{ mirrors = CI_UBUNTU_MIRRORS, fetcher = fetch } = {},
) {
	if (suites.length === 0) throw new Error('No active Ubuntu suites to probe')

	const failures = []
	for (const mirror of mirrors) {
		const results = await Promise.allSettled(
			suites.map(async (suite) => {
				const response = await fetcher(
					mirror + '/dists/' + encodeURIComponent(suite) + '/InRelease',
					{
						signal: AbortSignal.timeout(PROBE_TIMEOUT),
					},
				)
				try {
					if (!response.ok) throw new Error('HTTP ' + response.status)
				} finally {
					// A GET matches apt's request; its body is not needed for the reachability check.
					await response.body?.cancel()
				}
			}),
		)
		const unavailable = results.flatMap((result, index) =>
			result.status === 'rejected' ? [suites[index] + ': ' + String(result.reason)] : [],
		)

		if (unavailable.length === 0) return mirror

		failures.push(mirror + ' (' + unavailable.join('; ') + ')')
	}

	throw new Error(
		'No reachable Ubuntu mirror serves all active suites; source files were not changed. ' +
			failures.join(' | '),
	)
}

async function configureRunnerSources(mirrors = CI_UBUNTU_MIRRORS) {
	if (
		process.platform !== 'linux' ||
		process.env.GITHUB_ACTIONS !== 'true' ||
		process.env.RUNNER_OS !== 'Linux'
	) {
		throw new Error('Ubuntu mirror selection is only for a GitHub Actions Linux runner')
	}

	const files = [
		'/etc/apt/sources.list',
		...readdirSync('/etc/apt/sources.list.d')
			.filter((file) => /\.(?:sources|list)$/.test(file))
			.map((file) => '/etc/apt/sources.list.d/' + file),
	]
	const sources = files
		.filter((file) => existsSync(file))
		.map((file) => ({ file, before: readFileSync(file, 'utf8') }))
	const suites = ubuntuSuites(sources.map(({ before }) => before))

	if (suites.length === 0) {
		console.log('No active Ubuntu archive entries to configure')
		return
	}

	const mirror = await selectUbuntuMirror(suites, { mirrors })
	for (const { file, before } of sources) {
		const after = ciUbuntuSources(before, mirror)
		if (before === after) continue

		writeFileSync(file, after)
		console.log(file + ': Ubuntu suites use ' + mirror + ' with the original signing keys')
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	// Apt may fail after the metadata probe succeeded; allow one explicit archive fallback.
	const options = process.argv.slice(2)
	if (options.some((option) => option !== '--canonical'))
		throw new Error('Unknown Ubuntu mirror option')
	await configureRunnerSources(
		options.includes('--canonical') ? [CI_UBUNTU_MIRRORS[1]] : CI_UBUNTU_MIRRORS,
	)
}
