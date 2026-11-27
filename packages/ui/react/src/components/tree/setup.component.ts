import {
	TCollectionExtension,
	TCollectionItemExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../adapter'
import type { TreeProps, TreeRowProps } from './base.component'

export function useSetupTree(props: TreeProps) {
	const {
		contexts: [adapter, collectionAdapter],
		layer,
	} = useAdapterContext((create, elevator) => {
		const adapter = create(TreeDescriptor(), { ctrl: props.ctrl, props })
		const collectionAdapter = create(
			TreeCollectionDescriptor(),
			{ props, options: { owner: adapter.instance, engine: props.engine } },
			{ bundle: adapter.bundle },
		)
			.use(TCollectionExtension, { elevator })
			.use(TVirtualCollectionExtension, { elevator })

		return [adapter, collectionAdapter] as const
	})

	return { ...useCollectionAdapter(useAdapter(adapter, props), collectionAdapter, props), layer }
}

export function useSetupTreeRow(props: Pick<TreeRowProps, 'ctrl'>) {
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
