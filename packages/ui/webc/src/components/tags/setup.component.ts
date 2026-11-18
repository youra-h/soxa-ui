import { TCollectionExtension, TagsCollectionDescriptor, TagsDescriptor } from '@soxa-ui/setup'
import type { ITags, TTagsCollectionFacade } from '@soxa-ui/core'
import {
	createWebcAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
} from '../../adapter'
import type { TBinding, TUpdateListener } from '../../adapter'
import { createWebcElevator } from '../../adapter/elevator'

export function setupTags(
	host: HTMLElement,
	ctrl: ITags | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<ITags, TTagsCollectionFacade> {
	const adapter = createWebcAdapterContext(host, TagsDescriptor(), { ctrl, props })

	const collectionAdapter = createWebcAdapterContext(
		host,
		TagsCollectionDescriptor(),
		{ props, options: { owner: adapter.instance, engine: props['engine'] } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator: createWebcElevator(host) })

	const facade = useCollectionAdapter(collectionAdapter, host, onUpdate)
	const owner = useAdapter(adapter, host, onUpdate)

	return joinBindings(owner, facade)
}
