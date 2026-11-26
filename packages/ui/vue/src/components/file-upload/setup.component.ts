import { FileUploadDescriptor } from '@soxa-ui/setup'
import { useAdapter, useExpose, createVueAdapterContext, type SetupContext } from '../../adapter'
import BaseFileUpload, { type FileUploadProps } from './base.component'

export default {
	name: '_FileUpload',
	extends: BaseFileUpload,
	expose: useExpose(),
	setup(props: FileUploadProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(FileUploadDescriptor(), { ctrl: props.ctrl, props })
		return useAdapter(adapter, props, emit)
	},
}
