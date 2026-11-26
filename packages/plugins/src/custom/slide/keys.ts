import type { ISlidable } from '@soxa-ui/core'
import { arrowStep, slideDirection } from './direction'

type TSlideKeyboardOwner = Pick<
	ISlidable,
	'orientation' | 'inverted' | 'largeStep' | 'moveToEdge' | 'shift'
>

export function slideKeyAction(
	owner: TSlideKeyboardOwner,
	root: Element,
	event: KeyboardEvent,
): ((index: number) => void) | null {
	switch (event.key) {
		case 'Home':
			return (index) => owner.moveToEdge(index, 'start')
		case 'End':
			return (index) => owner.moveToEdge(index, 'end')
		case 'PageUp':
			return (index) => owner.shift(index, owner.largeStep)
		case 'PageDown':
			return (index) => owner.shift(index, -owner.largeStep)
	}

	const step = arrowStep(slideDirection(owner, root), event.key)

	if (step === null) return null

	const count = event.shiftKey ? step * owner.largeStep : step
	return (index) => owner.shift(index, count)
}
