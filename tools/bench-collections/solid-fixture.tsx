import { For } from 'solid-js'
import { Tabs, Tags } from '@soxa-ui/solid'
import { Tabs as ArkTabs } from '@ark-ui/solid/tabs'
import { Listbox, createListCollection } from '@ark-ui/solid/listbox'
import type { Spec } from './data'
export function Fixture({ spec: s }: { spec: Spec }) {
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
						<For each={s.items}>
							{(item) => (
								<Listbox.Item item={item}>
									<Listbox.ItemText>{item.text}</Listbox.ItemText>
								</Listbox.Item>
							)}
						</For>
					</Listbox.Content>
				</Listbox.Root>
			)
		}
		return (
			<ArkTabs.Root defaultValue="v1" lazyMount unmountOnExit>
				<ArkTabs.List aria-label="Items">
					<For each={s.items}>
						{(item) => (
							<ArkTabs.Trigger value={item.value}>{item.text}</ArkTabs.Trigger>
						)}
					</For>
				</ArkTabs.List>
				<For each={s.items}>
					{(item, i) => <ArkTabs.Content value={item.value}>Panel {i()}</ArkTabs.Content>}
				</For>
			</ArkTabs.Root>
		)
	}
	const props =
		s.mode === 'initial' ? { initial: s.source } : s.mode === 'data' ? { items: s.items } : {}
	if (s.kind === 'tags')
		return (
			<Tags {...props} mode="single" aria_label="Items">
				{s.mode === 'declarative' ? (
					<For each={s.items}>
						{(item, i) => (
							<Tags.Item value={item.value} text={item.text} selected={i() === 1} />
						)}
					</For>
				) : undefined}
			</Tags>
		)
	return (
		<Tabs
			{...props}
			aria_label="Items"
			content={
				<For each={s.items}>
					{(item, i) => (
						<Tabs.Content
							{...(s.mode === 'initial' ? { initial: i() } : { value: item.value })}
						>
							Panel {i()}
						</Tabs.Content>
					)}
				</For>
			}
		>
			{s.mode === 'declarative' ? (
				<For each={s.items}>
					{(item, i) => (
						<Tabs.Item value={item.value} text={item.text} active={i() === 1} />
					)}
				</For>
			) : undefined}
		</Tabs>
	)
}
