<script lang="ts">
	import { Tabs, Tags, type ICollectionInitialSource } from '@soxa-ui/svelte'

	let {
		source,
		automatic = false,
		before = false,
		tags = false,
		nested = false,
		discover,
	}: {
		source: ICollectionInitialSource
		automatic?: boolean
		before?: boolean
		tags?: boolean
		nested?: boolean
		discover?: () => void
	} = $props()
	const nestedSource = {
		items: [{ value: 'n', text: 'Nested', _: { active: true } }],
		panels: [{ value: 'n', id: 'nested-panel' }],
	}
</script>

{#snippet panels()}
	{#each source.panels ?? [] as _panel, ordinal}
		<Tabs.Content initial={ordinal}>
			{#if nested}
				{#if ordinal === 0}
					{discover?.()}<Tabs initial={{ items: [{ text: 'Hidden' }] }} />
				{:else}
					<Tabs initial={nestedSource}>
						{#snippet content()}<Tabs.Content initial={0}>Nested body</Tabs.Content>{/snippet}
					</Tabs>
				{/if}
			{:else}Panel {ordinal}{/if}
		</Tabs.Content>
	{/each}
{/snippet}
{#snippet items()}
	{#each source.items as _item, ordinal}<div><Tabs.Item initial={ordinal} /></div>{/each}
{/snippet}
{#if tags}
	<Tags mode="single" initial={source}>
		{#each source.items as _item, ordinal}<Tags.Item initial={ordinal} />{/each}
	</Tags>
{:else}
	<Tabs
		initial={source}
		children={automatic ? undefined : items}
		leading={before ? panels : undefined}
		content={before ? undefined : panels}
	/>
{/if}
