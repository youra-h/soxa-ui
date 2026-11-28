import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ISidebarItem } from '@soxa-ui/core'
import { TSidebarItemSurface } from '../../../generated/sidebar-item.metadata'
import { setupSidebarItem } from './setup.component'

@Component({
	selector: 'a[so-sidebar-item], button[so-sidebar-item]',
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { '[attr.title]': "state()['text'] || null" },
	templateUrl: './sidebar-item.component.html',
})
export class TSidebarItemComponent extends TSidebarItemSurface<ISidebarItem> {
	constructor() {
		super(setupSidebarItem, { strategy: 'host' })
	}
}
