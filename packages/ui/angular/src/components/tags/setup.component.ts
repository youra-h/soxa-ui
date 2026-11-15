import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import type { ITags, ITagsProps, TTagsCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding } from '../../adapter'

/** Tags: движок и регистратор лифт опускает в слой набора; `engine` — готовая коллекция. */
export function setupTags(
	ctrl: ITags | undefined,
	props: object,
	engine: ITagsProps['engine'],
): TBinding<ITags, TTagsCollectionFacade> {
	const source = useCollectionInitial(props)
	const adapter = createAngularAdapterContext(
		TagsDescriptor(),
		collectionInitialOwnerOptions(TagsDescriptor(), { ctrl, props }, source),
	)
	const owner = useAdapter(adapter)

	const collectionAdapter = createAngularAdapterContext(
		TagsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: source?.engine ?? engine } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator: AngularElevatorFactory })
		.use(TCollectionInitialExtension, { source, elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(collectionAdapter))
}
