import { TInputControl } from '../../base/input-control'
import type { TDefaultValues } from '../../base/component'
import type { TSwipe, TSwipeSide } from '../../base/layer'
import { TAria } from '../../../common'
import type {
	TDatasetAttributes,
	TScrollBehavior,
	TValuePayload,
	TEventSink,
} from '../../../common'
import type { TComponentSize, TComponentVariant } from '../../../common'
import { LIST_DEFAULTS, LIST_CONTENT_FIT_ATTRIBUTE, LIST_INDICATOR_ATTRIBUTE } from '../list'
import type { IListProps, TListContentFit, TListIndicator } from '../list'
import { TInput } from '../input'
import type { IInput } from '../input'
import type {
	ISelect,
	ISelectProps,
	TSelectEditableMode,
	TSelectEvents,
	TSelectPanelPlacement,
	TSelectPlacement,
	TSelectValue,
} from './types'

/**
 * Поле выбора из списка (`Select`).
 *
 * Наследует `TInputControl`: у него есть `value`/`name` для формы и
 * `readonly`/`required`. Своё здесь — состояние панели и то, как поле себя
 * подаёт.
 *
 * О коллекции класс не знает. Опции, выбор и связка с списком живут в
 * `TSelectCollectionFacade` и `TSelectExtension` — так же, как у Tabs.
 *
 * Паттерн доступности — APG Combobox, вариант select-only: поле объявляет
 * себя `combobox`, а DOM-фокус с него не уходит никогда. `role`,
 * `aria-haspopup`, `aria-expanded` и `aria-autocomplete` пишутся в
 * `field.aria`, а не в собственный `aria` Select: паттерн описывает элемент,
 * на котором держится фокус, — нативный `<input>`, а не корневой `div`.
 * `aria-controls` (список) и `aria-activedescendant` (подсветка) пишут туда
 * же расширение коллекции и клавиатурный плагин — имена и `id` списка/опции
 * знают они, не поле.
 *
 * `maxRows`, `contentFit`, `scrollBehavior`, `indicator`, `groupSeparators` —
 * общий с ListBox контракт `IList` (см. `custom/list/types.ts`), реализованный
 * здесь своей копией: общего предка у списка и поля выбора быть не может.
 * Копии сверяет `core/__tests__/list-contract.spec.ts`.
 *
 * `value`/`name`/`readonly`/`required` от `TInputControl` — служебное
 * состояние самого Select, не то, что пользователь видит внутри поля и что
 * объявляет скринридеру. Этим владеет отдельный инстанс `TInput` (`field`):
 * Select создаёт его один раз и синхронизирует с ним общие свойства
 * (`disabled`, `size`, `variant`, `readonly`, `required`, `name`,
 * `clearable`). Второго значения поля рядом с этим не заводим — единственный
 * держатель текста, плейсхолдера и ARIA поля это и есть `field`. `id` поля —
 * не свойство ядра: его держит `TIdPlugin`, и Select отдаёт свой вложенному
 * Input в разметке.
 *
 * **Кнопку очистки рисует поле**, а не Select: `clearable` — вход Select,
 * который уходит полю, а имя кнопки (`clearAria`) и команда (`clear`) — у
 * поля. Имя поле берёт из своего словаря, который пишет ему его же плагин
 * словаря, — через Select строки не идут. Очистку поля Select слышит событием
 * `clear` поля: выбор снимает `TSelectExtension`, одним путём и у встроенной
 * кнопки, и у своей в слоте `clear`.
 *
 * **Жест** (`swipe`, по умолчанию выключен) — смахнуть панель, чтобы закрыть:
 * Select — смахиваемый слой (`ISwipeable`), тянет его `TSwipePlugin`, общий с
 * поповером и выезжающей панелью. Панель уходит от поля — вниз, если стоит под
 * ним, и вверх, если над ним. Сторону решает flip плагина якоря, и знает её
 * только узел панели, поэтому `swipeSide` — всегда `null`. Признак «тянут»
 * (`swiping`) панель получает набором `panelDataset`: панель — Frame без
 * экземпляра в ядре, и `dataset` Select лежит на корне. Закрывает жест записью
 * `open`, как Escape.
 */
