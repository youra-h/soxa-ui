import { TreeItemCollectionDescriptor, TreeItemDescriptor } from '@soxa-ui/setup'
import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'

export type TreeItemProps = UseProps<typeof TreeItemDescriptor, TTreeItem> & {
	entry: TTreeRenderItem
}

export default {
	name: 'BaseTreeItem',
	emits: [
		...useEmits(TreeItemDescriptor()),
		...useEmits(TreeItemCollectionDescriptor()),
	] as TEmits,
	props: {
		...(useProps(TreeItemDescriptor()) as TProps),
		...(useProps(TreeItemCollectionDescriptor()) as TProps),
		entry: { type: Object, required: true as const },
	},
}
