import { useState } from 'react'
import type { ICheckBoxProps, IDatePickerProps, ISelectProps, TValuePayload } from '@soxa-ui/core'
import { Accordion, Button, CheckBox, DatePicker, Input, Label, Select } from '@soxa-ui/react'
import CtrlExample from './CtrlExample'

const cities = [
	{ value: 'kzn', text: 'Kazan' },
	{ value: 'msk', text: 'Moscow' },
]

export default function TravelRecipes() {
	const [name, setName] = useState('')
	const [accepted, setAccepted] = useState<ICheckBoxProps['value']>(false)
	const [city, setCity] = useState<ISelectProps['value']>('kzn')
	const [date, setDate] = useState<IDatePickerProps['value']>('2026-11-14')
	const [lastChange, setLastChange] = useState('')
	const [submitted, setSubmitted] = useState(false)
	const [mounted, setMounted] = useState(true)
	const changed = ({ newValue }: TValuePayload<string>) => {
		setName(newValue)
		setLastChange(newValue)
	}

	return (
		<main>
			<h1>Travel preferences</h1>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					setSubmitted(true)
				}}
			>
				<label htmlFor="traveler-name">Traveler name</label>
				<Input id="traveler-name" value={name} onChangeValue={changed} />
				<Label text="Accept travel policy">
					<CheckBox
						tag="span"
						value={accepted}
						onChangeValue={({ newValue }) => setAccepted(newValue)}
					/>
				</Label>
				<Select
					value={city}
					onChangeValue={({ newValue }) => setCity(newValue)}
					items={cities}
					aria_label="Destination"
					item={({ text }) => <span>{text}</span>}
				/>
				<DatePicker
					value={date}
					onChangeValue={({ newValue }) => setDate(newValue)}
					aria_label="Departure"
					timeZone="UTC"
				/>
				<Button type="button" text="Reset name" onActionClick={() => setName('Reset')} />
				<Button type="submit" text="Save preferences" variant="accent" />
				<output data-testid="values">
					{name}|{String(accepted)}|{String(city)}|{String(date)}
				</output>
				<output data-testid="change">{lastChange}</output>
				{submitted && <output>Preferences saved</output>}
			</form>
			<Accordion>
				<Accordion.Item
					value="help"
					text="Travel help"
					header={({ text, selected }) => (
						<>
							{text}: {selected ? 'open' : 'closed'}
						</>
					)}
				>
					<p>Bring your travel documents.</p>
				</Accordion.Item>
			</Accordion>
			<Button
				type="button"
				text="Toggle controller"
				onActionClick={() => setMounted(!mounted)}
			/>
			{mounted && <CtrlExample />}
			{false && (
				// @ts-expect-error Boolean props must stay typed in the consumer.
				<Button disabled="yes" />
			)}
		</main>
	)
}
