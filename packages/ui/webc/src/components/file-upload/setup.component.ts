import { FileUploadDescriptor } from '@soxa-ui/setup'
import type { IFileUpload } from '@soxa-ui/core'
import { createWebcAdapterContext, useAdapter } from '../../adapter'
import type { TBinding, TUpdateListener } from '../../adapter'

export function setupFileUpload(
	host: HTMLElement,
	ctrl: IFileUpload | undefined,
	props: Record<string, unknown>,
	onUpdate: TUpdateListener,
): TBinding<IFileUpload> {
	const adapter = createWebcAdapterContext(host, FileUploadDescriptor(), { ctrl, props })

	return useAdapter(adapter, host, onUpdate)
}
