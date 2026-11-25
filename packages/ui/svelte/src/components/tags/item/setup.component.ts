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
	getCreate: () => typeof createSvelteAdapterContext | undefined,
) {
	const elevator = useElevator()
	const props = getProps()
	const create = getCreate() ?? createSvelteAdapterContext
	const adapter = create(TagsItemDescriptor(), {
		ctrl: props.ctrl,
		props,
		mountId,
	})

	const item = create(
		TagsCollectionItemDescriptor(),
		{ props, mountId },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator })

	const itemBinding = useCollectionAdapter(item, getProps)
	const owner = useAdapter(adapter, getProps, receive)

	return Object.assign(joinBindings(owner, itemBinding), { context: item.instance.context })
}
