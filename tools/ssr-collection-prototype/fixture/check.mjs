import assert from 'node:assert/strict'
import { performance } from 'node:perf_hooks'
import { cpus } from 'node:os'
import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { createEngineTabs } from '@soxa-ui/core'
import * as react from './react.mjs'
import * as vue from './vue.mjs'

const diagnostics = []

for (const method of ['error', 'warn']) {
	const original = console[method].bind(console)
	console[method] = (...args) => {
		diagnostics.push(args.map(String).join(' '))
		original(...args)
	}
}

const observations = []
const rejections = []

function inspect(html, active = '1') {
	const dom = new JSDOM(html)
	const document = dom.window.document
	const tabs = [...document.querySelectorAll('[role="tab"]')]
	const activeTab = tabs.find((tab) => tab.textContent === 'Tab ' + active)
	const panel = [...document.querySelectorAll('[role="tabpanel"]')].find(
		(node) => node.textContent.trim() === 'Panel ' + active,
	)
	const result = {
		tabs: tabs.map((tab) => tab.textContent),
		stops: tabs.map((tab) => tab.getAttribute('tabindex')),
		activePanel: !!panel,
		activeLink: !!panel && activeTab?.getAttribute('aria-controls') === panel.id,
	}
	dom.window.close()

	return result
}

for (const framework of ['react', 'vue']) {
	const adapter = framework === 'react' ? react : vue
	const baseline = inspect(await adapter.baseline(framework === 'react' ? {} : 2))
	const candidate = inspect((await adapter.prototype(framework === 'react' ? {} : 2)).html)

	assert.equal(candidate.activePanel, true)
	assert.equal(candidate.activeLink, true)
	assert.deepEqual(candidate.stops, ['-1', '0'])

	if (framework === 'react') assert.equal(baseline.activePanel, false)
	else assert.deepEqual(baseline.stops, ['0', '0'])

	observations.push({
		framework,
		scenario:
			framework === 'react' ? 'synchronous wrapped declarations' : 'synchronous declarations',
		baseline,
		candidate,
	})

	const custom = inspect(
		(framework === 'react'
			? adapter.prototype({ scenario: 'custom-id' })
			: await adapter.prototype(2, true)
		).html,
	)

	assert.equal(custom.activePanel, true)
	assert.equal(custom.activeLink, false)
	rejections.push({
		scenario: framework + ' custom panel id',
		actual: custom,
		reason: 'Collecting items alone does not prepare the panel-to-tab id link before HTML.',
	})
}

const pending = { scenario: 'suspense', gate: react.suspendedGate() }
const abandoned = react.prototype(pending)
const abandonedValues = [...abandoned.run.engines.values()][0].extensions.batch.items.map(
	(item) => item.value,
)
const abandonedHtml = inspect(abandoned.html)

assert.ok(abandonedValues.includes('1'))
assert.ok(!abandonedHtml.tabs.includes('Tab 1'))
assert.equal(abandonedHtml.activePanel, true)
assert.equal(abandonedHtml.activeLink, false)
assert.deepEqual(abandonedHtml.stops, ['-1', '-1'])
rejections.push({
	scenario: 'React suspended branch abandoned by renderToString',
	engineValues: abandonedValues,
	actual: abandonedHtml,
	reason: 'A tab in abandoned work is retained and activates a panel whose tab is absent.',
})

const gate = react.resolvingGate()
const streamed = await react.prepareStreamed({ scenario: 'suspense', gate })
const completed = react.renderPrepared(streamed.plan, { scenario: 'suspense', gate })
const streamedValues = [...completed.run.engines.values()][0].extensions.batch.items.map(
	(item) => item.value,
)

assert.ok(streamedValues.includes('fallback'))
assert.ok(!inspect(completed.html).tabs.includes('Fallback'))
rejections.push({
	scenario: 'React streaming boundary resolved',
	engineValues: streamedValues,
	actual: inspect(completed.html),
	reason: 'A discarded fallback declaration survives even after onAllReady.',
})

const nestedPlan = react.prepare({ scenario: 'nested' })

