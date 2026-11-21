import { TValueControl } from '../../base/value-control'
import type { TDefaultValues } from '../../base/component'
import type { TScrollBehavior } from '../../../common'
import { LIST_DEFAULTS, LIST_CONTENT_FIT_ATTRIBUTE, LIST_INDICATOR_ATTRIBUTE } from '../list'
import type { IListProps, TListContentFit, TListIndicator } from '../list'
import type { IListBoxProps, TListBoxView, TListBoxEvents, IListBox, TListBoxValue } from './types'

/**
 * Компонент ListBox — список с выбором.
 *
 * Раньше между ним и `TValueControl` стоял `TList`. Слоя не стало: наследник у
 * него был ровно один, а Select, которому те же свойства нужны не меньше, всё
 * равно оставался в стороне — он растёт от `TInputControl`.
 *
 * `TValueControl`, а не `TControl`: выбор у списка был всегда, но отдавался
 * наружу списком объектов — внутренней моделью коллекции. Потребителю нужен
 * ответ в значениях, и он же уходит в форму. Связь `value` ↔ выбор держит
 * `TValueSelectionExtension`.
 *
 * `maxRows`, `contentFit`, `scrollBehavior`, `indicator`, `groupSeparators`
 * объявлены контрактом `IList` (см. `custom/list/types.ts`) и реализованы здесь
 * же — своей копией. Копия сознательная: общего предка у списка и поля выбора
 * быть не может, а попытка отдать свойства плагину сделала ядро
 * несамодостаточным. Расхождение копий стережёт
 * `core/__tests__/list-contract.spec.ts`.
 *
 * Применять их ядру по силам не всё: `contentFit` уходит в `data-*`, что ядру
 * доступно, а `maxRows` требует измерений — его применяет `TListHeightPlugin`,
 * читая свойство отсюда. `scrollBehavior` отсюда только читают, а
 * `groupSeparators` — разметка: разделитель между секциями рисует она.
 *
 * Роль — природа компонента, и пишет её он сам: `role="listbox"` в свой
 * `aria`, как `TSelect` — в `listAria`, а `TMenu` — `menu`. От режима выбора
 * она не зависит: роль по режиму — знание Tags, у которого без выбора набор —
 * простой список. Что выбрать можно несколько (`aria-multiselectable`), знает
 * коллекция: пишет это `TListBoxExtension`, рядом с `aria-selected` элементов.
 *
 * Набор `aria` разметка кладёт не на корень, а на узел списка внутри него
 * (`so-list-box__list`): в `listbox` ARIA пускает только опции, а в корне
 * рядом со списком стоят шапка и подвал с полями и кнопками. На узле списка —
 * роль, имя от `TAriaPlugin` и остановка Tab; на корне — `attrs` и `dataset`,
 * как у Tabs, чей набор лежит на списке табов.
 */
