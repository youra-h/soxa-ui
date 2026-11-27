import { TTreeExtension } from '@soxa-ui/core'
import type {
	TCollectionEngine,
	TTree,
	TTreeCollection,
	TTreeItem,
	TValuePayload,
} from '@soxa-ui/core'
import { TBasePlugin } from '../../base'
import type { IPluginContext, TPluginEvents } from '../../base'
import type { IDomEventTarget } from '../../utils'
import { isFocusableElement } from '../../utils'
import { TCollectionBundlesPlugin, TCollectionElements } from '../collection'
import { TElementPlugin } from '../element'
import { TTypeahead, itemText } from '../list/typeahead'

const ROW = '.so-tree-item__row'
const DISCLOSURE = '.so-tree-item__toggle'
const PIN = 'tree-tabstop'

/** The root is a fallback tab stop while no enabled node can receive focus. */
export function treeFocusTarget(root: Element): Element {
	for (const node of root.querySelectorAll('.so-tree-item[tabindex="0"]')) {
		if (node.closest('.so-tree') === root) return node
	}

	return root
}

/** Delegates DOM input to the Tree extension and restores focus after layout changes. */
export class TTreeKeyboardPlugin extends TBasePlugin<TTree, TPluginEvents> {
	private _root: Element | undefined
	private _owner: TTree | undefined
	private _elements: TCollectionElements | undefined
	private _engine: TTreeCollection | undefined
	private _cancelFocus: (() => void) | undefined
	private readonly _typeahead = new TTypeahead()

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		this._owner = ctx.getInstance<TTree>() ?? undefined
		this._elements = ctx.get(TCollectionElements)

		const element = ctx.get(TElementPlugin)
		element?.events.on('ready', (root) => this._attach(root))
		element?.events.on('removed', () => this._detach())

