import assert from 'node:assert/strict'
import { Session } from 'node:inspector'
import { spawnSync } from 'node:child_process'
import { cpus } from 'node:os'
import { Writable } from 'node:stream'
import { setImmediate as turn } from 'node:timers/promises'
import { createElement as h, Fragment, Suspense, version as reactVersion } from 'react'
import { renderToPipeableStream } from 'react-dom/server'
import { input, tree, distHash } from './initial-fixture.mjs'
import { TCollectionInitialSource } from '@soxa-ui/setup'
import { TCollectionBundlesPlugin } from '@soxa-ui/plugins'

const worker = process.argv.includes('--worker')
const requestsPerRound = 3
const rounds = 3
const warmups = 3
const samplingInterval = 16384
if (!global.gc) throw new Error('Run with node --expose-gc.')

/** The pending resource belongs to this request; abort must release its request graph. */
async function request(element, outcome) {
	const abortError = new Error('Intentional memory-probe abort')
	let expectedErrors = 0
	let bytes = 0
	const pending = new Promise(() => {})
	function Pending() {
		throw pending
	}
	const root =
		outcome === 'abort'
			? h(Fragment, null, element, h(Suspense, { fallback: 'Pending' }, h(Pending)))
			: element
	await new Promise((resolve, reject) => {
		const output = new Writable({
			write(chunk, encoding, done) {
				bytes += chunk.length
				done()
			},
		})
		output.once('finish', resolve)
		output.once('error', reject)
		const stream = renderToPipeableStream(root, {
			onShellReady() {
				stream.pipe(output)
				if (outcome === 'abort') stream.abort(abortError)
			},
			onShellError: reject,
			onError(error) {
				if (error === abortError) expectedErrors++
				else reject(error)
			},
		})
	})
	assert.ok(bytes > 0)
	assert.equal(expectedErrors, outcome === 'abort' ? 1 : 0)
}

async function collect() {
	for (let i = 0; i < 3; i++) {
		await turn()
		global.gc()
	}
	await turn()
}

function memory() {
	const current = process.memoryUsage()
	return {
		heapUsed: current.heapUsed,
		rss: current.rss,
		processLifetimePeakRSS: process.resourceUsage().maxRSS * 1024,
	}
}

