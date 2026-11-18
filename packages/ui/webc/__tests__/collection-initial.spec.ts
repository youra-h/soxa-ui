import { describe, it, expect, afterEach } from 'vitest'
import { TTabsElement, TTagsElement, type TTabsElementProps } from '@soxa-ui/webc'

const flush = async () => {
	await Promise.resolve()
	await Promise.resolve()
}
afterEach(() => {
	document.body.innerHTML = ''
})
const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
}
function create(): TTabsElementProps {
	const root = document.createElement('div', { is: 'so-tabs' })
	if (!(root instanceof TTabsElement)) throw new Error('Tabs was not registered')
	root.initial = initial
	root.innerHTML =
		'<div><div is="so-tabs-item" initial="0"></div></div><div is="so-tabs-item" initial="1"></div><div is="so-tabs-content" slot="content" initial="0">A</div><div is="so-tabs-content" slot="content" initial="1">B</div>'
	return root
}
function check(root: ParentNode) {
	const tabs = [...root.querySelectorAll('[role=tab]')]
	expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	expect(tabs[1].id).toBe('tab-b')
	expect(tabs[1].getAttribute('aria-controls')).toBe('panel-b')
	expect(root.querySelector('#panel-b')?.getAttribute('aria-labelledby')).toBe('tab-b')
}
describe('initial source native element lifetime', () => {
	it('prepares before waiting children and keeps the same data through consumer moves', async () => {
		const root = create()
		document.body.append(root)
		await flush()
		check(root)
		const before = root.querySelector('[role=tab]')?.id
		const destination = document.createElement('section')
		document.body.append(destination)
		destination.append(root)
		await flush()
		check(root)
		expect(root.querySelector('[role=tab]')?.id).toBe(before)
	})
})

it('prepares Tags through the shared source and native property input', async () => {
	const root = document.createElement('div', { is: 'so-tags' })
	if (!(root instanceof TTagsElement)) throw new Error('Tags was not registered')
	root.initial = {
		items: [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', _: { selected: true } },
		],
	}
	root.setAttribute('mode', 'single')
	root.innerHTML =
		'<div is="so-tags-item" initial="0"></div><div is="so-tags-item" initial="1"></div>'
	document.body.append(root)
	await flush()
	expect(
		[...root.querySelectorAll('[role=option]')].map((row) => row.getAttribute('tabindex')),
	).toEqual(['-1', '0'])
})
