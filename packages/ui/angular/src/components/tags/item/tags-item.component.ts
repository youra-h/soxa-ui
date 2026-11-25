import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { AttributesDirective, RoleIconDirective } from '../../../adapter'
import { TButtonComponent } from '../../button'
import { TItemRowComponent } from '../../item-row'
import { TIconComponent } from '../../icon'
import { TTagsItemView, tagsItemRoot } from './view.directive'
import { setupTagsItem } from './setup.component'
import { createAngularPreparedAdapterContext } from '../../../adapter/common/collection-preparation'

/**
 * Тег: строка — Button на `div` с набором `aria`, кнопка закрытия — её сосед:
 * потомки опции скринридеру презентационны, и подпись крестика вошла бы в имя тега.
 */
@Component({
	selector: 'div[so-tags-item], [so-tags-item]',
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
export class TTagsItemComponent extends TTagsItemView {
	constructor() {
		super(
			(ctrl, inputs) => setupTagsItem(ctrl, inputs, createAngularPreparedAdapterContext),
			tagsItemRoot,
		)
	}
}
