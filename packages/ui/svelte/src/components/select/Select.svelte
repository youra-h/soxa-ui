<script lang="ts">
	import type { ISelectItem, TDrawnEntry } from '@soxa-ui/core'
	import {
		Dynamic,
		roleIcon,
		toControlAttrs,
		toRootForward,
		toRootProps,
		toStyleText,
	} from '../../adapter'
	import { Frame } from '../frame'
	import { Icon } from '../icon'
	import { Input } from '../input'
	import { Tags } from '../tags'
	import { SelectItem } from './item'
	import { SelectGroup } from './group'
	import { setupSelect } from './setup.component'
	import type { SelectAttributes, SelectProps } from './base.component'

	let { ref = $bindable(), ...props }: SelectProps = $props()
	const mountId = $props.id()

	const binding = setupSelect(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const field = binding.ctrl.field

	const ARROW = roleIcon('arrowDown')
</script>

<!--
	Проброс слотов опции — только заданных: сниппет непрозрачен, и без него опция рисует своё.
	Слоты поля по сторонам отдаются всегда: обёртки поля стоят и без тегов. Класс стрелки — на
	обёртке: иконка слота поворачивается так же. Открытость — `visible` панели, а не `rendered`:
	снятие опций вычистило бы выбор. Части вплотную: пробел Svelte оставил бы текстом.
-->
{#snippet entries(list: ReadonlyArray<TDrawnEntry<ISelectItem>>)}
	{#each list as entry (entry.key)}
		{#if entry.kind === 'filler'}
			<div class="so-select__filler" aria-hidden="true" style={toStyleText(entry.style)}></div>
		{:else}
			{#snippet leading()}
				{@render props['item-leading']?.({ item: entry.item })}
			{/snippet}
			{#snippet content(scope: { text: string; selected: boolean })}
				{@render props.item?.({ ...scope, item: entry.item })}
			{/snippet}
			{#snippet trailing()}
				{@render props['item-trailing']?.({ item: entry.item })}
			{/snippet}
			{#snippet indicator(scope: { selected: boolean })}
				{@render props['item-indicator-icon']?.({ ...scope, item: entry.item })}
			{/snippet}
			<SelectItem
				ctrl={entry.item}
				leading={props['item-leading'] ? leading : undefined}
				trailing={props['item-trailing'] ? trailing : undefined}
				indicator-icon={props['item-indicator-icon'] ? indicator : undefined}
				children={props.item ? content : undefined}
			/>
		{/if}
	{/each}
{/snippet}
{#snippet fieldLeading()}
	{#if state.tags && state.tags_engine}
		{#if props.tags}
			{@render props.tags({ tags: state.tags, engine: state.tags_engine })}
		{:else}
			<Tags
				embedded="select.tags"
				class="so-select__tags"
				ctrl={state.tags}
				engine={state.tags_engine}
			/>
		{/if}
	{/if}{@render props.leading?.()}
{/snippet}
{#snippet fieldTrailing()}
	<span class="so-select__arrow"
		>{#if props['arrow-icon']}
			{@render props['arrow-icon']()}
		{:else}
			<Icon embedded="select.arrow" tag={ARROW} size={state.size} />
		{/if}</span
	>{@render props.trailing?.()}
{/snippet}
<Dynamic
	rendered={state.rendered}
	tag="div"
	attributes={toRootProps(
		state,
		[state.dataset, state.attrs],
		toRootForward(binding.forwardProps),
	)}
	attach={binding.attachElement}
>
	{#if props.field}
		{@render props.field({ field })}
	{:else}
		<Input
			embedded="select.field"
			class="so-select__field"
			ctrl={field}
			id={state.id}
			leading={fieldLeading}
			trailing={fieldTrailing}
			clear={props.clear}
			{...state.aria}
			{...toControlAttrs<SelectAttributes>(binding.forwardProps)}
		/>
	{/if}<Frame
		onBundleCreate={state.ids_bindPanel}
		embedded="select.frame"
		class="so-select__panel"
		visible={state.visible && state.open}
		strategy="fixed"
		anchor_anchor={binding.rootElement}
		anchor_placement={state.panelPlacement}
		anchor_flip={state.panelFlip}
		anchor_matchWidth={state.autoFitWidth}
		anchor_offset={4}
		{...state.panelDataset}
		{...state.dismiss_ownerAttribute}
	>
		{#if state.handleRendered}
			<div class="so-select__handle" aria-hidden="true"></div>
		{/if}<div class="so-select__list" {...state.listAria}>
			<!-- Options from data from the panel's first opening on (`contentRendered`) -->
			{#if props.children}
				{@render props.children()}
			{:else if state.contentRendered}
				{#each state.drawnSections ?? [] as section, index (section.key)}
					{#if state.groupSeparators && index > 0}<div
							class="so-select__separator"
							aria-hidden="true"
						></div>{/if}{#if section.group}<SelectGroup label={section.group.label}
							>{@render entries(section.entries)}</SelectGroup
						>{:else}{@render entries(section.entries)}{/if}
				{/each}
			{/if}{#if state.shown?.length === 0}
				{@render props.empty?.()}
			{/if}
		</div>
	</Frame>
</Dynamic>
