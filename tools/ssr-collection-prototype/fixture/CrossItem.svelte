<script>
	import {getContext} from 'svelte'
	import {Tabs} from '@soxa-ui/svelte'
	import {RUN,SCOPE,itemOf} from './cross-plan.mjs'
	let props=$props()
	const run=getContext(RUN)
	const ctrl=itemOf(getContext(SCOPE),(() => props)(),run.phase)
</script>
{#if run.phase !== 'scan'}<Tabs.Item {...props} {ctrl}/>{/if}
