<script lang="ts">
	import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
	import type { Snippet } from 'svelte'
	import { Dynamic, toRootProps } from '../../adapter'
	import { ItemRow } from '../item-row'
	import type { TreeProps, TreeIconScope } from './base.component'
	import { setupTreeRow } from './setup.component'

	let { ctrl, entry, item, icon, indicator, children }: {
		ctrl: TTreeItem
		entry: TTreeRenderItem
		item?: TreeProps['item']
		icon?: TreeProps['item-icon']
		indicator?: TreeProps['item-indicator-icon']
		children?: Snippet
	} = $props()

	const mountId = $props.id()
	const binding = setupTreeRow(() => ({ ctrl }), mountId, () => {})
	const state = binding.state

	function scope(): TreeIconScope {
		return {
			item: ctrl,
			branch: state.aria?.['aria-expanded'] !== undefined,
			expanded: state.aria?.['aria-expanded'] === 'true',
			loading: state.aria?.['aria-busy'] === 'true',
		}
	}
</script>

<Dynamic
	rendered={state.rendered}
	tag={state.href && !scope().branch ? 'a' : state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset, { href: scope().branch ? null : state.href ?? null }], {})}
	attach={binding.attachElement}
>
	{#if entry.row}
		<ItemRow
			embedded="tree.row"
			tag="div"
			class="so-tree-item__row"
			size={state.size}
			variant={state.variant}
			{...state.dataset}
		>
			{#snippet leading()}
				<span class={scope().branch ? 'so-tree-item__toggle' : 'so-tree-item__spacer'} aria-hidden="true">
					{#if scope().branch}
						{#if indicator}{@render indicator(scope())}{:else}<span class="so-tree-item__chevron"></span>{/if}
					{/if}
				</span>{@render icon?.(scope())}
			{/snippet}
			{#if item}
				{@render item({ ...scope(), text: state.text ?? '', selected: state.selected ?? false })}
			{:else}
				{state.text}
			{/if}
		</ItemRow>
	{:else}
		<span class="so-tree-item__accessible-name">{state.text}</span>
	{/if}
	{#if scope().expanded}
		<div role="group" class="so-tree-item__group">{@render children?.()}</div>
	{/if}
</Dynamic>
