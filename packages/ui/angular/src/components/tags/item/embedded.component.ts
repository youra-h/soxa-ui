import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { AttributesDirective, RoleIconDirective } from '../../../adapter'
import { TButtonComponent } from '../../button'
import { TItemRowComponent } from '../../item-row'
import { TIconComponent } from '../../icon'
import { TTagsItemView, tagsItemRoot } from './view.directive'
import { setupTagsItem } from './setup.component'

/**
 * Renders a tag from Select's existing collection.
 */
@Component({
	selector: 'div[so-tags-item]',
	imports: [
		NgTemplateOutlet,
		AttributesDirective,
		RoleIconDirective,
		TButtonComponent,
		TItemRowComponent,
		TIconComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tags-item.component.html',
})
export class TEmbeddedTagsItemComponent extends TTagsItemView {
	constructor() {
		super(setupTagsItem, tagsItemRoot)
	}
}
