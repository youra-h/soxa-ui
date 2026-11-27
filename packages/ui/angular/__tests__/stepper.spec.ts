import { Component } from '@angular/core'
import { expect, it } from 'vitest'
import {
	SlotDirective,
	TStepperComponent,
	TStepperContentComponent,
	TStepperItemComponent,
} from '@soxa-ui/angular'
import { findIn, mountHost } from './mount'

@Component({
	imports: [SlotDirective, TStepperComponent, TStepperItemComponent, TStepperContentComponent],
	template: `
		<div so-stepper value="first" linear>
			<li so-stepper-item value="first" text="First" completed>
				<ng-template slot="indicator" let-number="number"
					><b>{{ number }}</b></ng-template
				>
			</li>
			<li so-stepper-item value="second" text="Second"></li>
			<ng-template slot="content" let-canNext="canNext" let-next="next">
				<div so-stepper-content value="first">First panel</div>
				<div so-stepper-content value="second">Second panel</div>
				<button type="button" id="next" [disabled]="!canNext" (click)="next()">Next</button>
			</ng-template>
		</div>
	`,
})
class StepperHost {}

it('projects declarative items and renders the active scoped panel', async () => {
	const fixture = mountHost(StepperHost)
	await fixture.whenStable()

	const panel = () =>
		findIn(fixture, '.so-stepper-content:not([style*="display: none"])', HTMLElement)
	const next = findIn(fixture, '#next', HTMLButtonElement)

	expect(panel().textContent).toContain('First panel')
	expect(findIn(fixture, '.so-stepper-item__indicator b', HTMLElement).textContent).toBe('1')
	expect(next.disabled).toBe(false)

	next.click()
	await fixture.whenStable()

	expect(panel().textContent).toContain('Second panel')
	expect(next.disabled).toBe(true)
})
