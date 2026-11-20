import { describe, expect, it, vi } from 'vitest'
import { TComponentView } from '@soxa-ui/core'
import { TPluginMount } from '@soxa-ui/plugins'
import { ComponentViewDescriptor, createAdapterContext } from '@soxa-ui/setup'
import { CallbackProfile } from './helpers'
import { TCollectionAriaState } from '../content/extensions/collection/aria-state.class'

describe('prepared mount state', () => {
	function prepared() {
		const ctrl = new TComponentView()
		ctrl.aria.add('aria-label', 'External label')
		const aria = ctrl.aria.toObject()
		const context = createAdapterContext(ComponentViewDescriptor(), { ctrl })
		const state = context.connect(CallbackProfile).state
		const mount = new TPluginMount()
		mount.patch('aria', { id: 'declared-tab', 'aria-controls': 'declared-panel' })
		const port = new TCollectionAriaState(state, mount)

		return { ctrl, aria, context, state, mount, port }
	}

	it('renders the patches over the model without writing or subscribing to it', () => {
		const { ctrl, aria, context, port } = prepared()
		const listen = vi.spyOn(ctrl.events, 'listen')

		expect(port.getSnapshot().aria).toEqual({
			...aria,
			id: 'declared-tab',
			'aria-controls': 'declared-panel',
		})
		expect(ctrl.aria.toObject()).toEqual(aria)
		expect(listen).not.toHaveBeenCalled()

		context.destroy()

		expect(ctrl.aria.toObject()).toEqual(aria)
	})

	it('patches only fields the state has: a facade shares the mount with its component', () => {
		const { context, mount, port } = prepared()

		mount.patch('closeAria', { 'aria-label': 'Close' })

		expect(port.getSnapshot()).not.toHaveProperty('closeAria')

		context.destroy()
	})

	it('passes model changes through the patches and reads the model itself once accepted', () => {
		const { ctrl, context, state, mount, port } = prepared()
		const listener = vi.fn()
		const release = port.subscribe(listener)

		ctrl.aria.add('aria-label', 'Updated external label')

		expect(listener).toHaveBeenLastCalledWith('aria', {
			'aria-label': 'Updated external label',
			id: 'declared-tab',
			'aria-controls': 'declared-panel',
		})

		listener.mockClear()
		mount.accept()

		// The patched field is announced again: the model may already hold what the mount wrote
		expect(listener).toHaveBeenCalledExactlyOnceWith('aria', state.getSnapshot().aria)
		expect(port.getSnapshot()).toBe(state.getSnapshot())

		release()
		listener.mockClear()
		ctrl.aria.add('aria-label', 'After release')

		expect(listener).not.toHaveBeenCalled()

		context.destroy()
	})

	it('announces nothing at acceptance to a released subscriber', () => {
		const { context, mount, port } = prepared()
		const listener = vi.fn()

		// Subscribing hands over every value at once
		port.subscribe(listener)()
		listener.mockClear()
		mount.accept()

		expect(listener).not.toHaveBeenCalled()

		context.destroy()
	})
})
