import { queryObjects } from 'node:v8'
import { createEngineTabs } from '@soxa-ui/core'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Suspense, act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { Tabs, ListBox } from '@soxa-ui/react'
import { mount, track } from './mount'

class PendingItemMarker {}

type TEngineView = {
	extensions: {
		batch: {
			items: readonly { value: unknown }[]
		}
	}
}

function markPendingItems(engine: ReturnType<typeof createEngineTabs>): void {
	for (const model of engine.extensions.batch.items) {
		Reflect.set(model, Symbol(), new PendingItemMarker())
	}
}

/** Suspend a branch until the test releases its resource. */
function resource() {
	let ready = false
	let resolve!: () => void

	const promise = new Promise<void>((done) => {
		resolve = done
	})

	return {
		read() {
			if (!ready) throw promise
		},

		resolve() {
			ready = true

			resolve()
		},
	}
}

afterEach(() => vi.useRealTimers())

describe('Tabs initial preparation', () => {
	it('releases speculative models to GC while the external engine remains alive', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })

		const engine = createEngineTabs()

		renderToString(
			<Tabs engine={engine}>
				<Tabs.Item value="a" text="A" />
				<Tabs.Item value="b" text="B" active />
			</Tabs>,
		)
		markPendingItems(engine)

		expect(queryObjects(PendingItemMarker, { format: 'count' })).toBe(2)

		vi.advanceTimersByTime(1_001)

		expect(engine.extensions.batch.items).toHaveLength(0)

		// Bundle teardown releases its instances in microtasks.
		await Promise.resolve()

		expect(queryObjects(PendingItemMarker, { format: 'count' })).toBe(0)
	})

	it('renders the active declarative panel before attach and preserves its server nodes on hydration', () => {
		const tree = (
			<Tabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
				<Tabs.Item value="a" text="A" />
				<Tabs.Item value="b" text="B" active />
			</Tabs>
		)
		const container = document.createElement('div')

		container.innerHTML = renderToString(tree)
		document.body.append(container)

		const panel = container.querySelector('[role="tabpanel"]')
		const nodes = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
		const errors = vi.fn()

		expect(panel?.textContent).toBe('PANEL-b')

		act(() => track(hydrateRoot(container, tree, { onRecoverableError: errors })))

		expect(errors).not.toHaveBeenCalled()
		expect(nodes.every((node) => container.contains(node))).toBe(true)
		expect(container.querySelector('[role="tabpanel"]')).toBe(panel)
	})

	it('does not enable initial preparation for ListBox', () => {
		const container = document.createElement('div')

		container.innerHTML = renderToString(
			<ListBox>
				<ListBox.Item value="a" selected>
					A
				</ListBox.Item>
			</ListBox>,
		)

		expect(container.querySelector('[role="option"]')?.getAttribute('aria-selected')).toBeNull()
	})

	it('rolls back pending Suspense registrations and commits a new model after a late retry', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })

		const pending = resource()
		let current: TEngineView | undefined

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

		mount(
			<Tabs
				onEngineCreate={(engine: TEngineView) => {
					current = engine
				}}
			>
				<Tabs.Item value="a" text="A" />
				<Suspense fallback={<span>WAITING</span>}>
					<SomeComponent />
				</Suspense>
			</Tabs>,
		)
		await act(async () => {})

		const original = current?.extensions.batch.items.find((item) => item.value === 'b')

		expect(original).toBeDefined()

		await act(async () => {
			vi.advanceTimersByTime(1_001)
		})

		expect(current?.extensions.batch.items.map((item) => item.value)).toEqual(['a'])

		await act(async () => {
			pending.resolve()
		})

		expect(current?.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])
		expect(current?.extensions.batch.items.find((item) => item.value === 'b')).not.toBe(
			original,
		)
	})

	it('recovers when rollback happens after DOM insertion but before passive attach', async () => {
		vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })

		let expired = false
		let current: TEngineView | undefined

		const view = mount(
			<Tabs
				onEngineCreate={(engine: TEngineView) => {
					current = engine
				}}
			>
				<Tabs.Item value="a" text="A" />
				<Tabs.Item
					value="b"
					text="B"
					active
					ref={(node) => {
						if (node && !expired) {
							expired = true

							vi.advanceTimersByTime(1_001)
						}
					}}
				/>
			</Tabs>,
		)
		await act(async () => {})

		expect(expired).toBe(true)
		expect(current?.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])
		expect(view.container.querySelectorAll('[role="tab"]')).toHaveLength(2)
	})
})
