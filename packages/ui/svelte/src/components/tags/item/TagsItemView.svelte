<script lang="ts">
	import type { createSvelteAdapterContext } from '../../../adapter'
	import { clickAction, Dynamic, roleIcon, toControlAttrs, toRootForward, toRootProps } from '../../../adapter'
	import { Button } from '../../button'
	import { ItemRow } from '../../item-row'
	import { Icon } from '../../icon'
	import { setupTagsItem } from './setup.component'
	import type { TagsItemAttributes, TagsItemProps } from './base.component'

	type ViewProps = TagsItemProps & {
		create?: typeof createSvelteAdapterContext
	}

	let { ref = $bindable(), create, ...props }: ViewProps = $props()
	const mountId = $props.id()

	const binding = setupTagsItem(() => props, mountId, (node) => (ref = node), () => create)
	const state = binding.state
	const context = binding.context

	const CLOSE = roleIcon('close')

	// The action plugin makes Enter and Space activate the row.
	function toggle(): void {
		context?.adapters.selection.toggle()
	}

	// Stopped at the cross: the roots of the tag and the set would give `action:press`,
	// and the Select field the tags stand in would open its panel
	const close = clickAction((event) => {
		event.stopPropagation()
		context?.adapters.tags.close()
	})
</script>

<!--
	The root covers the row and close button. Keep the close button beside the option
	to preserve the option's accessible name. Adjacent markup avoids a Svelte text node.
-->
<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(
		state,
		[state.rootAria, state.dataset, state.attrs],
		toRootForward(binding.forwardProps),
	)}
	attach={binding.attachElement}
>
	<ItemRow
		embedded="tags.row"
		tag="div"
		direction={state.direction}
		disabled={state.disabled}
		size={state.size}
		variant={state.variant}
		leading={props.leading}
		trailing={props.trailing}
		onActionPress={toggle}
		{...state.aria}
		{...toControlAttrs<TagsItemAttributes>(binding.forwardProps)}
	>
		{#if props.children}
			{@render props.children({
				text: state.text ?? '',
				selected: state.selected ?? false,
			})}
		{:else}
			{state.text}
		{/if}
	</ItemRow>{#if state.tag_closable === true}<Button
		embedded="tags.close"
		type="button"
		class="so-tags-item__close"
		disabled={state.disabled}
		size={state.size}
		{...state.closeAria}
		{@attach close}
	>
		{#if props['close-icon']}
			{@render props['close-icon']()}
		{:else}
			<Icon embedded="tags.close-icon" tag={CLOSE} size={state.size} />
		{/if}
	</Button>{/if}
</Dynamic>
