// @vitest-environment jsdom
import { afterAll, afterEach, beforeEach, expect, it } from 'vitest'
import { Suspense, StrictMode, act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server.node'
import { Tabs } from '@soxa-ui/react'
import { createEngineTabs, TTabsItem } from '@soxa-ui/core'
import { registrations } from './journal'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
Reflect.set(
	globalThis,
	'ResizeObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	},
)
const rows: object[] = []
const roots: Root[] = []
let diagnostics: string[] = []
const error = console.error,
	warn = console.warn
const wait = (ms = 80) => new Promise<void>((resolve) => setTimeout(resolve, ms))
function gate() {
	let ready = false
	let done!: () => void
	const promise = new Promise<void>((resolve) => {
		done = resolve
	})
	return {
		read() {
			if (!ready) throw promise
		},
		resolve() {
			ready = true
			done()
		},
	}
}
type TEngineView = { extensions: { batch: { items: readonly { value?: unknown }[] } } }
const engine = () => registrations.engines.at(-1)?.deref() as TEngineView | undefined
const values = () => engine()?.extensions.batch.items.map((item) => item.value)
function mount(tree: ReactNode) {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	roots.push(root)
	return { container, root, render: () => root.render(tree) }
}
function Tree({ children }: { children?: ReactNode }) {
	return (
		<Tabs
			content={
				<>
					<Tabs.Content value="a">PANEL-a</Tabs.Content>
					<Tabs.Content value="b">PANEL-b</Tabs.Content>
				</>
			}
		>
			<Tabs.Item value="a" text="A" />
			{children ?? <Tabs.Item value="b" text="B" active />}
		</Tabs>
	)
}

beforeEach(() => {
	registrations.reset()
	registrations.configure(30)
	diagnostics = []
	console.error = (...args) => {
		diagnostics.push(args.map(String).join(' '))
		error(...args)
	}
	console.warn = (...args) => {
		diagnostics.push(args.map(String).join(' '))
		warn(...args)
	}
})
afterEach(async () => {
	await act(async () => {
		for (const root of roots.splice(0).reverse()) root.unmount()
	})
	registrations.reset()
	document.body.innerHTML = ''
	console.error = error
	console.warn = warn
	expect(diagnostics).toEqual([])
})

it('commits an ordinary mount without replacing prepared item identities', async () => {
	const view = mount(<Tree />)
	await act(async () => view.render())
	const models = registrations.models.map((ref) => ref.deref())
	const items = engine()?.extensions.batch.items
	rows.push({
		name: 'ordinary-commit',
		values: values(),
		counters: { ...registrations.counters },
		pending: registrations.size,
		sameModels: items?.every((item) => models.includes(item)),
		diagnostics: [...diagnostics],
	})
	expect(values()).toEqual(['a', 'b'])
	expect(registrations.size).toBe(0)
	expect(items?.every((item) => models.includes(item))).toBe(true)
	await act(async () => wait())
	expect(values()).toEqual(['a', 'b'])
})

it('rolls back an uncommitted sibling and recreates it when Suspense resolves later', async () => {
	const pending = gate()
	function Wait() {
		pending.read()
		return null
	}
	function SomeComponent() {
		return (
			<>
				<Tabs.Item value="b" text="B" active />
				<Wait />
			</>
		)
	}
	const view = mount(
		<Tree>
			<Suspense fallback={<span>WAITING</span>}>
				<SomeComponent />
			</Suspense>
		</Tree>,
	)
	await act(async () => view.render())
	const initial = values()
	const firstB = registrations.models
		.map((ref) => ref.deref())
		.find((item) => item && Reflect.get(item, 'value') === 'b')
	await act(async () => wait())
	const afterRollback = values(),
		pendingAfterRollback = registrations.size
	await act(async () => {
		pending.resolve()
		await wait(10)
	})
	const currentB = engine()?.extensions.batch.items.find((item) => item.value === 'b')
	rows.push({
		name: 'suspense-late-retry',
		initial,
		afterRollback,
		pendingAfterRollback,
		afterRetry: values(),
		pendingAfterRetry: registrations.size,
		recreated: currentB !== firstB,
		counters: { ...registrations.counters },
		diagnostics: [...diagnostics],
	})
	expect(afterRollback).toEqual(['a'])
	expect(values()).toEqual(['a', 'b'])
	expect(currentB).not.toBe(firstB)
	expect(registrations.size).toBe(0)
	expect(view.container.querySelectorAll('[role="tab"]')).toHaveLength(2)
})

it('removes a suspended branch without retry and leaves its committed neighbor alive', async () => {
	const pending = gate()
	function Wait() {
		pending.read()
		return null
	}
	const view = mount(
		<Tree>
			<Suspense fallback={<span>WAITING</span>}>
				<Tabs.Item value="b" active />
				<Wait />
			</Suspense>
		</Tree>,
	)
	await act(async () => view.render())
	const first = engine()?.extensions.batch.items.find((item) => item.value === 'a')
	await act(async () => {
		view.root.render(
			<Tree>
				<span>REMOVED</span>
			</Tree>,
		)
		await wait()
	})
	rows.push({
		name: 'abandoned-no-retry',
		values: values(),
		sameNeighbor: engine()?.extensions.batch.items[0] === first,
		pending: registrations.size,
		counters: { ...registrations.counters },
		diagnostics: [...diagnostics],
	})
	expect(values()).toEqual(['a'])
	expect(engine()?.extensions.batch.items[0]).toBe(first)
	expect(registrations.size).toBe(0)
})

it('preserves a data model supplied by an external engine when its speculative mount expires', async () => {
	const ctrl = new TTabsItem({ value: 'b', text: 'B' })
	const external = createEngineTabs({ items: [ctrl] })
	const pending = gate()
	function Wait() {
		pending.read()
		return null
	}
	const view = mount(
		<Tabs engine={external}>
			<Suspense fallback={<span>WAITING</span>}>
				<Tabs.Item ctrl={ctrl} />
				<Wait />
			</Suspense>
		</Tabs>,
	)
	await act(async () => view.render())
	await act(async () => wait())
	rows.push({
		name: 'external-data-model',
		sameModel: external.extensions.batch.items[0] === ctrl,
		pending: registrations.size,
		counters: { ...registrations.counters },
		diagnostics: [...diagnostics],
	})
	expect(external.extensions.batch.items).toEqual([ctrl])
	expect(registrations.size).toBe(0)
})

it('does not duplicate items after StrictMode effect replay', async () => {
	const view = mount(
		<StrictMode>
			<Tree />
		</StrictMode>,
	)
	await act(async () => view.render())
	await act(async () => wait())
	rows.push({
		name: 'strict-mode',
		values: values(),
		pending: registrations.size,
		counters: { ...registrations.counters },
		diagnostics: [...diagnostics],
	})
	expect(values()).toEqual(['a', 'b'])
	expect(registrations.size).toBe(0)
})

it('rebuilds a rolled-back assembly when attach arrives without another render first', async () => {
	let rolledBack = false
	const view = mount(
		<Tree>
			<Tabs.Item
				value="b"
				text="B"
				active
				ref={(node) => {
					if (node && !rolledBack) {
						rolledBack = true
						registrations.rollbackPending()
					}
				}}
			/>
		</Tree>,
	)
	await act(async () => view.render())
	await act(async () => wait())
	rows.push({
		name: 'rollback-before-passive-attach',
		values: values(),
		pending: registrations.size,
		counters: { ...registrations.counters },
		diagnostics: [...diagnostics],
	})
	expect(rolledBack).toBe(true)
	expect(values()).toEqual(['a', 'b'])
	expect(registrations.counters.rebuild).toBeGreaterThan(0)
	expect(registrations.size).toBe(0)
})

it('hydrates fresh client assemblies after server registrations were rolled back', async () => {
	const html = renderToString(<Tree />)
	await wait()
	expect(registrations.size).toBe(0)
	const container = document.createElement('div')
	container.innerHTML = html
	document.body.append(container)
	const original = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
	const recoverable: string[] = []
	await act(async () => {
		roots.push(
			hydrateRoot(container, <Tree />, {
				onRecoverableError: (error) => recoverable.push(String(error)),
			}),
		)
	})
	rows.push({
		name: 'hydration-after-server-rollback',
		sameNodes: original.every((node) => container.contains(node)),
		recoverable,
		pending: registrations.size,
		diagnostics: [...diagnostics],
	})
	expect(recoverable).toHaveLength(0)
	expect(original.every((node) => container.contains(node))).toBe(true)
})

it('rolls back by registration identity when siblings have equal values', async () => {
	const pending = gate()
	function Wait() {
		pending.read()
		return null
	}
	const view = mount(
		<Tabs>
			<Tabs.Item value="same" text="LIVE" />
			<Suspense fallback={<span>WAITING</span>}>
				<Tabs.Item value="same" text="PENDING" />
				<Wait />
			</Suspense>
		</Tabs>,
	)
	await act(async () => view.render())
	const neighbor = engine()?.extensions.batch.items[0]
	await act(async () => wait())
	rows.push({
		name: 'equal-value-siblings',
		values: values(),
		sameNeighbor: engine()?.extensions.batch.items[0] === neighbor,
		pending: registrations.size,
		diagnostics: [...diagnostics],
	})
	expect(values()).toEqual(['same'])
	expect(engine()?.extensions.batch.items[0]).toBe(neighbor)
})

afterAll(() => {
	const dir = path.join(import.meta.dirname, 'results')
	mkdirSync(dir, { recursive: true })
	writeFileSync(path.join(dir, 'client.json'), JSON.stringify(rows, null, 2))
})
