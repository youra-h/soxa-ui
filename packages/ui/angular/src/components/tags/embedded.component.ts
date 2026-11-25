import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ITags } from '@soxa-ui/core'
import { SlotDirective, provideElevator } from '../../adapter'
import { TEmbeddedTagsItemComponent } from './item/embedded.component'
import { TTagsSurface } from '../../generated/tags.metadata'
import { setupTags } from './setup.component'

/** Select supplies the models used by this tag view. */
@Component({
	selector: 'div[so-tags][embedded="select.tags"]',
	imports: [NgTemplateOutlet, SlotDirective, TEmbeddedTagsItemComponent],
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tags.component.html',
})
export class TEmbeddedTagsComponent extends TTagsSurface<ITags> {
	constructor() {
		super((ctrl, inputs) => setupTags(ctrl, inputs, this.engine), { strategy: 'host' })
	}
}
