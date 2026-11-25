import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import type { ITags, TTagsCollectionFacade } from '@soxa-ui/core'
import { joinBindings, useAdapter, useCollectionAdapter } from '../../adapter'
import { createWebcPreparedAdapterContext } from '../../adapter/common/collection-preparation'
import type { TBinding, TUpdateListener } from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupTags(
	host: HTMLElement,
	ctrl: ITags | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITags, TTagsCollectionFacade> {
	const adapter = createWebcPreparedAdapterContext(host, TagsDescriptor(), { ctrl, props })

	const collectionAdapter = createWebcPreparedAdapterContext(
		host,
		TagsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props['engine'] } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator: createWebcElevator(host) })

	const facade = useCollectionAdapter(collectionAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, facade)
}
