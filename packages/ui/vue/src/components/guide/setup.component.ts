import { GuideDescriptor } from '@soxa-ui/setup'
import {
	createVueAdapterContext,
	exposeRoot,
	extendBinding,
	useAdapter,
	useExpose,
	type SetupContext,
} from '../../adapter'
import BaseGuide, { type GuideProps } from './base.component'

export default {
	name: '_Guide',
	extends: BaseGuide,
	expose: useExpose(),
	setup(props: GuideProps, { emit, expose }: SetupContext) {
		const adapter = createVueAdapterContext(GuideDescriptor(), { ctrl: props.ctrl, props })
		const binding = useAdapter(adapter, props, emit)

		exposeRoot(expose, binding.rootElement)

		return extendBinding(binding, { guide: adapter.instance })
	},
}
