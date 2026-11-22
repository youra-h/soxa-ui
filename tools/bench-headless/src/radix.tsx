import { Checkbox, Dialog, Label, Select, Tabs } from 'radix-ui'

export function FormDemo() {
	return (
		<form>
			<Label.Root htmlFor="name">Name</Label.Root>
			<input id="name" name="name" />
			<Label.Root htmlFor="accept">Accept</Label.Root>
			<Checkbox.Root id="accept" name="accept">
				<Checkbox.Indicator>Selected</Checkbox.Indicator>
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
			<Dialog.Portal>
				<Dialog.Overlay />
				<Dialog.Content>
					<Dialog.Title>Settings</Dialog.Title>
					<Dialog.Description>Edit settings</Dialog.Description>
					<label>
						Name
						<input />
					</label>
					<Dialog.Close>Close</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}

export function SelectDemo() {
	return (
		<>
			<Label.Root htmlFor="choice">Choice</Label.Root>
			<Select.Root>
				<Select.Trigger id="choice">
					<Select.Value placeholder="Choose" />
				</Select.Trigger>
				<Select.Portal>
					<Select.Content>
						<Select.Viewport>
							<Select.Item value="alpha">
								<Select.ItemText>Alpha</Select.ItemText>
							</Select.Item>
							<Select.Item value="beta">
								<Select.ItemText>Beta</Select.ItemText>
							</Select.Item>
						</Select.Viewport>
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</>
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
