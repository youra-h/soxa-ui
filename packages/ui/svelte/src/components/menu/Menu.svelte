<script lang="ts">
	import { Dynamic, toRootProps } from '../../adapter'
	import { Frame } from '../frame'
	import { drawItems } from './submenu/Submenu.svelte'
	import { setupMenu } from './setup.component'
	import type { MenuProps } from './base.component'

	let { ref = $bindable(), ...props }: MenuProps = $props()
	const mountId = $props.id()

	const binding = setupMenu(() => props, mountId, (node) => (ref = node))
	const state = binding.state
</script>

<!--
	Триггер — внутри корня: нажатие по открытому — нажатие внутри владельца, и панель не мигает.
	Открытость — `visible` панели, а не `rendered`: закрытие не должно вычищать коллекцию.
	Роль `menu` — у панели, а не у списка: узел с ролью и фокусом должен быть один.
	Части вплотную: пробел между блоками Svelte оставил бы в корне и в списке текстом.
-->
<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(state, [state.attrs, state.dataset], binding.forwardProps)}
	attach={binding.attachElement}
>
	{@render props.trigger?.({
		triggerAria:
			!binding.rootElement && state.triggerAria?.['aria-controls']
				? { ...state.triggerAria, 'aria-controls': null }
				: (state.triggerAria ?? {}),
		triggerDataset: state.triggerDataset ?? {},
	})}<Frame
		embedded="menu.frame"
		class={state.panelClasses}
		tabindex={-1}
		visible={state.visible && state.open}
		strategy="fixed"
		anchor_anchor={binding.rootElement}
		anchor_point={state.point}
		anchor_placement={state.placement}
		anchor_offset={4}
		{...state.aria}
		{...state.dismiss_ownerAttribute}
	>
		<!-- Items from the panel's first opening on (`contentRendered`) -->
		<div class="so-menu__list">
			{#if state.contentRendered}
				{#if props.children}
					{@render props.children()}
				{:else}
					{@render drawItems(state, props)}
				{/if}
			{/if}
		</div>
	</Frame>
</Dynamic>
