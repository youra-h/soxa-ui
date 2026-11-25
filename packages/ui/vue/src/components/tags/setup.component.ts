import { TCollectionExtension, TagsDescriptor, TagsCollectionDescriptor } from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	useAdapter,
	joinBindings,
	useExpose,
	useCollectionAdapter,
	VueElevatorFactory,
	type SetupContext,
} from '../../adapter'
import BaseTags, { type TagsProps } from './base.component'

export function setupTags(
	props: TagsProps,
	{ emit }: SetupContext,
	create = createVueAdapterContext,
) {
	const adapter = create(TagsDescriptor(), { ctrl: props.ctrl, props })

	const collectionAdapter = create(
		TagsCollectionDescriptor(),
		{
			props,
			// An external engine keeps its identity and gains any missing extensions.
			options: { owner: adapter.instance, engine: props.engine },
		},
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator: VueElevatorFactory })

	const refsCollection = useCollectionAdapter(collectionAdapter, props, emit)
	const refs = useAdapter(adapter, props, emit)

	return joinBindings(refs, refsCollection)
}

export default {
	name: '_Tags',
	extends: BaseTags,
	expose: useExpose(),
	setup: setupTags,
}
