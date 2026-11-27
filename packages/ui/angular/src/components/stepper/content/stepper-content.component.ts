import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IStepperContent } from '@soxa-ui/core'
import { TStepperContentSurface } from '../../../generated/stepper-content.metadata'
import { setupStepperContent } from './setup.component'

@Component({
	selector: 'div[so-stepper-content], [so-stepper-content]',
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './stepper-content.component.html',
})
export class TStepperContentComponent extends TStepperContentSurface<IStepperContent> {
	constructor() {
		super(setupStepperContent, { strategy: 'host', shownBy: 'active' })
	}
}
