<script lang="ts">
	import { Accordion, Button, CheckBox, DatePicker, Input, Label, Select } from '@soxa-ui/svelte'
	import type { ICheckBoxProps, IDatePickerProps, ISelectProps, ISelectItem, TValuePayload } from '@soxa-ui/core'
	import CtrlExample from './CtrlExample.svelte'

	let name = $state('')
	let accepted = $state<ICheckBoxProps['value']>(false)
	let city = $state<ISelectProps['value']>('kzn')
	let date = $state<IDatePickerProps['value']>('2026-11-14')
	let oldValue = $state('')
	let lastChange = $state('')
	let submitted = $state(false)
	let controller = $state(true)
	const cities = [
		{ value: 'kzn', text: 'Kazan' },
		{ value: 'msk', text: 'Moscow' },
	]

	function changed(event: TValuePayload<string>) {
		oldValue = event.oldValue
		name = event.newValue
		lastChange = event.newValue
	}

	function save(event: SubmitEvent) {
		event.preventDefault()
		submitted = true
	}
</script>

{#snippet optionLeading({ item }: { item: ISelectItem })}
	<span aria-hidden="true">{item.text === 'Kazan' ? 'K' : 'M'}</span>
{/snippet}

<main>
	<h1>Travel preferences</h1>
	<form onsubmit={save}>
		<Label text="Traveler name">
			<Input value={name} onChangeValue={changed} />
		</Label>
		<Label text="Accept travel policy">
			<CheckBox tag="span" value={accepted} onChangeValue={({ newValue }) => (accepted = newValue)} />
		</Label>
		<Select
			value={city}
			items={cities}
			item-leading={optionLeading}
			aria_label="Destination"
			onChangeValue={({ newValue }) => (city = newValue)}
		>
			{#snippet item({ text })}<span>{text}</span>{/snippet}
		</Select>
		<DatePicker
			value={date}
			aria_label="Departure"
			timeZone="UTC"
			onChangeValue={({ newValue }) => (date = newValue)}
		/>
		<Button type="submit" text="Save preferences" variant="accent" />
		<Button type="button" text="Reset name" onclick={() => (name = 'Reset')} />
		<output data-testid="values">{name}|{accepted}|{city}|{date}</output>
		<output data-testid="old-value">{oldValue}</output>
		<output data-testid="change">{lastChange}</output>
		{#if submitted}<output>Preferences saved</output>{/if}
	</form>

	<Accordion>
		<Accordion.Item value="help" text="Travel help">
			{#snippet header({ text, selected })}{text}: {selected ? 'open' : 'closed'}{/snippet}
			<p>Bring your travel documents.</p>
		</Accordion.Item>
	</Accordion>
	<Button type="button" text="Toggle controller" onclick={() => (controller = !controller)} />
	{#if controller}<CtrlExample />{/if}
</main>
