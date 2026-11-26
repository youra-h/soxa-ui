/**
 * FileUpload binds the selected-file collection to a native form input and a drop zone.
 */

import { TFileUpload } from '@soxa-ui/core'
import {
	TFileUploadDropPlugin,
	TFileUploadNamesPlugin,
	TFileUploadNativePlugin,
	fileUploadChoose,
} from '@soxa-ui/plugins'
import {
	defineComponent,
	defineDescriptor,
	definePlugin,
	defineType,
} from '../../../protected/define'
import { ActionPluginDescriptor } from '../plugins'
import { ControlDescriptor } from './control.descriptor'

const native = definePlugin({
	ctor: TFileUploadNativePlugin,
	namespace: 'native',
	contribution: {
		props: { previews: { protected: true, triggers: ['change:previews'] } },
	},
})

const dropzone = definePlugin({ ctor: TFileUploadDropPlugin, namespace: 'dropzone' })

const names = definePlugin({
	ctor: TFileUploadNamesPlugin,
	namespace: 'names',
	contribution: {
		props: {
			choose: { protected: true, triggers: ['change:presentation'] },
			drop: { protected: true, triggers: ['change:presentation'] },
			browse: { protected: true, triggers: ['change:presentation'] },
			hint: { protected: true, triggers: ['change:presentation'] },
			rows: { protected: true, triggers: ['change:presentation'] },
			message: { protected: true, triggers: ['change:presentation'] },
		},
	},
})

export const FileUploadDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TFileUpload,
		extends: ControlDescriptor(),
		contribution: {
			props: {
				accept: { type: String, triggers: ['change:settings'] },
				name: { type: String, triggers: ['change:settings'] },
				form: { type: String, triggers: ['change:settings'] },
				multiple: { type: Boolean, triggers: ['change:settings'] },
				required: { type: Boolean, triggers: ['change:settings'] },
				maxFileSize: { type: Number, triggers: ['change:settings'] },
				maxFiles: { type: Number, triggers: ['change:settings'] },
			},
			events: ['change:files', 'reject'],
			slots: {
				'item-progress': {
					scope: { file: defineType<File>(Object), id: defineType<number>(Number) },
					description: 'Application-provided upload status for one selected file',
				},
			},
		},
		plugins: [
			ActionPluginDescriptor.with({ focusTarget: fileUploadChoose }),
			native,
			dropzone,
			names,
		],
	}),
)
