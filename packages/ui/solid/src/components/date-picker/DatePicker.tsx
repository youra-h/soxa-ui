import type { JSX } from 'solid-js'
import { Elevate, ResolvedSlot, clickAction, createRootProps, roleIcon } from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Button } from '../button'
import { Calendar } from '../calendar'
import { DateInput } from '../date-input'
import { Frame } from '../frame'
import { Icon } from '../icon'
import { setupDatePicker } from './setup.component'
import type { DatePickerProps } from './base.component'

/** Глифы кнопок — компоненты на роль: `tag` у Icon — корень, а не роль. */
const CloseGlyph = roleIcon('close')
const CalendarGlyph = roleIcon('calendar')

/**
 * Поле даты и календарь в панели, как Select — поле и список. Подвал календаря задан
 * значением только при `confirmable`: `Show` в слоте оставил бы пустую строку подвала.
 */
export function DatePicker(props: DatePickerProps): JSX.Element {
	const binding = setupDatePicker(props)
	const state = binding.state
	const ctrl = binding.ctrl
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.rootAria, state.dataset],
		forward: binding.forwardProps(),
	}))

	/** Clears by the DatePicker's command; the click does not bubble to an ancestor that listens to the field. */
	const clear = clickAction((event) => {
		event.stopPropagation()
		ctrl.clear()
	})
	const cancel = clickAction(() => {
		ctrl.open = false
	})
	const confirm = clickAction(() => ctrl.confirm())

	/** Встроенная кнопка очистки — по `clearable`. */
	const clearButton = () => (
		<Show when={state.clearable}>
			<Button
				embedded="date-picker.clear"
				type="button"
				class="so-date-picker__clear"
				size={state.size}
				disabled={state.disabled}
				{...state.clearAria}
				ref={clear}
			>
				<Icon embedded="date-picker.clear-icon" tag={CloseGlyph} size={state.size} />
			</Button>
		</Show>
	)

	/**
	 * Очистка — своя кнопка из слота `clear` с командой DatePicker в scope или встроенная.
	 * Полю уходит готовыми узлами: функцию слота поле позвало бы со своей командой `clear`.
	 */
	const clearSlot = () => (
		<ResolvedSlot
			content={props.clear}
			scope={() => ({ clear: ctrl.clear })}
			fallback={clearButton()}
		/>
	)

	/** Кнопка календаря: связка с панелью, вид «нажат», значок — слот `trigger-icon`. */
	const trigger = () => (
		<Button
			embedded="date-picker.trigger"
			type="button"
			class="so-date-picker__trigger"
			size={state.size}
			disabled={!state.openable}
			{...state.triggerAria}
			{...state.triggerDataset}
		>
			<ResolvedSlot
				content={props['trigger-icon']}
				fallback={<Icon embedded="date-picker.trigger-icon" tag={CalendarGlyph} />}
			/>
		</Button>
	)

	/** Одна дата: поле с именем DatePicker, очистка и кнопка календаря — в его слотах. */
	const single = () => (
		<DateInput
			embedded="date-picker.field"
			class="so-date-picker__field"
			ctrl={ctrl.field}
			aria_label={props.aria_label}
			aria_labelledBy={props.aria_labelledBy}
			aria_describedBy={props.aria_describedBy}
			{...state.aria}
			clear={clearSlot()}
			trailing={trigger()}
		/>
	)

	/** Диапазон: поля концов через тире, очистка периода и кнопка календаря. */
	const range = () => (
		<>
			<DateInput
				embedded="date-picker.start"
				class="so-date-picker__start"
				ctrl={ctrl.start}
				aria_label={state.names_start}
			/>
			<span class="so-date-picker__dash" aria-hidden="true">
				–
			</span>
			<DateInput
				embedded="date-picker.end"
				class="so-date-picker__end"
				ctrl={ctrl.end}
				aria_label={state.names_end}
			/>
			{clearSlot()}
			{trigger()}
		</>
	)

	/** Подвал календаря: «Отмена», затем «OK». Задан он, только пока `confirmable`. */
	const footer = () => (
		<>
			<Button
				embedded="date-picker.cancel"
				type="button"
				class="so-date-picker__cancel"
				size={state.size}
				text={state.names_cancel}
				ref={cancel}
			/>
			<Button
				embedded="date-picker.confirm"
				type="button"
				class="so-date-picker__confirm"
				size={state.size}
				disabled={state.confirmDisabled}
				text={state.names_confirm}
				ref={confirm}
			/>
		</>
	)

	return (
		<Show when={state.rendered}>
			<div id={state.id} {...root()} ref={binding.ref}>
				<Elevate layer={binding.layer}>
					<Show when={state.mode === 'single'} fallback={range()}>
						{single()}
					</Show>
					<Frame
						onBundleCreate={state.ids_bindPanel}
						embedded="date-picker.frame"
						class="so-date-picker__panel"
						tabindex="-1"
						visible={state.visible && state.open}
						strategy="fixed"
						anchor_anchor={binding.rootElement()}
						anchor_offset={4}
						{...state.panelAria}
						{...state.panelDataset}
						{...state.dismiss_ownerAttribute}
					>
						<Show when={state.handleRendered}>
							<div class="so-date-picker__handle" aria-hidden="true" />
						</Show>
						{/* The calendar from the panel's first opening on (`contentRendered`) */}
						<div class="so-date-picker__content">
							<Show when={state.contentRendered}>
								<Calendar
									embedded="date-picker.calendar"
									class="so-date-picker__calendar"
									ctrl={binding.calendar}
									engine={binding.engine}
									item={props.item}
									footer={state.confirmable && footer()}
								/>
							</Show>
						</div>
					</Frame>
				</Elevate>
			</div>
		</Show>
	)
}
