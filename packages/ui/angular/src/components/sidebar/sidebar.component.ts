import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ISidebar } from '@soxa-ui/core'
import { TSidebarSurface } from '../../generated/sidebar.metadata'
import { setupSidebar } from './setup.component'

@Component({
	selector: '[so-sidebar]',
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './sidebar.component.html',
})
export class TSidebarComponent extends TSidebarSurface<ISidebar> {
	constructor() {
		super(setupSidebar, { strategy: 'host' })
	}
}
