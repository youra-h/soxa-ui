<script lang="ts">
	import type { createEngineTabs } from '@soxa-ui/core'
	import { Tabs, Tags } from '@soxa-ui/svelte'
	let { automatic = false, tags = false, engine } : { automatic?: boolean; tags?: boolean; engine?: ReturnType<typeof createEngineTabs> } = $props()
	const initial = { items: [{ value: 'a', text: 'A' }, { value: 'b', text: 'B', id: 'tab-b', _: { active: true } }], panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }] }
</script>
{#if tags}
	<Tags mode="single" initial={{ items: [{ value: 'a', text: 'A' }, { value: 'b', text: 'B', _: { selected: true } }] }}><Tags.Item initial={0} /><Tags.Item initial={1} /></Tags>
{:else if automatic}
	<Tabs {initial} {engine}>{#snippet content()}<Tabs.Content initial={0}>A</Tabs.Content><Tabs.Content initial={1}>B</Tabs.Content>{/snippet}</Tabs>
{:else}
	<Tabs {initial} {engine}><div><Tabs.Item initial={0} /></div><Tabs.Item initial={1} />{#snippet content()}<Tabs.Content initial={0}>A</Tabs.Content><Tabs.Content initial={1}>B</Tabs.Content>{/snippet}</Tabs>
{/if}
