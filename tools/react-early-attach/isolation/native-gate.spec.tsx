import { afterAll, expect, it } from 'vitest'
import {
	cache,
	cacheSignal,
	createContext,
	Suspense,
	useContext,
	useId,
	type ReactNode,
} from 'react'
import { renderToString, renderToPipeableStream } from 'react-dom/server.node'
import { Writable } from 'node:stream'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Tabs } from '@soxa-ui/react'
import { TIsolatedExecution, installIsolationHooks, removeIsolationHooks } from './scope.mjs'
import { ComponentIsolationContext, ComponentScopedTabs } from './component-scope'

installIsolationHooks()
const rows: object[] = []
function Tree() {
	return (
		<Tabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
			<Tabs.Item value="a" />
			<Tabs.Item value="b" active />
		</Tabs>
	)
}

it('checks native request lifetime APIs during an unwrapped synchronous SSR call', () => {
	const signals: (AbortSignal | null)[] = []
	const cached = cache(() => ({}))
	let sameObject: boolean | undefined
	function Probe() {
		signals.push(cacheSignal())
		sameObject = cached() === cached()
		return <Tree />
	}
	const html = renderToString(<Probe />)
	rows.push({
		name: 'native-lifetime-sync',
		signals: signals.map((signal) => (signal === null ? 'null' : 'AbortSignal')),
		sameCachedObject: sameObject,
		panel: html.includes('PANEL-b'),
		note: 'No host-owned scope or application wrapper was installed.',
	})
	expect(signals).toEqual([null])
	expect(sameObject).toBe(false)
})

