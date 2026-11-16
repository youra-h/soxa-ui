import { afterAll, expect, it } from 'vitest'
import { Suspense } from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server.node'
import { Writable } from 'node:stream'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Tabs, ListBox } from '@soxa-ui/react'

const mode = process.env.ATTACH_MODE ?? 'baseline'
const rows: object[] = []
const diagnostics: string[] = []
const originalError = console.error
const originalWarn = console.warn
console.error = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	originalError(...args)
}
console.warn = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	originalWarn(...args)
}
type TEngineView = { extensions: { batch: { items: readonly object[] } } }
let engines: TEngineView[] = []
let weak: WeakRef<object>[] = []
const weakKinds = new WeakMap<WeakRef<object>, string>()
function observe(value: object, kind: string) {
	const ref = new WeakRef(value)
	weak.push(ref)
	weakKinds.set(ref, kind)
}
let count = 0
Reflect.set(
	globalThis,
	'__attachProbe',
	(built: object, engine: TEngineView | undefined, appliedMode: string) => {
		if (appliedMode !== mode) throw new Error(`Mode mismatch: ${appliedMode} / ${mode}`)
		observe(built, 'assembly')
		const contexts = Reflect.get(built, 'contexts')
		for (const context of Array.isArray(contexts) ? contexts : [contexts]) {
			observe(context, 'context')
			observe(context.instance, 'model')
			if (context.bundle) observe(context.bundle, 'bundle')
		}
		if (engine) observe(engine, 'engine')
		count++
		if (engine && !engines.includes(engine)) engines.push(engine)
	},
)
const values = () =>
	engines.map((engine) => engine.extensions.batch.items.map((item) => Reflect.get(item, 'value')))
const panel = (value: string) => <Tabs.Content value={value}>{`PANEL-${value}`}</Tabs.Content>
const immediate = () => new Promise<void>((resolve) => setImmediate(resolve))
function record(name: string, run: () => unknown) {
	engines = []
	try {
		rows.push({ name, outcome: 'completed', result: run(), values: values() })
	} catch (error) {
		rows.push({ name, outcome: 'error', error: String(error), values: values() })
	}
}

it('records actual synchronous SSR, without asserting candidate success', () => {
	record('markup-active-second', () =>
		renderToString(
			<Tabs
				content={
					<>
						{panel('a')}
						{panel('b')}
					</>
				}
			>
				<Tabs.Item value="a" text="A" />
				<Tabs.Item value="b" text="B" active />
			</Tabs>,
		),
	)
	record('data-active-second-control', () =>
		renderToString(
			<Tabs
				items={[
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', _: { active: true } },
				]}
				content={
					<>
						{panel('a')}
						{panel('b')}
					</>
				}
			/>,
		),
	)
	record('listbox-selected-second', () =>
		renderToString(
			<ListBox>
				<ListBox.Item value="a" text="A" />
				<ListBox.Item value="b" text="B" selected />
			</ListBox>,
		),
	)
	record('late-custom-panel-id', () =>
		renderToString(
			<Tabs
				content={
					<Tabs.Content value="b" id="custom-panel">
						PANEL-b
					</Tabs.Content>
				}
			>
				<Tabs.Item value="b" text="B" active />
			</Tabs>,
		),
	)
	expect(rows).toHaveLength(4)
})

it('records accepted fallback without any retry of the suspended item', async () => {
	engines = []
	function Never(): never {
		throw new Promise(() => {})
	}
	const html = renderToString(
		<Tabs
			content={
				<>
					{panel('a')}
					{panel('ghost')}
				</>
			}
		>
			<Tabs.Item value="a" text="A" />
			<Suspense fallback={<span>FALLBACK</span>}>
				<Tabs.Item value="ghost" text="GHOST" active />
				<Never />
			</Suspense>
		</Tabs>,
	)
	await immediate()
	rows.push({ name: 'fallback-no-retry', html, values: values() })
	expect(html).toContain('FALLBACK')
})

