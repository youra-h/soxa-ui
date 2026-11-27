import { TreeItemCollectionDescriptor, TreeItemDescriptor } from '@soxa-ui/setup'
import type { TTreeItem, TTreeItemCollectionFacade } from '@soxa-ui/core'
import { ElementBase, defineElement } from '../../adapter'
import type { TElementClassOf } from '../../adapter'
import { treeItemTemplate } from './tree-item.template'
import { setupTreeItem } from './setup.component'

function variant<T extends HTMLElement>(
	Native: new () => T,
): TElementClassOf<new () => T, typeof TreeItemDescriptor, TTreeItem, TTreeItemCollectionFacade> {
	return ElementBase(Native, {
		descriptor: TreeItemDescriptor,
		facade: TreeItemCollectionDescriptor,
		template: treeItemTemplate,
		root: { strategy: 'host', sets: ['attrs', 'aria', 'dataset'] },
		setup: setupTreeItem,
	})
}

type TreeItemElementClass<T extends HTMLElement> = TElementClassOf<
	new () => T,
	typeof TreeItemDescriptor,
	TTreeItem,
	TTreeItemCollectionFacade
>

export const TTreeItemElement: TreeItemElementClass<HTMLDivElement> = variant(HTMLDivElement)
export const TTreeLinkElement: TreeItemElementClass<HTMLAnchorElement> = variant(HTMLAnchorElement)

defineElement('so-tree-item', TTreeItemElement, 'div')
defineElement('so-tree-item-a', TTreeLinkElement, 'a')
