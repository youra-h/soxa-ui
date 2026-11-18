import assert from 'node:assert/strict'
import { createElement as h, Fragment, Suspense } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { Writable } from 'node:stream'
import { setImmediate as turn, setTimeout as delay } from 'node:timers/promises'
import { createEngineTabs } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import { TCollectionInitialSource } from '@soxa-ui/setup'
import { input, distHash } from '../ssr-collection-prototype/initial-fixture.mjs'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const { Tabs } = await import(process.env.SSR_REACT_MODULE || '@soxa-ui/react')

assert.ok(global.gc, 'Run with node --expose-gc')
const engines = []
const originalModels = new WeakMap()
let bundles = []
let sources = []
let seen = new WeakSet()
const originalUse = TPluginBundle.prototype.use
const originalMaterialize = TCollectionInitialSource.prototype.materialize
TPluginBundle.prototype.use = function (...args) {
	if (!seen.has(this)) {
		seen.add(this)
		bundles.push(new WeakRef(this))
	}
	return originalUse.apply(this, args)
}
TCollectionInitialSource.prototype.materialize = function (...args) {
	if (!seen.has(this)) {
		seen.add(this)
		sources.push(new WeakRef(this))
	}
	return originalMaterialize.apply(this, args)
}

async function collect() {
	for (let i = 0; i < 4; i++) {
		await turn()
		global.gc()
	}
	await turn()
}

async function request(outcome) {
	const source = input(12, false)
	const engine = createEngineTabs({ items: source.items })
	originalModels.set(engine, [...engine.extensions.batch.items])
	engines.push(engine)
	const owned = h(Tabs, {
		initial: source,
		engine,
		content: h(
			Fragment,
			null,
			...source.panels.map((panel, initial) =>
				h(Tabs.Content, { key: initial, initial }, `Panel ${initial}`),
			),
		),
	})
	const pending = new Promise(() => {})
	function Wait() {
		throw pending
	}
	const root = outcome === 'abort' ? h(Suspense, { fallback: 'Waiting' }, owned, h(Wait)) : owned
	const expected = new Error('Intentional external-engine probe abort')
	await new Promise((resolve, reject) => {
		let bytes = 0
		let aborts = 0
		const output = new Writable({
			write(chunk, encoding, done) {
				bytes += chunk.length
				done()
			},
		})
		output.once('error', reject)
		output.once('finish', () => {
			try {
				assert.ok(bytes > 0)
				assert.equal(aborts, outcome === 'abort' ? 1 : 0)
				resolve()
			} catch (error) {
				reject(error)
			}
		})
		const stream = renderToPipeableStream(root, {
			onShellReady() {
				stream.pipe(output)
				if (outcome === 'abort') stream.abort(expected)
			},
			onShellError: reject,
			onError(error) {
				if (error === expected) aborts++
				else reject(error)
			},
		})
	})
}

const results = []
try {
	for (const outcome of ['success', 'abort']) {
		bundles = []
		sources = []
		seen = new WeakSet()
		for (let i = 0; i < 12; i++) await request(outcome)
		// Also cover the expiry window used by the earlier transaction candidate.
		await delay(1200)
		await collect()
		const result = {
			outcome,
			enginesHeld: engines.length,
			bundlesObserved: bundles.length,
			bundlesAlive: bundles.filter((ref) => ref.deref()).length,
			sourcesObserved: sources.length,
			sourcesAlive: sources.filter((ref) => ref.deref()).length,
		}
		results.push(result)
		process.stderr.write(JSON.stringify(result) + '\n')
	}
} finally {
	TPluginBundle.prototype.use = originalUse
	TCollectionInitialSource.prototype.materialize = originalMaterialize
}
engines.forEach((engine) => {
	const items = engine.extensions.batch.items
	assert.equal(items.length, 12)
	items.forEach((item, index) => assert.equal(item, originalModels.get(engine)[index]))
})
engines.length = 0
await collect()
const afterExternalRelease = {
	bundlesAlive: bundles.filter((ref) => ref.deref()).length,
	sourcesAlive: sources.filter((ref) => ref.deref()).length,
}
process.stdout.write(
	JSON.stringify(
		{
			node: process.version,
			mode: process.env.NODE_ENV,
			commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
			workingTreeDirty: Boolean(
				execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim(),
			),
			candidateSha256: process.env.SSR_REACT_MODULE
				? createHash('sha256')
						.update(
							readFileSync(new URL(process.env.SSR_REACT_MODULE, import.meta.url)),
						)
						.digest('hex')
				: null,
			adapter: process.env.SSR_REACT_MODULE || '@soxa-ui/react',
			afterExternalRelease,
			distSha256: Object.fromEntries(
				['packages/core', 'packages/setup', 'packages/plugins', 'packages/ui/react'].map(
					(path) => [path, distHash(path)],
				),
			),
			results,
		},
		null,
		2,
	) + '\n',
)
assert.ok(results.every((result) => result.bundlesObserved > 0 && result.sourcesObserved > 0))
assert.ok(
	results.every((result) => result.bundlesAlive === 0 && result.sourcesAlive === 0),
	'Abandoned request assemblies must be collectible while external engines remain alive',
)
