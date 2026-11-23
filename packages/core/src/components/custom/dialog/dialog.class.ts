import { TModalLayer } from '../../base/modal-layer'
import type { TEventSink } from '../../../common'
import type { TDefaultValues } from '../../base/component'
import { TAria } from '../../../common'
import type { IDialog, IDialogProps, TDialogEvents, TDialogPlacement } from './types'

/**
 * Dialog window with modal behavior by default. Non-modal windows preserve the
 * page's focus, navigation and scrolling; plugins apply that policy to the DOM.
 * The title supplies the accessible name. Alert semantics apply only in modal
 * mode, where the dialog interrupts the current interaction.
 *
 * Placement, size and maximizing are theme layout values, without DOM measures.
 */
export default class TDialog<
	TProps extends IDialogProps = IDialogProps,
	TEvents extends TDialogEvents = TDialogEvents,
>
	extends TModalLayer<TProps, TEvents>
	implements IDialog<TProps, TEvents>
{
	static override baseClass = 'so-dialog'

	static defaultValues: typeof TModalLayer.defaultValues &
		TDefaultValues<
			IDialogProps,
			'placement' | 'maximized' | 'maximizable' | 'alert' | 'modal',
			'offset'
		> = {
		...TModalLayer.defaultValues,
		modal: true,
		placement: 'center',
		// Не задан — отступ темы. Не `0`: ноль — это «вплотную к краям»
		offset: undefined,
		maximized: false,
		maximizable: false,
		alert: false,
	}

	protected _modal: boolean
	protected _placement!: TDialogPlacement
	protected _offset: number | string | undefined
	protected _maximized!: boolean
	protected _maximizable: boolean
	protected _alert!: boolean
	protected _bodyAria: TAria
	protected _maximizeAria: TAria

	constructor(props: Partial<TProps> = {}) {
		super(props)

		const ctor = new.target as typeof TDialog

		this._bodyAria = new TAria()
		this._bodyAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:bodyAria', { newValue: this._bodyAria.toObject(), oldValue }),
		)

		this._maximizeAria = new TAria()
		this._maximizeAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:maximizeAria', {
				newValue: this._maximizeAria.toObject(),
				oldValue,
			}),
		)

		this._modal = props.modal ?? ctor.defaultValues.modal
		this._applyModal()

		this._offset = props.offset ?? ctor.defaultValues.offset
		this._maximizable = props.maximizable ?? ctor.defaultValues.maximizable

		this._applyAlert(props.alert ?? ctor.defaultValues.alert)
		this._applyPlacement(props.placement ?? ctor.defaultValues.placement)
		this._applyMaximized(props.maximized ?? ctor.defaultValues.maximized)
	}

	/** Emit the Dialog contract while descendants keep their complete event map. */
	protected override get _sink(): TEventSink<TDialogEvents> {
		return this.events
	}

	/** Развернуть окно или вернуть ему размер — действие кнопки разворота. */
	toggleMaximized(): void {
		this.maximized = !this._maximized
	}

	/** Где окно стоит на экране: по центру или у одной из сторон. */
	get placement(): TDialogPlacement {
		return this._placement
	}

	set placement(value: TDialogPlacement) {
		const oldPlacement = this.placement

		if (this._placement === value) return

		this._applyPlacement(value, this._placement)
		this._sink.emit('change:placement', { newValue: value, oldValue: oldPlacement })
	}

	/**
	 * Отступ окна от краёв экрана: число — px, строка — CSS-значение. Не задан
	 * — отступ темы, `0` — вплотную. Один на все стороны: у центра он
	 * действует со всех, у стороны — от её края, и со всех — как потолок
	 * размера. Стороны по отдельности правит подписчик `layout:offset:before`
	 * — событие раскладки, а не ядра: значение уходит теме переменными.
	 */
	get offset(): number | string | undefined {
		return this._offset
	}

	set offset(value: number | string | undefined) {
		const oldOffset = this.offset

		if (this._offset === value) return

		this._offset = value
		this._sink.emit('change:offset', { newValue: value, oldValue: oldOffset })
	}

	/**
	 * Развёрнуто ли окно на весь экран. Пишут и разработчик, и кнопка
	 * разворота: состояние одно, иначе кнопка разошлась бы с тем, что видно.
	 */
	get maximized(): boolean {
		return this._maximized
	}

	set maximized(value: boolean) {
		const oldMaximized = this.maximized

		if (this._maximized === value) return

		this._applyMaximized(value)
		this._sink.emit('change:maximized', { newValue: value, oldValue: oldMaximized })
	}

	/** Показывать ли кнопку разворота. Развернуть окно можно и без неё — `maximized`. */
	get maximizable(): boolean {
		return this._maximizable
	}

	set maximizable(value: boolean) {
		const oldMaximizable = this.maximizable

		if (this._maximizable === value) return

		this._maximizable = value
		this._sink.emit('change:maximizable', { newValue: value, oldValue: oldMaximizable })
	}

	/** Alert semantics apply while modal; the requested flag survives modality changes. */
	get alert(): boolean {
		return this._alert
	}

	set alert(value: boolean) {
		const oldAlert = this.alert

		if (this._alert === value) return

		this._applyAlert(value)
		this._sink.emit('change:alert', { newValue: value, oldValue: oldAlert })
	}

	/**
	 * Сторона тела: на него ссылается `aria-describedby` предупреждения.
	 * Живой набор: `id` в него пишет `TDialogIdsPlugin`, об изменении набор
	 * сообщает `change:bodyAria`.
	 */
	get bodyAria(): TAria {
		return this._bodyAria
	}

	/**
	 * Набор кнопки разворота: её имя и состояние — нажата, когда окно
	 * развёрнуто. Имя одно на оба состояния: кнопка — переключатель, и
	 * состояние она сообщает `aria-pressed`, а не сменой имени (APG, Button).
	 * Живой: состояние пишет окно, имя от локали — плагин имён
	 * (`TDialogNamesPlugin`), об изменении набор сообщает `change:maximizeAria`.
	 */
	get maximizeAria(): TAria {
		return this._maximizeAria
	}

	/** A non-modal dialog preserves page interaction and never takes focus. */
	get modal(): boolean {
		return this._modal
	}

	set modal(value: boolean) {
		const oldValue = this._modal

		if (oldValue === value) return

		this._modal = value
		this._applyModal()
		this._applyAlert(this._alert)
		this._sink.emit('change:modal', { newValue: value, oldValue })
	}

	private _applyModal(): void {
		this._aria.add('aria-modal', this._modal ? 'true' : null)
	}

	protected _applyAlert(value: boolean): void {
		this._alert = value

		this._aria.add('role', value && this._modal ? 'alertdialog' : 'dialog')
	}

	protected _applyPlacement(newValue: TDialogPlacement, oldValue?: TDialogPlacement): void {
		this._classes.swap({
			prefix: '--placement-',
			oldValue,
			newValue,
		})

		this._placement = newValue
	}

	protected _applyMaximized(value: boolean): void {
		this._maximized = value

		// Тема по нему разворачивает окно, а место и размер перестают действовать
		this._dataset.add('maximized', value)
		this._maximizeAria.add('aria-pressed', value ? 'true' : 'false')
	}

	override getProps(): TProps {
		return {
			...super.getProps(),
			modal: this._modal,
			placement: this._placement,
			offset: this._offset,
			maximized: this._maximized,
			maximizable: this._maximizable,
			alert: this._alert,
		}
	}
}
