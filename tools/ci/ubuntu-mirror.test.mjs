import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
	CI_UBUNTU_MIRRORS,
	ciUbuntuSources,
	selectUbuntuMirror,
	ubuntuSuites,
} from './ubuntu-mirror.mjs'

const MIRROR = 'https://mirrors.edge.kernel.org/ubuntu'
const key = 'Signed-By: /usr/share/keyrings/ubuntu-archive-keyring.gpg'

test('replaces runner mirror-method sources and preserves signed deb822 fields', () => {
	const before =
		'Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates noble-backports\nComponents: main universe restricted multiverse\n' +
		key +
		'\n\nTypes: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble-security\nComponents: main universe restricted multiverse\n' +
		key +
		'\n'
	const expected = before.replaceAll('mirror+file:/etc/apt/apt-mirrors.txt', MIRROR)

	assert.equal(ciUbuntuSources(before), expected)
	assert.equal(ciUbuntuSources(expected), expected)
})

test('supports direct Azure sources and classic signed list entries', () => {
	const before =
		'deb [signed-by=/keys/ubuntu.gpg] http://azure.archive.ubuntu.com/ubuntu/ noble main\n' +
		'deb-src mirror+file:///etc/apt/apt-mirrors.txt noble-security main\n'
	const expected =
		'deb [signed-by=/keys/ubuntu.gpg] ' +
		MIRROR +
		' noble main\n' +
		'deb-src ' +
		MIRROR +
		' noble-security main\n'

	assert.equal(ciUbuntuSources(before), expected)
})

test('also replaces fresh canonical archive and security sources', () => {
	const before =
		'Types: deb\nURIs: https://archive.ubuntu.com/ubuntu/\nSuites: noble noble-updates\n' +
		key +
		'\n\nTypes: deb\nURIs: https://security.ubuntu.com/ubuntu\nSuites: noble-security\n' +
		key +
		'\n'
	const expected = before
		.replace('https://archive.ubuntu.com/ubuntu/', MIRROR)
		.replace('https://security.ubuntu.com/ubuntu', MIRROR)

	assert.equal(ciUbuntuSources(before), expected)
})

test('preserves third-party and already selected mirror sources', () => {
	const source =
		'Types: deb\nURIs: ' +
		MIRROR +
		'\nSuites: noble-security\n' +
		key +
		'\n\n' +
		'deb https://packages.microsoft.com/ubuntu/24.04/prod noble main\n'

	assert.equal(ciUbuntuSources(source), source)
})

test('extracts active Ubuntu suites from both formats without unrelated or disabled suites', () => {
	const sources = [
		'Types: deb\nURIs: mirror+file:/etc/apt/apt-mirrors.txt\nSuites: noble noble-updates\n noble-security\n' +
			key,
		'Types: deb\nURIs: https://archive.ubuntu.com/ubuntu\nSuites: obsolete\nEnabled: no\n',
		'deb [signed-by=/keys/ubuntu.gpg] http://azure.archive.ubuntu.com/ubuntu noble-backports main\n' +
			'deb https://packages.microsoft.com/ubuntu/24.04/prod third-party main\n',
	]
	assert.deepEqual(ubuntuSuites(sources), [
		'noble',
		'noble-updates',
		'noble-security',
		'noble-backports',
	])
})

test('selects the preferred mirror only when it serves every suite and releases response bodies', async () => {
	const requests = []
	let released = 0
	const mirror = await selectUbuntuMirror(['noble', 'noble-security'], {
		fetcher: async (url, { signal }) => {
			requests.push(url)
			assert.ok(signal instanceof AbortSignal)
			return {
				ok: true,
				body: {
					cancel: async () => {
						released++
					},
				},
			}
		},
	})
	assert.equal(mirror, CI_UBUNTU_MIRRORS[0])
	assert.deepEqual(
		requests,
		['noble', 'noble-security'].map((suite) => mirror + '/dists/' + suite + '/InRelease'),
	)
	assert.equal(released, 2)
})

test('falls back when the preferred host is unreachable and preserves the signed source contract', async () => {
	const requests = []
	const mirror = await selectUbuntuMirror(['noble', 'noble-security'], {
		fetcher: async (url) => {
			requests.push(url)
			if (url.startsWith(CI_UBUNTU_MIRRORS[0])) throw new Error('connect timeout')
			return { ok: true, body: { cancel: async () => {} } }
		},
	})
	assert.equal(mirror, CI_UBUNTU_MIRRORS[1])
	assert.equal(requests.length, 4)
	const source =
		'Types: deb\nURIs: ' +
		MIRROR +
		'\nSuites: noble noble-security\nComponents: main universe\n' +
		key +
		'\n\n' +
		'deb https://packages.microsoft.com/ubuntu/24.04/prod noble main\n'
	assert.equal(ciUbuntuSources(source, mirror), source.replace(MIRROR, mirror))
})

test('rejects a mirror missing the security suite and releases failed HTTP responses', async () => {
	let released = 0
	const mirror = await selectUbuntuMirror(['noble', 'noble-security'], {
		fetcher: async (url) => ({
			ok: !(url.startsWith(CI_UBUNTU_MIRRORS[0]) && url.includes('noble-security')),
			status: 404,
			body: {
				cancel: async () => {
					released++
				},
			},
		}),
	})
	assert.equal(mirror, CI_UBUNTU_MIRRORS[1])
	assert.equal(released, 4)
})

test('reports every unavailable candidate clearly instead of selecting an unprobed source', async () => {
	await assert.rejects(
		selectUbuntuMirror(['noble', 'noble-security'], {
			fetcher: async () => {
				throw new Error('connect timeout')
			},
		}),
		(error) => {
			assert.match(
				error.message,
				/No reachable Ubuntu mirror serves all active suites; source files were not changed/,
			)
			for (const mirror of CI_UBUNTU_MIRRORS) assert.ok(error.message.includes(mirror))
			assert.match(error.message, /noble-security: Error: connect timeout/)
			return true
		},
	)
})

test('does not select a mirror without any active Ubuntu suites', async () => {
	await assert.rejects(selectUbuntuMirror([]), /No active Ubuntu suites to probe/)
})

test('allows an explicit canonical-only fallback after apt package downloads fail', async () => {
	const requested = []
	const canonical = CI_UBUNTU_MIRRORS[1]
	const mirror = await selectUbuntuMirror(['noble', 'noble-security'], {
		mirrors: [canonical],
		fetcher: async (url) => {
			requested.push(url)
			return { ok: true, body: { cancel: async () => {} } }
		},
	})
	assert.equal(mirror, canonical)
	assert.equal(requested.length, 2)
	assert.ok(requested.every((url) => url.startsWith(canonical + '/')))
})
