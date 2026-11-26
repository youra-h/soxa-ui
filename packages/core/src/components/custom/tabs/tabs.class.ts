import { TAttributes, type TOrientation } from '../../../common'
import { TControl } from '../../base/control'
import type { TDefaultValues } from '../../base/component'
import type {
	ITabs,
	ITabsProps,
	TTabsEvents,
	TTabsAlignment,
	TTabsPosition,
	TTabsView,
} from './types'

/**
 * Компонент табов (TTabs).
 * Управляет коллекцией табов на базе TCollectionEngine с расширениями (Plain, Batch, Selection).
 */
export class TTabs extends TControl<ITabsProps, TTabsEvents> implements ITabs {
	static override baseClass = 'so-tabs'

	static defaultValues: typeof TControl.defaultValues &
		TDefaultValues<ITabsProps, 'orientation' | 'alignment' | 'position' | 'closable', 'view'> =
		{
			...TControl.defaultValues,
			orientation: 'horizontal',
			alignment: 'start',
			position: 'start',
			view: undefined,
			closable: false,
		}

	protected _orientation!: TOrientation
	protected _alignment!: TTabsAlignment
	protected _position!: TTabsPosition
	protected _view: TTabsView | undefined
	protected _closable!: boolean

	protected readonly _scrollAttrs: TAttributes

	constructor(props: Partial<ITabsProps> = {}) {
		super(props)

		this._scrollAttrs = new TAttributes()
		this._scrollAttrs.subscribe((_set, oldValue) =>
			this.events.emit('change:scrollAttrs', {
				newValue: this._scrollAttrs.toObject(),
				oldValue,
			}),
		)

		const ctor = new.target as typeof TTabs

		// Набор `aria` владельца — это список табов: разметка биндит его на
		// `.so-tabs__list`, а не на корень, где рядом со списком лежат панели.
		// Туда же доходят имя из `aria_label` и `aria-disabled`.
		this._aria.add('role', 'tablist')

		this._applyOrientation(props.orientation ?? ctor.defaultValues.orientation)
		this._applyAlignment(props.alignment ?? ctor.defaultValues.alignment)
		this._applyPosition(props.position ?? ctor.defaultValues.position)
		this._applyView(props.view ?? ctor.defaultValues.view)

		this._closable = props.closable ?? ctor.defaultValues.closable
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldOrientation = this.orientation

		if (this._orientation !== value) {
			this._applyOrientation(value, this._orientation)
			this.events.emit('change:orientation', { newValue: value, oldValue: oldOrientation })
		}
	}

	protected _applyOrientation(newValue: TOrientation, oldValue?: TOrientation) {
		this._classes.swap({ prefix: '--orientation-', oldValue, newValue })
		// Не для вида: по ориентации скринридер объявляет, какими стрелками
		// ходить по списку, — у вертикального это ↑/↓ (`TTabsKeyboardPlugin`)
		this._aria.add('aria-orientation', newValue)
		this._orientation = newValue
		this._syncPositionClass()
	}

	/**
	 * `aria` стоит на списке табов — вложенном `div`, а не на корне. Поэтому
	 * ARIA-половину правила «нативный атрибут вместо ARIA-дубля» решает тег
	 * списка, а не `tag`: своего `disabled` у `div` нет, и выключенный список
	 * сообщает о себе `aria-disabled` при любом теге корня.
	 */
	protected override get _ariaTag(): string {
		return 'div'
	}

	get alignment(): TTabsAlignment {
		return this._alignment
	}

	set alignment(value: TTabsAlignment) {
		const oldAlignment = this.alignment

		if (this._alignment !== value) {
			this._applyAlignment(value, this._alignment)
			this.events.emit('change:alignment', { newValue: value, oldValue: oldAlignment })
		}
	}

	protected _applyAlignment(newValue: TTabsAlignment, oldValue?: TTabsAlignment) {
		this._classes.swap({
			prefix: '--alignment-',
			oldValue,
			newValue: newValue !== 'start' ? newValue : undefined,
		})
		this._alignment = newValue
	}

	get position(): TTabsPosition {
		return this._position
	}

	set position(value: TTabsPosition) {
		const oldPosition = this.position

		if (this._position !== value) {
			this._applyPosition(value)
			this.events.emit('change:position', { newValue: value, oldValue: oldPosition })
		}
	}

	protected _applyPosition(newValue: TTabsPosition) {
		this._position = newValue
		this._syncPositionClass()
	}

	/**
	 * Модификатор стороны выводится из пары «ориентация, сторона», поэтому его
	 * пересчитывает смена любой из двух: сторона бывает только у вертикального
	 * списка, и `--position-end` стоит у вертикальных с `end`. У `start`
	 * модификатора нет — это сторона по умолчанию.
	 */
	protected _syncPositionClass(): void {
		this._classes.toggle(
			'--position-end',
			this._orientation === 'vertical' && this._position === 'end',
		)
	}

	get view(): TTabsView | undefined {
		return this._view
	}

	set view(value: TTabsView | undefined) {
		const oldView = this.view

		if (this._view !== value) {
			this._applyView(value, this._view)
			this.events.emit('change:view', { newValue: value, oldValue: oldView })
		}
	}

	/**
	 * Модификатор вида — с префиксом: без него вид темы `vertical` совпал бы с
	 * модификатором ориентации. `swap` пропускает пустое значение.
	 */
	protected _applyView(newValue: TTabsView | undefined, oldValue?: TTabsView) {
		this._classes.swap({
			prefix: '--view-',
			oldValue,
			newValue,
		})
		this._view = newValue
	}

	get closable(): boolean {
		return this._closable
	}

	set closable(value: boolean) {
		const oldClosable = this.closable

		if (this._closable !== value) {
			this._closable = value
			this.events.emit('change:closable', { newValue: value, oldValue: oldClosable })
		}
	}

	/** Attributes of the scrolling part; measured focusability is supplied by its plugin. */
	get scrollAttrs(): TAttributes {
		return this._scrollAttrs
	}

	override getProps(): ITabsProps {
		return {
			...super.getProps(),
			orientation: this._orientation,
			alignment: this._alignment,
			position: this._position,
			view: this._view,
			closable: this._closable,
		}
	}
}
