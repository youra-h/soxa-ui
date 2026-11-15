import type { ITabs, TTabsCollection } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TElementPlugin } from '../../element'
import { TCollectionBundlesPlugin, TCollectionElements } from '../../collection'
import { isMeasurableElement } from '../../../utils'
import { TTabsLayoutPlugin } from '../layout'
import { barOf } from '../parts'
import type { TActiveTabOffset, TTabsActiveTabPluginEvents } from './types'

/**
 * TTabsActiveTabPlugin — вычисляет позицию/размер активного таба (offset).
 *
 * Использует:
 * - корень набора (через TElementPlugin) и его ряд — ребёнка корня, от
 *   которого считаются `offset*` табов;
 * - активный элемент коллекции (engine.extensions.activation);
 * - DOM-элемент активного таба (через TCollectionElements).
 *
 * Пересчитывает offset при активации/деактивации, удалении/перемещении элементов,
 * изменении view и изменении layout (resize).
 *
 * **Удаление и перемещение пересчитываются кадром позже — и только при узле
 * корня**: между `ready` и `removed` своего `TElementPlugin`. Сборка вместе с
 * подписками плагина идёт и на сервере, и табы там уходят из коллекции — Solid
 * снимает собранный корень после `renderToString`, — а узла там нет, как нет и
 * `requestAnimationFrame`. Без узла мерить нечего (`_computeOffset` отдаёт
 * `null`), и кадр не планируется: место активного таба померит `ready`.
 */
export class TTabsActiveTabPlugin extends TBasePlugin<ITabs, TTabsActiveTabPluginEvents> {
	private _element: Element | null = null
	private _tabs: ITabs | null = null
	private _collectionElements: TCollectionElements | null = null
	private _engine: TTabsCollection | null = null
	/** Last published measurement, retained by reference for the next notification. */
	private _offset: TActiveTabOffset | null = null

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		this._tabs = ctx.getInstance<ITabs>()
		this._collectionElements = ctx.get(TCollectionElements) ?? null

		ctx.get(TElementPlugin)?.events.on('ready', (element) => {
			this._element = element
			this._emitOffset()
		})

		ctx.get(TElementPlugin)?.events.on('removed', () => {
			this._element = null
			this._offset = null
		})

		ctx.get(TTabsLayoutPlugin)?.events.on('change:layout', () => this._emitOffset())

		// Коллекция привязывается к TCollectionBundlesPlugin ПОСЛЕ install() —
		// слушаем момент привязки и подписываемся на события коллекции.
		ctx.get(TCollectionBundlesPlugin)?.events.on('engine:bound', (engine: TTabsCollection) => {
			this._engine = engine

			const emit = () => this._emitOffset()
			const emitNextFrame = () => this._emitOffsetNextFrame()

			this._listenTo(engine.extensions.activation.events, 'item:activated', emit)
			this._listenTo(engine.extensions.activation.events, 'item:deactivated', emit)

			this._listenTo(engine.extensions.plain.events, 'item:removed', emitNextFrame)
			this._listenTo(engine.extensions.plain.events, 'item:moved', emitNextFrame)
		})

		this._listenTo(this._tabs?.events, 'change:view', () => this._emitOffset())
	}

	override destroy(): void {
		this._element = null
		this._offset = null
		this._tabs = null
		this._collectionElements = null
		this._engine = null

		super.destroy()
	}

	getOffset(): TActiveTabOffset | null {
		return this._computeOffset()
	}

	private _emitOffset(): void {
		const oldValue = this._offset
		this._offset = this._computeOffset()
		this.events.emit('change:active-tab', { newValue: this._offset, oldValue })
	}

	/**
	 * Пересчитать offset кадром позже — пока у плагина есть узел корня: разметка
	 * после удаления или перемещения таба ещё не перерисована. Без узла повод
	 * ничего не планирует: место активного таба померит `ready`.
	 */
	private _emitOffsetNextFrame(): void {
		if (this._element) requestAnimationFrame(() => this._emitOffset())
	}

	private _computeOffset(): TActiveTabOffset | null {
		if (!this._element || !this._collectionElements || !this._engine || !this._tabs) {
			return null
		}

		const barEl = barOf(this._tabs, this._element)

		// Отметку таба тема рисует переменными на ряду, а место считается в
		// `offset*` от него — ближайшего позиционированного предка таба: без
		// layout-бокса offset'ы считать не по чему.
		if (!isMeasurableElement(barEl)) return null

		const activeItem = this._engine.extensions.activation.activeItem
		const activeEl = activeItem
			? this._collectionElements.getElementByUid(activeItem.uid)
			: null
		const activeBox = isMeasurableElement(activeEl) ? activeEl : null

		return {
			barEl,
			offsetLeft: activeBox ? activeBox.offsetLeft : 0,
			offsetWidth: activeBox ? activeBox.offsetWidth : 0,
			offsetTop: activeBox ? activeBox.offsetTop : 0,
			offsetHeight: activeBox ? activeBox.offsetHeight : 0,
		}
	}
}
