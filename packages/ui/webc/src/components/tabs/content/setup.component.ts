import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import type { ITabsContent, TTabsContentCollectionFacade } from '@soxa-ui/core'
import { joinBindings, useAdapter, useCollectionAdapter } from '../../../adapter'
import { createWebcPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupTabsContent(
	host: HTMLElement,
	ctrl: ITabsContent | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITabsContent, TTabsContentCollectionFacade> {
	const adapter = createWebcPreparedAdapterContext(host, TabsContentDescriptor(), { ctrl, props })

	const contentAdapter = createWebcPreparedAdapterContext(
		host,
		TabsCollectionContentDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TTabsContentBindingExtension, { adapter, elevator: createWebcElevator(host) })

	// Фасад первым, как у Vue: с принятым контекстом панель слышит `item:added` поздних табов
	const content = useCollectionAdapter(contentAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, content)
}
