import { useEmits, useProps } from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'
import { FileUploadDescriptor } from '@soxa-ui/setup'
import type { IFileUpload } from '@soxa-ui/core'

export const emitsFileUpload: TEmits = useEmits(FileUploadDescriptor())
export const propsFileUpload: TProps = useProps(FileUploadDescriptor()) as TProps
export type FileUploadProps = UseProps<typeof FileUploadDescriptor, IFileUpload>

export default {
	name: 'BaseFileUpload',
	emits: emitsFileUpload,
	props: propsFileUpload,
}
