import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import type { ITabs, ITabsProps, TTabsCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding } from '../../adapter'

/** Tabs: движок и регистратор лифт опускает в слой набора — их берут и табы, и панели. */
export function setupTabs(
	ctrl: ITabs | undefined,
	props: object,
	engine: ITabsProps['engine'],
): TBinding<ITabs, TTabsCollectionFacade> {
	const source = useCollectionInitial(props, '')
	const adapter = createAngularAdapterContext(
		TabsDescriptor(),
		collectionInitialOwnerOptions(TabsDescriptor(), { ctrl, props }, source),
	)
	const owner = useAdapter(adapter)

	const collectionAdapter = createAngularAdapterContext(
		TabsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: source?.engine ?? engine } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator: AngularElevatorFactory })
		.use(TCollectionInitialExtension, { source, elevator: AngularElevatorFactory })
		.use(TDragAndDropCollectionExtension, { elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(collectionAdapter))
}
