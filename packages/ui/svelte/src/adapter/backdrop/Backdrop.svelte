<script lang="ts">
	import type { TDatasetAttributes } from '@soxa-ui/core'
	import { toShownStyleText } from '..'

	type TBackdropState = {
		readonly backdropClasses?: readonly string[]
		readonly backdropDataset?: TDatasetAttributes
		readonly layout_backdropStyles?: Record<string, string | number>
		readonly visible?: boolean
	}

	let { state }: { state: TBackdropState } = $props()
</script>

<div
	class={state.backdropClasses}
	style={toShownStyleText(state.layout_backdropStyles, state.visible === true)}
	aria-hidden="true"
	{...state.backdropDataset}
></div>
