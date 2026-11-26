import { FileUploadDescriptor } from '@soxa-ui/setup'
import { useComponent } from '../../adapter'
import type { FileUploadProps } from './base.component'

export function useSetupFileUpload(props: FileUploadProps) {
	return useComponent(
		(create) => create(FileUploadDescriptor(), { ctrl: props.ctrl, props }),
		props,
	)
}
