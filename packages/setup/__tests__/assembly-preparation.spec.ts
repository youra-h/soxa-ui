import { describe, expect, it, vi } from 'vitest'
import {
	ButtonDescriptor,
	TabsDescriptor,
	TabsItemDescriptor,
	TabsCollectionDescriptor,
	TCollectionExtension,
	TCollectionPreparation,
	TCollectionPreparationLifetime,
	collectionNeedsPreparation,
	createAdapterContext,
	type IAdapterPreparation,
} from '@soxa-ui/setup'
import { createElevatorFactory } from './helpers'

describe('context preparation before construction', () => {
	it('applies prepared inputs before plugin creation and completes with the assembled model', () => {
		const completed = vi.fn()
		const preparation: IAdapterPreparation = {
			prepare: (_descriptor, options) => ({
				options: { ...options, props: { ...options.props, text: 'Prepared' } },
				complete: (context) => completed(context.instance),
			}),
		}
		const context = createAdapterContext(
			ButtonDescriptor(),
			{ props: { text: 'Original' } },
			{ preparation },
		)

		expect(context.instance.text).toBe('Prepared')
		expect(completed).toHaveBeenCalledExactlyOnceWith(context.instance)
		context.destroy()
	})

	it('rejects preparation before constructing the supplied component type', () => {
		const descriptor = ButtonDescriptor()
		const ctor = vi.fn(descriptor.ctor)
		const preparation: IAdapterPreparation = {
			prepare() {
				throw new Error('Rejected preparation')
			},
		}

		expect(() => createAdapterContext({ ...descriptor, ctor }, {}, { preparation })).toThrow(
			'Rejected preparation',
		)
		expect(ctor).not.toHaveBeenCalled()
	})

	it('does not opt unrelated descriptors into collection preparation', () => {
		expect(collectionNeedsPreparation(ButtonDescriptor())).toBe(false)
		const context = createAdapterContext(ButtonDescriptor(), { props: { text: 'Ordinary' } })
		expect(context.instance.text).toBe('Ordinary')
		context.destroy()
	})

	it('releases a constructed context when preparation completion fails', () => {
		const released = vi.fn()
		const preparation: IAdapterPreparation = {
			prepare: (_descriptor, options) => ({
				options,
				complete: (context) => {
					context.events.on('destroy', released)
					throw new Error('Failed completion')
				},
			}),
		}

		expect(() => createAdapterContext(ButtonDescriptor(), {}, { preparation })).toThrow(
			'Failed completion',
		)
		expect(released).toHaveBeenCalledOnce()
	})
})

describe('prepared collection assembly without component resolvers', () => {
	const initial = {
		items: [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', _: { active: true } },
		],
		panels: [{ value: 'b', id: 'panel-b' }],
	}

	function owner(props: object, lifetime = new TCollectionPreparationLifetime()) {
		const elevator = createElevatorFactory().factory
		const preparation = new TCollectionPreparation(elevator, lifetime)
		const context = createAdapterContext(TabsDescriptor(), { props }, { preparation })
		const facade = createAdapterContext(
			TabsCollectionDescriptor(),
			{
				props,
				options: { owner: context.instance },
			},
			{ bundle: context.bundle, preparation },
		).use(TCollectionExtension, { elevator })
		return { context, facade, elevator, preparation }
	}

	it('tracks only prepared assemblies and releases their whole lifetime without deleting data', () => {
		vi.useFakeTimers()
		try {
			const ordinary = owner({})
			expect(
				ordinary.preparation.pending([ordinary.context, ordinary.facade], vi.fn()),
			).toBeUndefined()
			expect(ordinary.facade.instance.engine.has('preparation')).toBe(false)
			ordinary.facade.destroy()
			ordinary.context.destroy()

			const prepared = owner({ initial })
			const engine = prepared.facade.instance.engine
			const models = [...engine.extensions.batch.items]
			const rollback = vi.fn(() => {
				prepared.facade.destroy()
				prepared.context.destroy()
			})
			const receipt = prepared.preparation.pending(
				[prepared.context, prepared.facade],
				rollback,
			)
			expect(receipt).toBeDefined()
			vi.advanceTimersByTime(1001)
			expect(rollback).toHaveBeenCalledOnce()
			expect(engine.extensions.batch.items).toHaveLength(models.length)
			engine.extensions.batch.items.forEach((model, index) =>
				expect(model).toBe(models[index]),
			)
		} finally {
			vi.useRealTimers()
		}
	})

	it('resolves the exact prepared model through ordinary create calls', () => {
		const prepared = owner({ initial })
		const engine = prepared.facade.instance.engine
		const item = createAdapterContext(
			TabsItemDescriptor(),
			{ props: { initial: 1 } },
			{ preparation: prepared.preparation },
		)

		expect(item.instance).toBe(engine.extensions.batch.items[1])
		expect(engine.extensions.activation.activeItem).toBe(item.instance)
		item.destroy()
		prepared.facade.destroy()
		prepared.context.destroy()
	})

	it('retains the same source through native reassembly without resetting activation', () => {
		const lifetime = new TCollectionPreparationLifetime()
		const first = owner({ initial }, lifetime)
		const engine = first.facade.instance.engine
		const selected = engine.extensions.batch.items[0]
		engine.extensions.activation.activate(selected)
		first.facade.destroy()
		first.context.destroy()

		const next = owner({ initial }, lifetime)
		expect(next.facade.instance.engine).toBe(engine)
		expect(engine.extensions.activation.activeItem).toBe(selected)
		next.facade.destroy()
		next.context.destroy()
	})

	it('does not enable a source supplied only after the native lifetime began', () => {
		const lifetime = new TCollectionPreparationLifetime()
		const first = owner({}, lifetime)
		first.facade.destroy()
		first.context.destroy()
		const next = owner({ initial }, lifetime)

		expect(next.facade.instance.engine.extensions.batch.items).toHaveLength(0)
		next.facade.destroy()
		next.context.destroy()
	})
})
