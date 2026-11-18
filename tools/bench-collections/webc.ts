import { TTabsElement, TTagsElement } from '@soxa-ui/webc'
import { install } from './client'
void TTabsElement
void TTagsElement
const make = (is: string, props: object) => {
	const el = document.createElement('div', { is })
	Object.assign(el, props)
	return el
}
install(async (root, s) => {
	const owner = make(s.kind === 'tabs' ? 'so-tabs' : 'so-tags', {
		...(s.kind === 'tags' ? { mode: 'single' } : {}),
		...(s.mode === 'initial'
			? { initial: s.source }
			: s.mode === 'data'
				? { items: s.items }
				: {}),
	})
	if (s.mode === 'declarative')
		s.items.forEach((item, i) =>
			owner.append(
				make(s.kind === 'tabs' ? 'so-tabs-item' : 'so-tags-item', {
					value: item.value,
					text: item.text,
					...(s.kind === 'tabs' ? { active: i === 1 } : { selected: i === 1 }),
				}),
			),
		)
	if (s.kind === 'tabs')
		s.items.forEach((item, i) => {
			const panel = make(
				'so-tabs-content',
				s.mode === 'initial' ? { initial: i } : { value: item.value },
			)
			panel.slot = 'content'
			panel.textContent = `Panel ${i}`
			owner.append(panel)
		})
	root.append(owner)
	await new Promise((resolve) => setTimeout(resolve, 0))
	return () => owner.remove()
})
