import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import type { ITagsItem, TTagsItemCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding } from '../../../adapter'

/** Тег: свой контекст и фасада; в коллекцию входит, когда контекст фасада принят (`ngOnInit`). */
export function setupTagsItem(
	ctrl: ITagsItem | undefined,
	props: object,
): TBinding<ITagsItem, TTagsItemCollectionFacade> {
	const adapter = createAngularAdapterContext(
		TagsItemDescriptor(),
		resolveCollectionInitialItem(TagsItemDescriptor(), { ctrl, props }, AngularElevatorFactory),
	)
	const owner = useAdapter(adapter)

	const item = createAngularAdapterContext(
		TagsCollectionItemDescriptor(),
		{ props: collectionInitialInputs(adapter, props) },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(item))
}
