import { Component, DestroyRef, inject, signal } from '@angular/core'
import { TButton } from '@soxa-ui/core'
import { TButtonComponent } from '@soxa-ui/angular'

@Component({
	selector: 'app-controller',
	imports: [TButtonComponent],
	template: `<button so-button [ctrl]="button" (soActionPress)="changeText()"></button>
		<output>Controller clicks: {{ clicks() }}</output>`,
})
export class Controller {
	// The controller belongs to this mounted component, including on the server.
	readonly button = new TButton({ text: 'Controller action' })
	readonly clicks = signal(0)

	constructor() {
		const count = () => this.clicks.update((value) => value + 1)

		this.button.events.on('change:text', count)
		inject(DestroyRef).onDestroy(() => this.button.events.off('change:text', count))
	}

	changeText(): void {
		this.button.text =
			this.button.text === 'Controller action'
				? 'Controller action again'
				: 'Controller action'
	}
}
