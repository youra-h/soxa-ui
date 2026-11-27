import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IStepperItem } from '@soxa-ui/core'
import { hasIcon } from '@soxa-ui/setup'
import { AttributesDirective, RoleIconDirective } from '../../../adapter'
import { TIconComponent } from '../../icon'
import { TStepperItemSurface } from '../../../generated/stepper-item.metadata'
import { setupStepperItem } from './setup.component'

@Component({
	selector: 'li[so-stepper-item], [so-stepper-item]',
	imports: [NgTemplateOutlet, AttributesDirective, RoleIconDirective, TIconComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './stepper-item.component.html',
})
export class TStepperItemComponent extends TStepperItemSurface<IStepperItem> {
	protected readonly stepIcon = hasIcon('step') ? 'step' : 'arrowRight'

	constructor() {
		super(setupStepperItem, { strategy: 'host', sets: ['dataset'], control: true })
	}

	protected get scope() {
		const state = this.state()

		return {
			value: state['value'],
			number: state['stepper_number'],
			active: state['active'],
			completed: state['completed'],
			error: state['error'],
		}
	}

	protected activate(event: Event) {
		const step = this.facade()
		if (step && !event.defaultPrevented) step.active = true
	}
}
