import { TreeCollectionDescriptor, TreeDescriptor } from '@soxa-ui/setup'
import type { TTree } from '@soxa-ui/core'
import { useEmits, useProps } from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'

export type TreeProps = UseProps<typeof TreeDescriptor, TTree>

export default {
	name: 'BaseTree',
	emits: [...useEmits(TreeDescriptor()), ...useEmits(TreeCollectionDescriptor())] as TEmits,
	props: {
		...(useProps(TreeDescriptor()) as TProps),
		...(useProps(TreeCollectionDescriptor()) as TProps),
	},
}