it('checks native request lifetime APIs on streaming retry and real abort', async () => {
	for (const abort of [false, true]) {
		const signals: (AbortSignal | null)[] = []
		let ready = false
		let release!: () => void
		const pending = new Promise<void>((resolve) => {
			release = resolve
		})
		function Probe() {
			signals.push(cacheSignal())
			if (!ready) throw pending
			return <Tree />
		}
		let html = ''
		const errors: string[] = []
		await new Promise<void>((resolve, reject) => {
			const sink = new Writable({
				write(chunk, _encoding, callback) {
					html += String(chunk)
					callback()
				},
			})
			sink.on('finish', resolve)
			sink.on('error', reject)
			const stream = renderToPipeableStream(
				<Suspense fallback={<span>WAITING</span>}>
					<Probe />
				</Suspense>,
				{
					onShellReady() {
						if (abort) {
							stream.pipe(sink)
							setImmediate(() => stream.abort(new Error('native gate abort')))
						} else
							setImmediate(() => {
								ready = true
								release()
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
			name: abort ? 'native-lifetime-abort' : 'native-lifetime-resolved',
			signals: signals.map((signal) => (signal === null ? 'null' : 'AbortSignal')),
			errors,
			html,
		})
		expect(signals.length).toBeGreaterThan(0)
		expect(signals.every((signal) => signal === null)).toBe(true)
	}
})

it('checks whether a component-local try-finally can own descendant execution', () => {
	let scope: TIsolatedExecution | undefined
	const order: string[] = []
	function Child() {
		order.push('child executes')
		return <Tree />
	}
	function Candidate() {
		scope = new TIsolatedExecution()
		try {
			return scope.run(() => {
				order.push('parent returns JSX')
				return <Child />
			})
		} finally {
			scope.dispose()
			order.push('parent scope disposed')
		}
	}
	const html = renderToString(<Candidate />)
	rows.push({
		name: 'component-local-scope',
		order,
		captured: scope?.references.length,
		destroyed: scope?.destroyed,
		panel: html.includes('PANEL-b'),
	})
	expect(order).toEqual(['parent returns JSX', 'parent scope disposed', 'child executes'])
	expect(scope?.references).toHaveLength(0)
	expect(html).not.toContain('PANEL-b')
})

it('implements a local subrenderer candidate and records foreign Context and native ids', () => {
	const AppContext = createContext('DEFAULT')
	const observed: { context: string; id: string; kind: string }[] = []
	let kind = 'outer'
	function ReadApplication() {
		const context = useContext(AppContext)
		const id = useId()
		observed.push({ context, id, kind })
		return <span id={id}>{context}</span>
	}
	const isolated: string[] = []
	function Candidate({ children }: { children: ReactNode }) {
		const outerId = useId()
		const scope = new TIsolatedExecution()
		try {
			kind = 'isolated'
			isolated.push(scope.run(() => renderToString(children)))
			rows.push({
				name: 'subrenderer-execution',
				outerId,
				contexts: scope.references.length,
				html: isolated.at(-1),
			})
		} finally {
			scope.dispose()
			kind = 'outer'
		}
		return null
	}
	const html = renderToString(
		<AppContext value="APPLICATION">
			<ReadApplication />
			<Candidate>
				<ReadApplication />
				<Tree />
			</Candidate>
			<Candidate>
				<ReadApplication />
				<Tree />
			</Candidate>
		</AppContext>,
	)
	const inner = observed.filter((row) => row.kind === 'isolated')
	rows.push({
		name: 'local-subrenderer-context-and-ids',
		outerHtml: html,
		observed,
		foreignContextPreserved: inner.every((row) => row.context === 'APPLICATION'),
		uniqueInnerIds: new Set(inner.map((row) => row.id)).size === inner.length,
		note: 'Candidate returns null deliberately: emitted strings are recorded, not inserted into application HTML.',
	})
	expect(isolated).toHaveLength(2)
	expect(isolated.every((result) => result.includes('PANEL-b'))).toBe(true)
})

it('implements a native subtree end-marker candidate without replacing the renderer', () => {
	const AppContext = createContext('DEFAULT')
	const seen: { context: string; id: string; scope: TIsolatedExecution | undefined }[] = []
	function Item() {
		seen.push({
			context: useContext(AppContext),
			id: useId(),
			scope: useContext(ComponentIsolationContext),
		})
		return <Tabs.Item value="b" active />
	}
	const html = renderToString(
		<AppContext value="APPLICATION">
			<ComponentScopedTabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
				<Tabs.Item value="a" />
				<Item />
			</ComponentScopedTabs>
			<ComponentScopedTabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
				<Tabs.Item value="a" />
				<Item />
			</ComponentScopedTabs>
		</AppContext>,
	)
	rows.push({
		name: 'native-end-marker-sync',
		html,
		foreignContextPreserved: seen.every((row) => row.context === 'APPLICATION'),
		uniqueNativeIds: new Set(seen.map((row) => row.id)).size === seen.length,
		scopes: seen.map((row) => ({ closed: row.scope?.closed, destroyed: row.scope?.destroyed })),
	})
	expect(seen.every((row) => row.context === 'APPLICATION')).toBe(true)
	expect(seen.every((row) => row.scope?.closed)).toBe(true)
	expect(seen.every((row) => !!row.scope?.destroyed)).toBe(true)
	expect(html).toContain('PANEL-b')
})

it('tests the end-marker candidate when a suspended child resumes after the marker', async () => {
	for (const createsLateItem of [false, true]) {
		let ready = false
		let release!: () => void
		const pending = new Promise<void>((resolve) => {
			release = resolve
		})
		const failures: string[] = []
		let html = ''
		function Wait() {
			if (!ready) throw pending
			return createsLateItem ? <Tabs.Item value="late" /> : null
		}
		await new Promise<void>((resolve, reject) => {
			const sink = new Writable({
				write(chunk, _encoding, callback) {
					html += String(chunk)
					callback()
				},
			})
			sink.on('finish', resolve)
			sink.on('error', reject)
			const stream = renderToPipeableStream(
				<ComponentScopedTabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
					<Tabs.Item value="a" />
					<Suspense fallback={<span>WAITING</span>}>
						<Tabs.Item value="b" active />
						<Wait />
					</Suspense>
				</ComponentScopedTabs>,
				{
					onShellReady() {
						setImmediate(() => {
							ready = true
							release()
						})
					},
					onAllReady() {
						stream.pipe(sink)
					},
					onShellError: reject,
					onError(error) {
						failures.push(String(error))
					},
				},
			)
		})
		rows.push({
			name: createsLateItem ? 'native-end-marker-late-item' : 'native-end-marker-stream',
			html,
			failures,
			note: 'The marker disposes the owner while the native renderer still has pending descendants.',
		})
		expect(html.length).toBeGreaterThan(0)
		if (createsLateItem)
			expect(
				failures.some((message) => message.includes('Assembly after SSR scope disposal')),
			).toBe(true)
	}
})

afterAll(() => {
	removeIsolationHooks()
	const directory = path.join(import.meta.dirname, 'results')
	mkdirSync(directory, { recursive: true })
	writeFileSync(
		path.join(directory, 'native-gate.json'),
		JSON.stringify({ react: '19.3.1', node: process.version, rows }, null, 2),
	)
})
