import type { TTree, TTreeItem } from '@soxa-ui/core'
import type { TreeCollectionDescriptor, TreeDescriptor } from '@soxa-ui/setup'
import type { EventProps, TDomAttributes, UseDomProps } from '../../types'

export type TreeEventProps = EventProps<typeof TreeDescriptor> &
	EventProps<typeof TreeCollectionDescriptor>
export type TreeAttributes = TDomAttributes<typeof TreeDescriptor, TreeEventProps>
export type TreeProps = UseDomProps<typeof TreeDescriptor, TTree, TreeEventProps>

export type TreeIconScope = {
	item: TTreeItem
	branch: boolean
	expanded: boolean
	loading: boolean
}

export type TreeRowProps = {
	ctrl: TTreeItem
	entry: import('@soxa-ui/core').TTreeRenderItem
	slots: Pick<TreeProps, 'item' | 'item-icon' | 'item-indicator-icon'>
	children?: import('solid-js').JSX.Element
}
