import { describe, it, expect, vi } from 'vitest'
import { createEngineSelect } from '@soxa-ui/core'
import { TListSeparatorPlugin } from '@soxa-ui/plugins'
import { SelectSeparatorDescriptor, ListBoxSeparatorDescriptor } from '../content/descriptors'
import { TListSeparatorExtension } from '../content/extensions'
import { createAdapterContext } from '../protected/adapter'
import { ITEM_CONTEXT_ELEVATOR } from '../protected/adapter/elevator/keys'
import { CommonProfile } from '../protected/naming'
import { childOf, elevatorOf } from './helpers'

describe('separator server assembly', () => {
	it.each([SelectSeparatorDescriptor, ListBoxSeparatorDescriptor])(
		'has no slots or collection membership and needs no browser globals',
		(descriptor) => {
			const engine = createEngineSelect()
			const parent = childOf()
			const elevator = elevatorOf(childOf(parent))

			elevatorOf(parent)(ITEM_CONTEXT_ELEVATOR).down(engine)

			const context = createAdapterContext(descriptor(), {}).use(TListSeparatorExtension, {
				elevator,
			})
			const plugin = context.bundle?.get(TListSeparatorPlugin)

			if (!plugin) throw new Error('separator plugin missing')

			const bind = vi.spyOn(plugin, 'bindCollection')
			const exchange = context.connect(CommonProfile)
			const unsubscribe = exchange.state.subscribe(() => {})

			expect(bind).not.toHaveBeenCalled()
			context.attach()
			expect(bind).toHaveBeenCalledWith(engine)
			expect(context.descriptor.slots).toEqual([])
			expect(context.instance.aria.get('aria-hidden')).toBe('true')
			expect(engine.extensions.batch.items).toHaveLength(0)

			engine.extensions.filter.query = 'server query'
			unsubscribe()
			context.destroy()
			engine.extensions.filter.clear()
		},
	)
})
