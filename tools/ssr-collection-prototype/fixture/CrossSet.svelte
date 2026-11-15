<script>
	import { Tabs } from '@soxa-ui/svelte'
	import Root from './CrossRoot.svelte'
	import Item from './CrossItem.svelte'
	import Content from './CrossContent.svelte'
	import Self from './CrossSet.svelte'
	let {candidate=false,scenario='sync',count=2,prefix=''}=$props()
	const R=$derived(candidate?Root:Tabs)
	const I=$derived(candidate?Item:Tabs.Item)
	const C=$derived(candidate?Content:Tabs.Content)
</script>
{#snippet content()}
	{#each Array.from({length:count},(_,i)=>i) as i}
	<C value={prefix+i}>Panel {prefix+i}{#if (scenario==='nested' && i===count-1) || scenario==='inactive-nested'}<Self {candidate} prefix={i===0?'hidden-':'nested-'}/>{/if}</C>
	{/each}
	{#if scenario==='conditional'}<C value={prefix+'last'}>Panel {prefix}last</C>{/if}
{/snippet}
<R {content}>
	{#each Array.from({length:count},(_,i)=>i) as i}
	{#if scenario!=='conditional' || i!==1}<I value={prefix+i} text={'Tab '+prefix+i} active={i===count-1}/>{/if}
	{/each}
	{#if scenario==='conditional'}<I value={prefix+'last'} text={'Tab '+prefix+'last'} active/>{/if}
</R>
