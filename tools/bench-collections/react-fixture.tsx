import { Fragment, useState } from 'react'
import { Tabs, Tags } from '@soxa-ui/react'
import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import { Listbox, createListCollection } from '@ark-ui/react/listbox'
import MuiTabs from '@mui/material/Tabs'
import MuiTab from '@mui/material/Tab'
import Chip from '@mui/material/Chip'
import { Tabs as ShTabs, TabsList, TabsTrigger, TabsContent } from './shadcn/tabs'
import { ToggleGroup, ToggleGroupItem } from './shadcn/toggle-group'
import './shadcn/styles.css'
import type { Spec } from './data'

export function Fixture({ spec: s }: { spec: Spec }) {
	const [value, setValue] = useState('v1')
	if (s.library === 'mui') {
		if (s.kind === 'tags')
			return (
				<div role="listbox" aria-label="Items">
					{s.items.map((item) => (
						<Chip
							key={item.value}
							role="option"
							aria-selected={value === item.value}
							color={value === item.value ? 'primary' : 'default'}
							tabIndex={value === item.value ? 0 : -1}
							label={item.text}
							onClick={() => setValue(item.value)}
						/>
					))}
				</div>
			)
		return (
			<>
				<MuiTabs value={value} onChange={(_, next) => setValue(next)} aria-label="Items">
					{s.items.map((item, i) => (
						<MuiTab
							key={item.value}
							value={item.value}
							id={`tab-${i}`}
							aria-controls={`panel-${i}`}
							label={item.text}
						/>
					))}
				</MuiTabs>
				{s.items.map((item, i) =>
					value === item.value ? (
						<div
							key={item.value}
							role="tabpanel"
							id={`panel-${i}`}
							aria-labelledby={`tab-${i}`}
						>
							Panel {i}
						</div>
					) : null,
				)}
			</>
		)
	}
	if (s.library === 'shadcn') {
		if (s.kind === 'tags')
			return (
				<ToggleGroup type="single" defaultValue="v1" aria-label="Items">
					{s.items.map((item) => (
						<ToggleGroupItem data-bench-option key={item.value} value={item.value}>
							{item.text}
						</ToggleGroupItem>
					))}
				</ToggleGroup>
			)
		return (
			<ShTabs defaultValue="v1">
				<TabsList aria-label="Items">
					{s.items.map((item) => (
						<TabsTrigger key={item.value} value={item.value}>
							{item.text}
						</TabsTrigger>
					))}
				</TabsList>
				{s.items.map((item, i) => (
					<TabsContent key={item.value} value={item.value}>
						Panel {i}
					</TabsContent>
				))}
			</ShTabs>
		)
	}
	if (s.library === 'ark') {
		if (s.kind === 'tags') {
			const list = createListCollection({
				items: s.items,
				itemToString: (item) => item.text,
				itemToValue: (item) => item.value,
			})
			return (
				<Listbox.Root collection={list} defaultValue={['v1']}>
					<Listbox.Content aria-label="Items">
						{s.items.map((item) => (
							<Listbox.Item key={item.value} item={item}>
								<Listbox.ItemText>{item.text}</Listbox.ItemText>
							</Listbox.Item>
						))}
					</Listbox.Content>
				</Listbox.Root>
			)
		}
		return (
			<ArkTabs.Root defaultValue="v1" lazyMount unmountOnExit>
				<ArkTabs.List aria-label="Items">
					{s.items.map((item) => (
						<ArkTabs.Trigger key={item.value} value={item.value}>
							{item.text}
						</ArkTabs.Trigger>
					))}
				</ArkTabs.List>
				{s.items.map((item, i) => (
					<ArkTabs.Content key={item.value} value={item.value}>
						Panel {i}
					</ArkTabs.Content>
				))}
			</ArkTabs.Root>
		)
	}
	if (s.kind === 'tags')
		return (
			<Tags
				mode="single"
				aria_label="Items"
				{...(s.mode === 'initial'
					? { initial: s.source }
					: s.mode === 'data'
						? { items: s.items }
						: {})}
			>
				{s.mode === 'declarative'
					? s.items.map((item, i) => (
							<Tags.Item
								key={item.value}
								value={item.value}
								text={item.text}
								selected={i === 1}
							/>
						))
					: undefined}
			</Tags>
		)
	const content = (
		<Fragment>
			{s.items.map((item, i) => (
				<Tabs.Content
					key={item.value}
					{...(s.mode === 'initial' ? { initial: i } : { value: item.value })}
				>
					Panel {i}
				</Tabs.Content>
			))}
		</Fragment>
	)
	return (
		<Tabs
			aria_label="Items"
			content={content}
			{...(s.mode === 'initial'
				? { initial: s.source }
				: s.mode === 'data'
					? { items: s.items }
					: {})}
		>
			{s.mode === 'declarative'
				? s.items.map((item, i) => (
						<Tabs.Item
							key={item.value}
							value={item.value}
							text={item.text}
							active={i === 1}
						/>
					))
				: undefined}
		</Tabs>
	)
}
