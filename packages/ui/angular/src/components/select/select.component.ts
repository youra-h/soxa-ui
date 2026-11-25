import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ISelect } from '@soxa-ui/core'
import {
	AttributesDirective,
	RoleIconDirective,
	SlotDirective,
	provideElevator,
} from '../../adapter'
import { TFrameComponent } from '../frame'
import { TIconComponent } from '../icon'
import { TInputComponent } from '../input'
import { TEmbeddedTagsComponent } from '../tags/embedded.component'
import { TSelectItemComponent } from './item'
import { TSelectGroupComponent } from './group'
import { TSelectSurface } from '../../generated/select.metadata'
import { setupSelect } from './setup.component'

/**
 * Поле выбора из списка: в корне поле (Input над `field` Select) и панель со списком во Frame.
 * AGENTS.md (Angular), «Select — поле в шаблоне, опции — коллекция в панели».
 */
@Component({
	selector: 'div[so-select], [so-select]',
	imports: [
		NgTemplateOutlet,
		AttributesDirective,
		RoleIconDirective,
		SlotDirective,
		TFrameComponent,
		TIconComponent,
		TInputComponent,
		TEmbeddedTagsComponent,
		TSelectItemComponent,
		TSelectGroupComponent,
	],
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './select.component.html',
})
export class TSelectComponent extends TSelectSurface<ISelect> {
	constructor() {
		super((ctrl, inputs) => setupSelect(ctrl, inputs, this.engine), {
			strategy: 'host',
			sets: ['attrs', 'dataset'],
			control: true,
		})
	}
}
