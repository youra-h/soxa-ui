import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '@soxa-ui/setup'
import type { ITabs, TTabsCollectionFacade } from '@soxa-ui/core'
import { joinBindings, useAdapter, useCollectionAdapter } from '../../adapter'
import { createWebcPreparedAdapterContext } from '../../adapter/common/collection-preparation'
import type { TBinding, TUpdateListener } from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupTabs(
	host: HTMLElement,
	ctrl: ITabs | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITabs, TTabsCollectionFacade> {
	const adapter = createWebcPreparedAdapterContext(host, TabsDescriptor(), { ctrl, props })
	const elevator = createWebcElevator(host)

	const collectionAdapter = createWebcPreparedAdapterContext(
		host,
		TabsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props['engine'] } },
		{ bundle: adapter.bundle },
	)
		.use(TCollectionExtension, { elevator })
		.use(TDragAndDropCollectionExtension, { elevator })

	const facade = useCollectionAdapter(collectionAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, facade)
}