export class TSelect<
	TProps extends ISelectProps = ISelectProps,
	TEvents extends TSelectEvents = TSelectEvents,
>
	extends TInputControl<TSelectValue, TProps, TEvents>
	implements ISelect<TProps, TEvents>
{
	static override baseClass = 'so-select'

	static defaultValues: typeof TInputControl.defaultValues &
		TDefaultValues<
			ISelectProps,
			| keyof IListProps
			| 'open'
			| 'placeholder'
			| 'closeOnSelect'
			| 'clearable'
			| 'editable'
			| 'editableMode'
			| 'removeOnBackspace'
			| 'placement'
			| 'swipe'
		> = {
		...TInputControl.defaultValues,
		...LIST_DEFAULTS,
		open: false,
		placeholder: '',
		closeOnSelect: true,
		// Кнопку рисует поле: умолчание — его, второй копии не заводим
		clearable: TInput.defaultValues.clearable,
		editable: false,
		editableMode: 'search',
		removeOnBackspace: false,
		placement: 'auto',
		swipe: 'none',
		// Не `false` от `TInputControl`: select-only (`editable: false`) и есть
		// `readonly`, с ним Select и стартует. Умолчание уходит адаптеру через
		// декларацию пропа, и Vue отдал бы отсутствующему `readonly` не то.
		readonly: true,
		tag: 'div',
	}

	protected _open!: boolean
	/** Whether the panel has ever been open — from then on the options from data stay mounted. */
	protected _opened = false
	protected _placeholder!: string
	protected _closeOnSelect!: boolean
	protected _clearable!: boolean
	protected _maxRows!: number
	protected _contentFit!: TListContentFit
	protected _scrollBehavior!: TScrollBehavior
	protected _indicator!: TListIndicator
	protected _groupSeparators!: boolean
	protected _editable!: boolean
	protected _editableMode!: TSelectEditableMode
	protected _removeOnBackspace!: boolean
	protected _placement!: TSelectPlacement
	protected _swipe!: TSwipe
	protected _swiping = false
	protected readonly _field: IInput
	protected readonly _listAria: TAria

	constructor(props: Partial<TProps> = {}) {
		super(props)

		const ctor = new.target as typeof TSelect
		const own = props as Partial<ISelectProps>

		// Кнопку очистки рисует поле: свой `clearable` Select отдаёт ему при
		// создании и при каждой смене, как `name` и `size`
		this._clearable = own.clearable ?? ctor.defaultValues.clearable

		// Поле — экземпляр `TInput`, которым владеет Select, а не второе
		// значение рядом со своим `value`. Шаблон передаёт его целиком через
		// `ctrl` (`<Input :ctrl="field">`), как `tags` передаётся в `<Tags>`.
		// Пишут в него: `TInputPlugin` — набранное, `TSelectExtension` —
		// текст выбранного, `TEditablePlugin` — возврат текста. Двух копий
		// значения поля с этим больше нет.
		//
		// Создаётся сразу после `super()`, а не в конце конструктора: ниже
		// `_applyEditable`/`_applyOpen` уже пишут ARIA комбобокса в
		// `field.aria`, и на момент этих вызовов поле обязано существовать.
		// Начальный `readonly` не берём из `this.readonly` — `_applyEditable`
		// его ещё не пересчитал, а `_applyReadonly` события не шлёт, поэтому
		// эквивалент выключателя editable читаем явно из пропов.
		this._field = new TInput({
			disabled: this.disabled,
			size: this.size,
			variant: this.variant,
			readonly: !(own.editable ?? ctor.defaultValues.editable),
			required: this.required,
			name: this.name,
			clearable: this._clearable,
		})

		this._placeholder = own.placeholder ?? ctor.defaultValues.placeholder
		this._closeOnSelect = own.closeOnSelect ?? ctor.defaultValues.closeOnSelect

		this._maxRows = own.maxRows ?? ctor.defaultValues.maxRows
		this._scrollBehavior = own.scrollBehavior ?? ctor.defaultValues.scrollBehavior
		this._groupSeparators = own.groupSeparators ?? ctor.defaultValues.groupSeparators

		this._applyContentFit(own.contentFit ?? ctor.defaultValues.contentFit)
		this._applyIndicator(own.indicator ?? ctor.defaultValues.indicator)

		// `_editableMode` — до `_applyEditable`: тот вызывает
		// `_syncAutocomplete()`, и на момент вызова режим должен быть уже
		// установлен (сам `aria-autocomplete` от режима не зависит).
		this._editableMode = own.editableMode ?? ctor.defaultValues.editableMode
		this._applyEditable(own.editable ?? ctor.defaultValues.editable)
		this._removeOnBackspace = own.removeOnBackspace ?? ctor.defaultValues.removeOnBackspace
		this._placement = own.placement ?? ctor.defaultValues.placement
		this._swipe = own.swipe ?? ctor.defaultValues.swipe
		// Тем же правилом, что и сеттер `editable`, только без события — и
		// после `TInputControl`, поэтому проп `readonly` здесь перекрывается.
		this._applyReadonly(!this._editable)
		this._applyOpen(own.open ?? ctor.defaultValues.open)

		// Роль и haspopup постоянны, а `aria-expanded` следует за панелью — оба
		// в `field.aria`: паттерн combobox описывает нативный `<input>`, а не
		// корневой `div` Select. `aria-controls` и `aria-activedescendant` —
		// не отсюда: это ссылки на `id` списка и опции, их пишут плагины.
		this._field.aria.add('role', 'combobox')
		this._field.aria.add('aria-haspopup', 'listbox')

		this._listAria = new TAria()
		this._listAria.subscribe((_set, oldValue) =>
			this._sink.emit('change:listAria', { newValue: this._listAria.toObject(), oldValue }),
		)

		this._listAria.add('role', 'listbox')

		this.events.on('change:disabled', () => this._syncOpenable())

		this._syncOpenable()

		this.events.on(
			'change:disabled',
			({ newValue: value }: TValuePayload<boolean>) => (this._field.disabled = value),
		)
		this.events.on('change:size', (payload: TValuePayload<TComponentSize>) => {
			this._field.size = payload.newValue
		})
		this.events.on(
			'change:variant',
			(payload: TValuePayload<TComponentVariant | undefined>) => {
				this._field.variant = payload.newValue
			},
		)
		this.events.on(
			'change:readonly',
			({ newValue: value }: TValuePayload<boolean>) => (this._field.readonly = value),
		)
		this.events.on(
			'change:required',
			({ newValue: value }: TValuePayload<boolean>) => (this._field.required = value),
		)
		this.events.on(
			'change:name',
			({ newValue: value }: TValuePayload<string>) => (this._field.name = value),
		)
		this.events.on(
			'change:clearable',
			({ newValue: value }: TValuePayload<boolean>) => (this._field.clearable = value),
		)
		// Ошибка — и полю, как `required`: его рамку красит тема Input, и
		// `aria-invalid` стоит на том же `<input>`, что и набор Select
		this.events.on(
			'change:invalid',
			({ newValue: value }: TValuePayload<boolean>) => (this._field.invalid = value),
		)
	}

	/**
	 * Эмит собственных событий класса — без приведения `this.events` к
	 * конкретной карте (см. `TEventSink` в `common/event/types.ts`).
	 */
	protected get _sink(): TEventSink<TSelectEvents> {
		return this.events
	}

	/**
	 * Поле ввода — экземпляр `TInput`, единственный владелец текста и
	 * плейсхолдера, которые видит пользователь. Не меняется за время жизни
	 * Select, поэтому `change:`-события у геттера нет: инстанс один и тот же,
	 * меняется только его собственное состояние.
	 */
	/**
	 * ARIA списка в панели. Список — разметка внутри шаблона Select, своего
	 * экземпляра у него нет, поэтому набор — Select'а (AGENTS.md, «Часть или
	 * слот»). Живой, потому что пишут в него трое: роль — Select,
	 * `aria-multiselectable` по режиму выбора — `TSelectExtension`, `id` —
	 * `TSelectIdsPlugin`. Об изменении набор сообщает `change:listAria`.
	 */
	get listAria(): TAria {
		return this._listAria
	}

	get field(): IInput {
		return this._field
	}

	/**
	 * `aria` Select'а разметка кладёт на `<input>` поля, рядом с набором
	 * комбобокса (`field.aria`): имя (`aria_label`), описание и ошибка
	 * описывают элемент, на котором стоит фокус, а не корневой `div`. Поэтому
	 * ARIA-половину правил решает `input`: `disabled` у него нативный, и
	 * `aria-disabled` рядом не пишется, а подпись поля формы называет его
	 * своим `for` (`labelable`).
	 */
	protected override get _ariaTag(): string {
		return 'input'
	}

	/**
	 * Можно ли сейчас открыть панель.
	 *
	 * Раньше её запрещал ещё и `readonly`. Теперь `readonly` значит только
	 * «в поле нельзя печатать», и ставит его `editable`; select-only — это
	 * как раз `editable: false`, а ему панель и нужна. Остаётся `disabled`.
	 */
	get openable(): boolean {
		return !this.disabled
	}

	get open(): boolean {
		return this._open
	}

	set open(value: boolean) {
		const oldOpen = this.open

		if (this._open === value) return
		if (value && !this.openable) return

		this._applyOpen(value)
		this._sink.emit('change:open', { newValue: value, oldValue: oldOpen })
		this._sink.emit(value ? 'open' : 'close')
	}

	/**
	 * Простой тумблер. Кто и когда его зовёт — решает не ядро: в select-only
	 * это клик по всему полю, в `editable` — только клик по стрелке
	 * (`TSelectPointerPlugin`), а клик по тексту поля там вообще не доходит
	 * до `toggleOpen`, потому что ставит курсор, а не открывает панель.
	 * Закрытие сверх тумблера остаётся за `Escape` и нажатием мимо
	 * (`TDismissPlugin`).
	 */
	toggleOpen(): void {
		this.open = !this._open
	}

	/**
	 * Whether the panel's options from data (`items`) are mounted: from the
	 * first opening on. A closed Select nobody opened is a field — options
	 * built for every Select of a form would outweigh the form, and the closed
	 * field needs none of their nodes: the selected text and tags come from the
	 * collection, a key on the closed field opens the panel before it looks
	 * for an option, and the list the field refers to (`aria-controls`) is
	 * there regardless. Options written in markup are mounted from the start:
	 * they enter the collection only mounted. Closing does not unmount them:
	 * openness is the panel's `visible`, not `rendered`.
	 */
	get contentRendered(): boolean {
		return this._opened
	}

	get placeholder(): string {
		return this._placeholder
	}

	set placeholder(value: string) {
		const oldPlaceholder = this.placeholder

		if (this._placeholder === value) return

		this._placeholder = value
		this._sink.emit('change:placeholder', { newValue: value, oldValue: oldPlaceholder })
	}

	get closeOnSelect(): boolean {
		return this._closeOnSelect
	}

	set closeOnSelect(value: boolean) {
		const oldCloseOnSelect = this.closeOnSelect

		if (this._closeOnSelect === value) return

		this._closeOnSelect = value
		this._sink.emit('change:closeOnSelect', { newValue: value, oldValue: oldCloseOnSelect })
	}

	/** Показывать ли кнопку очистки. Рисует её поле: значение уходит ему. */
	get clearable(): boolean {
		return this._clearable
	}

	set clearable(value: boolean) {
		const oldClearable = this.clearable

		if (this._clearable === value) return

		this._clearable = value
		this._sink.emit('change:clearable', { newValue: value, oldValue: oldClearable })
	}

	/**
	 * Можно ли вводить текст в поле. `false` — режим select-only (по
	 * умолчанию): вложенный `Input` остаётся `readonly`, значение меняет
	 * только выбор из списка.
	 *
	 * Включает и выключает `readonly` — он и есть «в поле нельзя печатать».
	 * Сам `readonly` при этом обычный, своей логики у него нет.
	 */
	get editable(): boolean {
		return this._editable
	}

	set editable(value: boolean) {
		const oldEditable = this.editable

		if (this._editable === value) return

		this._applyEditable(value)
		this._sink.emit('change:editable', { newValue: value, oldValue: oldEditable })

		this.readonly = !value
	}

	/**
	 * Что делает ввод текста при `editable: true`. Реакцию на сам ввод несёт
	 * `TEditablePlugin` — здесь только состояние с тремя значениями. На
	 * `aria-autocomplete` режим не влияет: при `editable` он всегда `"list"`.
	 *
	 * `search` — совпадение подсвечивается, список остаётся целым; `filter` —
	 * несовпавшие опции скрываются (`filter.query` коллекции); `none` — ввод
	 * не делает ничего сам, но приложение может слушать значение поля и
	 * подменять список (например, серверный поиск).
	 */
	get editableMode(): TSelectEditableMode {
		return this._editableMode
	}

	set editableMode(value: TSelectEditableMode) {
		const oldEditableMode = this.editableMode

		if (this._editableMode === value) return

		this._applyEditableMode(value)
		this._sink.emit('change:editableMode', { newValue: value, oldValue: oldEditableMode })
	}

	/**
	 * Удалять ли выбранные теги по `Backspace` в пустом поле. По умолчанию
	 * `false` — реакцию на клавишу несёт отдельный плагин
	 * (`TSelectBackspacePlugin`), который слушает и это свойство, и `editable`,
	 * и режим выбора коллекции; здесь только хранится значение.
	 */
	get removeOnBackspace(): boolean {
		return this._removeOnBackspace
	}

	set removeOnBackspace(value: boolean) {
		const oldRemoveOnBackspace = this.removeOnBackspace

		if (this._removeOnBackspace === value) return

		this._removeOnBackspace = value
		this._sink.emit('change:removeOnBackspace', {
			newValue: value,
			oldValue: oldRemoveOnBackspace,
		})
	}

	/**
	 * С какой стороны поля открывается панель. `auto` (по умолчанию) — снизу,
	 * а у нижнего края окна, где снизу не помещается, сверху. `top` и `bottom`
	 * держат сторону, даже если панель там не помещается.
	 *
	 * Сторону считает не ядро, а `TAnchorPlugin` вложенного Frame: здесь только
	 * выбор потребителя, перевод в пропы якоря — `panelPlacement` и `panelFlip`.
	 */
	get placement(): TSelectPlacement {
		return this._placement
	}

	set placement(value: TSelectPlacement) {
		const oldPlacement = this.placement

		if (this._placement === value) return

		this._placement = value
		this._sink.emit('change:placement', { newValue: value, oldValue: oldPlacement })
	}

	/**
	 * За что панель можно смахнуть, чтобы закрыть: ни за что (по умолчанию), за
	 * полосу или за любое место, кроме опций и прокручиваемого списка — с ними
	 * работают сами.
	 */
	get swipe(): TSwipe {
		return this._swipe
	}

	set swipe(value: TSwipe) {
		const oldSwipe = this.swipe

		if (this._swipe === value) return

		this._swipe = value

		// Жест выключили посреди жеста — тянуть больше нечего
		if (value === 'none') this._setSwiping(false)

		this._sink.emit('change:swipe', { newValue: value, oldValue: oldSwipe })
	}

	/**
	 * Куда панель уходит жестом — от поля. Под ним она или над ним, решает flip
	 * плагина якоря, и знает это только её узел: здесь всегда `null`.
	 */
	get swipeSide(): TSwipeSide | null {
		return null
	}

	/** Идёт жест: с `beginSwipe` до `endSwipe` или до закрытия панели. */
	get swiping(): boolean {
		return this._swiping
	}

	/**
	 * Рисовать ли полосу, за которую панель тянут. Рисуется, пока жест включён,
	 * — и при `panel` тоже: она говорит, что панель можно смахнуть.
	 */
	get handleRendered(): boolean {
		return this._swipe !== 'none'
	}

	/**
	 * Жест начался: панель тянут. Закрытую панель и панель без жеста тянуть
	 * нельзя — тогда жест не начинается.
	 */
	beginSwipe(): boolean {
		if (this._swipe === 'none' || !this._open) return false

		this._setSwiping(true)

		return true
	}

	/**
	 * Жест кончился. Закрывать или нет, решил плагин по пройденному пути и
	 * скорости, и закрывает он записью `open`, как Escape.
	 */
	endSwipe(): void {
		this._setSwiping(false)
	}

	/** Сколько строк показывать до появления прокрутки. `0` — все. */
	get maxRows(): number {
		return this._maxRows
	}

	set maxRows(value: number) {
		const oldMaxRows = this.maxRows

		if (this._maxRows === value) return

		this._maxRows = value
		this._sink.emit('change:maxRows', { newValue: value, oldValue: oldMaxRows })
	}

	/** Что делать с не помещающимся текстом. */
	get contentFit(): TListContentFit {
		return this._contentFit
	}

	set contentFit(value: TListContentFit) {
		const oldContentFit = this.contentFit

		if (this._contentFit === value) return

		this._applyContentFit(value)
		this._sink.emit('change:contentFit', { newValue: value, oldValue: oldContentFit })
	}

	/** Как прокручивать к опции при навигации. */
	get scrollBehavior(): TScrollBehavior {
		return this._scrollBehavior
	}

	set scrollBehavior(value: TScrollBehavior) {
		const oldScrollBehavior = this.scrollBehavior

		if (this._scrollBehavior === value) return

		this._scrollBehavior = value
		this._sink.emit('change:scrollBehavior', { newValue: value, oldValue: oldScrollBehavior })
	}

	/** Где показывать отметку выбранной опции. */
	get indicator(): TListIndicator {
		return this._indicator
	}

	set indicator(value: TListIndicator) {
		const oldIndicator = this.indicator

		if (this._indicator === value) return

		this._applyIndicator(value)
		this._sink.emit('change:indicator', { newValue: value, oldValue: oldIndicator })
	}

	/**
	 * Draw separators between sections generated from data. For markup groups,
	 * place Select.Separator explicitly; groupSeparators does not control it.
	 */
	get groupSeparators(): boolean {
		return this._groupSeparators
	}

	set groupSeparators(value: boolean) {
		const oldGroupSeparators = this.groupSeparators

		if (this._groupSeparators === value) return

		this._groupSeparators = value
		this._sink.emit('change:groupSeparators', { newValue: value, oldValue: oldGroupSeparators })
	}

	/**
	 * Подгонять ли ширину панели под ширину поля.
	 *
	 * Производное от `contentFit`, и вычисляется здесь, а не в разметке:
	 * панель телепортирована, ширину ей задаёт плагин якоря, и шаблону остаётся
	 * только пробросить это в `anchor_matchWidth`. Оставь выражение
	 * `contentFit !== 'expand'` в разметке — и оно повторится в каждом из шести
	 * адаптеров.
	 *
	 * Списку такого свойства не нужно: у него ширину меняет сам `data-*`.
	 */
	get autoFitWidth(): boolean {
		return this._contentFit !== 'expand'
	}

	/**
	 * Сторона панели для плагина якоря (`anchor_placement`) — перевод
	 * `placement`: `top` — `top-start`, `auto` и `bottom` — `bottom-start`.
	 *
	 * Здесь, а не в разметке, по той же причине, что `autoFitWidth`: сторону
	 * телепортированной панели считает плагин якоря, шаблону остаётся только
	 * пробросить значение. Тернарный оператор в шаблоне повторился бы в каждом
	 * из шести адаптеров.
	 */
	get panelPlacement(): TSelectPanelPlacement {
		return this._placement === 'top' ? 'top-start' : 'bottom-start'
	}

	/**
	 * Разрешён ли плагину якоря flip (`anchor_flip`). Только в `auto`: `top` и
	 * `bottom` — сторона, на которой настоял потребитель, переворачивать её
	 * нельзя. Вычисляется здесь по той же причине, что `panelPlacement`.
	 */
	get panelFlip(): boolean {
		return this._placement === 'auto'
	}

	/**
	 * Состояние панели для темы: тянут ли её (`data-swiping`) — тогда переход
	 * сдвига снят, и панель идёт за пальцем без задержки.
	 *
	 * Открытости (`data-open`) в наборе нет: её пишет слой панели (`TLayer`),
	 * чья видимость и есть `open`, — второй писатель атрибута разошёлся бы с
	 * ним. Стороны тоже нет: после flip её пишет в панель плагин якоря
	 * (`data-placement`).
	 *
	 * Отдельный набор, а не `dataset`: `dataset` Select лежит на корне, а панель
	 * — Frame без экземпляра в ядре, и её `data-*` раскладывает разметка, как
	 * `listAria` списка.
	 */
	get panelDataset(): TDatasetAttributes {
		return { 'data-swiping': this._swiping ? 'true' : 'false' }
	}

	protected _applyOpen(value: boolean): void {
		this._open = value

		if (value) this._opened = true

		// Закрытую панель не тянут: жест кончается вместе с ней
		if (!value) this._setSwiping(false)

		// `aria-expanded` — в `field.aria`: паттерн combobox описывает нативный
		// `<input>`, а не корневой `div`.
		this._field.aria.add('aria-expanded', value ? 'true' : 'false')
		// То же состояние для темы: она разворачивает стрелку по `data-open`
		// на корне Select. ARIA поля и `data-*` корня живут на разных
		// элементах — тема ждёт `data-open` там, где ищет стрелку.
		this._dataset.add('open', value)
	}

	protected _setSwiping(value: boolean): void {
		const oldSwiping = this.swiping

		if (this._swiping === value) return

		this._swiping = value
		this._sink.emit('change:swiping', { newValue: value, oldValue: oldSwiping })
	}

	protected _applyEditable(value: boolean): void {
		this._editable = value
		this._dataset.add('editable', value)
		this._syncAutocomplete()
	}

	protected _applyEditableMode(value: TSelectEditableMode): void {
		this._editableMode = value
		this._syncAutocomplete()
	}

	/**
	 * `aria-autocomplete`. Не `editable` — атрибута нет вовсе: поле не
	 * принимает текст, обещать автодополнение нечему. `editable` — всегда
	 * `"list"`, независимо от режима: даже при `none` список зависит от
	 * набранного текста (это делает само приложение, встроенный поиск
	 * выключен), и панель на вводе открывается, совпадение объявляется через
	 * `aria-activedescendant`.
	 */
	protected _syncAutocomplete(): void {
		if (!this._editable) {
			this._field.aria.add('aria-autocomplete', null)

			return
		}

		this._field.aria.add('aria-autocomplete', 'list')
	}

	/**
	 * `data-content-fit` на поле — и то же имя на каждой опции.
	 *
	 * Со списка тема читает `expand`, с опции — `wrap`. Одно свойство, два
	 * уровня; разрешение «опция поверх поля» делает расширение коллекции.
	 */
	protected _applyContentFit(value: TListContentFit): void {
		this._contentFit = value
		this._dataset.add(LIST_CONTENT_FIT_ATTRIBUTE, value)
	}

	/**
	 * `data-indicator` на поле — и то же имя на каждой опции.
	 *
	 * На поле он нужен, чтобы тема резервировала место под отметку до первого
	 * выбора; опциям тот же атрибут ставит `TSelectExtension`.
	 */
	protected _applyIndicator(value: TListIndicator): void {
		this._indicator = value
		this._dataset.add(LIST_INDICATOR_ATTRIBUTE, value)
	}

	/**
	 * Пока открывать нечего — панель закрывается. Иначе `open`, выставленный
	 * до `disabled`, остался бы висеть.
	 *
	 * `tabindex` здесь больше не ставится: фокус держит нативный `<input>`
	 * поля, он и так в порядке обхода, а `disabled` на нём выводит браузер сам.
	 */
	protected _syncOpenable(): void {
		if (!this.openable && this._open) this.open = false
	}

	override getProps(): TProps {
		return {
			...super.getProps(),
			open: this._open,
			placeholder: this._placeholder,
			closeOnSelect: this._closeOnSelect,
			clearable: this._clearable,
			editable: this._editable,
			editableMode: this._editableMode,
			removeOnBackspace: this._removeOnBackspace,
			placement: this._placement,
			swipe: this._swipe,
			maxRows: this._maxRows,
			contentFit: this._contentFit,
			scrollBehavior: this._scrollBehavior,
			indicator: this._indicator,
			groupSeparators: this._groupSeparators,
		} as TProps
	}
}
