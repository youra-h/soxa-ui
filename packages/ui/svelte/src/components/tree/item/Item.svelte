<script lang="ts">
	import { Dynamic, roleIcon, toRootProps } from '../../../adapter'
	import { Icon } from '../../icon'
	import { ItemRow } from '../../item-row'
	import type { TreeItemProps, TreeItemIconScope } from './base.component'
	import { setupTreeItem } from './setup.component'

	let { ctrl, entry, item, icon, indicator, children }: TreeItemProps = $props()

	const mountId = $props.id()
	const binding = setupTreeItem(() => ({ ctrl }), mountId, () => {})
	const state = binding.state
	const CHECK = roleIcon('check')
	const indicatorSide = () => state.indicator

	function scope(): TreeItemIconScope {
		return {
			item: ctrl,
			branch: state.branch ?? false,
			expanded: state.expanded ?? false,
			loading: state.loading ?? false,
		}
	}
</script>

{#snippet selectionMark()}
	<span class="so-tree-item__selection-indicator" aria-hidden="true">
		{#if state.selected}
			<Icon embedded="tree.selection-indicator" tag={CHECK} size={state.size} />
		{/if}
	</span>
{/snippet}

<Dynamic
	rendered={state.rendered}
	tag={state.href && !scope().branch ? 'a' : state.tag}
	attributes={toRootProps(state, [state.attrs, state.aria, state.dataset, { href: scope().branch ? null : state.href ?? null }], {})}
	attach={binding.attachElement}
>
	<!-- Keep the group and accessible name when Virtual omits this row. -->
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
				</span>
				{#if indicatorSide() === 'start'}{@render selectionMark()}{/if}
				{@render icon?.(scope())}
			{/snippet}
			{#if item}
				{@render item({ ...scope(), text: state.text ?? '', selected: state.selected ?? false })}
			{:else}
				{state.text}
			{/if}
			{#snippet trailing()}
				{#if indicatorSide() === 'end'}{@render selectionMark()}{/if}
			{/snippet}
		</ItemRow>
	{:else}
		<span class="so-tree-item__accessible-name">{state.text}</span>
	{/if}
	{#if scope().expanded}
		<div role="group" class="so-tree-item__group">{@render children?.()}</div>
	{/if}
</Dynamic>
