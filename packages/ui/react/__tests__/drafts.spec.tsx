/**
 * TDrafts — сборки, которые React ещё не принял, и освобождение тех, что он
 * отбросил.
 *
 * React об отброшенной сборке не сообщает, поэтому её освобождает следующая
 * сборка того же `ctrl` или движка. Сборка, отброшенная без следующей, живёт
 * до неё — и освобождается, как только тот же `ctrl` или движок собирают
 * снова. Сборка на месте отброшенной над тем же `ctrl` берёт её id
 * монтирования. Настоящий цикл React сторожат `external-lifetime.spec.tsx` и
 * `remount-ctrl.spec.tsx`, здесь — правила без фреймворка.
 */

import { describe, it, expect, vi } from 'vitest'
import { TDrafts } from '../src/adapter/runtime/drafts.class'

describe('TDrafts', () => {
	it('непринятую сборку уничтожает следующая сборка того же ctrl — один раз', () => {
		const drafts = new TDrafts()
		const ctrl = {}
		const destroy = vi.fn()

		drafts.add(drafts.take({ ctrl }).held, destroy, 'a')
		drafts.take({ ctrl })
		drafts.take({ ctrl })

		expect(destroy).toHaveBeenCalledTimes(1)
	})

	it('отброшенная без следующей сборка живёт, пока тот же ctrl не соберут снова', () => {
		const drafts = new TDrafts()
		const ctrl = {}
		const destroy = vi.fn()

		drafts.add(drafts.take({ ctrl }).held, destroy, 'a')
		drafts.take({ ctrl: {} })

		expect(destroy).not.toHaveBeenCalled()

		drafts.take({ ctrl })

		expect(destroy).toHaveBeenCalledTimes(1)
	})

	it('принятую сборку следующая не трогает', () => {
		const drafts = new TDrafts()
		const ctrl = {}
		const destroy = vi.fn()
		const { held } = drafts.take({ ctrl })

		drafts.add(held, destroy, 'a')
		drafts.forget(held)
		drafts.take({ ctrl })

		expect(destroy).not.toHaveBeenCalled()
	})

	it('движок фасада из опций — такой же ключ, как ctrl', () => {
		const drafts = new TDrafts()
		const engine = {}
		const destroy = vi.fn()

		drafts.add(drafts.take({ options: { owner: {}, engine } }).held, destroy, 'a')
		drafts.take({ options: { engine } })

		expect(destroy).toHaveBeenCalledTimes(1)
	})

	it('сборку, взявшую ctrl и движок, уничтожает любой из них, и только раз', () => {
		const drafts = new TDrafts()
		const ctrl = {}
		const engine = {}
		const destroy = vi.fn()

		drafts.add(
			[...drafts.take({ ctrl }).held, ...drafts.take({ options: { engine } }).held],
			destroy,
			'a',
		)
		drafts.take({ options: { engine } })
		drafts.take({ ctrl })

		expect(destroy).toHaveBeenCalledTimes(1)
	})

	it('без ctrl и движка сборка ничего не берёт и не запоминается', () => {
		const drafts = new TDrafts()

		expect(drafts.take({ props: { text: 'x' }, options: { owner: {} } })).toEqual({
			held: [],
			mountId: undefined,
		})
	})

	describe('id монтирования', () => {
		it('сборка на месте отброшенной над тем же ctrl берёт её id', () => {
			const drafts = new TDrafts()
			const ctrl = {}

			drafts.add(drafts.take({ ctrl }).held, vi.fn(), 'a')

			expect(drafts.take({ ctrl }).mountId).toBe('a')
		})

		it('у принятой сборки id не берут: следующее монтирование — своё', () => {
			const drafts = new TDrafts()
			const ctrl = {}
			const { held } = drafts.take({ ctrl })

			drafts.add(held, vi.fn(), 'a')
			drafts.forget(held)

			expect(drafts.take({ ctrl }).mountId).toBeUndefined()
		})

		it('движок без ctrl id не передаёт: компоненты на нём пишут id каждый в свой инстанс', () => {
			const drafts = new TDrafts()
			const engine = {}

			drafts.add(drafts.take({ options: { engine } }).held, vi.fn(), 'a')

			expect(drafts.take({ options: { engine } }).mountId).toBeUndefined()
		})
	})
})
