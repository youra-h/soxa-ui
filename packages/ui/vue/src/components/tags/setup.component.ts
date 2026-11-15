import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import { TCollectionExtension, TagsDescriptor, TagsCollectionDescriptor } from '@soxa-ui/setup'
import {
	useAdapter,
	joinBindings,
	useExpose,
	useCollectionAdapter,
	VueElevatorFactory,
	createVueAdapterContext,
	type SetupContext,
} from '../../adapter'
import BaseTags, { type TagsProps } from './base.component'

export default {
	name: '_Tags',
	extends: BaseTags,
	expose: useExpose(),
	setup(props: TagsProps, { emit }: SetupContext) {
		const source = useCollectionInitial(props)
		const adapter = createVueAdapterContext(
			TagsDescriptor(),
			collectionInitialOwnerOptions(TagsDescriptor(), { ctrl: props.ctrl, props }, source),
		)

		const collectionAdapter = createVueAdapterContext(
			TagsCollectionDescriptor(),
			{
				props,
				// Готовая коллекция снаружи. Дали — фасад работает на ней и своей
				// не создаёт, лишь доложит недостающие расширения в неё же.
				// Не дали — соберёт свою. Развилка в `completeEngine`
				options: { owner: adapter.instance, engine: source?.engine ?? props.engine },
			},
			{ bundle: adapter.bundle },
		)
			.use(TCollectionExtension, { elevator: VueElevatorFactory })
			.use(TCollectionInitialExtension, { source, elevator: VueElevatorFactory })

		const refsCollection = useCollectionAdapter(collectionAdapter, props, emit)
		const refs = useAdapter(adapter, props, emit)

		return joinBindings(refs, refsCollection)
	},
}
