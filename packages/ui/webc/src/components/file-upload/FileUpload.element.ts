import { FileUploadDescriptor } from '@soxa-ui/setup'
import type { IFileUpload } from '@soxa-ui/core'
import { ElementBase, defineElement } from '../../adapter'
import type { TElementClassOf, TElementType } from '../../adapter'
import { fileUploadTemplate } from './file-upload.template'
import { setupFileUpload } from './setup.component'

export const TFileUploadElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof FileUploadDescriptor,
	IFileUpload
> = ElementBase(HTMLDivElement, {
	descriptor: FileUploadDescriptor,
	template: fileUploadTemplate,
	root: { strategy: 'host' },
	setup: setupFileUpload,
})

defineElement('so-file-upload', TFileUploadElement, 'div')

export type TFileUploadElementProps = TElementType<typeof TFileUploadElement>
