import { createSignal, onMount, onCleanup, Show } from 'solid-js'
import { A } from '@solidjs/router'
import { TButton } from '@soxa-ui/core'
import type { ICheckBoxProps, ISelectProps, IDatePickerProps } from '@soxa-ui/core'
import {
	Accordion,
	Button,
	CheckBox,
	DatePicker,
	Input,
	Label,
	LocaleProvider,
	Select,
} from '@soxa-ui/solid'
import { enUS } from '@soxa-ui/plugins'

function SeatCounter() {
	const controller = new TButton({ text: 'Reserve seat' })
	const [events, setEvents] = createSignal(0)
	let root: Element | undefined

	onMount(() => {
		const changed = () => setEvents((n) => n + 1)
		controller.events.on('change:text', changed)
		window.dispatchEvent(new CustomEvent('workshop-lifecycle', { detail: 'mount' }))
		onCleanup(() => {
			controller.events.off('change:text', changed)

			// The verifier checks that a disposed subscription cannot observe this change.
			controller.text = 'Disposed'
			window.dispatchEvent(
				new CustomEvent('workshop-lifecycle', {
					detail: { kind: 'cleanup', finalCount: events() },
				}),
			)
		})
	})

	return (
		<section aria-label="Seat controller">
			<Button
				ctrl={controller}
				type="button"
				ref={(el) => {
					root = el
				}}
				onActionClick={() => {
					controller.text =
						controller.text === 'Reserve seat' ? 'Seat reserved' : 'Reserve seat'
				}}
			/>
			<button
				type="button"
				onClick={() => {
					if (root instanceof HTMLElement) root.focus()
				}}
			>
				Focus seat action
			</button>
			<output data-testid="controller-count">{events()}</output>
		</section>
	)
}

export default function Workshop() {
	const [attendee, setAttendee] = createSignal('')
	const [consent, setConsent] = createSignal<ICheckBoxProps['value']>(false)
	const [session, setSession] = createSignal<ISelectProps['value']>('clay')
	const [day, setDay] = createSignal<IDatePickerProps['value']>('2026-11-20')
	const [payload, setPayload] = createSignal('')
	const [saved, setSaved] = createSignal(false)
	const [showCounter, setShowCounter] = createSignal(true)

	return (
		<LocaleProvider locale={enUS}>
			<main data-so-theme="oren">
				<h1>Studio workshop registration</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						setSaved(true)
					}}
				>
					<Label text="Attendee name">
						<Input
							value={attendee()}
							onChangeValue={(e) => {
								setAttendee(e.newValue)
								setPayload(JSON.stringify(e))
							}}
						/>
					</Label>
					<Label text="Agree to studio rules">
						<CheckBox
							tag="span"
							value={consent()}
							onChangeValue={(e) => setConsent(e.newValue)}
						/>
					</Label>
					<Select
						aria_label="Workshop session"
						value={session()}
						onChangeValue={(e) => setSession(e.newValue)}
						items={[
							{ value: 'clay', text: 'Clay sculpture' },
							{ value: 'ink', text: 'Ink drawing' },
							{ value: 'wood', text: 'Wood carving' },
						]}
						item={(scope) => <span>Studio: {scope.text}</span>}
					/>
					<DatePicker
						aria_label="Workshop date"
						value={day()}
						onChangeValue={(e) => setDay(e.newValue)}
						timeZone="UTC"
					/>
					<Button
						type="button"
						text="Use guest registration"
						onActionClick={() => {
							setAttendee('Guest')
							setConsent(true)
							setSession('ink')
							setDay('2026-11-22')
						}}
					/>
					<Button type="submit" variant="accent" text="Register workshop" />
					<output data-testid="values">
						{JSON.stringify({
							attendee: attendee(),
							consent: consent(),
							session: session(),
							day: day(),
						})}
					</output>
					<output data-testid="payload">{payload()}</output>
					<Show when={saved()}>
						<p role="status">Registration recorded</p>
					</Show>
				</form>
				<Accordion>
					<Accordion.Item
						value="materials"
						text="Materials included"
						header={(scope) => (
							<span>
								{scope.text} — {scope.selected ? 'expanded' : 'collapsed'}
							</span>
						)}
					>
						<p>Clay, tools and aprons are provided.</p>
					</Accordion.Item>
				</Accordion>
				<button type="button" onClick={() => setShowCounter((v) => !v)}>
					Toggle seat counter
				</button>
				<Show when={showCounter()}>
					<SeatCounter />
				</Show>
				<A href="/away">Visit studio information</A>
				{false && (
					// @ts-expect-error disabled must retain its boolean public contract.
					<Button disabled="invalid" />
				)}
			</main>
		</LocaleProvider>
	)
}
