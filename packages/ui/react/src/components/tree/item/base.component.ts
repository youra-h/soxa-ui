import type { ReactNode } from 'react'
import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
import type { TreeProps } from '../base.component'

export type TreeItemProps = {
	ctrl: TTreeItem
	entry: TTreeRenderItem
	slots: Pick<TreeProps, 'item' | 'item-icon' | 'item-indicator-icon'>
	children?: ReactNode
}
