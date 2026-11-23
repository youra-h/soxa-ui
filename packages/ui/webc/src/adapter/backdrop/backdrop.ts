import type { TDatasetAttributes } from '@soxa-ui/core'
import { ownerAttributes, ownerClasses, ownerStyles } from '..'

type TBackdropState = {
	readonly backdropClasses?: readonly string[]
	readonly backdropDataset?: TDatasetAttributes
	readonly layout_backdropStyles?: Record<string, string | number>
}

export const backdropOutputs = ['backdropClasses', 'backdropDataset', 'layout_backdropStyles']

export function createBackdrop(doc: Document): HTMLElement {
	const backdrop = doc.createElement('div')
	backdrop.setAttribute('aria-hidden', 'true')
	return backdrop
}

export function paintBackdrop(backdrop: HTMLElement, state: TBackdropState): void {
	ownerClasses(backdrop, state.backdropClasses)
	ownerStyles(backdrop, state.layout_backdropStyles)
	ownerAttributes(backdrop, state.backdropDataset)
}
