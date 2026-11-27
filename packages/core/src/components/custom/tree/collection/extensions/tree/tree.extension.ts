import { batchOf, selectionOf, TBaseExtension } from '../../../../../base/collection'
import type { IExtensionContext, TQueryEvent } from '../../../../../base/collection'
import type { TValuePayload } from '../../../../../../common'
import { LIST_DEFAULTS, LIST_INDICATOR_ATTRIBUTE } from '../../../../list'
import type { TTreeItem } from '../../../item.class'
import type { TTree } from '../../../tree.class'
import type { ITreeNode, TTreeKey, TTreeLoadChildren } from '../../../types'
import { normalizeNodes } from './normalize'

export type TTreeExtensionEvents = {
	'change:expanded': (payload: TValuePayload<readonly TTreeKey[]>) => void
	'change:tabStop': (payload: TValuePayload<TTreeItem | undefined>) => void
	'change:loading': (item: TTreeItem, loading: boolean) => void
	'load:error': (item: TTreeItem, error: unknown) => void
}

type TIndex = {
	byValue: Map<TTreeKey, TTreeItem>
	children: Map<TTreeKey | null, TTreeItem[]>
}

/** One hierarchy over the collection's item identities, independent of mounted rows. */
export class TTreeExtension extends TBaseExtension<
	TTreeItem,
	TTreeExtensionEvents,
	{ owner: TTree }
