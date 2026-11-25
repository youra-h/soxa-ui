import {
	TCollectionItemExtension,
	TagsCollectionItemDescriptor,
	TagsItemDescriptor,
} from '@soxa-ui/setup'
import type { ITagsItem, TTagsItemCollectionFacade } from '@soxa-ui/core'
import { joinBindings, useAdapter, useCollectionAdapter } from '../../../adapter'
import { createWebcPreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { TBinding, TUpdateListener } from '../../../adapter'
import { createWebcElevator } from '../../../adapter/elevator'

export function setupTagsItem(
	host: HTMLElement,
	ctrl: ITagsItem | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITagsItem, TTagsItemCollectionFacade> {
	const adapter = createWebcPreparedAdapterContext(host, TagsItemDescriptor(), { ctrl, props })

	const itemAdapter = createWebcPreparedAdapterContext(
		host,
		TagsCollectionItemDescriptor(),
		{ props },
		{ bundle: adapter.bundle },
	).use(TCollectionItemExtension, { adapter, elevator: createWebcElevator(host) })

	// Фасад — первым: в коллекцию тег входит, когда его контекст принят
	const item = useCollectionAdapter(itemAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, item)
}
