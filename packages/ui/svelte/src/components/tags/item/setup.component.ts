import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSvelteAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useElevator,
	type TRootReceiver,
} from '../../../adapter'
import type { TagsItemProps } from './base.component'

export function setupTagsItem(
	getProps: () => TagsItemProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const elevator = useElevator()
	const props = getProps()
	const adapter = createSvelteAdapterContext(TagsItemDescriptor(), {
		...resolveCollectionInitialItem(
			TagsItemDescriptor(),
			{ ctrl: props.ctrl, props, mountId },
			elevator,
		),
		mountId,
	})

	const item = createSvelteAdapterContext(
		TagsCollectionItemDescriptor(),
		{ props: collectionInitialInputs(adapter, props), mountId },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return Object.assign(joinBindings(owner, itemBinding), { context: item.instance.context })
}
