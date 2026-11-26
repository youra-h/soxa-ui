import type { ISlidable } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import type { IDomEventTarget } from '../../../utils'
import { slideKeyAction } from '../keys'
import { fieldOf, thumbsOf, trackOf } from '../parts'
import type { TSlideKeyboardPluginEvents } from './types'

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

	override install(ctx: IPluginContext): void {
		super.install(ctx)

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
		const action = index < 0 ? null : slideKeyAction(owner, root, event)

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

	/** Номер ручки, чьё поле — цель события; не поле ручки — `-1`. */
	private _thumbOf(owner: ISlidable, root: Element, target: EventTarget | null): number {
		const track = trackOf(owner, root)

		if (!track) return -1

		return thumbsOf(owner, track).findIndex((thumb) => fieldOf(thumb) === target)
	}
}
