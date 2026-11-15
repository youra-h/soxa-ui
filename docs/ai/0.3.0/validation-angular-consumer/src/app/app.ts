import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core'
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms'
import {
	TButtonComponent,
	TInputComponent,
	TLabelComponent,
	TSelectComponent,
	TCheckBoxComponent,
} from '@soxa-ui/angular'

@Component({
	selector: 'app-root',
	changeDetection: ChangeDetectionStrategy.OnPush,
	imports: [
		FormsModule,
		ReactiveFormsModule,
		TButtonComponent,
		TInputComponent,
		TLabelComponent,
		TSelectComponent,
		TCheckBoxComponent,
	],
	template: `<main>
		<h1>Library collection reservation</h1>
		<label so-label text="Borrower" position="top"
			><div
				so-input
				[(value)]="borrower"
				(soChangeValue)="lastBorrower.set($event.newValue)"
			></div
		></label>
		<label so-label text="Contact address" position="top"
			><div so-input [formControl]="contact"></div
		></label>
		<label so-label text="Pickup desk" position="top"
			><div so-select [(ngModel)]="desk" [items]="desks"></div
		></label>
		<label so-label text="Email receipt"><span so-check-box [(value)]="receipt"></span></label>
		<button so-button text="Clear contact" (soActionPress)="contact.reset()"></button>
		<button
			so-button
			text="Toggle contact"
			(soActionPress)="contact.disabled ? contact.enable() : contact.disable()"
		></button>
		<button so-button text="Reserve collection" (soActionPress)="reserved.set(true)"></button>
		<output data-testid="state">{{ borrower() }}|{{ desk() }}|{{ receipt() }}</output>
		<output data-testid="event">{{ lastBorrower() }}</output>
		<output data-testid="form">{{ contact.value ?? 'null' }}|{{ contact.touched }}</output>
		@if (reserved()) {
			<p role="status">Collection reserved</p>
		}
		@if (ready()) {
			<span data-testid="hydrated">Hydrated</span>
		}
	</main>`,
})
export class App {
	readonly borrower = signal<string | undefined>('Ada')
	readonly lastBorrower = signal('')
	readonly contact = new FormControl<string | null>('ada@library.example')
	readonly desk = signal('north')
	readonly receipt = signal<boolean | undefined>(true)
	readonly reserved = signal(false)
	readonly ready = signal(false)
	readonly desks = [
		{ value: 'north', text: 'North reading room' },
		{ value: 'south', text: 'South archive' },
	]

	constructor() {
		afterNextRender(() => this.ready.set(true))
	}
}
