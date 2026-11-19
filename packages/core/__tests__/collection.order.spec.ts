import { describe, it, expect, vi } from 'vitest'
import {
	TCollectionEngine,
	TPlainExtension,
	TBatchExtension,
	TOrderExtension,
	TItemContextRegistry,
} from '@soxa-ui/core'

type Item = { id: number; name: string }

function createCollection() {
	const plain = new TPlainExtension<Item>()
	const batch = new TBatchExtension<Item>()
	const order = new TOrderExtension<Item>()

	return new TCollectionEngine<
		Item,
		{ plain: TPlainExtension<Item>; batch: TBatchExtension<Item>; order: TOrderExtension<Item> }
	>({
		extensions: { plain, batch, order },
	})
}

describe('TOrderExtension', () => {
	it('getItemOrder: возвращает индекс элемента', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)

		expect(col.extensions.order.getItemOrder(a)).toBe(1)
		expect(col.extensions.order.getItemOrder(b)).toBe(0)
	})

	it('getItemOrder: возвращает -1 если элемента нет', () => {
		const col = createCollection()
		const item: Item = { id: 1, name: 'a' }

		expect(col.extensions.order.getItemOrder(item)).toBe(-1)
	})

	it('эмитит change:order при изменении items', () => {
		const col = createCollection()
		const handler = vi.fn()

		col.extensions.order.events.on('change:order', handler)
		col.extensions.plain.insert({ id: 1, name: 'a' })

		expect(handler).toHaveBeenCalledOnce()
	})

	it('эмитит change:order при перемещении', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)

		col.extensions.order.events.on('change:order', handler)
		col.extensions.plain.move(a, 0)

		expect(handler).toHaveBeenCalledOnce()
	})

	it('эмитит change:order один раз при batch с несколькими перемещениями', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }
		const c: Item = { id: 3, name: 'c' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)
		col.extensions.plain.insert(c)

		col.extensions.order.events.on('change:order', handler)

		col.batch(() => {
			col.extensions.plain.move(a, 2)
			col.extensions.plain.move(b, 0)
		})

		expect(handler).toHaveBeenCalledOnce()
	})

	it('эмитит change:order при удалении элемента', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)

		col.extensions.order.events.on('change:order', handler)
		col.extensions.plain.remove(a)

		expect(handler).toHaveBeenCalledOnce()
	})

	it('эмитит change:order один раз при очистке нескольких элементов', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)

		col.extensions.order.events.on('change:order', handler)
		col.extensions.batch.clear()

		expect(handler).toHaveBeenCalledOnce()
	})

	it('не эмитит change:order при перемещении на тот же индекс', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)

		col.extensions.order.events.on('change:order', handler)
		col.extensions.plain.move(a, 0)

		expect(handler).not.toHaveBeenCalled()
	})

	it('не эмитит change:order при batch из нескольких обновлений', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)

		col.extensions.order.events.on('change:order', handler)

		col.batch(() => {
			col.extensions.plain.update(a, { name: 'a2' })
			col.extensions.plain.update(b, { name: 'b2' })
		})

		expect(handler).not.toHaveBeenCalled()
	})

	it('не эмитит change:order, если после отменённой вставки прошло обновление (флаг не протекает)', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const handler = vi.fn()

		col.extensions.plain.insert(a)

		col.getCore().driver.events.on('item:add:before', (event) => event.preventDefault())

		col.extensions.order.events.on('change:order', handler)

		col.extensions.plain.insert({ id: 2, name: 'b' })
		col.extensions.plain.update(a, { name: 'a2' })

		expect(handler).not.toHaveBeenCalled()
	})

	it('order обновляется после перемещения', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }

		col.extensions.plain.insert(a)
		col.extensions.plain.insert(b)

		expect(col.extensions.order.getItemOrder(a)).toBe(1)

		col.extensions.plain.move(a, 0)

		expect(col.extensions.order.getItemOrder(a)).toBe(0)
	})

	it('элемент слышит change:order, только когда сдвинулся он сам', () => {
		const col = createCollection()
		const registry = new TItemContextRegistry(col.getCore())
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }

		col.extensions.plain.push(a)
		col.extensions.plain.push(b)

		const onA = vi.fn()
		const onB = vi.fn()

		registry.get(a).adapters.order.events.on('change:order', onA)
		registry.get(b).adapters.order.events.on('change:order', onB)

		// Appending moves no one: a mount of N items is not N² notifications
		col.extensions.plain.push({ id: 3, name: 'c' })

		expect(onA).not.toHaveBeenCalled()
		expect(onB).not.toHaveBeenCalled()

		col.extensions.plain.remove(a)

		expect(onB).toHaveBeenCalledOnce()
		expect(registry.get(b).adapters.order.order).toBe(0)
	})

	it('порядок, прочитанный посреди batch, — уже новый', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }
		const read: number[] = []

		col.extensions.plain.push(a)
		col.extensions.plain.push(b)

		expect(col.extensions.order.getItemOrder(a)).toBe(0)

		col.batch(() => {
			col.extensions.plain.move(a, 1)
			read.push(col.extensions.order.getItemOrder(a))
		})

		expect(read).toEqual([1])
	})

	it('освобождённый адаптер элемента больше не уведомляется', () => {
		const col = createCollection()
		const a: Item = { id: 1, name: 'a' }
		const b: Item = { id: 2, name: 'b' }

		col.extensions.plain.push(a)
		col.extensions.plain.push(b)

		const context = new TItemContextRegistry(col.getCore()).get(b)
		const adapter = context.adapters.order
		const sync = vi.spyOn(adapter, 'sync')

		context.release()
		col.extensions.plain.remove(a)

		expect(sync).not.toHaveBeenCalled()
	})
})
