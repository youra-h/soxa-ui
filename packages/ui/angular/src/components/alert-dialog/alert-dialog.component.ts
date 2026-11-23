import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IAlertDialog } from '@soxa-ui/core'
import { AttributesDirective, RoleIconDirective } from '../../adapter'
import { BackdropDirective } from '../../adapter/backdrop/backdrop.directive'
import { TButtonComponent } from '../button'
import { TIconComponent } from '../icon'
import { TAlertDialogSurface } from '../../generated/alert-dialog.metadata'
import { setupAlertDialog } from './setup.component'

@Component({
	selector: 'div[so-alert-dialog], [so-alert-dialog]',
	imports: [
		NgTemplateOutlet,
		AttributesDirective,
		BackdropDirective,
		RoleIconDirective,
		TButtonComponent,
		TIconComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { tabindex: '-1', ngSkipHydration: 'true' },
	templateUrl: './alert-dialog.component.html',
})
export class TAlertDialogComponent extends TAlertDialogSurface<IAlertDialog> {
	constructor() {
		super(setupAlertDialog, {
			strategy: 'host',
			teleport: { target: 'target', companion: true },
			plugins: ['dismiss_ownerAttribute'],
		})
	}
}
