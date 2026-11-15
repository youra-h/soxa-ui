import { type TDatePickerValue } from '@soxa-ui/core'
import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
	TButtonComponent,
	TInputComponent,
	TCheckBoxComponent,
	TLabelComponent,
	TSelectComponent,
	TDatePickerComponent,
	TAccordionComponent,
	TAccordionItemComponent,
	SlotDirective,
} from '@soxa-ui/angular'
import { Controller } from './controller'

@Component({
	selector: 'app-root',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		FormsModule,
		ReactiveFormsModule,
		TButtonComponent,
		TInputComponent,
		TCheckBoxComponent,
		TLabelComponent,
		TSelectComponent,
		TDatePickerComponent,
		TAccordionComponent,
		TAccordionItemComponent,
		SlotDirective,
		Controller,
	],
	template: `<main>
		<h1>Travel preferences</h1>
		<label so-label text="Traveler name" position="top">
			<div
				so-input
				[(value)]="name"
				(soChangeValue)="lastChange.set($event.newValue); lastOld.set($event.oldValue)"
			></div>
		</label>
		<label so-label text="Accept travel policy"
			><span so-check-box [(value)]="accepted"></span
		></label>
		<label so-label text="Destination" position="top">
			<div so-select [(ngModel)]="destination" [items]="cities"></div>
		</label>
		<label so-label text="Departure" position="top">
			<div
				so-date-picker
				[value]="departure()"
				(valueChange)="departure.set($event)"
				aria_label="Departure"
			></div>
		</label>
		<output data-testid="values">{{ name() }}|{{ destination() }}|{{ departure() }}</output>
		<output data-testid="old-value">{{ lastOld() }}</output>
		<output data-testid="change">{{ lastChange() }}</output>
		<button so-button text="Reset name" (soActionPress)="name.set('Reset')"></button>
		<label so-label text="Contact email" position="top"
			><div so-input [formControl]="email"></div
		></label>
		<button so-button text="Reset form" (soActionPress)="email.reset()"></button>
		<button
			so-button
			text="Toggle disabled"
			(soActionPress)="email.disabled ? email.enable() : email.disable()"
		></button>
		<output data-testid="form-state">{{ email.value ?? 'null' }}|{{ email.touched }}</output>
		<div so-accordion>
			<div so-accordion-item value="help" text="Travel help">
				<ng-template slot="header" let-selected="selected"
					>Travel help: {{ selected ? 'open' : 'closed' }}</ng-template
				>
				Bring your travel documents.
			</div>
		</div>
		<button
			so-button
			text="Toggle controller"
			(soActionPress)="showController.update(toggle)"
		></button>
		@if (showController()) {
			<app-controller />
		}
		<button
			so-button
			text="Save preferences"
			variant="accent"
			(soActionPress)="saved.set(true)"
		></button>
		@if (saved()) {
			<p>Preferences saved</p>
		}
		@if (mounted()) {
			<span data-testid="mounted">Mounted</span>
		}
	</main>`,
})
export class App {
	readonly name = signal<string | undefined>('')
	readonly accepted = signal<boolean | undefined>(false)
	readonly destination = signal('kzn')
	readonly departure = signal<TDatePickerValue>('2026-11-14')
	readonly lastChange = signal('')
	readonly lastOld = signal('')
	readonly email = new FormControl<string | null>('hello@example.com')
	readonly saved = signal(false)
	readonly mounted = signal(false)
	readonly showController = signal(true)
	readonly toggle = (value: boolean) => !value
	readonly cities = [
		{ value: 'kzn', text: 'Kazan' },
		{ value: 'msk', text: 'Moscow' },
	]

	constructor() {
		afterNextRender(() => this.mounted.set(true))
	}
}