> {
	readonly name = 'tree'

	private _expanded = new Set<TTreeKey>()
	private readonly _loading = new Map<TTreeItem, AbortController>()
	private _index: TIndex | undefined
	private _revision = -1
	private _current: TTreeItem | undefined
	private _tabStop: TTreeItem | undefined
	private _hasFocusHistory = false

	override install(ctx: IExtensionContext<TTreeItem, { owner: TTree }>): void {
		super.install(ctx)

		const batch = batchOf(ctx)

		if (!batch) throw new Error('Tree requires the batch extension')

		batch.trackBy = (item) => item.value
		ctx.driver.events.on('item:added', ({ item }) => this._inheritStyle(item))
		ctx.driver.events.on('item:updated', ({ item }) => this._inheritStyle(item))

		ctx.driver.events.on('item:removed', ({ item }) => {
			this.cancelLoad(item)
			if (item === this._current) {
				item.dataset.remove('highlighted')
				this._current = undefined
			}
		})
		ctx.driver.events.on('items:query:before', this._query)
		batch.events.on('change:shown', this._syncShown)

		const selection = selectionOf(ctx)

		selection?.events.on('change:selection', (_items, changed) => {
			for (const item of changed) this._syncSelected(item)
			if (!this._hasFocusHistory) this._syncTabStop()
		})
		selection?.events.on('change:mode', this._syncShown)

		ctx.options.watch('owner', (owner, scope) => {
			if (owner) {
				const syncStyle = () => {
					for (const item of ctx.driver.valueOf()) this._inheritStyle(item, owner)
				}

				scope.on(owner.events, 'change:size', syncStyle)
				scope.on(owner.events, 'change:variant', syncStyle)
				scope.on(owner.events, 'change:disabled', this._syncShown)
				scope.on(owner.events, 'change:indicator', this._syncShown)
				scope.on(owner.events, 'change:loadChildren', () => this.cancelLoads())
				syncStyle()
			}

			this.cancelLoads()
			this._syncShown()
		})
		ctx.driver.invalidateQuery()
	}

	get expanded(): readonly TTreeKey[] {
		return [...this._expanded]
	}

	set expanded(values: readonly TTreeKey[]) {
		const next = new Set(values)

		if (
			next.size === this._expanded.size &&
			values.every((value) => this._expanded.has(value))
		) {
			return
		}

		const oldValue = this.expanded
		this._expanded = next

		this._ctx.driver.invalidateQuery()
		this.events.emit('change:expanded', { oldValue, newValue: this.expanded })
	}

	isExpanded(item: TTreeItem): boolean {
		return this._expanded.has(item.value)
	}

	isBranch(item: TTreeItem): boolean {
		return item.hasChildren || this.childrenOf(item).length > 0
	}

	parentOf(item: TTreeItem): TTreeItem | undefined {
		const parent = item.parentValue

		return parent === null ? undefined : this._readIndex().byValue.get(parent)
	}

	childrenOf(item?: TTreeItem): readonly TTreeItem[] {
		return this._readIndex().children.get(item?.value ?? null) ?? []
	}

	/** Reconcile values without remounting unchanged nodes or disturbing selection. */
	setNodes(nodes: readonly ITreeNode[]): void {
		const sources = normalizeNodes(nodes)

		this.cancelLoads()

		batchOf(this._ctx)?.patch(sources)
	}

	/** Replace only this branch. A late result for a removed item is ignored. */
	setChildren(parent: TTreeItem, nodes: readonly ITreeNode[]): boolean {
		const index = this._readIndex()

		if (index.byValue.get(parent.value) !== parent) return false

		const replaceable = new Set<TTreeItem>()
		const stack = [...this.childrenOf(parent)]

		for (let item = stack.pop(); item; item = stack.pop()) {
			replaceable.add(item)
			for (const child of this.childrenOf(item)) stack.push(child)
		}

		const batch = batchOf(this._ctx)

		if (!batch) return false

		const preserved = batch.items.filter((item) => !replaceable.has(item))
		const known = new Set(preserved.map((item) => item.value))
		const sources = normalizeNodes(nodes, parent.value, known)

		// Complete a deferred branch even when the loader returns no children.
		batch.patch([
			...preserved.map((item) =>
				item === parent ? { value: parent.value, hasChildren: false } : item,
			),
			...sources,
		])

		return true
	}

	isLoading(item: TTreeItem): boolean {
		return this._loading.has(item)
	}

	/**
	 * A collapsed branch can finish loading for the next visit. A removed
	 * branch or a replacement of the input invalidates the request.
	 */
	async loadChildren(item: TTreeItem, load: TTreeLoadChildren): Promise<void> {
		if (
			!item.hasChildren ||
			this.childrenOf(item).length ||
			this.isLoading(item) ||
			this._readIndex().byValue.get(item.value) !== item
		)
			return

		const request = new AbortController()

		this._loading.set(item, request)
		item.aria.add('aria-busy', 'true')
		item.dataset.add('loading', true)
		this.events.emit('change:loading', item, true)

		try {
			const children = await load({
				value: item.value,
				text: item.text,
				signal: request.signal,
			})

			if (!request.signal.aborted) this.setChildren(item, children)
		} catch (error) {
			if (!request.signal.aborted) this.events.emit('load:error', item, error)
		} finally {
			if (this._loading.get(item) === request) {
				this._loading.delete(item)
				item.aria.add('aria-busy', null)
				item.dataset.add('loading', false)
				this.events.emit('change:loading', item, false)
			}
		}
	}

	cancelLoad(item: TTreeItem): void {
		const request = this._loading.get(item)

		if (!request) return

		this._loading.delete(item)
		request.abort()
		item.aria.add('aria-busy', null)
		item.dataset.add('loading', false)
		this.events.emit('change:loading', item, false)
	}

	cancelLoads(): void {
		for (const item of this._loading.keys()) this.cancelLoad(item)
	}

	/** Activate the row according to the selection mode. Return true on disclosure. */
	activate(item: TTreeItem): boolean {
		if (!this.isNavigable(item)) return false

		if (this._current !== item) {
			this._current?.dataset.remove('highlighted')
			this._current = item
			this._syncCurrent()
		}

		return !this.choose(item) && this.toggle(item)
	}

	toggle(item: TTreeItem): boolean {
		if (!this.isNavigable(item) || !this.isBranch(item)) return false

		this.expanded = this.isExpanded(item)
			? this.expanded.filter((value) => value !== item.value)
			: [...this.expanded, item.value]

		return true
	}

	choose(item: TTreeItem): boolean {
		const selection = selectionOf(this._ctx)

		if (!selection || selection.mode === 'none' || !this.isNavigable(item)) return false

		selection.toggle(item)

		return true
	}

	get tabStop(): TTreeItem | undefined {
		return this._tabStop
	}

	isNavigable(item: TTreeItem): boolean {
		return (
			!this._ctx.options.get('owner')?.disabled &&
			!item.disabled &&
			item.rendered &&
			item.visible
		)
	}

	focus(item: TTreeItem): boolean {
		if (!this.isNavigable(item) || !batchOf(this._ctx)?.shown.includes(item)) return false

		this._hasFocusHistory = true
		this._setTabStop(item)

		return true
	}

	private _setTabStop(item: TTreeItem | undefined): void {
		const oldValue = this._tabStop

		if (oldValue !== item) {
			oldValue?.aria.add('tabindex', '-1')
			this._tabStop = item
		}

		item?.aria.add('tabindex', '0')
		this._ctx.options.get('owner')?.aria.add('tabindex', item ? null : '0')

		if (oldValue !== item) this.events.emit('change:tabStop', { oldValue, newValue: item })
	}

	private _inheritStyle(item: Partial<TTreeItem>, owner = this._ctx.options.get('owner')): void {
		if (!owner) return

		item.size = owner.size
		item.variant = owner.variant
	}

	private _syncCurrent(): void {
		const current = selectionOf(this._ctx)?.mode === 'none'
		this._current?.dataset.add('highlighted', current ? true : null)
	}

	private _syncSelected(item: TTreeItem): void {
		const selection = selectionOf(this._ctx)

		item.aria.add(
			'aria-selected',
			selection?.mode === 'none' ? null : String(selection?.isSelected(item) ?? false),
		)
	}

	private readonly _syncShown = (): void => {
		const shown = batchOf(this._ctx)?.shown ?? []
		const owner = this._ctx.options.get('owner')
		const selection = selectionOf(this._ctx)
		const indicator =
			selection?.mode === 'none'
				? LIST_DEFAULTS.indicator
				: (owner?.indicator ?? LIST_DEFAULTS.indicator)
		const levels = new Map<TTreeItem, number>()
		const siblingCounts = new Map<TTreeKey | null, number>()
		const positions = new Map<TTreeKey | null, number>()

		for (const item of shown) {
			const parent = item.parentValue
			siblingCounts.set(parent, (siblingCounts.get(parent) ?? 0) + 1)
		}

		for (const item of shown) {
			const parent = this.parentOf(item)
			const level = (parent ? (levels.get(parent) ?? 0) : 0) + 1
			const position = (positions.get(item.parentValue) ?? 0) + 1
			const branch = this.isBranch(item)
			const expanded = branch && this.isExpanded(item)

			levels.set(item, level)
			positions.set(item.parentValue, position)

			item.aria.add('aria-level', String(level))
			item.aria.add('aria-posinset', String(position))
			item.aria.add('aria-setsize', String(siblingCounts.get(item.parentValue)))
			item.aria.add('aria-expanded', branch ? String(expanded) : null)
			item.dataset.add('branch', branch)
			item.dataset.add('expanded', expanded)
			item.dataset.add(LIST_INDICATOR_ATTRIBUTE, indicator)
			if (item !== this._tabStop) item.aria.add('tabindex', '-1')
			this._syncSelected(item)
		}

		owner?.aria.add('aria-multiselectable', selection?.multiple ? 'true' : null)

		this._syncCurrent()
		this._syncTabStop(shown)
	}

	private _syncTabStop(shown = batchOf(this._ctx)?.shown ?? []): void {
		const selection = selectionOf(this._ctx)
		const visible = new Set(shown)
		let stop = this._hasFocusHistory
			? this._tabStop
			: shown.find((item) => this.isNavigable(item) && selection?.isSelected(item))

		// Collapsing a branch returns focus to the closest visible ancestor.
		while (stop && (!visible.has(stop) || !this.isNavigable(stop))) stop = this.parentOf(stop)

		this._setTabStop(stop ?? shown.find((item) => this.isNavigable(item)))
	}

	/** This traversal is shared by keyboard navigation and the draw extension. */
	private readonly _query = (event: TQueryEvent<TTreeItem>): void => {
		const { children } = this._readIndex()
		const stack = [...(children.get(null) ?? [])].reverse()
		const shown: TTreeItem[] = []

		for (let item = stack.pop(); item; item = stack.pop()) {
			if (!item.rendered || !item.visible) continue

			shown.push(item)

			if (!this.isExpanded(item)) continue

			const nested = children.get(item.value) ?? []

			for (let index = nested.length - 1; index >= 0; index--) stack.push(nested[index])
		}

		event.items = shown
	}

	private _readIndex(): TIndex {
		const { driver } = this._ctx

		if (this._index && this._revision === driver.revision) return this._index

		const byValue = new Map<TTreeKey, TTreeItem>()
		const children = new Map<TTreeKey | null, TTreeItem[]>()

		for (const item of driver.valueOf()) {
			byValue.set(item.value, item)

			let siblings = children.get(item.parentValue)
			if (!siblings) {
				siblings = []
				children.set(item.parentValue, siblings)
			}

			siblings.push(item)
		}

		// Track-by patches preserve storage positions. Presentation follows source sibling order.
		for (const siblings of children.values()) {
			siblings.sort((a, b) => a.siblingOrder - b.siblingOrder)
		}

		this._revision = driver.revision
		return (this._index = { byValue, children })
	}
}
