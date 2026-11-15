<script lang="ts">
	import { onMount } from 'svelte'
	import { TButton } from '@soxa-ui/core'
	import { Button } from '@soxa-ui/svelte'

	// A controller belongs to this component instance, including on the server.
	const ctrl = new TButton({ text: 'Controller action' })
	let clicks = $state(0)
	let mounted = $state(false)
	const count = () => { clicks++ }

	onMount(() => {
		ctrl.events.on('change:text', count)
		mounted = true
		return () => ctrl.events.off('change:text', count)
	})

	function act() {
		ctrl.text = ctrl.text === 'Controller action' ? 'Controller action again' : 'Controller action'
	}
</script>

<section aria-label="Controller example">
	<Button {ctrl} type="button" onActionClick={act} />
	<output>Controller clicks: {clicks}</output>
	{#if mounted}<span data-testid="mounted">Mounted</span>{/if}
</section>
