import { afterEach, describe, expect, it, vi } from 'vitest'
import { Activity, StrictMode, Suspense, act, use } from 'react'
import { createEngineTabs } from '@soxa-ui/core'
import { Tabs } from '@soxa-ui/react'
import { createRoot } from 'react-dom/client'
import { find, mount, nextFrame, track } from './mount'
import {
	initial,
	Example,
	selected,
	externalSnapshot,
	watchSubscriptions,
} from './initial-collection.helpers'
afterEach(() => vi.restoreAllMocks())
describe('initial collection native lifetime', () => {
	it('keeps accepted selection and prepared ids through parent inputs and Activity replay', async () => {
		const view = (mode: 'visible' | 'hidden', source = initial) => (
			<StrictMode>
				<Activity mode={mode}>
					<Example source={source} />
				</Activity>
			</StrictMode>
		)
		const mounted = mount(view('visible'))
		await nextFrame()
		const before = [...mounted.container.querySelectorAll('[role=tab]')]
		const ids = before.map((tab) => tab.id)
		act(() => find(mounted.container, '[role=tab]', HTMLElement).click())
		expect(selected(mounted.container)).toEqual(['true', 'false'])
		expect(mounted.container.querySelector('[role=tabpanel]')?.textContent).toBe('Panel A')
		mounted.render(view('visible', structuredClone(initial)))
		expect(selected(mounted.container)).toEqual(['true', 'false'])
		mounted.render(view('hidden'))
		mounted.render(view('visible'))
		await nextFrame()
		expect(selected(mounted.container)).toEqual(['true', 'false'])
		const after = [...mounted.container.querySelectorAll('[role=tab]')]
		expect(after).toEqual(before)
		expect(after.map((tab) => tab.id)).toEqual(ids)
		expect(new Set(ids).size).toBe(2)
		act(() => {
			find(mounted.container, '[role=tab]', HTMLElement).focus()
			find(mounted.container, '[role=tab]', HTMLElement).dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'ArrowRight',
					bubbles: true,
					cancelable: true,
				}),
			)
		})
		expect(selected(mounted.container)).toEqual(['false', 'true'])
	})

	it('ignores a later initial source when the native owner mounted without one', () => {
		const mounted = mount(<Tabs />)
		mounted.render(<Tabs initial={initial} />)
		expect(mounted.container.querySelectorAll('[role=tab]')).toHaveLength(0)
	})

	it('does not change an accepted mount when a concurrent client render is abandoned', async () => {
		const engine = createEngineTabs({ items: initial.items })
		const live = watchSubscriptions(engine)
		const mounted = mount(<Example engine={engine} />)
		await nextFrame()
		const before = externalSnapshot(engine)
		const nodes = [...mounted.container.querySelectorAll('[role=tab]')]
		const ids = nodes.map((tab) => tab.id)
		const subscriptions = live()
		const pending = new Promise<void>(() => {})
		function Wait() {
			use(pending)
			return null
		}
		const pendingContainer = document.createElement('div')
		document.body.append(pendingContainer)
		const speculative = createRoot(pendingContainer)
		track(speculative)
		await act(async () =>
			speculative.render(
				<Suspense fallback={<p>Waiting</p>}>
					<Example engine={engine} />
					<Wait />
				</Suspense>,
			),
		)
		expect(pendingContainer.textContent).toBe('Waiting')
		await act(async () => speculative.render(null))
		expect(externalSnapshot(engine)).toEqual(before)
		expect([...mounted.container.querySelectorAll('[role=tab]')]).toEqual(nodes)
		expect(nodes.map((tab) => tab.id)).toEqual(ids)
		expect(live(), JSON.stringify(live.details())).toBe(subscriptions)
		act(() => find(mounted.container, '[role=tab]', HTMLElement).click())
		expect(selected(mounted.container)).toEqual(['true', 'false'])
		mounted.render(<></>)
		expect(live(), JSON.stringify(live.details())).toBe(0)
	})
})