export class TListBox
	extends TValueControl<TListBoxValue, IListBoxProps, TListBoxEvents>
	implements IListBox
{
	static override baseClass = 'so-list-box'

	static defaultValues: typeof TValueControl.defaultValues &
		TDefaultValues<IListBoxProps, keyof IListProps, 'view'> = {
		...TValueControl.defaultValues,
		...LIST_DEFAULTS,
		view: undefined,
	}

	protected _view: TListBoxView | undefined
	protected _maxRows: number
	protected _contentFit!: TListContentFit
	protected _scrollBehavior: TScrollBehavior
	protected _indicator!: TListIndicator
	protected _groupSeparators: boolean

	constructor(props: Partial<IListBoxProps> = {}) {
		super(props)

		const ctor = new.target as typeof TListBox

		// Только то, что список знает о себе сам: он — listbox. Роль стоит на
		// узле списка — там же фокус, клавиатура и имя от `TAriaPlugin`
		this._aria.add('role', 'listbox')

		this._applyView(props.view ?? ctor.defaultValues.view)

		this._maxRows = props.maxRows ?? ctor.defaultValues.maxRows
		this._scrollBehavior = props.scrollBehavior ?? ctor.defaultValues.scrollBehavior
		this._groupSeparators = props.groupSeparators ?? ctor.defaultValues.groupSeparators

		this._applyContentFit(props.contentFit ?? ctor.defaultValues.contentFit)
		this._applyIndicator(props.indicator ?? ctor.defaultValues.indicator)
	}

	/**
	 * `aria` стоит на узле списка внутри корня, а тег у него фиксированный
	 * (`div`), разметка задаёт его сама. Поэтому ARIA-половина правила
	 * «нативный атрибут вместо ARIA-дубля» от `tag` корня не зависит: у `div`
	 * своего `disabled` нет, и выключенный список узел объявляет
	 * `aria-disabled`, каким бы ни был корень — как строка `ListBox.Item`.
	 */
	protected override get _ariaTag(): string {
		return 'div'
	}

	get view(): TListBoxView | undefined {
		return this._view
	}

	set view(value: TListBoxView | undefined) {
		const oldView = this.view

		if (this._view === value) return

		this._applyView(value, this._view)
		this.events.emit('change:view', { newValue: value, oldValue: oldView })
	}

	/** Сколько строк показывать до появления прокрутки. `0` — все. */
	get maxRows(): number {
		return this._maxRows
	}

	set maxRows(value: number) {
		const oldMaxRows = this.maxRows

		if (this._maxRows === value) return

		this._maxRows = value
		this.events.emit('change:maxRows', { newValue: value, oldValue: oldMaxRows })
	}

	/** Что делать с не помещающимся текстом. */
	get contentFit(): TListContentFit {
		return this._contentFit
	}

	set contentFit(value: TListContentFit) {
		const oldContentFit = this.contentFit

		if (this._contentFit === value) return

		this._applyContentFit(value)
		this.events.emit('change:contentFit', { newValue: value, oldValue: oldContentFit })
	}

	/** Как прокручивать к элементу при навигации. */
	get scrollBehavior(): TScrollBehavior {
		return this._scrollBehavior
	}

	set scrollBehavior(value: TScrollBehavior) {
		const oldScrollBehavior = this.scrollBehavior

		if (this._scrollBehavior === value) return

		this._scrollBehavior = value
		this.events.emit('change:scrollBehavior', { newValue: value, oldValue: oldScrollBehavior })
	}

	/** Где показывать отметку выбранного элемента. */
	get indicator(): TListIndicator {
		return this._indicator
	}

	set indicator(value: TListIndicator) {
		const oldIndicator = this.indicator

		if (this._indicator === value) return

		this._applyIndicator(value)
		this.events.emit('change:indicator', { newValue: value, oldValue: oldIndicator })
	}

	/**
	 * Draw separators between sections generated from data. For markup groups,
	 * place ListBox.Separator explicitly; groupSeparators does not control it.
	 */
	get groupSeparators(): boolean {
		return this._groupSeparators
	}

	set groupSeparators(value: boolean) {
		const oldGroupSeparators = this.groupSeparators

		if (this._groupSeparators === value) return

		this._groupSeparators = value
		this.events.emit('change:groupSeparators', {
			newValue: value,
			oldValue: oldGroupSeparators,
		})
	}

	/** Модификатор вида — с префиксом `--view-`; `swap` пропускает пустое значение. */
	protected _applyView(newValue: TListBoxView | undefined, oldValue?: TListBoxView): void {
		this._classes.swap({
			prefix: '--view-',
			oldValue,
			newValue,
		})
		this._view = newValue
	}

	/**
	 * `data-content-fit`, а не класс: то же имя получает каждый элемент, и тема
	 * читает одно свойство на двух уровнях — `expand` со списка (ширина
	 * контейнера), `wrap` с элемента (перенос текста).
	 */
	protected _applyContentFit(value: TListContentFit): void {
		this._contentFit = value
		this._dataset.add(LIST_CONTENT_FIT_ATTRIBUTE, value)
	}

	/**
	 * `data-indicator` на самом списке: место под отметку резервирует тема, и
	 * знать сторону ей надо до того, как что-то выбрано. Тот же атрибут каждому
	 * элементу ставит `TListBoxExtension`.
	 */
	protected _applyIndicator(value: TListIndicator): void {
		this._indicator = value
		this._dataset.add(LIST_INDICATOR_ATTRIBUTE, value)
	}

	override getProps(): IListBoxProps {
		return {
			...super.getProps(),
			view: this._view,
			maxRows: this._maxRows,
			contentFit: this._contentFit,
			scrollBehavior: this._scrollBehavior,
			indicator: this._indicator,
			groupSeparators: this._groupSeparators,
		} as IListBoxProps
	}
}
