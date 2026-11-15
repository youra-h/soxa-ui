import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { PassThrough } from 'node:stream'
import {
	createContext,
	createElement as h,
	Suspense,
	useContext,
	useEffect,
	useId,
	useMemo,
} from 'react'
import { renderToPipeableStream, renderToString } from 'react-dom/server'
import { prerenderToNodeStream } from 'react-dom/static'
import { Tabs } from '@soxa-ui/react'
import { JSDOM } from 'jsdom'

const Application = createContext({ panelId: 'default-panel', language: 'default-language' })
const observations = []
const diagnostics = []
const originals = new Map()

for (const method of ['warn', 'error']) {
	originals.set(method, console[method])
	console[method] = (...args) => diagnostics.push(args.map(String).join(' '))
}

function inspect(html) {
	const dom = new JSDOM(html)
	const tabs = [...dom.window.document.querySelectorAll('[role="tab"]')]
	const result = {
		tabs: tabs.map((node) => node.textContent),
		controls: tabs.map((node) => node.getAttribute('aria-controls')),
		panels: [...dom.window.document.querySelectorAll('[role="tabpanel"]')].map((node) => ({
			id: node.id,
			labelledby: node.getAttribute('aria-labelledby'),
		})),
	}
	dom.window.close()

	return result
}

/** A consumer component, forwarding to the unchanged published Tabs.Item. */
function ApplicationTab({ trace, value, text, onRender }) {
	const context = useContext(Application)
	const id = useId()
	trace.push({ event: 'tab', value, id, context })
	onRender?.()

	useEffect(() => {
		trace.push({ event: 'effect', value })
		return () => trace.push({ event: 'cleanup', value })
	}, [trace, value])

	return h(Tabs.Item, { value, text })
}

function ApplicationPanel({ trace }) {
	const context = useContext(Application)
	const id = useId()
	trace.push({ event: 'panel', id, context })

	return h(Tabs.Content, { value: 'selected', id: context.panelId }, context.language)
}

function ApplicationLabel({ trace }) {
	const context = useContext(Application)
	const id = useId()
	trace.push({ event: 'tab', value: 'selected', id, context })
	return 'Selected'
}

function LibraryTree({ trace }) {
	return h(Tabs, {
		items: [{ value: 'selected', text: 'Selected', _: { active: true } }],
		item: () => h(ApplicationLabel, { trace }),
		content: h(ApplicationPanel, { trace }),
	})
}

/** Prepare precisely the subtree subsequently returned, with no Candidate substitution. */
function LocalRenderer({ trace }) {
	const subtree = h(LibraryTree, { trace })
	renderToString(subtree)

	return subtree
}

const provided = { panelId: 'application-panel', language: 'application-language' }
const localTrace = []
const localHtml = renderToString(
	h(Application.Provider, { value: provided }, h(LocalRenderer, { trace: localTrace })),
)
const localPanels = localTrace.filter((row) => row.event === 'panel')
const localTabs = localTrace.filter((row) => row.event === 'tab')

assert.equal(localPanels.length, 2)
assert.equal(localTabs.length, 2)
assert.equal(localPanels[0].context.panelId, 'default-panel')
assert.equal(localPanels[1].context.panelId, provided.panelId)
assert.notEqual(localPanels[0].id, localPanels[1].id)
assert.notEqual(localTabs[0].id, localTabs[1].id)
assert.equal(inspect(localHtml).panels[0].id, provided.panelId)

observations.push({
	scenario: 'local native rendering of the exact same library subtree',
	trace: localTrace,
	result: 'The nested request loses application context and uses its own native id namespace.',
})

// Moving preparation to the host preserves the entire ancestor tree. The same
// element object and the same components are used in both requests here.
const wholeTrace = []
const wholeTree = h(
	Application.Provider,
	{ value: provided },
	h(LibraryTree, { trace: wholeTrace }),
)
const firstHtml = renderToString(wholeTree)
const firstTrace = wholeTrace.splice(0)
const secondHtml = renderToString(wholeTree)

assert.equal(firstHtml, secondHtml)
assert.deepEqual(firstTrace, wholeTrace)
assert.ok(wholeTrace.every((row) => row.context === provided))

observations.push({
	scenario: 'whole root native replay, same element object and deterministic application',
	first: firstTrace,
	second: wholeTrace.splice(0),
	identicalHtml: true,
	result: 'Host replay preserves context and native ids in this case; it is not a library hook.',
})

