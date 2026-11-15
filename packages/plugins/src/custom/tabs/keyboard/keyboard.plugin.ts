import type { ITabs, ITabsItem, TTabsCollection, TTabsOrientation } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import { TCollectionBundlesPlugin, TCollectionElements } from '../../collection'
import { TLeavingFocus } from '../../collection/leaving-focus'
import { focusFirst, isFocusableElement, tabStopsAfter } from '../../../utils'
import type { IDomEventTarget } from '../../../utils'
import { listOf } from '../parts'
import { tabOf } from '../tab'
import type { TTabsKeyboardPluginEvents } from './types'

/** Стрелки «к предыдущему» и «к следующему» — на оси ориентации списка. */
const AXIS_KEYS: Record<TTabsOrientation, readonly [back: string, forward: string]> = {
	horizontal: ['ArrowLeft', 'ArrowRight'],
	vertical: ['ArrowUp', 'ArrowDown'],
}

/**
 * TTabsKeyboardPlugin — клавиатура Tabs по паттерну APG Tabs и фокус после
 * закрытия таба.
 *
 * Стрелки по оси списка (у горизонтального ←/→, у вертикального ↑/↓) ведут к
 * соседнему табу по кругу, `Home`/`End` — к первому и последнему. Табы, на
 * которые нельзя перейти (`TTabsExtension.isEnabledTab`), пропускаются.
 * `Delete` закрывает таб, если его можно закрыть.
 *
 * **Активация автоматическая**: переход сразу активирует таб. APG советует
 * так, когда панель показывается без задержки, а `Tabs.Content` рисуется
 * локально. Поэтому фокус и активный таб не расходятся, и остановка Tab —
 * активный таб — считается в коллекции без знания о фокусе. `Enter` и пробел
 * здесь не обрабатываются: таб — нативная `<button>`, и активирует её клик.
 *
 * **Закрытый таб отдаёт фокус остановке Tab** — любым закрытием: клавишей,
 * крестиком, из кода. Крестик фокус от клика принимает, и узел таба уходит из
 * документа вместе с ним: фокус ушёл бы на страницу, и следующий Tab начинал
 * бы обход заново. Переносится только фокус из узла закрываемого таба — на
 * таб-остановку после удаления (`tabStop`): закрыли активный — это сосед,
 * которого уже активировал `TTabsExtension`; закрыли неактивный — прежний
 * активный, соседа такое закрытие не активирует. Остановки нет — к первой
 * остановке Tab после списка; нет и её — фокус не трогается.
 *
 * Когда переносить фокус, решает помощник коллекции (`TLeavingFocus`), общий с
 * Tags: таб бывает снят ещё до того, как закрытие дойдёт до плагина, —
 * подписчиком `item:close`, который стоит раньше, например приложением в
 * обработчике события фасада. Удаление, отменённое в `item:remove:before`, и
 * уход таба без закрытия фокус не трогают. Закрыть таб из кода можно и на
 * сервере, поэтому фокус читается только при узле корня.
 *
 * Сами `tabindex` плагин не пишет: roving tabindex ставит `TTabsExtension`,
 * потому что атрибут обязан стоять с первой отрисовки, включая серверную.
 * Здесь только то, что требует DOM: слушатель клавиш и перенос фокуса.
 *
 * От `TListNavigationPlugin` не наследуется: там модель подсветки при фокусе
 * на контейнере, а у табов по APG фокус ходит по самим табам (см. AGENTS.md,
 * «Граница переиспользования между похожими компонентами»).
 */
export class TTabsKeyboardPlugin extends TBasePlugin<ITabs, TTabsKeyboardPluginEvents> {
	private _owner: ITabs | null = null
	/** Корень: на нём слушатель, по нему же направление письма. */
	private _element: Element | null = null
	private _elements: TCollectionElements | null = null
	private _engine: TTabsCollection | null = null
	/** Фокус закрываемого таба — ждёт, пока таб закроют и он уйдёт из списка. */
	private _leaving: TLeavingFocus<ITabsItem, undefined> | null = null

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		this._owner = ctx.getInstance<ITabs>()
		this._elements = ctx.get(TCollectionElements) ?? null
		this._leaving = new TLeavingFocus(this._elements, {
			root: () => this._element,
			// Месту закрытого таба запоминать нечего: цель — остановка после удаления
			place: () => undefined,
			pass: (root) => this._pass(root),
		})

		const elementPlugin = ctx.get(TElementPlugin)

		elementPlugin?.events.on('ready', (element) => this._attach(element))
		elementPlugin?.events.on('removed', () => {
			this._detach()
			this._leaving?.reset()
		})

