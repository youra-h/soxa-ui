import { NgTemplateOutlet } from '@angular/common'
import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { IFileUpload } from '@soxa-ui/core'
import { hasIcon } from '@soxa-ui/setup'
import { RoleIconDirective } from '../../adapter'
import { TButtonComponent } from '../button'
import { TIconComponent } from '../icon'
import { TFileUploadSurface } from '../../generated/file-upload.metadata'
import { setupFileUpload } from './setup.component'

@Component({
	selector: 'div[so-file-upload], [so-file-upload]',
	imports: [NgTemplateOutlet, RoleIconDirective, TButtonComponent, TIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './file-upload.component.html',
})
export class TFileUploadComponent extends TFileUploadSurface<IFileUpload> {
	protected readonly uploadRole = hasIcon('upload') ? 'upload' : 'arrowUpward'

	constructor() {
		super(setupFileUpload, { strategy: 'host' })
	}
}
