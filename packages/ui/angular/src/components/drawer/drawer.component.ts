import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IDrawer } from '@soxa-ui/core'
import { AttributesDirective, RoleIconDirective } from '../../adapter'
import { BackdropDirective } from '../../adapter/backdrop/backdrop.directive'
import { TButtonComponent } from '../button'
import { TIconComponent } from '../icon'
import { TDrawerSurface } from '../../generated/drawer.metadata'
import { setupDrawer } from './setup.component'

/**
 * Выезжающая панель у края экрана или контейнера; корень — сама панель, она и уезжает в цель.
 * AGENTS.md (Angular), «Dialog и Drawer — корень и есть панель».
 */
@Component({
	selector: 'div[so-drawer], [so-drawer]',
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
	templateUrl: './drawer.component.html',
})
export class TDrawerComponent extends TDrawerSurface<IDrawer> {
	constructor() {
		super(setupDrawer, {
			strategy: 'host',
			teleport: { target: 'target', contained: 'contained', companion: true },
			plugins: ['dismiss_ownerAttribute'],
		})
	}
}
