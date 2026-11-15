import { collectionInitialInputs } from '@soxa-ui/setup'
import { resolveCollectionInitialItem } from '@soxa-ui/setup'
import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import type { ITagsItem, TTagsItemCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../../adapter'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupTagsItem(
	host: HTMLElement,
	ctrl: ITagsItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITagsItem, TTagsItemCollectionFacade> {
	const adapter = createWebcAdapterContext(
		host,
		TagsItemDescriptor(),
		resolveCollectionInitialItem(
			TagsItemDescriptor(),
			{ ctrl, props },
			createWebcElevator(host),
		),
	)

	const itemAdapter = createWebcAdapterContext(
		host,
		TagsCollectionItemDescriptor(),
		{ props: collectionInitialInputs(adapter, props) },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: createWebcElevator(host) })

	// Фасад — первым: в коллекцию тег входит, когда его контекст принят
	const item = useCollectionAdapter(itemAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, item)
}
