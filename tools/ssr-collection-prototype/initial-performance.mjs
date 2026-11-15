import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { cpus } from 'node:os'
import { spawnSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'
import { createElement as h, Fragment, version as reactVersion } from 'react'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { Tabs } from '@soxa-ui/react'
import { TCollectionInitialSource } from '@soxa-ui/setup'

// Run after npm run build: this measures the built workspace packages.
if (!global.gc) throw new Error('Run with node --expose-gc.')
const sizes = process.argv.includes('--quick') ? [10, 100] : [100, 1000]
const runs = process.argv.includes('--quick') ? 3 : 9
const warmups = 3

function input(n, nested) {
	return {
		items: Array.from({ length: n }, (_, i) => ({
			value: `v${i}`,
			text: `Item ${i}`,
			_: { active: i === 1 },
			...(nested
				? {
						_extra: {
							nodes: Array.from({ length: 16 }, (_, j) => ({
								key: j,
								data: [j, j + 1, j + 2],
							})),
						},
					}
				: {}),
		})),
		panels: Array.from({ length: n }, (_, i) => ({ value: `v${i}` })),
	}
}

function tree(source, prepared) {
	const panels = source.panels.map((panel, ordinal) =>
		h(
			Tabs.Content,
			{
				key: ordinal,
				...(prepared ? { initial: ordinal } : { value: panel.value }),
			},
			`Panel ${ordinal}`,
		),
	)
	return h(
		Tabs,
		prepared
			? { initial: source, content: h(Fragment, null, ...panels) }
			: {
					items: source.items,
					content: h(Fragment, null, ...panels),
				},
	)
}

/** Validate equivalent output outside the timer; generated ids may differ in spelling. */
function canonical(html, n) {
	const document = new JSDOM(html).window.document
	const tabs = [...document.querySelectorAll('[role=tab]')]
	assert.equal(tabs.length, n)
	assert.equal(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true').length, 1)
	assert.equal(tabs[1].getAttribute('aria-selected'), 'true')
	assert.equal(tabs.filter((tab) => tab.getAttribute('tabindex') === '0').length, 1)
	const panels = [...document.querySelectorAll('[role=tabpanel]')]
	assert.equal(panels.length, 1)
	assert.equal(tabs[1].getAttribute('aria-controls'), panels[0].id)
	assert.equal(panels[0].getAttribute('aria-labelledby'), tabs[1].id)
	const ids = new Map()
	tabs.forEach((tab, index) => {
		ids.set(tab.id, `tab-${index}`)
		ids.set(tab.getAttribute('aria-controls'), `panel-${index}`)
	})
	for (const node of document.querySelectorAll('*'))
		for (const name of ['id', 'aria-controls', 'aria-labelledby']) {
			const value = node.getAttribute(name)
			if (value && ids.has(value)) node.setAttribute(name, ids.get(value))
		}
	const result = document.body.innerHTML
	document.defaultView.close()
	return result
}

function stats(times) {
	const ordered = [...times].sort((a, b) => a - b)
	return {
		medianMs: +ordered[Math.floor(ordered.length / 2)].toFixed(3),
		p95Ms: +ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * 0.95))].toFixed(3),
	}
}

async function measure(run) {
	const times = []
	for (let i = -warmups; i < runs; i++) {
		const start = performance.now()
		run()
		const elapsed = performance.now() - start
		// Engine creation announcements finish before the next independent request.
		await Promise.resolve()
		if (i >= 0) times.push(elapsed)
	}
	return stats(times)
}

/** Alternate comparable renders so mode order does not systematically favor one path. */
async function measurePair(initialTree, legacyTree) {
	const times = { initialSSR: [], existingItemsSSR: [] }
	for (let i = -warmups; i < runs; i++) {
		const pair = [
			['initialSSR', initialTree],
			['existingItemsSSR', legacyTree],
		]
		if (i % 2 !== 0) pair.reverse()
		for (const [mode, element] of pair) {
			const start = performance.now()
			renderToString(element)
			const elapsed = performance.now() - start
			await Promise.resolve()
			if (i >= 0) times[mode].push(elapsed)
		}
	}
	return Object.fromEntries(Object.entries(times).map(([mode, values]) => [mode, stats(values)]))
}

let retained = []
function captureMemory(source) {
	for (let i = 0; i < 30; i++) new TCollectionInitialSource({ initial: source })
	global.gc()
	global.gc()
	const before = process.memoryUsage().heapUsed
	retained = Array.from({ length: 12 }, () => new TCollectionInitialSource({ initial: source }))
	global.gc()
	global.gc()
	const bytes = (process.memoryUsage().heapUsed - before) / retained.length
	assert.equal(retained[0].source.items.length, source.items.length)
	retained = []
	global.gc()
	return Math.round(bytes)
}

if (process.argv.includes('--memory')) {
	const n = Number(process.argv[process.argv.indexOf('--memory') + 1])
	const nested = process.argv[process.argv.indexOf('--memory') + 2] === 'true'
	const bytes = captureMemory(input(n, nested))
	assert.ok(bytes > 0, 'Isolated retained data must have positive heap size')
	process.stdout.write(String(bytes))
	process.exit(0)
}

function isolatedMemory(n, nested) {
	const result = spawnSync(
		process.execPath,
		['--expose-gc', import.meta.filename, '--memory', String(n), String(nested)],
		{ encoding: 'utf8' },
	)
	if (result.status !== 0)
		throw new Error(result.stderr || result.error?.message || 'Memory worker failed')
	return Number(result.stdout)
}

function distHash(packagePath) {
	const directory = fileURLToPath(new URL('../../' + packagePath + '/dist/', import.meta.url))
	const hash = createHash('sha256')
	function visit(folder) {
		for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
			a.name.localeCompare(b.name),
		)) {
			const path = join(folder, entry.name)
			if (entry.isDirectory()) visit(path)
			else if (entry.name.endsWith('.js')) {
				hash.update(relative(directory, path))
				hash.update(readFileSync(path))
			}
		}
	}
	visit(directory)
	return hash.digest('hex')
}

const results = []
for (const nested of [false, true])
	for (const n of sizes) {
		const source = input(n, nested)
		const initialTree = tree(source, true)
		const legacyTree = tree(source, false)
		const initialHtml = renderToString(initialTree)
		const legacyHtml = renderToString(legacyTree)
		assert.equal(canonical(initialHtml, n), canonical(legacyHtml, n))
		await Promise.resolve()
		results.push({
			n,
			nested,
			inputBytes: Buffer.byteLength(JSON.stringify(source)),
			outputBytes: Buffer.byteLength(initialHtml),
			equivalentHtmlIgnoringGeneratedIds: true,
			capture: await measure(() => new TCollectionInitialSource({ initial: source })),
			...(await measurePair(initialTree, legacyTree)),
			retainedCaptureBytesPerSource: isolatedMemory(n, nested),
		})
	}
process.stdout.write(
	JSON.stringify(
		{
			measuredAt: new Date().toISOString(),
			node: process.version,
			react: reactVersion,
			mode: process.env.NODE_ENV ?? 'development',
			distSha256: Object.fromEntries(
				['packages/setup', 'packages/plugins', 'packages/ui/react'].map((path) => [
					path,
					distHash(path),
				]),
			),
			cpu: cpus()[0]?.model,
			runs,
			warmups,
			results,
			scope: 'Synchronous React renderToString over built packages; no HTTP, RSC, browser or hydration timing. Heap is retained snapshot data after GC in a fresh child process per case, not peak process memory.',
		},
		null,
		2,
	) + '\n',
)
