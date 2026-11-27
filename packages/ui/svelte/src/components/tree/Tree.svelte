<script lang="ts">
	import type { TTreeRenderEntry } from '@soxa-ui/core'
	import { Dynamic, toRootProps, toStyleText } from '../../adapter'
	import TreeRow from './TreeRow.svelte'
	import { setupTree } from './setup.component'
	import type { TreeProps } from './base.component'

	let { ref = $bindable(), ...props }: TreeProps = $props()
	const mountId = $props.id()
	const binding = setupTree(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

{#snippet entries(layout: readonly TTreeRenderEntry[])}
	{#each layout as entry (entry.key)}
		{#if entry.kind === 'filler'}
			<div class="so-tree__filler" aria-hidden="true" style={toStyleText(entry.style)}></div>
		{:else}
			<TreeRow {entry} ctrl={entry.item} item={props.item} icon={props['item-icon']} indicator={props['item-indicator-icon']}>
				{@render entries(entry.children)}
			</TreeRow>
		{/if}
	{/each}
{/snippet}

<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	{#if state.layout?.length}
		{@render entries(state.layout)}
	{:else}
		{@render props.empty?.()}
	{/if}
</Dynamic>
