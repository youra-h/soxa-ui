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
	create = createAngularAdapterContext,
): TBinding<ITags, TTagsCollectionFacade> {
	const adapter = create(TagsDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)

	const collectionAdapter = create(
		TagsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: engine } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(collectionAdapter))
}
