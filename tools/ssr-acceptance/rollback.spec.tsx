import { afterEach, expect, it, vi } from 'vitest'
import { act, Suspense, use, useLayoutEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { createEngineTabs } from '@soxa-ui/core'
import { Example, initial } from '../../packages/ui/react/__tests__/initial-collection.helpers'

afterEach(() => vi.useRealTimers())

it('resumes native Suspense after transaction expiry and keeps the external source models', async () => {
	vi.useFakeTimers()
	const engine = createEngineTabs({ items: initial.items })
	const items = [...engine.extensions.batch.items]
	let release!: () => void
	const pending = new Promise<void>((resolve) => {
		release = resolve
	})
	function Wait() {
		use(pending)
		return null
	}
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		await act(async () =>
			root.render(
				<Suspense fallback="Waiting">
					<Example engine={engine} />
					<Wait />
				</Suspense>,
			),
		)
		expect(container.textContent).toBe('Waiting')
		await act(async () => {
			vi.advanceTimersByTime(1200)
		})
		engine.extensions.batch.items.forEach((item, index) => expect(item).toBe(items[index]))
		await act(async () => {
			release()
			await pending
		})
		expect(container.querySelectorAll('[role=tab]')).toHaveLength(2)
		expect(container.querySelectorAll('[role=tab][aria-selected=true]')).toHaveLength(1)
		expect(container.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel B')
		act(() => (container.querySelector('[role=tab]') as HTMLElement).click())
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel A')
	} finally {
		act(() => root.unmount())
		container.remove()
	}
	expect(engine.extensions.batch.items).toHaveLength(items.length)
	engine.extensions.batch.items.forEach((item, index) => expect(item).toBe(items[index]))
})

it('rebuilds when expiry occurs after DOM commit and before passive acceptance', async () => {
	vi.useFakeTimers()
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	function ExpireInLayout() {
		useLayoutEffect(() => {
			vi.advanceTimersByTime(1200)
		}, [])
		return null
	}
	try {
		await act(async () =>
			root.render(
				<>
					<Example />
					<ExpireInLayout />
				</>,
			),
		)
		expect(container.querySelectorAll('[role=tab]')).toHaveLength(2)
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel B')
		act(() => (container.querySelector('[role=tab]') as HTMLElement).click())
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel A')
	} finally {
		act(() => root.unmount())
		container.remove()
	}
})
