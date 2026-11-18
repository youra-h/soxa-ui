import {
	createElement as h,
	createContext,
	useContext,
	useId,
	useRef,
	Suspense,
	Fragment,
} from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server'
import { PassThrough } from 'node:stream'
import { Tabs as LibraryTabs } from '@soxa-ui/react'
import { TPlan } from './plan.mjs'

const Run = createContext(null)
const Scope = createContext(null)

function CandidateTabs(props) {
	const run = useContext(Run)
	const id = useId()
	const engine = useRef(null)

	if (props.engine) throw new Error('External engine needs an ownership protocol')

	const entries = run.plan.scope(id, run.phase)

	if (run.phase === 'render' && !engine.current) {
		engine.current = run.plan.engine(id)
		run.engines.set(id, engine.current)
	}

	const body =
		run.phase === 'scan'
			? h(Fragment, null, props.children, props.content)
			: h(LibraryTabs, { engine: engine.current, content: props.content }, props.children)

	return h(Scope.Provider, { value: { entries, engine: engine.current } }, body)
}

function CandidateItem(props) {
	const run = useContext(Run)
	const scope = useContext(Scope)

	if (run.phase === 'scan') {
		scope.entries.set(props.value, { ...props })
		return null
	}

	const ctrl = scope.engine.extensions.batch.items.find((item) => item.value === props.value)

	if (!ctrl) throw new Error('Declaration missing from first pass: ' + props.value)

	return h(LibraryTabs.Item, { ...props, ctrl })
}

function CandidateContent(props) {
	return useContext(Run).phase === 'scan' ? props.children : h(LibraryTabs.Content, props)
}

const Candidate = Object.assign(CandidateTabs, { Item: CandidateItem, Content: CandidateContent })

/** Instrumented components are a research fixture, not a public adapter implementation. */
export function Page({
	tabs: Tabs,
	scenario = 'simple',
	count = 2,
	gate,
	externalEngine,
	marker = '',
}) {
	const items = Array.from({ length: count }, (_, index) =>
		h(Tabs.Item, {
			key: index,
			value: marker + index,
			text: 'Tab ' + index,
			active: index === count - 1,
		}),
	)
	const content = Array.from({ length: count }, (_, index) =>
		h(
			Tabs.Content,
			{
				key: index,
				value: marker + index,
				...(scenario === 'custom-id' && index === count - 1 ? { id: 'custom-panel' } : {}),
			},
			'Panel ' + index,
		),
	)

	if (scenario === 'suspense') {
		function Wait() {
			gate.read()
			return null
		}

		return h(Tabs, { content }, [
			items[0],
			h(
				Suspense,
				{
					key: 'boundary',
					fallback: h(Tabs.Item, { value: marker + 'fallback', text: 'Fallback' }),
				},
				items[1],
				h(Wait),
			),
		])
	}

	if (scenario === 'nested') {
		return h(Tabs, { content: h(Tabs.Content, { value: '1' }, h(Page, { tabs: Tabs })) }, items)
	}

	function WrappedItem({ item }) {
		return item
	}

	return h(
		Tabs,
		{ engine: externalEngine, content },
		items.map((item, index) => h(WrappedItem, { key: index, item })),
	)
}

function runOf(plan, phase) {
	return { plan, phase, engines: new Map() }
}

function tree(run, props) {
	return h(Run.Provider, { value: run }, h(Page, { ...props, tabs: Candidate }))
}

export const baseline = (props) => renderToString(h(Page, { ...props, tabs: LibraryTabs }))

export function prepare(props) {
	const run = runOf(new TPlan(), 'scan')

	renderToString(tree(run, props))

	return run.plan
}

export function renderPrepared(plan, props) {
	const run = runOf(plan, 'render')
	const html = renderToString(tree(run, props))

	return { html, run, element: tree(run, props) }
}

export function prototype(props) {
	return renderPrepared(prepare(props), props)
}

export function suspendedGate() {
	const pending = new Promise(() => {})

	return {
		read() {
			throw pending
		},
	}
}

export function resolvingGate() {
	let ready = false
	let resolve
	const pending = new Promise((done) => {
		resolve = done
	})

	return {
		read() {
			if (!ready) throw pending
		},
		resolve() {
			ready = true
			resolve()
		},
	}
}

/** Wait for final HTML while retaining declarations observed in abandoned fallback work. */
export async function prepareStreamed(props) {
	const run = runOf(new TPlan(), 'scan')
	const output = new PassThrough()
	const chunks = []
	output.on('data', (chunk) => chunks.push(chunk))
	const complete = new Promise((resolve, reject) => {
		output.on('end', resolve)
		output.on('error', reject)
	})
	const stream = renderToPipeableStream(tree(run, props), {
		onAllReady() {
			stream.pipe(output)
		},
		onError(error) {
			output.destroy(error)
		},
	})

	setTimeout(() => props.gate.resolve(), 5)
	await complete

	return { plan: run.plan, html: Buffer.concat(chunks).toString() }
}
