<script>
	import {getContext} from 'svelte'
	import {Tabs} from '@soxa-ui/svelte'
	import {RUN} from './cross-plan.mjs'
	let {children,...props}=$props()
	const run=getContext(RUN)
</script>
{#if run.phase === 'scan'}{@render children?.()}{:else}<Tabs.Content {...props}>{@render children?.()}</Tabs.Content>{/if}
