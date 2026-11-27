import {
	TCollectionExtension,
	TVirtualCollectionExtension,
	TreeCollectionDescriptor,
	TreeDescriptor,
} from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useExpose,
	VueElevatorFactory,
	type SetupContext,
} from '../../adapter'
import BaseTree, { type TreeProps } from './base.component'

export default {
	name: '_Tree',
	inheritAttrs: false,
	extends: BaseTree,
	expose: useExpose(),
	setup(props: TreeProps, { emit }: SetupContext) {
		const owner = createVueAdapterContext(TreeDescriptor(), { ctrl: props.ctrl, props })
		const collectionAdapter = createVueAdapterContext(
			TreeCollectionDescriptor(),
			{ props, options: { owner: owner.instance, engine: props.engine } },
			{ bundle: owner.bundle },
		)
			.use(TCollectionExtension, { elevator: VueElevatorFactory })
			.use(TVirtualCollectionExtension, { elevator: VueElevatorFactory })

		const collectionBinding = useCollectionAdapter(collectionAdapter, props, emit)
		const ownerBinding = useAdapter(owner, props, emit)

		return joinBindings(ownerBinding, collectionBinding)
	},
}
