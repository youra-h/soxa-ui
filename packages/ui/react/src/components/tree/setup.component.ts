import {
	TCollectionExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
} from '@soxa-ui/setup'
import { useAdapter, useAdapterContext, useCollectionAdapter } from '../../adapter'
import type { TreeProps } from './base.component'

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
