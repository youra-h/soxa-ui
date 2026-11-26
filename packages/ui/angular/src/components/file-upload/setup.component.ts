import { FileUploadDescriptor } from '@soxa-ui/setup'
import type { IFileUpload } from '@soxa-ui/core'
import { createAngularAdapterContext, useAdapter } from '../../adapter'
import type { TBinding } from '../../adapter'

export function setupFileUpload(
	ctrl: IFileUpload | undefined,
	props: object,
): TBinding<IFileUpload> {
	const adapter = createAngularAdapterContext(FileUploadDescriptor(), { ctrl, props })

	return useAdapter(adapter)
}
