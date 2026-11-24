<script lang="ts">
	import { Dynamic, roleIcon, toRootProps } from '../../adapter'
	import { Button } from '../button'
	import { Icon } from '../icon'
	import { setupScroller } from './setup.component'
	import type { ScrollerProps } from './base.component'

	let { ref = $bindable(), ...props }: ScrollerProps = $props()
	const mountId = $props.id()

	const binding = setupScroller(() => props, mountId, (node) => (ref = node))
	const state = binding.state

	// Одна иконка на обе кнопки: роли «влево» нет, стрелку в начало строки зеркалит тема
	const ARROW = roleIcon('arrowRight')

	// Firefox can restore disabled before hydration. Pass its button attribute through as HTML.
	const arrowAttributes = { autocomplete: 'off' }
</script>

<!--
	Кнопки снаружи вьюпорта: роль ряда (`listbox` у тегов) приходит на вьюпорт, а кнопке в
	листбоксе места нет. Вьюпорт — он же ряд, без дорожки: по его детям тема ставит снап, а плагин
	считает края. `tabindex` — набором и до `viewportAria`: значение потребителя сильнее, а роль из
	набора компилятор Svelte не видит и счёл бы остановку на `div` ошибкой доступности.
-->
<Dynamic
	rendered={state.rendered}
	tag={state.tag}
	attributes={toRootProps(
		state,
		[state.attrs, state.aria, state.dataset],
		binding.forwardProps,
	)}
	attach={binding.attachElement}
>
	<Button
		embedded="scroller.prev"
		type="button"
		{...arrowAttributes}
		class="so-scroller__prev"
		size={state.size}
		disabled={state.prevDisabled}
		{...state.prevAria}
	>
		{#if props['prev-icon']}
			{@render props['prev-icon']()}
		{:else}
			<Icon embedded="scroller.prev-icon" tag={ARROW} size={state.size} />
		{/if}
	</Button><div
		class="so-scroller__viewport"
		{...{ tabindex: state.viewportTabIndex }}
		{...state.viewportAria}
	>
		{@render props.children?.()}
	</div><Button
		embedded="scroller.next"
		type="button"
		{...arrowAttributes}
		class="so-scroller__next"
		size={state.size}
		disabled={state.nextDisabled}
		{...state.nextAria}
	>
		{#if props['next-icon']}
			{@render props['next-icon']()}
		{:else}
			<Icon embedded="scroller.next-icon" tag={ARROW} size={state.size} />
		{/if}
	</Button>
</Dynamic>
