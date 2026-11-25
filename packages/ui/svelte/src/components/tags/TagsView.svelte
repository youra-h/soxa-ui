<script lang="ts">
	import type { createSvelteAdapterContext } from '../../adapter'
	import { Dynamic, toRootProps } from '../../adapter'
	import type { Component } from 'svelte'
	import TagsItemView from './item/TagsItemView.svelte'
	import type { TagsItemProps } from './item/base.component'
	import { setupTags } from './setup.component'
	import type { TagsProps } from './base.component'

	type ViewProps = TagsProps & {
		create?: typeof createSvelteAdapterContext
		Item?: Component<TagsItemProps>
	}

	let { ref = $bindable(), create, Item = TagsItemView, ...props }: ViewProps = $props()
	const mountId = $props.id()

	const binding = setupTags(() => props, mountId, (node) => (ref = node), () => create)
	const state = binding.state
</script>

<!--
	The default slot receives the shown tags. Each tag has one view so its bundle
	registration belongs to the correct mount.
-->
<Dynamic
	rendered={state.rendered}
	tag="div"
	attributes={toRootProps(
		state,
		[state.attrs, state.aria, state.dataset],
		binding.forwardProps,
	)}
	attach={binding.attachElement}
>
	{#if props.children}
		{@render props.children({ shown: state.shown ?? [] })}
	{:else}
		{#each state.shown ?? [] as tag (tag.uid)}
			{#snippet leading()}{@render props['item-leading']?.({ item: tag })}{/snippet}
			{#snippet content(scope: { text: string; selected: boolean })}
				{@render props.item?.({ ...scope, item: tag })}
			{/snippet}
			{#snippet trailing()}{@render props['item-trailing']?.({ item: tag })}{/snippet}
			{#snippet closeIcon()}
				{@render props['item-close-icon']?.({ item: tag })}
			{/snippet}
			<Item
				ctrl={tag}
				leading={props['item-leading'] ? leading : undefined}
				trailing={props['item-trailing'] ? trailing : undefined}
				close-icon={props['item-close-icon'] ? closeIcon : undefined}
				children={props.item ? content : undefined}
			/>
		{/each}
	{/if}
</Dynamic>
