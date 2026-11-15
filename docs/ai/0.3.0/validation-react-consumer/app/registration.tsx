'use client'
import { useState } from 'react'
import type { ICheckBoxProps, TValuePayload } from '@soxa-ui/core'
import { Accordion, Button, CheckBox, Input, Label } from '@soxa-ui/react'
export function Registration() {
	const [attendee, setAttendee] = useState('')
	const [consent, setConsent] = useState<ICheckBoxProps['value']>(false)
	const [receipt, setReceipt] = useState('')
	const [audit, setAudit] = useState('')
	const updateAttendee = ({ newValue, oldValue }: TValuePayload<string>) => {
		setAttendee(newValue)
		setAudit(`${oldValue} -> ${newValue}`)
	}
	return (
		<section aria-label="Workshop registration">
			<h1>Register for the accessibility workshop</h1>
			<form
				onSubmit={(event) => {
					event.preventDefault()
					setReceipt(`${attendee}: ${consent ? 'confirmed' : 'pending consent'}`)
				}}
			>
				<label htmlFor="workshop-attendee">Attendee name</label>
				<Input id="workshop-attendee" value={attendee} onChangeValue={updateAttendee} />
				<Label text="Send workshop reminders">
					<CheckBox
						tag="span"
						value={consent}
						onChangeValue={({ newValue }) => setConsent(newValue)}
					/>
				</Label>
				<Button
					type="button"
					text="Use guest name"
					onActionClick={() => setAttendee('Guest attendee')}
				/>
				<Button type="submit" variant="accent" text="Reserve a seat" />
				<output data-testid="state">
					{attendee}|{String(consent)}
				</output>
				<output data-testid="audit">{audit}</output>
				<output data-testid="receipt">{receipt}</output>
			</form>
			<Accordion mode="single">
				<Accordion.Item
					value="arrival"
					text="Arrival instructions"
					header={({ text, selected }) => (
						<span>
							{text} ({selected ? 'expanded' : 'collapsed'})
						</span>
					)}
				>
					<p>Check in at reception ten minutes before the workshop.</p>
				</Accordion.Item>
			</Accordion>
			{false && (
				// @ts-expect-error The public boolean prop must reject a string.
				<CheckBox disabled="invalid" />
			)}
		</section>
	)
}
