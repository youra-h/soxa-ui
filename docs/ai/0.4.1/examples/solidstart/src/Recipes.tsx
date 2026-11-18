import { createSignal, Show } from 'solid-js'
import { enUS } from '@soxa-ui/plugins'
import type { ICheckBoxProps, IDatePickerProps, ISelectProps } from '@soxa-ui/core'
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
import CtrlExample from './CtrlExample'

const cities = [
	{ value: 'kzn', text: 'Kazan' },
	{ value: 'msk', text: 'Moscow' },
]

export default function Recipes() {
	const [name, setName] = createSignal('')
	const [accepted, setAccepted] = createSignal<ICheckBoxProps['value']>(false)
	const [city, setCity] = createSignal<ISelectProps['value']>('kzn')
	const [date, setDate] = createSignal<IDatePickerProps['value']>('2026-11-14')
	const [lastChange, setLastChange] = createSignal('')
	const [submitted, setSubmitted] = createSignal(false)
	const [mounted, setMounted] = createSignal(true)

	return (
		<LocaleProvider locale={enUS}>
			<main data-so-theme="oren">
				<h1>Travel preferences</h1>
				<form
					onSubmit={(event) => {
						event.preventDefault()
						setSubmitted(true)
					}}
				>
					<Label text="Traveler name">
						<Input
							value={name()}
							onChangeValue={(event) => {
								setName(event.newValue)
								setLastChange(event.newValue)
							}}
						/>
					</Label>
					<Label text="Accept travel policy">
						<CheckBox
							tag="span"
							value={accepted()}
							onChangeValue={(event) => setAccepted(event.newValue)}
						/>
					</Label>
					<Select
						value={city()}
						onChangeValue={(event) => setCity(event.newValue)}
						items={cities}
						aria_label="Destination"
						item={(scope) => <span>{scope.text}</span>}
					/>
					<DatePicker
						value={date()}
						onChangeValue={(event) => setDate(event.newValue)}
						aria_label="Departure"
						timeZone="UTC"
					/>
					<Button
						type="button"
						text="Reset name"
						onActionClick={() => setName('Reset')}
					/>
					<Button type="submit" text="Save preferences" variant="accent" />
					<output data-testid="values">
						{name()}|{String(accepted())}|{String(city())}|{String(date())}
					</output>
					<output data-testid="change">{lastChange()}</output>
					<Show when={submitted()}>
						<output>Preferences saved</output>
					</Show>
				</form>
				<Accordion>
					<Accordion.Item
						value="help"
						text="Travel help"
						header={(scope) => (
							<>
								{scope.text}: {scope.selected ? 'open' : 'closed'}
							</>
						)}
					>
						<p>Bring your travel documents.</p>
					</Accordion.Item>
				</Accordion>
				<Button
					type="button"
					text="Toggle controller"
					onActionClick={() => setMounted((value) => !value)}
				/>
				<Show when={mounted()}>
					<CtrlExample />
				</Show>
				{false && (
					// @ts-expect-error Consumer props must retain their public types.
					<Button disabled="yes" />
				)}
			</main>
		</LocaleProvider>
	)
}
