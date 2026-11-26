import type { TValuePayload } from '../../../common'
import type { IControl, IControlProps, TControlEvents } from '../../base/control'

export interface IFileUploadProps extends IControlProps {
	accept?: string
	name?: string
	form?: string
	multiple?: boolean
	required?: boolean
	/** Per-file size limit in bytes. Zero permits only empty files. */
	maxFileSize?: number
	/** Maximum number of retained files. Defaults to no additional limit. */
	maxFiles?: number
}

export interface IFileUploadItem {
	readonly id: number
	readonly file: File
}

export type TFileUploadRejectionReason = 'type' | 'size' | 'count'

export interface IFileUploadRejection {
	readonly file: File
	readonly reason: TFileUploadRejectionReason
}

export type TFileUploadEvents = TControlEvents & {
	'change:settings': () => void
	'change:files': (payload: TValuePayload<readonly File[]>) => void
	'change:rejections': () => void
	selection: () => void
	reject: (rejections: readonly IFileUploadRejection[]) => void
}

export interface IFileUpload extends IControl<IFileUploadProps, TFileUploadEvents> {
	accept: string
	name: string
	form: string
	multiple: boolean
	required: boolean
	maxFileSize: number
	maxFiles: number
	dragging: boolean
	readonly items: readonly IFileUploadItem[]
	readonly files: readonly File[]
	readonly rejections: readonly IFileUploadRejection[]
	addFiles(files: readonly File[]): void
	removeFile(id: number): void
	resetFiles(): void
}
