import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { cpus } from 'node:os'
import { performance } from 'node:perf_hooks'
import { setImmediate as turn } from 'node:timers/promises'
import { createElement as h, Fragment, version } from 'react'
import { renderToString } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { input, distHash } from '../ssr-collection-prototype/initial-fixture.mjs'
import { Tabs as Before } from './results/comparison-before/index.js'
import { Tabs as Integrated } from './results/comparison-integrated/index.js'

assert.ok(global.gc, 'Run with --expose-gc')
assert.equal(process.env.NODE_ENV, 'production')
const runs = 15
const warmups = 4
const results = []

function tree(Tabs, source) {
	return h(Tabs, {
		initial: source,
		content: h(
			Fragment,
			null,
			...source.panels.map((panel, initial) =>
				h(Tabs.Content, { key: initial, initial }, `Panel ${initial}`),
			),
		),
	})
}

function canonical(html, n) {
	const dom = new JSDOM(html)
	const document = dom.window.document
	const tabs = [...document.querySelectorAll('[role=tab]')]
	assert.equal(tabs.length, n)
	assert.equal(document.querySelectorAll('[role=tab][aria-selected=true]').length, 1)
	assert.equal(document.querySelectorAll('[role=tab][tabindex="0"]').length, 1)
	const panel = document.querySelector('[role=tabpanel]')
	assert.ok(panel)
	assert.equal(tabs[1].getAttribute('aria-controls'), panel.id)
	assert.equal(panel.getAttribute('aria-labelledby'), tabs[1].id)
	const ids = new Map()
	tabs.forEach((tab, index) => {
		ids.set(tab.id, `tab-${index}`)
		ids.set(tab.getAttribute('aria-controls'), `panel-${index}`)
	})
	for (const node of document.querySelectorAll('*')) {
		for (const name of ['id', 'aria-controls', 'aria-labelledby']) {
			const value = node.getAttribute(name)
			if (value && ids.has(value)) node.setAttribute(name, ids.get(value))
		}
	}
	const value = document.body.innerHTML
	dom.window.close()
	return value
}

async function collect() {
	await turn()
	global.gc()
	await turn()
}

function stats(samples) {
	const ordered = [...samples].sort((a, b) => a - b)
	return {
		medianMs: ordered[Math.floor(ordered.length / 2)],
		p95Ms: ordered[Math.floor(ordered.length * 0.95)],
		samplesMs: samples,
	}
}

for (const nested of [false, true]) {
	for (const n of [100, 1000]) {
		const source = input(n, nested)
		const trees = { before: tree(Before, source), integrated: tree(Integrated, source) }
		assert.equal(
			canonical(renderToString(trees.before), n),
			canonical(renderToString(trees.integrated), n),
		)
		const samples = { before: [], integrated: [] }
		for (let round = -warmups; round < runs; round++) {
			const order = round % 2 ? ['before', 'integrated'] : ['integrated', 'before']
			for (const mode of order) {
				await collect()
				const started = performance.now()
				const html = renderToString(trees[mode])
				const elapsed = performance.now() - started
				assert.ok(html.length > 0)
				if (round >= 0) samples[mode].push(elapsed)
			}
		}
		const before = stats(samples.before)
		const integrated = stats(samples.integrated)
		results.push({
			n,
			nestedMetadata: nested,
			inputBytes: Buffer.byteLength(JSON.stringify(source)),
			equivalentHtml: true,
			before,
			integrated,
			medianChangePercent: (integrated.medianMs / before.medianMs - 1) * 100,
		})
	}
}
process.stdout.write(
	JSON.stringify(
		{
			measuredAt: new Date().toISOString(),
			node: process.version,
			react: version,
			cpu: cpus()[0]?.model,
			runs,
			warmups,
			method: 'Serial production renderToString; alternating modes; GC outside timing. Before uses runtime from 3d2a372e0 with current core/setup/plugins; measures transaction integration, not every change since PR #882. Nested means metadata payload, not nested Tabs. p95 is descriptive over 15 samples. No HTTP, browser, hydration or profiler in latency samples.',
			distSha256: Object.fromEntries(
				['packages/core', 'packages/setup', 'packages/plugins'].map((path) => [
					path,
					distHash(path),
				]),
			),
			adapterSha256: Object.fromEntries(
				['before', 'integrated'].map((mode) => [
					mode,
					createHash('sha256')
						.update(
							readFileSync(
								new URL(`./results/comparison-${mode}/index.js`, import.meta.url),
							),
						)
						.digest('hex'),
				]),
			),
			results,
		},
		null,
		2,
	) + '\n',
)
