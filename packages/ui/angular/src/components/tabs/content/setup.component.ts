import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialPanel } from '@soxa-ui/setup'
import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import type { ITabsContent, TTabsContentCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding } from '../../../adapter'

/** Панель таба: свой таб по `value` находит лифтом `TTabsContentBindingExtension`. */
export function setupTabsContent(
	ctrl: ITabsContent | undefined,
	props: object,
): TBinding<ITabsContent, TTabsContentCollectionFacade> {
	const adapter = createAngularAdapterContext(
		TabsContentDescriptor(),
		resolveCollectionInitialPanel(
			TabsContentDescriptor(),
			{ ctrl, props },
			AngularElevatorFactory,
		),
	)

	const content = createAngularAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props: collectionInitialInputs(adapter, props) },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator: AngularElevatorFactory })

	const facade = useCollectionAdapter(content)
	const owner = useAdapter(adapter)
	return joinBindings(owner, facade)
}
