import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
	TBatchExtension,
	TCollectionEngine,
	TPlainExtension,
	TPreparationExtension,
	preparationOf,
} from '@soxa-ui/core'

type TItem = { id: number }

beforeEach(() => vi.useFakeTimers())

afterEach(() => {
	vi.clearAllTimers()
	vi.useRealTimers()
})

function engineKit() {
	const engine = new TCollectionEngine<
		TItem,
		{
			plain: TPlainExtension<TItem>
			batch: TBatchExtension<TItem>
			preparation: TPreparationExtension<TItem>
		}
	>({
		extensions: {
			plain: new TPlainExtension<TItem>(),
			batch: new TBatchExtension<TItem>(),
			preparation: new TPreparationExtension<TItem>(),
		},
	})

	return { engine, ...engine.extensions }
}

describe('driver-owned collection transactions', () => {
	it('confirms the existing item without replaying initialization', () => {
		const { preparation, plain, batch } = engineKit()
		const item = { id: 1 }
		const initialize = vi.fn(() => plain.push(item))
		const rollback = vi.fn(() => plain.remove(item))
		const transaction = preparation.prepare(item, {
			owner: {},
			timeout: 20,
			initialize,
			rollback,
		})

		expect(batch.items).toEqual([item])

		transaction.commit()
		transaction.commit()
		vi.advanceTimersByTime(100)

		expect(batch.items[0]).toBe(item)
		expect(initialize).toHaveBeenCalledOnce()
		expect(rollback).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('forgets a rolled-back receipt before its cleanup reenters the registry', () => {
		const { preparation, plain, batch } = engineKit()
		const item = { id: 1 }
		const rollback = vi.fn(() => {
			transaction.cancel()
			plain.remove(item)
		})
		const transaction = preparation.prepare(item, {
			owner: {},
			timeout: 20,
			initialize: () => plain.push(item),
			rollback,
		})

		transaction.rollback()
		transaction.rollback()
		vi.advanceTimersByTime(100)

		expect(batch.items).toEqual([])
		expect(rollback).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('cancels a receipt without destroying resources already released by its owner', () => {
		const { preparation } = engineKit()
		const rollback = vi.fn()
		const transaction = preparation.prepare(
			{ id: 1 },
			{
				owner: {},
				timeout: 20,
				initialize: vi.fn(),
				rollback,
			},
		)

		transaction.cancel()
		vi.advanceTimersByTime(100)

		expect(rollback).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('expires attempts independently, including a new earlier deadline', () => {
		const { preparation, plain, batch } = engineKit()
		const slow = { id: 1 },
			fast = { id: 2 }

		preparation.prepare(slow, {
			owner: {},
			timeout: 100,
			initialize: () => plain.push(slow),
			rollback: () => plain.remove(slow),
		})
		preparation.prepare(fast, {
			owner: {},
			timeout: 10,
			initialize: () => plain.push(fast),
			rollback: () => plain.remove(fast),
		})

		vi.advanceTimersByTime(11)

		expect(batch.items).toEqual([slow])

		vi.advanceTimersByTime(100)

		expect(batch.items).toEqual([])
		expect(vi.getTimerCount()).toBe(0)
	})

	it('rolls back only the released owners unconfirmed attempts', () => {
		const { preparation, plain, batch } = engineKit()
		const left = {},
			right = {}
		const a = { id: 1 },
			b = { id: 2 }

		preparation.prepare(a, {
			owner: left,
			timeout: 20,
			initialize: () => plain.push(a),
			rollback: () => plain.remove(a),
		})
		const accepted = preparation.prepare(b, {
			owner: right,
			timeout: 20,
			initialize: () => plain.push(b),
			rollback: () => plain.remove(b),
		})

		preparation.release(left)
		accepted.commit()
		vi.advanceTimersByTime(100)

		expect(batch.items).toEqual([b])
	})

	it('defers new initialization while an owner of the engine is accepted', () => {
		const { preparation, plain, batch } = engineKit()
		const owner = {}
		const item = { id: 1 }
		const initialize = vi.fn(() => plain.push(item))

		preparation.accept(owner)

		const transaction = preparation.prepare(item, {
			owner: {},
			timeout: 20,
			initialize,
			rollback: () => plain.remove(item),
		})

		expect(initialize).not.toHaveBeenCalled()
		expect(batch.items).toEqual([])

		// The normal acceptance path still performs the deferred registration.
		plain.push(item)
		transaction.commit()
		vi.advanceTimersByTime(100)

		expect(batch.items).toEqual([item])
	})

	it('releases partial initialization when its callback throws', () => {
		const { preparation, plain, batch } = engineKit()
		const item = { id: 1 }
		const rollback = vi.fn(() => plain.remove(item))

		expect(() =>
			preparation.prepare(item, {
				owner: {},
				timeout: 20,
				initialize: () => {
					plain.push(item)

					throw new Error('Initialization failed')
				},
				rollback,
			}),
		).toThrow('Initialization failed')

		expect(batch.items).toEqual([])
		expect(rollback).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it.each([-1, NaN, Infinity])('rejects timeout %s before acquiring resources', (timeout) => {
		const { preparation } = engineKit()
		const initialize = vi.fn()

		expect(() =>
			preparation.prepare(
				{ id: 1 },
				{
					owner: {},
					timeout,
					initialize,
					rollback: vi.fn(),
				},
			),
		).toThrow('finite and non-negative')

		expect(initialize).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('finds the optional extension through its contract', () => {
		const { engine, preparation } = engineKit()
		const ordinary = new TCollectionEngine<TItem, { plain: TPlainExtension<TItem> }>({
			extensions: { plain: new TPlainExtension<TItem>() },
		})

		expect(preparationOf(engine)).toBe(preparation)
		expect(preparationOf(ordinary)).toBeUndefined()
		expect(preparationOf(null)).toBeUndefined()
	})
})
