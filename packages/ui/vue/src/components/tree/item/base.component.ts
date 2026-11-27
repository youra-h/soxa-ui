import type { PropType } from 'vue'
import { TreeItemCollectionDescriptor, TreeItemDescriptor } from '@soxa-ui/setup'
import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'

export type TreeItemProps = UseProps<typeof TreeItemDescriptor, TTreeItem> & {
	entry: TTreeRenderItem
}
export type TreeItemIconScope = {
	item: TTreeItem
	branch: boolean
	expanded: boolean
	loading: boolean
}
export type TreeItemScope = TreeItemIconScope & { text: string; selected: boolean }

export default {
	name: 'BaseTreeItem',
	emits: [
		...useEmits(TreeItemDescriptor()),
		...useEmits(TreeItemCollectionDescriptor()),
	] as TEmits,
	props: {
		...(useProps(TreeItemDescriptor()) as TProps),
		...(useProps(TreeItemCollectionDescriptor()) as TProps),
		entry: { type: Object as PropType<TTreeRenderItem>, required: true as const },
	},
}
