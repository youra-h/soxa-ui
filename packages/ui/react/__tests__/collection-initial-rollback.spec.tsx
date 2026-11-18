import { afterEach, expect, it, vi } from 'vitest'
import { act, Suspense, use, useLayoutEffect } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { createEngineTabs } from '@soxa-ui/core'
import { Example, initial } from './initial-collection.helpers'

afterEach(() => vi.useRealTimers())

it('hydrates the same server nodes after their speculative server assemblies expired', async () => {
	vi.useFakeTimers()
	const container = document.createElement('div')
	container.innerHTML = renderToString(<Example />)
	document.body.append(container)
	const before = [...container.querySelectorAll('[role=tab]')]
	vi.advanceTimersByTime(1200)
	const recover = vi.fn()
	let root: ReturnType<typeof hydrateRoot> | undefined
	try {
		await act(async () => {
			root = hydrateRoot(container, <Example />, { onRecoverableError: recover })
		})
		expect([...container.querySelectorAll('[role=tab]')]).toEqual(before)
		expect(recover).not.toHaveBeenCalled()
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel B')
		act(() => before[0].dispatchEvent(new MouseEvent('click', { bubbles: true })))
		expect(container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel A')
	} finally {
		act(() => root?.unmount())
		container.remove()
	}
})

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
