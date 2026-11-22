import { useState } from 'react'
import { Checkbox } from '@ark-ui/react/checkbox'
import { Dialog } from '@ark-ui/react/dialog'
import { Field } from '@ark-ui/react/field'
import { Tabs } from '@ark-ui/react/tabs'
import { Select, createListCollection } from '@ark-ui/react/select'
import { Combobox } from '@ark-ui/react/combobox'

const items = [
	{ value: 'alpha', label: 'Alpha' },
	{ value: 'beta', label: 'Beta' },
]
const optionsCollection = createListCollection({ items })

export function FormDemo() {
	return (
		<form>
			<Field.Root>
				<Field.Label>Name</Field.Label>
				<Field.Input name="name" />
			</Field.Root>
			<Checkbox.Root name="accept">
				<Checkbox.Label>Accept</Checkbox.Label>
				<Checkbox.Control />
				<Checkbox.HiddenInput />
			</Checkbox.Root>
		</form>
	)
}

export function TabsDemo() {
	return (
		<Tabs.Root defaultValue="alpha">
			<Tabs.List aria-label="Sections">
				<Tabs.Trigger value="alpha">Alpha</Tabs.Trigger>
				<Tabs.Trigger value="beta">Beta</Tabs.Trigger>
			</Tabs.List>
			<Tabs.Content value="alpha">Alpha panel</Tabs.Content>
			<Tabs.Content value="beta">Beta panel</Tabs.Content>
		</Tabs.Root>
	)
}

export function DialogDemo() {
	return (
		<Dialog.Root>
			<Dialog.Trigger>Open</Dialog.Trigger>
			<Dialog.Backdrop />
			<Dialog.Positioner>
				<Dialog.Content>
					<Dialog.Title>Settings</Dialog.Title>
					<Dialog.Description>Edit settings</Dialog.Description>
					<label>
						Name
						<input />
					</label>
					<Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
				</Dialog.Content>
			</Dialog.Positioner>
		</Dialog.Root>
	)
}

export function SelectDemo() {
	return (
		<Select.Root collection={optionsCollection}>
			<Select.Label>Choice</Select.Label>
			<Select.Control>
				<Select.Trigger>
					<Select.ValueText placeholder="Choose" />
				</Select.Trigger>
			</Select.Control>
			<Select.Positioner>
				<Select.Content>
					{items.map((item) => (
						<Select.Item key={item.value} item={item}>
							<Select.ItemText>{item.label}</Select.ItemText>
							<Select.ItemIndicator>Selected</Select.ItemIndicator>
						</Select.Item>
					))}
				</Select.Content>
			</Select.Positioner>
			<Select.HiddenSelect />
		</Select.Root>
	)
}

export function ComboboxDemo() {
	const [query, setQuery] = useState('')
	const filtered = createListCollection({
		items: items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
	})
	return (
		<Combobox.Root
			collection={filtered}
			onInputValueChange={(event) => setQuery(event.inputValue)}
		>
			<Combobox.Label>Choice</Combobox.Label>
			<Combobox.Control>
				<Combobox.Input />
				<Combobox.Trigger>Choose</Combobox.Trigger>
			</Combobox.Control>
			<Combobox.Positioner>
				<Combobox.Content>
					{filtered.items.map((item) => (
						<Combobox.Item key={item.value} item={item}>
							<Combobox.ItemText>{item.label}</Combobox.ItemText>
							<Combobox.ItemIndicator>Selected</Combobox.ItemIndicator>
						</Combobox.Item>
					))}
				</Combobox.Content>
			</Combobox.Positioner>
		</Combobox.Root>
	)
}

export function AppDemo() {
	return (
		<>
			<section aria-label="Form">
				<FormDemo />
			</section>
			<section aria-label="Tabs">
				<TabsDemo />
			</section>
			<section aria-label="Dialog">
				<DialogDemo />
			</section>
			<section aria-label="Select">
				<SelectDemo />
			</section>
		</>
	)
}
