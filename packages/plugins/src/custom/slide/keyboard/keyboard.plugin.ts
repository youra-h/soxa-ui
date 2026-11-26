import type { ISlidable } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import type { IDomEventTarget } from '../../../utils'
import { arrowStep, slideDirection } from '../direction'
import { fieldOf, thumbIndex, thumbsOf, trackOf } from '../parts'
import type { ISlideKeyboardPluginOptions, TSlideKeyboardPluginEvents } from './types'

/**
 * TSlideKeyboardPlugin — клавиатура и жест скринридера у полей ручек.
 *
 * Поле ручки — нативный `input[type=range]`, и браузер сдвинул бы его сам. Но
 * шаг у него свой: он не знает ни крупного шага, ни неравного шага списком, ни
 * `inverted`, а в RTL стрелки у браузеров расходятся. Поэтому клавиши плагин
 * берёт себе (`preventDefault`) и переводит в команды владельца — одинаково во
 * всех браузерах:
 *
 * - стрелки — шаг по направлению роста (`arrowStep`): стрелка своей оси ведёт
 *   ручку туда, куда смотрит, в RTL и при `inverted` тоже;
 * - Shift со стрелкой, PageUp и PageDown — крупный шаг (`largeStep`);
 * - Home и End — край хода ручки.
 *
 * Клавиши с Alt, Ctrl и Meta — чужие жесты, их плагин не трогает. Слушает он
 * корень, но берёт только клавиши самих полей: у содержимого слотов своя
 * клавиатура.
 *
 * Мобильный скринридер клавиш не шлёт: свайп двигает поле его собственным
 * шагом и сообщает об этом событием `input`. Плагин переводит направление
 * правки в шаг владельца и возвращает полю значение владельца — показывать
 * поле должно то, что решило ядро.
 */
export class TSlideKeyboardPlugin extends TBasePlugin<ISlidable, TSlideKeyboardPluginEvents> {
	private _owner: ISlidable | null = null
	private _root: Element | null = null
	private _options: ISlideKeyboardPluginOptions = {}

	override install(ctx: IPluginContext, options: ISlideKeyboardPluginOptions = {}): void {
		super.install(ctx, options)
		this._options = options

		this._owner = ctx.getInstance<ISlidable>()

		const element = ctx.get(TElementPlugin)

		element?.events.on('ready', (node) => this._attach(node))
		element?.events.on('removed', () => this._detach())
	}

	override destroy(): void {
		this._detach()
		this._owner = null

		super.destroy()
	}

	private _attach(root: Element): void {
		this._detach()

		this._root = root

		const target: IDomEventTarget = root

		target.addEventListener('keydown', this._onKeyDown)
		target.addEventListener('input', this._onInput)
	}

	private _detach(): void {
		const target: IDomEventTarget | null = this._root

		target?.removeEventListener('keydown', this._onKeyDown)
		target?.removeEventListener('input', this._onInput)

		this._root = null
	}

	private readonly _onKeyDown = (event: KeyboardEvent): void => {
		// С модификатором — чужой жест: Alt+← у браузера «назад»
		if (event.altKey || event.ctrlKey || event.metaKey) return

		const owner = this._owner
		const root = this._root

		if (!owner || !root) return

		const index = this._thumbOf(owner, root, event.target)
		const action = index < 0 ? null : this._actionOf(owner, root, event)

		if (!action) return

		// Поле само не сдвигается: иначе клавиша дала бы два шага — браузера и ядра
		event.preventDefault()

		action(index)
	}

	/**
	 * Правка поля не клавишей — жестом скринридера. Владелец делает шаг в ту
	 * же сторону, а поле показывает его значение: и когда шаг сделан, и когда
	 * упёрся в соседа.
	 */
	private readonly _onInput = (event: Event): void => {
		const owner = this._owner
		const root = this._root
		const field = event.target

		if (!owner || !root || !(field instanceof HTMLInputElement)) return

		const index = this._thumbOf(owner, root, field)

		if (index < 0) return

		const direction = Math.sign(Number(field.value) - owner.values[index])

		// `NaN` и ноль — правки нет
		if (direction) owner.shift(index, direction)

		const value = String(owner.values[index])

		if (field.value !== value) field.value = value
	}

	/** Что клавиша делает с ручкой; не наша клавиша — `null`, её обработает браузер. */
	private _actionOf(
		owner: ISlidable,
		root: Element,
		event: KeyboardEvent,
	): ((index: number) => void) | null {
		switch (event.key) {
			case 'Enter': {
				const activate = this._options.activate

				return activate ? (index) => activate(owner, index) : null
			}
			case 'Home':
				return (index) => owner.moveToEdge(index, 'start')
			case 'End':
				return (index) => owner.moveToEdge(index, 'end')
			case 'PageUp':
				return (index) => owner.shift(index, owner.largeStep)
			case 'PageDown':
				return (index) => owner.shift(index, -owner.largeStep)
		}

		const step = arrowStep(slideDirection(owner, root), event.key)

		if (step === null) return null

		if (
			this._options.axisOnly &&
			(owner.orientation === 'horizontal') !==
				(event.key === 'ArrowLeft' || event.key === 'ArrowRight')
		)
			return null

		const count = event.shiftKey ? step * owner.largeStep : step

		return (index) => owner.shift(index, count)
	}

	/** Номер ручки, чьё поле — цель события; не поле ручки — `-1`. */
	private _thumbOf(owner: ISlidable, root: Element, target: EventTarget | null): number {
		const parts = this._options.parts ?? {}
		const track = (parts.track ?? trackOf)(owner, root)

		if (!track) return -1

		return thumbIndex(
			parts,
			thumbsOf(owner, track),
			(thumb) => (parts.field ?? fieldOf)(thumb) === target,
		)
	}
}
