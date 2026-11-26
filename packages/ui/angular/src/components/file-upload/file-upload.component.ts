import { NgTemplateOutlet } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { IFileUpload } from '@soxa-ui/core'
import { TFileUploadSurface } from '../../generated/file-upload.metadata'
import { setupFileUpload } from './setup.component'

@Component({
	selector: 'div[so-file-upload], [so-file-upload]',
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './file-upload.component.html',
})
export class TFileUploadComponent extends TFileUploadSurface<IFileUpload> {
	constructor() {
		super(setupFileUpload, { strategy: 'host' })
	}
}
