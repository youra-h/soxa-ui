import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { IStepper } from '@soxa-ui/core'
import { provideElevator } from '../../adapter'
import { TStepperSurface } from '../../generated/stepper.metadata'
import { TStepperItemComponent } from './item'
import { setupStepper } from './setup.component'

@Component({
	selector: 'div[so-stepper], [so-stepper]',
	imports: [NgTemplateOutlet, TStepperItemComponent],
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './stepper.component.html',
})
export class TStepperComponent extends TStepperSurface<IStepper> {
	constructor() {
		super((ctrl, inputs) => setupStepper(ctrl, inputs, this.engine), { strategy: 'host' })
	}

	protected readonly next = () => this.facade()?.next() ?? false
	protected readonly previous = () => this.facade()?.previous() ?? false
}
