import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IDialog } from '@soxa-ui/core'
import { AttributesDirective, RoleIconDirective } from '../../adapter'
import { BackdropDirective } from '../../adapter/backdrop/backdrop.directive'
import { TButtonComponent } from '../button'
import { TIconComponent } from '../icon'
import { TDialogSurface } from '../../generated/dialog.metadata'
import { setupDialog } from './setup.component'

/**
 * Модальное окно: корень — элемент потребителя, он же панель, и в `target` уезжает он.
 * AGENTS.md (Angular), «Dialog и Drawer — корень и есть панель».
 */
@Component({
	selector: 'div[so-dialog], [so-dialog]',
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
	templateUrl: './dialog.component.html',
})
export class TDialogComponent extends TDialogSurface<IDialog> {
	constructor() {
		super(setupDialog, {
			strategy: 'host',
			teleport: { target: 'target', companion: true },
			plugins: ['dismiss_ownerAttribute'],
		})
	}
}
