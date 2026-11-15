import { collectionInitialOwnerOptions } from '@soxa-ui/setup'
import { TCollectionInitialExtension } from '@soxa-ui/setup'
import { useCollectionInitial } from '../../adapter'
import {
	TCollectionExtension,
	TDragAndDropCollectionExtension,
	TabsDescriptor,
	TabsCollectionDescriptor,
} from '@soxa-ui/setup'
import {
	useAdapter,
	extendBinding,
	joinBindings,
	useExpose,
	useCollectionAdapter,
	useSplitAttrs,
	VueElevatorFactory,
	createVueAdapterContext,
	type SetupContext,
} from '../../adapter'
import BaseTabs, { type TabsProps } from './base.component'

export default {
	name: '_Tabs',
	inheritAttrs: false,
	extends: BaseTabs,
	expose: useExpose(),
	setup(props: TabsProps, { emit }: SetupContext) {
		const source = useCollectionInitial(props, '')
		const adapter = createVueAdapterContext(
			TabsDescriptor(),
			collectionInitialOwnerOptions(TabsDescriptor(), { ctrl: props.ctrl, props }, source),
		)

		const collectionAdapter = createVueAdapterContext(
			TabsCollectionDescriptor(),
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
			.use(TDragAndDropCollectionExtension, { elevator: VueElevatorFactory })

		const refsCollection = useCollectionAdapter(collectionAdapter, props, emit)
		const refs = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(refs, refsCollection), useSplitAttrs())
	},
}
