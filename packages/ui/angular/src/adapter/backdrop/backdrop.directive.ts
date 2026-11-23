import { Directive, input } from '@angular/core'

type TBackdropState = {
	readonly backdropClasses?: readonly string[]
	readonly layout_backdropStyles?: Record<string, string | number>
}

// Keep the companion as a native element so the modal can move it with the panel.
@Directive({
	selector: '[so-modal-backdrop]',
	host: {
		'[class]': 'state().backdropClasses',
		'[style]': 'state().layout_backdropStyles',
		'aria-hidden': 'true',
	},
})
export class BackdropDirective {
	readonly state = input.required<TBackdropState>({ alias: 'so-modal-backdrop' })
}
