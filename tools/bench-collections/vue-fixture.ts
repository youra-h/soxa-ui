import { h } from 'vue'
import { Tabs, Tags } from '@soxa-ui/vue'
import { Tabs as ArkTabs } from '@ark-ui/vue/tabs'
import { Listbox, createListCollection } from '@ark-ui/vue/listbox'
import type { Spec } from './data'
export function view(s: Spec) {
	if (s.library === 'ark') {
		if (s.kind === 'tags') {
			const list = createListCollection({
				items: s.items,
				itemToString: (item) => item.text,
				itemToValue: (item) => item.value,
			})
			return h(
				Listbox.Root,
				{ ['collection']: list, defaultValue: ['v1'] },
				{
					default: () =>
						h(
							Listbox.Content,
							{ 'aria-label': 'Items' },
							{
								default: () =>
									s.items.map((item) =>
										h(
											Listbox.Item,
											{ item },
											{
												default: () =>
													h(Listbox.ItemText, {}, () => item.text),
											},
										),
									),
							},
						),
				},
			)
		}
		return h(
			ArkTabs.Root,
			{ defaultValue: 'v1', lazyMount: true, unmountOnExit: true },
			{
				default: () => [
					h(ArkTabs.List, { 'aria-label': 'Items' }, () =>
						s.items.map((item) =>
							h(ArkTabs.Trigger, { value: item.value }, () => item.text),
						),
					),
					...s.items.map((item, i) =>
						h(ArkTabs.Content, { value: item.value }, () => `Panel ${i}`),
					),
				],
			},
		)
	}
	const props =
		s.mode === 'initial' ? { initial: s.source } : s.mode === 'data' ? { items: s.items } : {}
	if (s.kind === 'tags')
		return h(
			Tags,
			{ ...props, mode: 'single', aria_label: 'Items' },
			{
				...(s.mode === 'declarative'
					? {
							default: () =>
								s.items.map((item, i) =>
									h(Tags.Item, {
										key: item.value,
										value: item.value,
										text: item.text,
										selected: i === 1,
									}),
								),
						}
					: {}),
			},
		)
	return h(
		Tabs,
		{ ...props, aria_label: 'Items' },
		{
			...(s.mode === 'declarative'
				? {
						default: () =>
							s.items.map((item, i) =>
								h(Tabs.Item, {
									key: item.value,
									value: item.value,
									text: item.text,
									active: i === 1,
								}),
							),
					}
				: {}),
			content: () =>
				s.items.map((item, i) =>
					h(
						Tabs.Content,
						s.mode === 'initial' ? { initial: i } : { value: item.value },
						() => `Panel ${i}`,
					),
				),
		},
	)
}