function gateOf() {
	let ready = false
	let release
	const promise = new Promise((resolve) => {
		release = resolve
	})

	return {
		read() {
			if (!ready) throw promise
		},
		resolve() {
			ready = true
			release()
		},
	}
}

function Wait({ gate, trace }) {
	trace.push({ event: 'wait' })
	gate.read()
	trace.push({ event: 'resolved' })
	return null
}

function BranchTree({ trace, gate, onFallback }) {
	return h(
		Tabs,
		null,
		h(ApplicationTab, { trace, value: 'outside', text: 'Outside' }),
		h(
			Suspense,
			{
				fallback: h(ApplicationTab, {
					trace,
					value: 'fallback',
					text: 'Fallback',
					onRender: onFallback,
				}),
			},
			h(ApplicationTab, { trace, value: 'primary', text: 'Primary' }),
			h(Wait, { gate, trace }),
		),
	)
}

const abandonedTrace = []
const abandonedTree = h(BranchTree, { trace: abandonedTrace, gate: gateOf() })
const abandonedHtml = renderToString(abandonedTree)
const abandoned = inspect(abandonedHtml)

assert.ok(abandonedTrace.some((row) => row.event === 'tab' && row.value === 'primary'))
assert.ok(abandonedTrace.some((row) => row.event === 'tab' && row.value === 'fallback'))
assert.deepEqual(abandoned.tabs, ['Outside', 'Fallback'])
assert.equal(
	abandonedTrace.some((row) => ['effect', 'cleanup'].includes(row.event)),
	false,
)

observations.push({
	scenario: 'ordinary library markup, native renderToString abandons suspended primary',
	trace: abandonedTrace,
	accepted: abandoned,
	result: 'Execution is not membership; no effect or cleanup announces abandonment on the server.',
})

async function stream(tree, trace, resolve) {
	const output = new PassThrough()
	const chunks = []
	output.on('data', (chunk) => chunks.push(chunk))
	const done = new Promise((complete, reject) => {
		output.on('end', complete)
		output.on('error', reject)
	})
	const request = renderToPipeableStream(tree, {
		onShellReady(...args) {
			trace.push({ event: 'shell', arguments: args.length })
			resolve()
		},
		onAllReady(...args) {
			trace.push({ event: 'all-ready', arguments: args.length })
			request.pipe(output)
		},
		onError(error) {
			output.destroy(error)
		},
	})

	await done
	return Buffer.concat(chunks).toString()
}

const streamedTrace = []
const streamedGate = gateOf()
const streamedTree = h(BranchTree, {
	trace: streamedTrace,
	gate: streamedGate,
	onFallback: () => streamedGate.resolve(),
})
const streamedHtml = await stream(streamedTree, streamedTrace, () => {})
const streamed = inspect(streamedHtml)

assert.deepEqual(streamed.tabs, ['Outside', 'Primary'])
assert.ok(streamedTrace.some((row) => row.event === 'tab' && row.value === 'fallback'))
assert.equal(
	streamedTrace.some((row) => ['effect', 'cleanup'].includes(row.event)),
	false,
)
assert.equal(streamedTrace.find((row) => row.event === 'all-ready').arguments, 0)

observations.push({
	scenario: 'ordinary library markup, native all-ready buffering after primary resolves',
	trace: [...streamedTrace],
	accepted: streamed,
	result: 'The host knows completion, but receives no accepted declaration set or branch identities.',
})

// When application resources are explicitly retained by the host, a completed
// boundary can be replayed without its fallback. Keep this successful control.
streamedTrace.length = 0
const replayedHtml = renderToString(streamedTree)
assert.deepEqual(inspect(replayedHtml), streamed)
assert.deepEqual(
	streamedTrace.filter((row) => row.event === 'tab').map((row) => row.value),
	['outside', 'primary'],
)
observations.push({
	scenario: 'host replay with explicitly retained resolved application resource',
	trace: [...streamedTrace],
	identicalHtml: replayedHtml === streamedHtml,
	result: 'This replay avoids fallback execution; retaining application resources is a host input.',
})

const Resource = createContext(null)

function RequestResources({ trace }) {
	const gate = useMemo(gateOf, [])

	return h(Resource.Provider, { value: gate }, h(ResourceTree, { trace }))
}

function ResourceTree({ trace }) {
	const gate = useContext(Resource)
	return h(BranchTree, { trace, gate, onFallback: () => gate.resolve() })
}

