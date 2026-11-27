<script lang="ts">
	import type { TValuePayload } from '@soxa-ui/core'
	import { Button, Guide } from '@soxa-ui/svelte'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
	const row = $derived(bind.visible === true)
	let shown = $derived(row)

	function onChangeVisible(payload: TValuePayload<boolean>): void {
		shown = payload.newValue
		const listener = bind.onChangeVisible
		if (typeof listener === 'function') listener(payload)
	}
</script>

<Button text="Запустить Guide" onclick={() => (shown = true)} />
<Guide {...bind} visible={shown} {onChangeVisible} />
