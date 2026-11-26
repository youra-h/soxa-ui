import type { IFileUpload } from '@soxa-ui/core'
import type { FileUploadDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../types'

export type FileUploadEventProps = EventProps<typeof FileUploadDescriptor>

export type FileUploadProps = UseDomProps<
	typeof FileUploadDescriptor,
	IFileUpload,
	FileUploadEventProps
>