		// Коллекция привязывается после install — ждём момент привязки
		ctx.get(TCollectionBundlesPlugin)?.events.on('engine:bound', (engine) =>
			this._bindEngine(engine),
		)
	}

	override destroy(): void {
		this._detach()
		this._bindEngine(null)

		this._owner = null
		this._elements = null
		this._leaving = null

		super.destroy()
	}

	private _attach(element: Element): void {
		this._detach()

		this._element = element

		const target: IDomEventTarget = element

		target.addEventListener('keydown', this._onKeyDown)
	}

	private _detach(): void {
		const target: IDomEventTarget | null = this._element

		target?.removeEventListener('keydown', this._onKeyDown)

		this._element = null
	}

	/** Движок сменился — закрытие табов и их уход слушаются у нового. */
	private _bindEngine(engine: TTabsCollection | null): void {
		this._engine?.extensions.tabs.events.off('item:close', this._onClose)

		this._engine = engine

		engine?.extensions.tabs.events.on('item:close', this._onClose)
		this._leaving?.bind(engine?.extensions.plain ?? null)
	}

	private readonly _onKeyDown = (event: KeyboardEvent): void => {
		// С модификатором — чужой жест: Alt+← у браузера «назад»
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

		const engine = this._engine

		if (!engine) return

		const tab = this._tabOf(engine, event.target)

		if (!tab) return

		// Фокус остановке передаёт само закрытие — тем же путём, что у крестика
		if (event.key === 'Delete') {
			if (engine.extensions.tabs.closeTab(tab)) event.preventDefault()

			return
		}

		const candidates = this._candidates(engine, event.key, tab)

		if (candidates.length === 0) return

		event.preventDefault()

		// Активация автоматическая, и фокус идёт только на таб, который стал
		// активным: отменённую в `item:activate:before` пропускаем к следующему
		// в том же направлении. Иначе фокус и активный таб разошлись бы
		const next = candidates.find((item) => engine.extensions.activation.activate(item))

		if (next) this._focus(next)
	}

	/**
	 * Таб, с которого пришла клавиша, — тот, чей узел содержит цель события.
	 *
	 * Слушатель висит на корне, и до него всплывают клавиши панелей, слотов
	 * списка и вложенных Tabs: их перехватывать нельзя. Кнопка закрытия лежит
	 * внутри узла таба и считается его частью.
	 */
	private _tabOf(engine: TTabsCollection, target: EventTarget | null): ITabsItem | undefined {
		if (!(target instanceof Node)) return undefined

		return engine.extensions.batch.shown.find((item) =>
			this._elements?.getElementByUid(item.uid)?.contains(target),
		)
	}

	/**
	 * Куда ведёт клавиша — табы по порядку, от первого кандидата; пусто —
	 * клавиша не наша или перейти некуда. `Home` идёт от первого вперёд,
	 * `End` — от последнего назад, стрелка — от соседа в своём направлении.
	 */
	private _candidates(engine: TTabsCollection, key: string, tab: ITabsItem): ITabsItem[] {
		if (key === 'Home') return this._available(engine)

		if (key === 'End') return this._available(engine).reverse()

		const step = this._step(key)

		return step === null ? [] : this._neighbours(engine, tab, step)
	}

	/**
	 * Шаг по списку от стрелки; клавиши чужой оси не перехватываются. В RTL
	 * горизонтальный список идёт справа налево, и ←/→ меняются местами.
	 */
	private _step(key: string): number | null {
		const orientation = this._owner?.orientation ?? 'horizontal'
		const [back, forward] = AXIS_KEYS[orientation]
		const step = key === forward ? 1 : key === back ? -1 : null

		if (step === null || orientation === 'vertical') return step

		return this._rtl ? -step : step
	}

	/**
	 * Направление письма берётся вычисленным: `direction` компонента бывает
	 * `inherit`, и тогда его задаёт предок.
	 */
	private get _rtl(): boolean {
		return this._element !== null && getComputedStyle(this._element).direction === 'rtl'
	}

	/** Табы в порядке списка, на которые можно перейти. */
	private _available(engine: TTabsCollection): ITabsItem[] {
		return engine.extensions.batch.shown.filter((item) =>
			engine.extensions.tabs.isEnabledTab(item),
		)
	}

	/**
	 * Табы в направлении шага, по кругу, от ближайшего: с последнего вперёд —
	 * на первый. Отсчёт от позиции таба в списке, а не среди доступных: таб
	 * могли выключить, пока на нём фокус.
	 */
	private _neighbours(engine: TTabsCollection, tab: ITabsItem, step: number): ITabsItem[] {
		const shown = engine.extensions.batch.shown
		const count = shown.length
		const from = shown.indexOf(tab)
		const neighbours: ITabsItem[] = []

		for (let offset = 1; offset <= count; offset++) {
			const candidate = shown[(((from + step * offset) % count) + count) % count]

			if (engine.extensions.tabs.isEnabledTab(candidate)) neighbours.push(candidate)
		}

		return neighbours
	}

	/** Фокус на узел таба с ролью. Гард нужен: узел плагину приходит `Element`. */
	private _focus(item: ITabsItem): void {
		const tab = tabOf(this._elements, item.uid)

		if (isFocusableElement(tab)) tab.focus()
	}

	/**
	 * Таб закрывают — любым путём: клавишей, крестиком, из кода. Переносить
	 * ли фокус, решает помощник: фокус мог стоять и не в этом табе.
	 */
	private readonly _onClose = (tab: ITabsItem): void => this._leaving?.close(tab)

	/**
	 * Фокус закрытого таба — на таб-остановку. Остановка берётся по модели
	 * (`tabStop`), а не по `[tabindex="0"]`: в такте закрытия разметка ещё
	 * старая. Остановки нет — на первую остановку Tab после списка: за ним
	 * слот `trailing` и панели; нет и её — фокус остаётся, где был.
	 */
	private _pass(root: Element): void {
		const stop = this._engine?.extensions.tabs.tabStop
		const tab = stop ? tabOf(this._elements, stop.uid) : null

		if (tab && focusFirst([tab])) return

		const list = this._owner ? listOf(this._owner, root) : null

		if (list) focusFirst(tabStopsAfter(list, null))
	}
}
