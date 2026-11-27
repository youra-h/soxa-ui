import type { TTree, TTreeCollectionFacade, TTreeRenderEntry } from '@soxa-ui/core'
import { bind, createItem, lendSamples, ownerStyles, TKeyedLoop } from '../../adapter'
import type { ITemplate, ITemplateContext, TItemSlots } from '../../adapter'
import { TTreeItemElement, TTreeLinkElement } from './TreeItem.element'

export const TREE_ITEM_SLOTS: TItemSlots = {
	item: 'default',
	'item-icon': 'icon',
	'item-indicator-icon': 'indicator-icon',
}

type TRowsContext = Pick<ITemplateContext, 'root' | 'sample'>
type TLoop = TKeyedLoop<TTreeRenderEntry, string, HTMLElement>
type TGroup = { node: HTMLElement; loop: TLoop }
const groups = new WeakMap<HTMLElement, TGroup>()
const roots = new WeakMap<HTMLElement, TLoop>()

function linkOf(entry: TTreeRenderEntry): string | undefined {
	return entry.kind === 'item' && !entry.item.aria.has('aria-expanded')
		? entry.item.href
		: undefined
}

function makeLoop(parent: Node, end: Node | null): TLoop {
	return new TKeyedLoop(parent, end, (entry) => `${entry.key}:${linkOf(entry) ? 'a' : 'div'}`)
}

function renderEntries(loop: TLoop, entries: readonly TTreeRenderEntry[], ctx: TRowsContext): void {
	loop.draw(
		entries,
		(entry) => {
			const document = ctx.root.ownerDocument

			if (entry.kind === 'filler') {
				const filler = document.createElement('div')
				filler.className = 'so-tree__filler'
				filler.setAttribute('aria-hidden', 'true')
				ownerStyles(filler, entry.style)

				return filler
			}

			const link = linkOf(entry)
			const item = link
				? createItem(document, TTreeLinkElement)
				: createItem(document, TTreeItemElement)
			item.ctrl = entry.item

			const group = document.createElement('div')
			group.className = 'so-tree-item__group'
			group.setAttribute('role', 'group')
			group.setAttribute('slot', 'group')
			groups.set(item, { node: group, loop: makeLoop(group, null) })

			lendSamples(ctx, item, TREE_ITEM_SLOTS)
			item.append(group)
			updateEntry(item, entry, ctx)

			return item
		},
		(node, entry) => updateEntry(node, entry, ctx),
	)
}

function updateEntry(node: HTMLElement, entry: TTreeRenderEntry, ctx: TRowsContext): void {
	if (entry.kind === 'filler') {
		ownerStyles(node, entry.style)

		return
	}

	const link = linkOf(entry)
	if (link) node.setAttribute('href', link)

	node.toggleAttribute('data-window-ancestor', !entry.row)
	const group = groups.get(node)

	if (group) {
		group.node.hidden = entry.item.aria.get('aria-expanded') !== 'true'
		renderEntries(group.loop, entry.children, ctx)
	}
}

export const treeTemplate: ITemplate<TTree, TTreeCollectionFacade> = {
	create: (root) => {
		const end = root.ownerDocument.createComment('')
		root.append(end)
		roots.set(root, makeLoop(root, end))

		return {
			slots: {
				empty: { mode: 'before', node: end },
				item: { mode: 'sample' },
				'item-icon': { mode: 'sample' },
				'item-indicator-icon': { mode: 'sample' },
			},
		}
	},
	bindings: [
		bind('layout', (ctx) => {
			const loop = roots.get(ctx.root)
			const layout = ctx.state.layout ?? []

			if (loop) renderEntries(loop, layout, ctx)
			ctx.showSlot('empty', layout.length === 0)
		}),
	],
}
