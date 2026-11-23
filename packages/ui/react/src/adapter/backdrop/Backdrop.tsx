import type { TDatasetAttributes } from '@soxa-ui/core'
import { toAriaProps, toRootLayout } from '..'

type TBackdropState = {
	readonly backdropClasses?: readonly string[]
	readonly backdropDataset?: TDatasetAttributes
	readonly layout_backdropStyles?: Record<string, string | number>
	readonly visible?: boolean
}

export function Backdrop({ state }: { state: TBackdropState }) {
	return (
		<div
			aria-hidden="true"
			{...toAriaProps(state.backdropDataset)}
			{...toRootLayout(
				{
					classes: state.backdropClasses,
					layout_styles: state.layout_backdropStyles,
					visible: state.visible,
				},
				{},
			)}
		/>
	)
}