assert.equal(nestedPlan.scopes.size, 2)
assert.throws(
	() => react.renderPrepared(nestedPlan, { scenario: 'nested' }),
	/Scope identity changed/,
)
rejections.push({
	scenario: 'React nested sets',
	reason: 'useId scope positions change when the discovery wrappers are replaced by real adapter structure.',
})

const external = createEngineTabs({ items: [{ value: 'external', text: 'External' }] })
const externalBefore = [...external.extensions.batch.items]

assert.throws(() => react.prepare({ externalEngine: external }), /External engine needs/)
assert.deepEqual([...external.extensions.batch.items], externalBefore)
observations.push({ scenario: 'external engine', unchangedOnRejection: true, supported: false })

const hydration = JSON.parse(
	readFileSync(new URL('./hydration-report.json', import.meta.url), 'utf8'),
)
const concurrent = await Promise.all(
	Array.from({ length: 3 }, async (_, index) => {
		const localGate = react.resolvingGate()
		const marker = 'request-' + index + '-'
		const local = await react.prepareStreamed({ scenario: 'suspense', gate: localGate, marker })
		const values = [...local.plan.scopes.values()].flatMap((scope) => [...scope.keys()])

		assert.deepEqual(values, [marker + '0', marker + '1', marker + 'fallback'])
		return local.plan
	}),
)

assert.equal(new Set(concurrent).size, 3)
assert.ok(concurrent.every((plan) => plan !== streamed.plan))
observations.push({
	scenario: 'concurrent requests',
	separatePlans: true,
	count: concurrent.length,
})

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const timing = []
const count = 100

for (const framework of ['react', 'vue']) {
	const adapter = framework === 'react' ? react : vue
	const props = framework === 'react' ? { count } : count
	const prepared = await adapter.prepare(props)
	const measures = { baseline: [], prepared: [], prototype: [] }
	const heapDeltas = { baseline: [], prepared: [], prototype: [] }

	for (let round = -5; round < 9; round++) {
		for (const mode of round % 2
			? ['prototype', 'prepared', 'baseline']
			: ['baseline', 'prepared', 'prototype']) {
			globalThis.gc?.()
			const heapBefore = process.memoryUsage().heapUsed
			const started = performance.now()
			const result =
				mode === 'prepared'
					? await adapter.renderPrepared(prepared, props)
					: await adapter[mode](props)
			const elapsed = performance.now() - started
			const heapDelta = process.memoryUsage().heapUsed - heapBefore

			assert.ok((typeof result === 'string' ? result : result.html).includes('Tab 99'))

			if (round >= 0) {
				measures[mode].push(elapsed)
				heapDeltas[mode].push(heapDelta)
			}
		}
	}
	timing.push({
		framework,
		tabs: count,
		warmups: 5,
		measuredRounds: 9,
		medianMs: {
			baseline: median(measures.baseline),
			prepared: median(measures.prepared),
			prototype: median(measures.prototype),
		},
		medianHeapDeltaBytes: {
			baseline: median(heapDeltas.baseline),
			prepared: median(heapDeltas.prepared),
			prototype: median(heapDeltas.prototype),
		},
		meaning:
			'Elapsed time of server calls; heap delta immediately after a call, not peak memory or retained memory. Compare prototype versus prepared to isolate discovery overhead with the same completed HTML. Published baseline React omits panel content and is not equivalent work.',
		samplesMs: measures,
	})
}

assert.deepEqual(diagnostics, [])

const report = {
	diagnostics,
	checkedAt: new Date().toISOString(),
	environment: {
		node: process.version,
		platform: process.platform,
		arch: process.arch,
		cpu: cpus()[0]?.model,
		dependencies: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
			.dependencies,
	},
	disposition: 'REJECTED as a general implementation; synchronous proof of concept only',
	observations,
	rejections,
	hydration,
	timing,
	limits: [
		'Standalone instrumented fixture on published packages; no library or protected-layer changes.',
		'React and Vue prototype only; Svelte, Solid and Angular are not claimed as prototyped.',
		'The two-pass collector deliberately records render work without commit-aware branch ownership; the failing adversarial cases are evidence against this implementation.',
		'External engines are rejected without mutation rather than silently replaced.',
		'Client hydration checked in jsdom; not a full Next/Nuxt application or browser benchmark.',
	],
}

writeFileSync(new URL('./report.json', import.meta.url), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
