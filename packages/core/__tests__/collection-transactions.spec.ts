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
	it('confirms an attempt once and releases its timer', () => {
		const { preparation } = engineKit()
		const rollback = vi.fn()
		const transaction = preparation.prepare({ timeout: 20, rollback })

		transaction.commit()
		transaction.commit()
		vi.advanceTimersByTime(100)

		expect(rollback).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('forgets a rolled-back receipt before its cleanup reenters the registry', () => {
		const { preparation, plain, batch } = engineKit()
		const item = { id: 1 }

		plain.push(item)

		const rollback = vi.fn(() => {
			transaction.cancel()
			plain.remove(item)
		})
		const transaction = preparation.prepare({ timeout: 20, rollback })

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
		const transaction = preparation.prepare({ timeout: 20, rollback })

		transaction.cancel()
		vi.advanceTimersByTime(100)

		expect(rollback).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('expires attempts independently, including a new earlier deadline', () => {
		const { preparation } = engineKit()
		const slow = vi.fn()
		const fast = vi.fn()

		preparation.prepare({ timeout: 100, rollback: slow })
		preparation.prepare({ timeout: 10, rollback: fast })

		vi.advanceTimersByTime(11)

		expect(fast).toHaveBeenCalledOnce()
		expect(slow).not.toHaveBeenCalled()

		vi.advanceTimersByTime(100)

		expect(slow).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it('schedules an attempt begun by an expiring rollback after the sweep', () => {
		const { preparation } = engineKit()
		const later = vi.fn()

		preparation.prepare({
			timeout: 10,
			rollback: () => preparation.prepare({ timeout: 10, rollback: later }),
		})

		vi.advanceTimersByTime(11)

		expect(later).not.toHaveBeenCalled()
		expect(vi.getTimerCount()).toBe(1)

		vi.advanceTimersByTime(11)

		expect(later).toHaveBeenCalledOnce()
		expect(vi.getTimerCount()).toBe(0)
	})

	it.each([-1, NaN, Infinity])('rejects timeout %s before acquiring resources', (timeout) => {
		const { preparation } = engineKit()

		expect(() => preparation.prepare({ timeout, rollback: vi.fn() })).toThrow(
			'finite and non-negative',
		)
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
