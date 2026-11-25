import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import type { ITabsContent, TTabsContentCollectionFacade } from '@soxa-ui/core'
import {
	AngularElevatorFactory,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import { createAngularPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TBinding } from '../../../adapter'

/** Панель таба: свой таб по `value` находит лифтом `TTabsContentBindingExtension`. */
export function setupTabsContent(
	ctrl: ITabsContent | undefined,
	props: object,
): TBinding<ITabsContent, TTabsContentCollectionFacade> {
	const adapter = createAngularPreparedAdapterContext(TabsContentDescriptor(), { ctrl, props })

	const content = createAngularPreparedAdapterContext(
		TabsCollectionContentDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator: AngularElevatorFactory })

	const facade = useCollectionAdapter(content)
	const owner = useAdapter(adapter)
	return joinBindings(owner, facade)
}
