<script lang="ts">
	import { clickAction, Dynamic, roleIcon, toRootProps } from '../../adapter'
	import { Button } from '../button'
	import { Calendar } from '../calendar'
	import { DateInput } from '../date-input'
	import { Frame } from '../frame'
	import { Icon } from '../icon'
	import { setupDatePicker } from './setup.component'
	import type { DatePickerProps } from './base.component'

	let { ref = $bindable(), ...props }: DatePickerProps = $props()
	const mountId = $props.id()

	const binding = setupDatePicker(() => props, mountId, (node) => (ref = node))
	const state = binding.state
	const ctrl = binding.ctrl

	const CLOSE = roleIcon('close')
	const CALENDAR = roleIcon('calendar')

	const clear = clickAction((event) => {
		event.stopPropagation()
		ctrl.clear()
	})

	/** Closing itself drops the draft of the choice. */
	const cancel = clickAction(() => {
		ctrl.open = false
	})

	const confirm = clickAction(() => ctrl.confirm())
</script>

<!--
	DatePicker — кнопки диапазона стоят после поля конца, а не в его сниппете: они
	работают со всем периодом. Узлы вплотную: пробел между блоками Svelte оставил бы
	текстом.
-->
<!--
	Полю очистка уходит сниппетом без scope: поле позвало бы его со своей командой
	`clear`, а очищает DatePicker.
-->
{#snippet clearButton()}
	{#if props.clear}
		{@render props.clear({ clear: ctrl.clear })}
	{:else if state.clearable}
		<Button
			embedded="date-picker.clear"
			type="button"
			class="so-date-picker__clear"
			size={state.size}
			disabled={state.disabled}
			{...state.clearAria}
			{@attach clear}
		>
			<Icon embedded="date-picker.clear-icon" tag={CLOSE} size={state.size} />
		</Button>
	{/if}
{/snippet}
{#snippet trigger()}
	<Button
		embedded="date-picker.trigger"
		type="button"
		class="so-date-picker__trigger"
		size={state.size}
		disabled={!state.openable}
		{...state.triggerAria}
		{...state.triggerDataset}
	>
		{#if props['trigger-icon']}
			{@render props['trigger-icon']()}
		{:else}
			<Icon embedded="date-picker.trigger-icon" tag={CALENDAR} />
		{/if}
	</Button>
{/snippet}
<!-- Подвал — только при `confirmable`: сниппет непрозрачен, строка стояла бы пустой. -->
{#snippet footer()}
	<Button
		embedded="date-picker.cancel"
		type="button"
		class="so-date-picker__cancel"
		size={state.size}
		text={state.names_cancel}
		{@attach cancel}
	/><Button
		embedded="date-picker.confirm"
		type="button"
		class="so-date-picker__confirm"
		size={state.size}
		disabled={state.confirmDisabled}
		text={state.names_confirm}
		{@attach confirm}
	/>
{/snippet}
<Dynamic
	rendered={state.rendered}
	tag="div"
	attributes={{
		id: state.id,
		...toRootProps(
			state,
			[state.attrs, state.rootAria, state.dataset],
			binding.forwardProps,
		),
	}}
	attach={binding.attachElement}
>
	<!-- The name goes to the field: it is the group of the parts, so the name reaches them too. -->
	{#if state.mode === 'single'}<DateInput
			embedded="date-picker.field"
			class="so-date-picker__field"
			ctrl={ctrl.field}
			aria_label={props.aria_label}
			aria_labelledBy={props.aria_labelledBy}
			aria_describedBy={props.aria_describedBy}
			{...state.aria}
			clear={props.clear || state.clearable ? clearButton : undefined}
			trailing={trigger}
		/>{:else}<DateInput
			embedded="date-picker.start"
			class="so-date-picker__start"
			ctrl={ctrl.start}
			aria_label={state.names_start}
		/><span class="so-date-picker__dash" aria-hidden="true">–</span><DateInput
			embedded="date-picker.end"
			class="so-date-picker__end"
			ctrl={ctrl.end}
			aria_label={state.names_end}
		/>{@render clearButton()}{@render trigger()}{/if}<Frame
		onBundleCreate={state.ids_bindPanel}
		embedded="date-picker.frame"
		class="so-date-picker__panel"
		tabindex={-1}
		visible={state.visible && state.open}
		strategy="fixed"
		anchor_anchor={binding.rootElement}
		anchor_offset={4}
		{...state.panelAria}
		{...state.panelDataset}
		{...state.dismiss_ownerAttribute}
	>
		{#if state.handleRendered}<div
				class="so-date-picker__handle"
				aria-hidden="true"
			></div>{/if}<div class="so-date-picker__content">
			<!-- The calendar from the panel's first opening on (`contentRendered`) -->
			{#if state.contentRendered}
				<Calendar
					embedded="date-picker.calendar"
					class="so-date-picker__calendar"
					ctrl={ctrl.calendar}
					engine={ctrl.engine}
					item={props.item}
					footer={state.confirmable ? footer : undefined}
				/>
			{/if}
		</div>
	</Frame>
</Dynamic>
