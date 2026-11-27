import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
import type { Snippet } from 'svelte'
import type { TreeProps } from '../base.component'

export type TreeItemIconScope = {
	item: TTreeItem
	branch: boolean
	expanded: boolean
	loading: boolean
}

export type TreeItemProps = {
	ctrl: TTreeItem
	entry: TTreeRenderItem
	item?: TreeProps['item']
	icon?: TreeProps['item-icon']
	indicator?: TreeProps['item-indicator-icon']
	children?: Snippet
}
