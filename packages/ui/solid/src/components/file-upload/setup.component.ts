import { FileUploadDescriptor } from '@soxa-ui/setup'
import { createSolidAdapterContext, useAdapter } from '../../adapter'
import type { FileUploadProps } from './base.component'

export function setupFileUpload(props: FileUploadProps) {
	const adapter = createSolidAdapterContext(FileUploadDescriptor(), {
		ctrl: props.ctrl,
		props,
	})

	return useAdapter(adapter, props)
}
