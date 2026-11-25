import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import {
	createSolidAdapterContext,
	useAdapter,
	joinBindings,
	useCollectionAdapter,
	useElevator,
} from '../../../adapter'
import type { TagsItemProps } from './base.component'

export function setupTagsItem(props: TagsItemProps, create = createSolidAdapterContext) {
	const { elevator } = useElevator()
	const adapter = create(TagsItemDescriptor(), { ctrl: props.ctrl, props })

	const item = create(TagsCollectionItemDescriptor(), { props }, { bundle: adapter.bundle }).use(
		TCollectionItemExtension,
		{ adapter, elevator },
	)

	const itemBinding = useCollectionAdapter(item, props)
	const owner = useAdapter(adapter, props)

	return { ...joinBindings(owner, itemBinding), context: item.instance.context }
}
