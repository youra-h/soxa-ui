import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEngineTabs, TTabsItem } from '@soxa-ui/core'
import { createAdapterContext } from '../protected/adapter'
import {
	TabsDescriptor,
	TabsCollectionDescriptor,
	TabsItemDescriptor,
	TabsCollectionItemDescriptor,
} from '../content/descriptors'
import {
	TCollectionExtension,
	TCollectionItemExtension,
	TCollectionPreparationExtension,
	TCollectionItemPreparationExtension,
} from '../content/extensions'
import { createElevatorFactory } from './helpers'

const cleanups: (() => void)[] = []
beforeEach(() => vi.useFakeTimers())
afterEach(() => {
	for (const cleanup of cleanups.splice(0).reverse()) cleanup()
	vi.useRealTimers()
})

function ownerKit(optIn = true, engine = createEngineTabs(), timeout = 20) {
	const { factory } = createElevatorFactory()
	const owner = createAdapterContext(TabsDescriptor(), { props: {} })
	const context = createAdapterContext(
		TabsCollectionDescriptor(),
		{ props: {}, options: { owner: owner.instance, engine } },
		{ bundle: owner.bundle },
	).use(TCollectionExtension, { elevator: factory })
	if (optIn) context.use(TCollectionPreparationExtension, { elevator: factory, timeout })
	let destroyed = false
	const destroy = () => {
		if (destroyed) return
		destroyed = true
		context.detach()
		owner.detach()
		context.destroy()
		owner.destroy()
	}
	cleanups.push(destroy)
	return {
		factory,
		engine,
		context,
		destroy,
		attach() {
			owner.attach()
			context.attach()
		},
	}
}

function item(parent: ReturnType<typeof ownerKit>, value: string, ctrl?: TTabsItem) {
	const props = { value, active: true }
	const adapter = createAdapterContext(TabsItemDescriptor(), { props, ctrl })
	const context = createAdapterContext(
		TabsCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionItemExtension, { adapter, elevator: parent.factory })
		.use(TCollectionItemPreparationExtension, { adapter, elevator: parent.factory })
	let destroyed = false
	const destroy = vi.fn(() => {
		if (destroyed) return
		destroyed = true
		context.detach()
		adapter.detach()
		context.destroy()
		adapter.destroy()
	})
	cleanups.push(destroy)
	context.get(TCollectionItemPreparationExtension)?.bindLifetime(destroy)
	return {
		model: adapter.instance,
		context,
		destroy,
		attach() {
			adapter.attach()
			context.attach()
		},
	}
}

describe('opt-in collection preparation', () => {
	it('keeps ordinary registration on attach when the owner did not opt in', () => {
		const parent = ownerKit(false)
		const child = item(parent, 'b')
		expect(parent.engine.extensions.batch.items).toEqual([])
		vi.advanceTimersByTime(100)
		expect(child.destroy).not.toHaveBeenCalled()
		child.attach()
		parent.attach()
		expect(parent.engine.extensions.batch.items).toEqual([child.model])
	})

	it('prepares initial membership and commits the same model without replaying active metadata', () => {
		const parent = ownerKit()
		const first = item(parent, 'a'),
			second = item(parent, 'b')
		expect(parent.engine.extensions.batch.items).toEqual([first.model, second.model])
		parent.engine.extensions.activation.activate(first.model)
		first.attach()
		second.attach()
		parent.attach()
		vi.advanceTimersByTime(100)
		expect(parent.engine.extensions.batch.items).toEqual([first.model, second.model])
		expect(parent.engine.extensions.activation.activeItem).toBe(first.model)
		expect(first.destroy).not.toHaveBeenCalled()
		expect(second.destroy).not.toHaveBeenCalled()
	})

	it('rolls back one unaccepted child without removing its committed sibling', () => {
		const parent = ownerKit()
		const accepted = item(parent, 'same'),
			pending = item(parent, 'same')
		accepted.attach()
		parent.attach()
		vi.advanceTimersByTime(21)
		expect(pending.destroy).toHaveBeenCalledTimes(1)
		expect(accepted.destroy).not.toHaveBeenCalled()
		expect(parent.engine.extensions.batch.items).toEqual([accepted.model])
	})

	it('leaves new items deferred after the owner has attached', () => {
		const parent = ownerKit()
		parent.attach()
		const child = item(parent, 'late')
		expect(parent.engine.extensions.batch.items).toEqual([])
		child.attach()
		expect(parent.engine.extensions.batch.items).toEqual([child.model])
		vi.advanceTimersByTime(21)
		expect(child.destroy).not.toHaveBeenCalled()
	})

	it('releases speculative mounts without removing external data models', () => {
		const model = new TTabsItem({ value: 'data' })
		const parent = ownerKit(true, createEngineTabs({ items: [model] }))
		const child = item(parent, 'data', model)
		vi.advanceTimersByTime(21)
		expect(child.destroy).toHaveBeenCalledTimes(1)
		expect(parent.engine.extensions.batch.items).toEqual([model])
	})

	it('honors separate owner deadlines on a shared engine', () => {
		const engine = createEngineTabs()
		const slow = item(ownerKit(true, engine, 100), 'slow')
		const fast = item(ownerKit(true, engine, 10), 'fast')
		vi.advanceTimersByTime(11)
		expect(fast.destroy).toHaveBeenCalledTimes(1)
		expect(slow.destroy).not.toHaveBeenCalled()
		expect(engine.extensions.batch.items).toEqual([slow.model])
		vi.advanceTimersByTime(100)
		expect(slow.destroy).toHaveBeenCalledTimes(1)
		expect(engine.extensions.batch.items).toEqual([])
	})

	it('owner teardown cancels only its own pending mounts on a shared engine', () => {
		const engine = createEngineTabs()
		const left = ownerKit(true, engine),
			right = ownerKit(true, engine)
		const a = item(left, 'a'),
			b = item(right, 'b')
		left.destroy()
		expect(a.destroy).toHaveBeenCalledTimes(1)
		expect(b.destroy).not.toHaveBeenCalled()
		expect(engine.extensions.batch.items).toEqual([b.model])
		b.attach()
		right.attach()
		vi.advanceTimersByTime(100)
		expect(engine.extensions.batch.items).toEqual([b.model])
	})
})
