/**
 * TStableSnapshot — снимок связки для React: значение, то же по содержимому,
 * остаётся прежним объектом, а снимок, где не сменилось ничего, — прежним
 * снимком. Иначе React перерисовывал бы компонент от повторного чтения того же.
 */

import { describe, it, expect } from 'vitest'
import { TPluginMount } from '@soxa-ui/plugins'
import { TCollectionAriaState } from '@soxa-ui/setup'
import type { TStateSnapshot } from '@soxa-ui/setup'
import { TStableSnapshot } from '../src/adapter/runtime/stable-snapshot.class'

/** Снимок связки, который тест меняет сам: новый объект — как после перечитанной ячейки. */
function sourceOf(initial: TStateSnapshot) {
	let current = Object.freeze({ ...initial })

	return {
		getSnapshot: () => current,
		subscribe: () => () => {},
		write: (next: TStateSnapshot) => {
			current = Object.freeze({ ...next })
		},
	}
}

/** Ячейки строки таблицы, собранные заново, — как геттер ядра на каждое чтение. */
const cells = () => [
	{ value: 'Анна', aria: { role: 'rowheader' }, dataset: { 'data-align': 'start' } },
	{ value: 30, aria: {}, dataset: { 'data-align': 'end' } },
]

describe('TStableSnapshot', () => {
	it('первый снимок — снимок связки как есть', () => {
		const source = sourceOf({ cells: cells() })
		const snapshot = new TStableSnapshot(source)

		expect(snapshot.getSnapshot()).toBe(source.getSnapshot())
	})

	it('перечитанное то же по содержимому — прежний снимок и прежние объекты', () => {
		const source = sourceOf({ cells: cells(), selected: false })
		const snapshot = new TStableSnapshot(source)
		const first = snapshot.getSnapshot()

		source.write({ cells: cells(), selected: false })

		expect(snapshot.getSnapshot()).toBe(first)
	})

	it('сменилось одно свойство — новый снимок, остальные прежними объектами', () => {
		const source = sourceOf({ cells: cells(), selected: false })
		const snapshot = new TStableSnapshot(source)
		const first = snapshot.getSnapshot()

		source.write({ cells: cells(), selected: true })

		const next = snapshot.getSnapshot()

		expect(next).not.toBe(first)
		expect(next.selected).toBe(true)
		expect(next.cells).toBe(first.cells)
	})

	it('сменилось вложенное — новое значение', () => {
		const source = sourceOf({ cells: cells() })
		const snapshot = new TStableSnapshot(source)
		const first = snapshot.getSnapshot()
		const changed = cells()

		changed[1] = { ...changed[1], dataset: { 'data-align': 'start' } }
		source.write({ cells: changed })

		expect(snapshot.getSnapshot().cells).toBe(changed)
		expect(snapshot.getSnapshot()).not.toBe(first)
	})

	it('экземпляры классов — по идентичности, а не по полям', () => {
		class TItem {
			constructor(readonly value: string) {}
		}

		const source = sourceOf({ items: [new TItem('a')] })
		const snapshot = new TStableSnapshot(source)
		const replaced = [new TItem('a')]

		snapshot.getSnapshot()
		source.write({ items: replaced })

		expect(snapshot.getSnapshot().items).toBe(replaced)
	})

	it('массив и объект с теми же ключами — разные значения', () => {
		const source = sourceOf({ value: ['a'] })
		const snapshot = new TStableSnapshot(source)

		snapshot.getSnapshot()
		source.write({ value: { 0: 'a' } })

		expect(snapshot.getSnapshot().value).toEqual({ 0: 'a' })
	})

	it('снимок связки тот же — сверки нет, снимок тот же', () => {
		const source = sourceOf({ cells: cells() })
		const snapshot = new TStableSnapshot(source)

		expect(snapshot.getSnapshot()).toBe(snapshot.getSnapshot())
	})

	it('keeps the same snapshot when the committed state matches the prepared ARIA', () => {
		const mount = new TPluginMount()
		const source = sourceOf({ aria: { role: 'tab' } })
		const snapshot = new TStableSnapshot(new TCollectionAriaState(source, mount))

		mount.patch('aria', { id: 'declared-tab' })
		const prepared = snapshot.getSnapshot()

		mount.accept()
		source.write({ aria: { role: 'tab', id: 'declared-tab' } })
		const release = snapshot.subscribe(() => {})

		expect(snapshot.getSnapshot()).toBe(prepared)

		release()
	})
})
