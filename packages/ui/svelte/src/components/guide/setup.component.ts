import { GuideDescriptor } from '@soxa-ui/setup'
import { createSvelteAdapterContext, useAdapter, type TRootReceiver } from '../../adapter'
import type { GuideProps } from './base.component'

export function setupGuide(getProps: () => GuideProps, mountId: string, receive: TRootReceiver) {
	const adapter = createSvelteAdapterContext(GuideDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	})

	return useAdapter(adapter, getProps, receive)
}
