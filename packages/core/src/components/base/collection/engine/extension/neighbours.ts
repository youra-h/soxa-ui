import type { IActivationExtension } from './activation/types'
import type { IBatchExtension } from './batch/types'
import type { IDrawExtension, TDrawable } from './draw/types'
import type { IFactoryExtension } from './factory/types'
import type { IFilterExtension } from './filter/types'
import type { IGroupExtension } from './group/types'
import type { IMetaExtension } from './meta/types'
import type { IPlainExtension } from './plain/types'
import type { ISelectionExtension } from './selection/types'
import type { IExtension } from './types'
import type { IPreparationExtension } from './preparation/types'

/** Pending acceptance of prepared assemblies is an optional collection capability. */
function isPreparation<TItem extends object>(
	extension: IExtension<TItem>,
): extension is IPreparationExtension<TItem> {
	return 'prepare' in extension
}

/** Pending acceptance of prepared assemblies, if an adapter installed it. */
export function preparationOf<TItem extends object>(
	source: TNeighbours<TItem> | null | undefined,
): IPreparationExtension<TItem> | undefined {
	const extension = source?.extensions.preparation

	return extension && isPreparation(extension) ? extension : undefined
}

/**
 * Соседи по коллекции — по контракту, а не приведением типа.
 *
 * Контекст расширения знает соседей только как `IExtension`, а движок,
 * пришедший к плагину или расширению адаптера, — как `TCollectionEngine<any,
 * any>`. Поэтому соседа узнают проверкой его контракта: так расширения не
 * замыкают друг на друга циклом модулей, а снаружи нечего приводить.
 *
 * Охранник называется `<имя расширения>Of` и проверяет члены, которых нет у
 * соседей с похожим API: `update` и `clear` есть и у `batch`, `toggle` — и у
 * выбора, и у активации. Соседей, которые есть только у коллекции
 * компонента, находят охранники из её `guards.ts` — с тем же правилом имени,
 * без компонента: чей охранник, говорит путь импорта. Одноимённые охранники
 * разных коллекций в одном файле различает алиас в импорте:
 * `import { selectionOf as calendarSelectionOf } from '…/calendar/…/guards'`.
 */

/** Где искать соседа: контекст расширения или сам движок. */
export type TNeighbours<TItem extends object> = {
	readonly extensions: Readonly<Record<string, IExtension<TItem> | undefined>>
}

function isActivation<TItem extends object>(
	ext: IExtension<TItem>,
): ext is IActivationExtension<TItem> {
	return 'activeItem' in ext && 'isActive' in ext && 'findActivatable' in ext
}

function isBatch<TItem extends object>(ext: IExtension<TItem>): ext is IBatchExtension<TItem> {
	return 'shown' in ext && 'items' in ext && 'patch' in ext
}

function isDraw<TItem extends TDrawable>(ext: IExtension<TItem>): ext is IDrawExtension<TItem> {
	return 'drawn' in ext && 'pin' in ext && 'useStrategy' in ext && 'notifyViewport' in ext
}

function isFactory<TItem extends object>(ext: IExtension<TItem>): ext is IFactoryExtension<TItem> {
	return 'create' in ext && 'isSource' in ext
}

function isFilter<TItem extends object>(ext: IExtension<TItem>): ext is IFilterExtension<TItem> {
	return 'query' in ext && 'matches' in ext && 'predicate' in ext
}

function isGroup<TItem extends object>(ext: IExtension<TItem>): ext is IGroupExtension<TItem> {
	return 'sections' in ext && 'groups' in ext && 'groupBy' in ext && 'register' in ext
}

function isMeta<TItem extends object>(ext: IExtension<TItem>): ext is IMetaExtension<TItem> {
	return 'apply' in ext && 'get' in ext
}

function isPlain<TItem extends object>(ext: IExtension<TItem>): ext is IPlainExtension<TItem> {
	return 'insert' in ext && 'push' in ext && 'move' in ext
}

function isSelection<TItem extends object>(
	ext: IExtension<TItem>,
): ext is ISelectionExtension<TItem> {
	return 'isSelected' in ext && 'selectMany' in ext && 'deselectMany' in ext && 'multiple' in ext
}

/** Активация коллекции, если она есть: активный элемент — один. */
export function activationOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IActivationExtension<TItem> | undefined {
	const ext = neighbours?.extensions.activation

	return ext && isActivation(ext) ? ext : undefined
}

/** Состав коллекции, если он есть: его выборка — показанные элементы. */
export function batchOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IBatchExtension<TItem> | undefined {
	const ext = neighbours?.extensions.batch

	return ext && isBatch(ext) ? ext : undefined
}

/** Рисование коллекции, если оно есть: что рисовать из показанных и окно. */
export function drawOf<TItem extends TDrawable>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IDrawExtension<TItem> | undefined {
	const ext = neighbours?.extensions.draw

	return ext && isDraw(ext) ? ext : undefined
}

/**
 * Фабрика элементов коллекции, если она есть: она знает класс элемента, а с
 * ним — чей элемент. У движка, собранного без компонента (`createEngine`),
 * её нет, пока его не привязали к компоненту.
 */
export function factoryOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IFactoryExtension<TItem> | undefined {
	const ext = neighbours?.extensions.factory

	return ext && isFactory(ext) ? ext : undefined
}

/** Отбор коллекции, если он есть: строка поиска и правило отбора. */
export function filterOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IFilterExtension<TItem> | undefined {
	const ext = neighbours?.extensions.filter

	return ext && isFilter(ext) ? ext : undefined
}

/** Группировка коллекции, если она есть: показанное по группам и его секции. */
export function groupOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IGroupExtension<TItem> | undefined {
	const ext = neighbours?.extensions.group

	return ext && isGroup(ext) ? ext : undefined
}

/**
 * Отметки элементов из данных (`_`), если они есть: события о них и снимок,
 * применённый к элементу раньше.
 */
export function metaOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IMetaExtension<TItem> | undefined {
	const ext = neighbours?.extensions.meta

	return ext && isMeta(ext) ? ext : undefined
}

/**
 * Базовые операции коллекции, если они есть: вставка, удаление, перемещение
 * по одному элементу и события хранилища.
 */
export function plainOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): IPlainExtension<TItem> | undefined {
	const ext = neighbours?.extensions.plain

	return ext && isPlain(ext) ? ext : undefined
}

/** Выбор коллекции, если он есть: выбранные элементы и режим. */
export function selectionOf<TItem extends object>(
	neighbours: TNeighbours<TItem> | null | undefined,
): ISelectionExtension<TItem> | undefined {
	const ext = neighbours?.extensions.selection

	return ext && isSelection(ext) ? ext : undefined
}