		ctx.get(TCollectionBundlesPlugin)?.events.on('engine:bound', (engine) => this._bind(engine))
	}

	override destroy(): void {
		this._detach()
		this._bind()

		super.destroy()
	}

	private _bind(engine?: TCollectionEngine<any, any>): void {
		const previous = this._engine?.extensions
		previous?.tree.events.off('change:tabStop', this._onTabStop)
		previous?.tree.events.off('change:expanded', this._onExpanded)
		previous?.plain.events.off('change:items', this._onItems)
		previous?.draw.pin(PIN, undefined)

		this._engine = engine?.extensions.tree instanceof TTreeExtension ? engine : undefined

		// Pin the tab stop so it stays mounted as the virtual window moves.
		const next = this._engine?.extensions
		next?.tree.events.on('change:tabStop', this._onTabStop)
		next?.tree.events.on('change:expanded', this._onExpanded)
		next?.plain.events.on('change:items', this._onItems)
		next?.draw.pin(PIN, next.tree.tabStop)

		this._loadOpened()
	}

	private _attach(root: Element): void {
		this._detach()
		this._root = root

		const target: IDomEventTarget = root
		target.addEventListener('keydown', this._onKey)
		target.addEventListener('click', this._onClick)
		target.addEventListener('focusin', this._onFocus)

		this._loadOpened()
	}

	private _detach(): void {
		const root: IDomEventTarget | undefined = this._root
		root?.removeEventListener('keydown', this._onKey)
		root?.removeEventListener('click', this._onClick)
		root?.removeEventListener('focusin', this._onFocus)

		this._cancelFocus?.()
		this._cancelFocus = undefined
		this._root = undefined
		this._typeahead.reset()
	}

	/** Defer lazy loading until the tree root exists, including for initially open branches. */
	private _loadOpened(previous: readonly (string | number)[] = []): void {
		const extensions = this._engine?.extensions
		const load = this._owner?.loadChildren

		if (!this._root || !extensions || !load) return

		const known = new Set(previous)

		for (const item of extensions.batch.shown) {
			if (extensions.tree.isExpanded(item) && !known.has(item.value)) {
				void extensions.tree.loadChildren(item, load)
			}
		}
	}

	private readonly _onItems = (): void => {
		this._loadOpened()
	}

	private readonly _onExpanded = ({
		oldValue,
	}: TValuePayload<readonly (string | number)[]>): void => {
		this._loadOpened(oldValue)
	}

	private readonly _onTabStop = ({
		oldValue,
		newValue,
	}: TValuePayload<TTreeItem | undefined>): void => {
		this._engine?.extensions.draw.pin(PIN, newValue)

		// Move DOM focus only if the item that held it has become unavailable.
		const focused = oldValue && this._elements?.getElementByItem(oldValue)

		if (
			oldValue &&
			focused &&
			this._root?.ownerDocument.activeElement === focused &&
			(!this._engine?.extensions.batch.shown.includes(oldValue) ||
				!this._engine.extensions.tree.isNavigable(oldValue))
		) {
			this._focus(newValue)
		}
	}

	private _focus(item: TTreeItem | undefined): void {
		this._cancelFocus?.()
		this._cancelFocus = undefined

		if (!item) {
			if (isFocusableElement(this._root)) this._root.focus({ preventScroll: true })

			return
		}

		if (!this._engine?.extensions.tree.focus(item)) return

		const target = () => {
			const element = this._elements?.getElementByItem(item)

			if (!isFocusableElement(element)) return false

			element.focus({ preventScroll: true })
			element.querySelector(ROW)?.scrollIntoView?.({ block: 'nearest' })

			return true
		}

		// A newly pinned item may mount on the next adapter update.
		if (!target()) this._cancelFocus = this._elements?.waitFor(target)
	}

	/** Resolve an event against the nearest Tree, including Trees mounted inside slots. */
	private _itemOf(target: EventTarget | null): TTreeItem | undefined {
		if (!(target instanceof Element) || target.closest('.so-tree') !== this._root) return

		const node = target.closest('.so-tree-item')
		const uid = node && this._elements?.getUidByElement(node)

		return this._engine?.extensions.batch.shown.find((item) => item.uid === uid)
	}

	private readonly _onFocus = (event: FocusEvent): void => {
		const item = this._itemOf(event.target)

		if (item) this._engine?.extensions.tree.focus(item)
	}

	private readonly _onClick = (event: MouseEvent): void => {
		const extensions = this._engine?.extensions
		const item = this._itemOf(event.target)
		const target = event.target

		if (!extensions || !item || !(target instanceof Element) || !target.closest(ROW)) return

		const { tree, selection } = extensions
		if (!tree.isNavigable(item)) {
			event.preventDefault()

			return
		}

		if (event.defaultPrevented || target.closest('button, input, select, textarea')) return

		this._focus(item)

		// In selection modes the disclosure control changes only expansion.
		const disclosure = selection.mode !== 'none' && target.closest(DISCLOSURE)
		if (disclosure ? tree.toggle(item) : tree.activate(item)) event.preventDefault()
	}

	/** Handle navigation on the treeitem root so embedded controls keep their own keys. */
	private readonly _onKey = (event: KeyboardEvent): void => {
		const extensions = this._engine?.extensions
		const item = this._itemOf(event.target)
		const root = this._root

		if (
			!extensions ||
			!item ||
			!root ||
			event.defaultPrevented ||
			event.isComposing ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.target !== this._elements?.getElementByItem(item)
		)
			return

		const { tree, batch } = extensions
		const items = batch.shown.filter((node) => tree.isNavigable(node))
		const index = items.indexOf(item)

		if (index === -1) return

		const rtl = getComputedStyle(root).direction === 'rtl'
		const expand = rtl ? 'ArrowLeft' : 'ArrowRight'
		const collapse = rtl ? 'ArrowRight' : 'ArrowLeft'
		let next: TTreeItem | null | undefined

		switch (event.key) {
			case 'ArrowDown':
				next = items[index + 1]
				break
			case 'ArrowUp':
				next = items[index - 1]
				break
			case 'Home':
				next = items[0]
				break
			case 'End':
				next = items.at(-1)
				break
			case expand:
				if (tree.isBranch(item) && !tree.isExpanded(item)) tree.toggle(item)
				else if (tree.isExpanded(item)) {
					next = tree.childrenOf(item).find((node) => tree.isNavigable(node))
					const load = this._owner?.loadChildren
					if (!next && load) void tree.loadChildren(item, load)
				}
				break
			case collapse:
				if (tree.isBranch(item) && tree.isExpanded(item)) tree.toggle(item)
				else next = tree.parentOf(item)
				break
			case 'Enter':
				if (item.href && !tree.isBranch(item)) return
				tree.activate(item)
				break
			case ' ':
				if (this._typeahead.typing())
					next = this._typeahead.next(' ', items, item, itemText)
				else tree.choose(item)
				break
			default:
				if ([...event.key].length !== 1) return
				next = this._typeahead.next(event.key, items, item, itemText)
		}

		event.preventDefault()
		if (next) this._focus(next)
	}
}
