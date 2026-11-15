import { Button, DatePicker, Input, Select, Table, Tabs } from '@soxa-ui/react'
import { DialogDemo } from './dialog-demo'

const cities = [
	{ value: 'kzn', text: 'Kazan' },
	{ value: 'msk', text: 'Moscow' },
	{ value: 'oms', text: 'Omsk' },
]

const columns = [
	{ field: 'name', text: 'Name', rowHeader: true },
	{ field: 'age', text: 'Age', align: 'end' as const },
]

const rows = [{ data: { name: 'Anna', age: 30 } }, { data: { name: 'Boris', age: 41 } }]

/**
 * A server component, as a page of Next.js is by default: it renders the
 * library's components without a `'use client'` of its own. The tabs write
 * their parts through the owner (`Tabs.Item`, `Tabs.Content`): a part a server
 * component does not get is `undefined`, and the prerender of `next build`
 * fails on it.
 */
export default function Home() {
	return (
		<main>
			<DialogDemo />
			<Input placeholder="Name" aria_label="Name" />
			<Select placeholder="City" aria_label="City" items={cities} />
			<Table aria_label="Staff" columns={columns} items={rows} />
			<DatePicker aria_label="Date" />
			<div data-initial-source>
				<Tabs
					aria_label="Settings"
					initial={{
						items: [
							{ value: 'general', text: 'General' },
							{
								value: 'privacy',
								text: 'Privacy',
								id: 'privacy-tab',
								_: { active: true },
							},
						],
						panels: [
							{ value: 'general', id: 'general-panel' },
							{ value: 'privacy', id: 'privacy-panel' },
						],
					}}
					content={
						<>
							<Tabs.Content initial={0}>General settings</Tabs.Content>
							<Tabs.Content initial={1}>Privacy settings</Tabs.Content>
						</>
					}
				>
					<Tabs.Item initial={0} />
					<Tabs.Item initial={1} />
				</Tabs>
			</div>
			{false && (
				// @ts-expect-error `disabled` is a boolean: the adapter's types reach the project
				<Button disabled="yes" />
			)}
		</main>
	)
}
