import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../../adapter'
import type { TreeItemProps } from './base.component'

export function useSetupTreeItem(props: Pick<TreeItemProps, 'ctrl'>) {
	const {
		contexts: [adapter, item],
	} = useAdapterContext((create, elevator) => {
		const adapter = create(TreeItemDescriptor(), { ctrl: props.ctrl, props })
		const item = create(
			TreeItemCollectionDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator })

		return [adapter, item] as const
	})

	return useCollectionAdapter(useAdapter(adapter, props), item, props)
}
