import { useState } from 'react'
import { CheckBox, Dialog, Input, Label, Select, Tabs } from '@soxa-ui/react'

const items = [
	{ value: 'alpha', text: 'Alpha' },
	{ value: 'beta', text: 'Beta' },
]

export function FormDemo() {
	return (
		<form>
			<Label text="Name">
				<Input name="name" />
			</Label>
			<Label text="Accept">
				<CheckBox name="accept" icon="Selected" />
			</Label>
		</form>
	)
}

export function DeclarativeTabsDemo() {
	return (
		<Tabs
			aria-label="Sections"
			content={
				<>
					<Tabs.Content value="alpha">Alpha panel</Tabs.Content>
					<Tabs.Content value="beta">Beta panel</Tabs.Content>
				</>
			}
		>
			<Tabs.Item value="alpha" text="Alpha" active />
			<Tabs.Item value="beta" text="Beta" />
		</Tabs>
	)
}

export function DialogDemo() {
	const [open, setOpen] = useState(false)
	return (
		<>
			<button onClick={() => setOpen(true)}>Open</button>
			<Dialog
				visible={open}
				onChangeVisible={({ newValue }) => setOpen(newValue)}
				title="Settings"
				close-icon="Close"
			>
				<p>Edit settings</p>
				<label>
					Name
					<input />
				</label>
				<button onClick={() => setOpen(false)}>Close</button>
			</Dialog>
		</>
	)
}

export function SelectDemo() {
	return (
		<Label text="Choice">
			<Select
				items={items}
				arrow-icon={<span aria-hidden="true">Choose</span>}
				item-indicator-icon={<span aria-hidden="true">Selected</span>}
			/>
		</Label>
	)
}

export function ComboboxDemo() {
	return (
		<Label text="Choice">
			<Select
				editable
				editableMode="filter"
				items={items}
				arrow-icon={<span aria-hidden="true">Choose</span>}
				item-indicator-icon={<span aria-hidden="true">Selected</span>}
			/>
		</Label>
	)
}

export function TabsDemo() {
	return (
		<Tabs
			aria_label="Sections"
			initial={{
				items: [
					{ value: 'alpha', text: 'Alpha', _: { active: true } },
					{ value: 'beta', text: 'Beta' },
				],
				panels: [{ value: 'alpha' }, { value: 'beta' }],
			}}
			content={
				<>
					<Tabs.Content initial={0}>Alpha panel</Tabs.Content>
					<Tabs.Content initial={1}>Beta panel</Tabs.Content>
				</>
			}
		/>
	)
}