// This is also one unchanged root element object, with ordinary request-scoped
// hook state. A new server request does not inherit the old request's useMemo.
const resourceTrace = []
const resourceTree = h(RequestResources, { trace: resourceTrace })
const resourceFirst = await stream(resourceTree, resourceTrace, () => {})
const resourceFirstTrace = resourceTrace.splice(0)
const resourceSecond = await stream(resourceTree, resourceTrace, () => {})

assert.equal(resourceFirst, resourceSecond)
for (const rows of [resourceFirstTrace, resourceTrace]) {
	assert.ok(rows.some((row) => row.event === 'tab' && row.value === 'fallback'))
	assert.ok(rows.some((row) => row.event === 'tab' && row.value === 'primary'))
}
observations.push({
	scenario: 'whole root replay with a request-local application resource provider',
	first: resourceFirstTrace,
	second: [...resourceTrace],
	identicalHtml: true,
	result: 'Both completed requests execute the discarded fallback; another pass is not an acceptance signal.',
})

const staticTrace = []
const staticGate = gateOf()
const staticTree = h(BranchTree, {
	trace: staticTrace,
	gate: staticGate,
	onFallback: () => staticGate.resolve(),
})
const staticPending = prerenderToNodeStream(staticTree)
const staticResult = await staticPending
let staticHtml = ''

for await (const chunk of staticResult.prelude) staticHtml += chunk

assert.deepEqual(inspect(staticHtml).tabs, ['Outside', 'Primary'])
assert.ok(staticTrace.some((row) => row.event === 'tab' && row.value === 'fallback'))
assert.equal(staticResult.postponed, null)
observations.push({
	scenario: 'native static prerender waits for primary completion',
	trace: staticTrace,
	accepted: inspect(staticHtml),
	resultKeys: Object.keys(staticResult).sort(),
	postponed: staticResult.postponed,
	result: 'Static prerender also executes the discarded fallback; its result exposes prelude and opaque postponed state.',
})

// This input already has the tab in `items`, avoiding the separate React
// markup-registration defect. Only the forward panel-id dependency remains.
function DelayedPanel({ gate, trace }) {
	gate.read()
	return h(ApplicationPanel, { trace })
}

const idTrace = []
const idGate = gateOf()
const idTree = h(
	Application.Provider,
	{ value: provided },
	h(Tabs, {
		items: [{ value: 'selected', text: 'Selected', _: { active: true } }],
		item: () => h(ApplicationLabel, { trace: idTrace }),
		content: h(Suspense, { fallback: null }, h(DelayedPanel, { gate: idGate, trace: idTrace })),
	}),
)
const idHtml = await stream(idTree, idTrace, () => idGate.resolve())
const idResult = inspect(idHtml)

assert.equal(idTrace.filter((row) => row.event === 'tab').length, 1)
assert.equal(idResult.panels[0].id, provided.panelId)
assert.notEqual(idResult.controls[0], provided.panelId)
assert.ok(
	idTrace.findIndex((row) => row.event === 'tab') <
		idTrace.findIndex((row) => row.event === 'panel'),
)

observations.push({
	scenario: 'late custom panel id, data tab, native all-ready buffering',
	trace: idTrace,
	accepted: idResult,
	result: 'Buffering the host stream does not replay the already rendered earlier tab.',
})

for (const [method, original] of originals) console[method] = original

assert.deepEqual(diagnostics, [])
const buffered = observations.find(
	(row) =>
		row.scenario ===
		'ordinary library markup, native all-ready buffering after primary resolves',
)
assert.ok(buffered.trace.some((row) => row.event === 'tab' && row.value === 'fallback'))
assert.ok(buffered.trace.some((row) => row.event === 'all-ready'))

const report = {
	checkedAt: new Date().toISOString(),
	environment: {
		node: process.version,
		dependencies: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
			.dependencies,
	},
	gate: 'NOT PASSED: no production transport is implemented or certified by this experiment',
	observations,
	diagnostics,
	limits: [
		'All Tabs components are unchanged published @soxa-ui/react 0.4.0; application wrappers only record observations.',
		'HTML is inspected as test output; it is never modified or consumed as a preparation plan.',
		'Whole-root replay is a positive deterministic control, not a claim that replay is universally impossible.',
		'The trace is speculative execution, not an accepted declaration transport.',
		'No Next integration, production adapter changes, hydration or performance claim in this gate test.',
	],
}

writeFileSync(
	new URL('./native-transport-results.json', import.meta.url),
	JSON.stringify(report, null, 2),
)
console.log(
	JSON.stringify({ gate: report.gate, scenarios: observations.length, diagnostics }, null, 2),
)