it('records streaming fallback replacement and real stream abort', async () => {
	for (const abort of [false, true]) {
		engines = []
		let ready = false
		let resolve!: () => void
		const waiting = new Promise<void>((done) => {
			resolve = done
		})
		function Wait() {
			if (!ready) throw waiting
			return <span>RESOLVED</span>
		}
		let html = ''
		const errors: string[] = []
		await new Promise<void>((done, reject) => {
			const sink = new Writable({
				write(chunk, _encoding, callback) {
					html += String(chunk)
					callback()
				},
			})
			sink.on('finish', done)
			sink.on('error', reject)
			const stream = renderToPipeableStream(
				<Tabs
					content={
						<>
							{panel('a')}
							{panel('b')}
							{panel('fallback')}
						</>
					}
				>
					<Tabs.Item value="a" text="A" />
					<Suspense fallback={<Tabs.Item value="fallback" text="FALLBACK" active />}>
						<Tabs.Item value="b" text="B" active />
						<Wait />
					</Suspense>
				</Tabs>,
				{
					onShellReady() {
						if (abort) {
							stream.pipe(sink)
							setImmediate(() => stream.abort(new Error('experiment abort')))
						} else
							setImmediate(() => {
								ready = true
								resolve()
							})
					},
					onAllReady() {
						if (!abort) stream.pipe(sink)
					},
					onShellError: reject,
					onError(error) {
						errors.push(String(error))
					},
				},
			)
		})
		rows.push({
			name: abort ? 'stream-abort' : 'stream-resolved',
			html,
			values: values(),
			errors,
		})
	}
})

it('samples GC after whole request disposal; retained-engine branch is measured separately', async () => {
	engines = []
	weak = []
	await immediate()
	global.gc?.()
	const before = process.memoryUsage().heapUsed
	for (let round = 0; round < 20; round++) {
		renderToString(
			<Tabs content={panel('b')}>
				<Tabs.Item value="a" />
				<Tabs.Item value="b" active />
			</Tabs>,
		)
		engines = []
	}
	const refs = weak
	weak = []
	for (let pass = 0; pass < 8; pass++) {
		await immediate()
		global.gc?.()
	}
	const alive = refs.filter((ref) => ref.deref()).length
	rows.push({
		name: 'whole-request-gc',
		assemblies: refs.length,
		alive,
		heapDelta: process.memoryUsage().heapUsed - before,
		note: 'WeakRef observation after 8 GC turns; heap delta includes runtime caches, not isolated leak bytes.',
	})
	engines = []
	function Never(): never {
		throw new Promise(() => {})
	}
	renderToString(
		<Tabs>
			<Suspense fallback={<span>FALLBACK</span>}>
				<Tabs.Item value="ghost" active />
				<Never />
			</Suspense>
		</Tabs>,
	)
	const retained = engines[0]
	engines = []
	for (let pass = 0; pass < 4; pass++) {
		await immediate()
		global.gc?.()
	}
	rows.push({
		name: 'owner-retained-gc',
		values: retained?.extensions.batch.items.map((item) => Reflect.get(item, 'value')),
		note: 'Probe intentionally retains the internal owner engine to inspect membership; this is not a whole-request leak claim.',
	})
	expect(global.gc).toBeTypeOf('function')
})

it('samples request-owned references after repeated real streaming aborts', async () => {
	engines = []
	weak = []
	function Never(): never {
		throw new Promise(() => {})
	}
	async function abortedRequest() {
		await new Promise<void>((done, reject) => {
			const sink = new Writable({
				write(_chunk, _encoding, callback) {
					callback()
				},
			})
			sink.on('finish', done)
			sink.on('error', reject)
			const stream = renderToPipeableStream(
				<Tabs>
					<Suspense fallback={<span>FALLBACK</span>}>
						<Tabs.Item value="ghost" active />
						<Never />
					</Suspense>
				</Tabs>,
				{
					onShellReady() {
						stream.pipe(sink)
						setImmediate(() => stream.abort(new Error('memory abort')))
					},
					onShellError: reject,
					onError() {},
				},
			)
		})
		engines = []
	}
	for (const requests of [10, 50]) {
		weak = []
		for (let request = 0; request < requests; request++) await abortedRequest()
		const refs = weak
		weak = []
		for (let pass = 0; pass < 8; pass++) {
			await immediate()
			global.gc?.()
		}
		const aliveKinds = refs.filter((ref) => ref.deref()).map((ref) => weakKinds.get(ref))
		rows.push({
			name: 'aborted-request-gc',
			requests,
			observations: refs.length,
			alive: aliveKinds.length,
			aliveKinds,
			note: 'Includes assembly/context/model/bundle/engine weak references; duplicate observations are possible. Nonzero survivors are reported, not classified as a proven leak.',
		})
		expect(refs.length).toBeGreaterThan(0)
	}
})

afterAll(() => {
	Reflect.deleteProperty(globalThis, '__attachProbe')
	console.error = originalError
	console.warn = originalWarn
	const directory = path.resolve(import.meta.dirname, 'results')
	mkdirSync(directory, { recursive: true })
	writeFileSync(
		path.join(directory, mode + '.json'),
		JSON.stringify({ mode, node: process.version, count, diagnostics, rows }, null, 2),
	)
})
