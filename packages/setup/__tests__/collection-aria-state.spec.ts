import { describe, expect, it, vi } from 'vitest'
import { TComponentView } from '@soxa-ui/core'
import { ComponentViewDescriptor, createAdapterContext } from '@soxa-ui/setup'
import { CallbackProfile } from './helpers'
import { TCollectionAriaState } from '../content/extensions/collection/aria-state.class'

function readonlyLink() {
	let snapshot: Readonly<Record<string, unknown>> = Object.freeze({
		id: 'declared-tab',
		'aria-controls': 'declared-panel',
	})
	const listeners = new Set<() => void>()

	return {
		getSnapshot: () => snapshot,
		subscribe(listener: () => void) {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		change(next: Readonly<Record<string, unknown>>) {
			snapshot = Object.freeze(next)
			for (const listener of listeners) listener()
		},
		get listenerCount() {
			return listeners.size
		},
	}
}

describe('collection mount ARIA state port', () => {
	function prepared() {
		const ctrl = new TComponentView()
		ctrl.aria.add('aria-label', 'External label')
		const aria = ctrl.aria.toObject()
		const context = createAdapterContext(ComponentViewDescriptor(), { ctrl })
		const state = context.connect(CallbackProfile).state
		const link = readonlyLink()
		const port = new TCollectionAriaState({ state, link })

		return { ctrl, aria, context, state, link, port }
	}

	it('reads one stable snapshot without mutating or subscribing during abandoned assembly', () => {
		const { ctrl, aria, context, link, port } = prepared()
		const listen = vi.spyOn(ctrl.events, 'listen')
		const first = port.getSnapshot()

		expect(first.aria).toEqual({
			...aria,
			id: 'declared-tab',
			'aria-controls': 'declared-panel',
		})
		expect(port.getSnapshot()).toBe(first)
		expect(ctrl.aria.toObject()).toEqual(aria)
		expect(listen).not.toHaveBeenCalled()
		expect(link.listenerCount).toBe(0)

		context.destroy()

		expect(ctrl.aria.toObject()).toEqual(aria)
		expect(link.listenerCount).toBe(0)
	})

	it('publishes both live link and core ARIA changes through the same aria field', () => {
		const { ctrl, aria, context, link, port } = prepared()
		const listen = vi.spyOn(ctrl.events, 'listen')
		const unlisten = vi.spyOn(ctrl.events, 'unlisten')
		const listener = vi.fn()
		const release = port.subscribe(listener)
		const first = port.getSnapshot()

		expect(link.listenerCount).toBe(1)

		link.change({ id: 'updated-tab', 'aria-controls': 'updated-panel' })

		const afterLink = port.getSnapshot()

		expect(afterLink).not.toBe(first)
		expect(port.getSnapshot()).toBe(afterLink)
		expect(listener).toHaveBeenLastCalledWith('aria', afterLink.aria)
		expect(ctrl.aria.toObject()).toEqual(aria)

		ctrl.aria.add('aria-label', 'Updated external label')

		const afterCore = port.getSnapshot()

		expect(afterCore).not.toBe(afterLink)
		expect(afterCore.aria).toMatchObject({
			'aria-label': 'Updated external label',
			id: 'updated-tab',
			'aria-controls': 'updated-panel',
		})
		expect(listener).toHaveBeenLastCalledWith('aria', afterCore.aria)
		expect(port.getSnapshot()).toBe(afterCore)

		release()

		expect(link.listenerCount).toBe(0)
		expect(unlisten.mock.calls).toEqual(listen.mock.calls)
		listener.mockClear()
		link.change({ id: 'after-release' })
		ctrl.aria.add('aria-label', 'After release')
		expect(listener).not.toHaveBeenCalled()

		context.destroy()
	})
})
