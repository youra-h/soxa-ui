import { LIST_INDICATOR_ATTRIBUTE } from '@soxa-ui/core'
import type { TTreeItem, TTreeItemCollectionFacade } from '@soxa-ui/core'
import { DEFAULT_SLOT } from '@soxa-ui/setup'
import {
	bind,
	createDetail,
	lend,
	lendBefore,
	lendMark,
	ownerAttributes,
	patch,
} from '../../adapter'
import type { ITemplate } from '../../adapter'
import { TIconElement, type TIconElementProps } from '../icon'
import { registerItemRowTag } from '../item-row'
import type { TItemRowElementProps } from '../item-row'

const Row = registerItemRowTag('div')
type TParts = {
	row: TItemRowElementProps<HTMLDivElement>
	toggle: HTMLElement
	selectionMark: HTMLElement
	selectionAnchor: Comment
	icon?: TIconElementProps
}
const parts = new WeakMap<HTMLElement, TParts>()

export const treeItemTemplate: ITemplate<TTreeItem, TTreeItemCollectionFacade> = {
	create: (root, { hasSlot }) => {
		const { ownerDocument } = root
		const row = createDetail(ownerDocument, Row, { embedded: 'tree.row' })
		row.classList.add('so-tree-item__row')
		const toggle = ownerDocument.createElement('span')
		toggle.setAttribute('aria-hidden', 'true')
		const selectionMark = ownerDocument.createElement('span')
		selectionMark.className = 'so-tree-item__selection-indicator'
		selectionMark.setAttribute('aria-hidden', 'true')

		if (!hasSlot('indicator-icon')) {
			const chevron = ownerDocument.createElement('span')
			chevron.className = 'so-tree-item__chevron'
			toggle.append(chevron)
		}

		lend(row, 'leading', toggle, 'start')
		const selectionAnchor = lendMark(row, 'leading')
		root.append(row)
		parts.set(root, { row, toggle, selectionMark, selectionAnchor })

		return {
			slots: {
				default: { mode: 'append', node: row, slot: DEFAULT_SLOT },
				icon: { mode: 'append', node: row, slot: 'leading' },
				'indicator-icon': { mode: 'append', node: toggle },
				group: { mode: 'append', node: root },
			},
		}
	},
	bindings: [
		bind(['dataset', 'selected', 'size'], ({ root, state }) => {
			const current = parts.get(root)
			if (!current) return

			const { row, selectionMark, selectionAnchor } = current
			const side = state.dataset?.[`data-${LIST_INDICATOR_ATTRIBUTE}`]
			if (side === 'start') {
				if (selectionAnchor.previousSibling !== selectionMark)
					lendBefore(selectionAnchor, selectionMark)
			} else if (side === 'end') {
				if (row.lastChild !== selectionMark) lend(row, 'trailing', selectionMark, 'end')
			} else {
				selectionMark.remove()
				return
			}

			if (!state.selected) {
				current.icon?.remove()
				return
			}

			const icon = (current.icon ??= createDetail(root.ownerDocument, TIconElement, {
				embedded: 'tree.selection-indicator',
			}))
			patch(icon, { icon: 'check', size: state.size })
			if (icon.parentNode !== selectionMark) selectionMark.append(icon)
		}),
		bind(['size', 'variant', 'dataset', 'aria', 'text'], ({ root, state, hasSlot }) => {
			const current = parts.get(root)

			if (!current) return

			const { row, toggle } = current
			const branch = state.aria?.['aria-expanded'] !== undefined
			toggle.className = branch ? 'so-tree-item__toggle' : 'so-tree-item__spacer'
			patch(row, { size: state.size, variant: state.variant })
			ownerAttributes(row, state.dataset)
			if (!hasSlot(DEFAULT_SLOT)) row.text = state.text ?? ''
		}),
	],
}
