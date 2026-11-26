import type { TClosedComponent } from '../../adapter'
import FileUploadComponent from './FileUpload.vue'

export { default as BaseFileUpload, emitsFileUpload, propsFileUpload } from './base.component'

export const FileUpload: TClosedComponent<typeof FileUploadComponent> = FileUploadComponent
