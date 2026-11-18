import {
	TCollectionItemExtension,
	TabsCollectionItemDescriptor,
	TabsItemDescriptor,
} from '@soxa-ui/setup'
import type { ITabsItem, TTabsItemCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding } from '../../../adapter'

/** Таб: свой контекст и фасада; в коллекцию входит, когда контекст фасада принят (`ngOnInit`). */
export function setupTabsItem(
	ctrl: ITabsItem | undefined,
	props: object,
): TBinding<ITabsItem, TTabsItemCollectionFacade> {
	const adapter = createAngularAdapterContext(TabsItemDescriptor(), { ctrl, props })
	const owner = useAdapter(adapter)

	const item = createAngularAdapterContext(
		TabsCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: AngularElevatorFactory })

	return joinBindings(owner, useCollectionAdapter(item))
}