if (worker) {
	const [, , , size, nestedArg, mode, outcome] = process.argv
	const n = Number(size)
	const source = input(n, nestedArg === 'true')
	const element = tree(source, mode === 'initial')
	let sourceRefs = []
	let engineRefs = []
	const seenSources = new WeakSet()
	const seenEngines = new WeakSet()
	const materialize = TCollectionInitialSource.prototype.materialize
	TCollectionInitialSource.prototype.materialize = function (...args) {
		if (!seenSources.has(this)) {
			seenSources.add(this)
			sourceRefs.push(new WeakRef(this))
		}
		return materialize.apply(this, args)
	}
	const bindEngine = TCollectionBundlesPlugin.prototype.bindEngine
	TCollectionBundlesPlugin.prototype.bindEngine = function (engine) {
		if (!seenEngines.has(engine)) {
			seenEngines.add(engine)
			engineRefs.push(new WeakRef(engine))
		}
		return bindEngine.call(this, engine)
	}
	const warmupElement = tree(input(10, nestedArg === 'true'), mode === 'initial')
	for (let i = 0; i < warmups; i++) await request(warmupElement, outcome)
	await collect()
	sourceRefs = []
	engineRefs = []
	const session = new Session()
	session.connect()
	const post = (method, params = {}) =>
		new Promise((resolve, reject) =>
			session.post(method, params, (error, result) =>
				error ? reject(error) : resolve(result),
			),
		)
	await post('HeapProfiler.startSampling', {
		samplingInterval,
		includeObjectsCollectedByMajorGC: true,
		includeObjectsCollectedByMinorGC: true,
	})
	const baseline = memory()
	const snapshots = []
	for (let round = 0; round < rounds; round++) {
		for (let i = 0; i < requestsPerRound; i++) await request(element, outcome)
		const beforeGC = memory()
		await collect()
		const afterGC = memory()
		snapshots.push({
			completedRequests: (round + 1) * requestsPerRound,
			beforeGC,
			afterGC,
			reclaimedHeapBytes: beforeGC.heapUsed - afterGC.heapUsed,
			retainedHeapDeltaFromBaselineBytes: afterGC.heapUsed - baseline.heapUsed,
		})
	}
	// Take memory readings before returning the profiler's own allocation tree.
	assert.equal(sourceRefs.length, mode === 'initial' ? rounds * requestsPerRound : 0)
	assert.equal(engineRefs.length, rounds * requestsPerRound)
	const sourcesAlive = sourceRefs.filter((ref) => ref.deref()).length
	const enginesAlive = engineRefs.filter((ref) => ref.deref()).length
	assert.equal(
		sourcesAlive,
		0,
		'Prepared request sources must be collectible after completion or abort',
	)
	assert.equal(
		enginesAlive,
		0,
		'Request-owned engines must be collectible after completion or abort',
	)
	const { profile } = await post('HeapProfiler.stopSampling')
	session.disconnect()
	function allocated(node) {
		return node.selfSize + node.children.reduce((sum, child) => sum + allocated(child), 0)
	}
	const sampledAllocationEstimateBytes = allocated(profile.head)
	process.stdout.write(
		JSON.stringify({
			n,
			nested: nestedArg === 'true',
			mode,
			outcome,
			inputBytes: Buffer.byteLength(JSON.stringify(source)),
			baseline,
			rounds: snapshots,
			requests: rounds * requestsPerRound,
			sampledAllocationEstimateBytes,
			sampledAllocationEstimateBytesPerRequest: Math.round(
				sampledAllocationEstimateBytes / (rounds * requestsPerRound),
			),
			samples: profile.samples.length,
			weakRefs: {
				sourcesObserved: sourceRefs.length,
				sourcesAlive,
				enginesObserved: engineRefs.length,
				enginesAlive,
			},
		}),
	)
} else {
	const results = []
	for (const nested of [false, true])
		for (const n of [100, 1000])
			for (const mode of ['initial', 'items'])
				for (const outcome of ['success', 'abort']) {
					const result = spawnSync(
						process.execPath,
						[
							'--expose-gc',
							import.meta.filename,
							'--worker',
							String(n),
							String(nested),
							mode,
							outcome,
						],
						{ encoding: 'utf8', timeout: 60000 },
					)
					if (result.status !== 0)
						throw new Error(
							result.stderr || result.error?.message || 'Memory worker failed',
						)
					results.push(JSON.parse(result.stdout))
				}
	process.stdout.write(
		JSON.stringify(
			{
				measuredAt: new Date().toISOString(),
				node: process.version,
				react: reactVersion,
				mode: process.env.NODE_ENV ?? 'development',
				cpu: cpus()[0]?.model,
				warmups,
				warmupItems: 10,
				requestsPerRound,
				rounds,
				samplingIntervalBytes: samplingInterval,
				distSha256: Object.fromEntries(
					['packages/setup', 'packages/plugins', 'packages/ui/react'].map((path) => [
						path,
						distHash(path),
					]),
				),
				method: 'Fresh process per case; real completed/aborted Fizz. Inspector sampling includes objects collected by major/minor GC: allocation estimates, not exact allocated or temporary bytes. beforeGC minus afterGC is observed reclaimed heap, not all temporary allocations. Signed post-GC heap deltas include runtime/profiler caches. Peak RSS is the OS whole-process lifetime high-water mark (imports, fixtures and warmup included), not an exact isolated SSR-phase peak. WeakRefs verify request-owned source and engine collection. Profile payload is obtained after heap measurements. Profiled runs are separate from latency measurements.',
				results,
			},
			null,
			2,
		) + '\n',
	)
}
