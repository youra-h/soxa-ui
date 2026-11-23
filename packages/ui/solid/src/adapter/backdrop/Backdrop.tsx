import type { TDatasetAttributes } from '@soxa-ui/core'
import { createRootProps } from '..'

type TBackdropState = {
	readonly backdropClasses?: readonly string[]
	readonly backdropDataset?: TDatasetAttributes
	readonly layout_backdropStyles?: Record<string, string | number>
	readonly visible?: boolean
}

export function Backdrop(props: { state: TBackdropState }) {
	const backdrop = createRootProps(() => ({
		state: {
			classes: props.state.backdropClasses,
			layout_styles: props.state.layout_backdropStyles,
			visible: props.state.visible,
		},
		sets: [props.state.backdropDataset],
		forward: {},
	}))

	return <div aria-hidden="true" {...backdrop()} />
}
