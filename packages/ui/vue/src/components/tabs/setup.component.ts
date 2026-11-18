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
		const adapter = createVueAdapterContext(TabsDescriptor(), { ctrl: props.ctrl, props })

		const collectionAdapter = createVueAdapterContext(
			TabsCollectionDescriptor(),
			{
				props,
				// Готовая коллекция снаружи. Дали — фасад работает на ней и своей
				// не создаёт, лишь доложит недостающие расширения в неё же.
				// Не дали — соберёт свою. Развилка в `completeEngine`
				options: { owner: adapter.instance, engine: props.engine },
			},
			{ bundle: adapter.bundle },
		)
			.use(TCollectionExtension, { elevator: VueElevatorFactory })
			.use(TDragAndDropCollectionExtension, { elevator: VueElevatorFactory })

		const refsCollection = useCollectionAdapter(collectionAdapter, props, emit)
		const refs = useAdapter(adapter, props, emit)

		return extendBinding(joinBindings(refs, refsCollection), useSplitAttrs())
	},
}
