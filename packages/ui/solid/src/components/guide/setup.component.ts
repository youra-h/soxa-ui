import { GuideDescriptor } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter } from '../../adapter'
import type { GuideProps } from './base.component'

export function setupGuide(props: GuideProps) {
	const adapter = createSolidAdapterContext(GuideDescriptor(), { ctrl: props.ctrl, props })

	return useAdapter(adapter, props)
}
