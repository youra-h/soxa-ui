import { FileUploadDescriptor } from '@soxa-ui/setup'
import { createSvelteAdapterContext, useAdapter, type TRootReceiver } from '../../adapter'
import type { FileUploadProps } from './base.component'

export function setupFileUpload(
	getProps: () => FileUploadProps,
	mountId: string,
	receive: TRootReceiver,
) {
	const adapter = createSvelteAdapterContext(FileUploadDescriptor(), {
		ctrl: getProps().ctrl,
		props: getProps(),
		mountId,
	})

	return useAdapter(adapter, getProps, receive)
}
