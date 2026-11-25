import {
	TCollectionItemExtension,
	TabsCollectionItemDescriptor,
	TabsItemDescriptor,
} from '@soxa-ui/setup'
import type { ITabsItem, TTabsItemCollectionFacade } from '@soxa-ui/core'
import { joinBindings, useAdapter, useCollectionAdapter } from '../../../adapter'
import { createWebcPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupTabsItem(
	host: HTMLElement,
	ctrl: ITabsItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITabsItem, TTabsItemCollectionFacade> {
	const adapter = createWebcPreparedAdapterContext(host, TabsItemDescriptor(), { ctrl, props })

	const itemAdapter = createWebcPreparedAdapterContext(
		host,
		TabsCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: createWebcElevator(host) })

	// Фасад первым, как у Vue: в коллекцию таб входит, когда его контекст принят
	const item = useCollectionAdapter(itemAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, item)
}
