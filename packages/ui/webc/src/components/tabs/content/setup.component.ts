import {
	TTabsContentBindingExtension,
	TabsCollectionContentDescriptor,
	TabsContentDescriptor,
} from '@soxa-ui/setup'
import type { ITabsContent, TTabsContentCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupTabsContent(
	host: HTMLElement,
	ctrl: ITabsContent | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITabsContent, TTabsContentCollectionFacade> {
	const adapter = createWebcAdapterContext(host, TabsContentDescriptor(), { ctrl, props })

	const contentAdapter = createWebcAdapterContext(
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
