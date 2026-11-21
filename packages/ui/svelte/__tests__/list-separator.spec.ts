import { it, expect } from 'vitest'
import { flushSync } from 'svelte'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import { ListBox, Select, ListBoxSeparator, SelectSeparator } from '@soxa-ui/svelte'
import Harness from './ListSeparators.test.svelte'
import { mount, nextFrame, find } from './mount'

async function settle(): Promise<void> {
	flushSync()
	for (let frame = 0; frame < 3; frame++) {
		await nextFrame()
		flushSync()
	}
}

it('silent lines stay outside collections, arrows skip them and filtering hides and restores them', async () => {
	const list = createEngineListBox()
	const select = createEngineSelect()

	mount(Harness, { list, select })
	await settle()

	expect(ListBox.Separator).toBe(ListBoxSeparator)
	expect(Select.Separator).toBe(SelectSeparator)
	for (const block of ['so-list-box', 'so-select']) {
		const line = find(document, '.' + block + '__separator', HTMLElement)

		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
	}
	expect(list.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])
	expect(select.extensions.batch.items).toHaveLength(2)

	const node = find(document, '.so-list-box__list', HTMLElement)
	const visited: string[] = []

	node.focus()
	for (let step = 0; step < 2; step++) {
		node.dispatchEvent(
			new KeyboardEvent('keydown', {
				key: 'ArrowDown',
				bubbles: true,
				cancelable: true,
			}),
		)
		await settle()
		visited.push(
			document
				.querySelector('.so-list-box-item [data-highlighted="true"]')
				?.textContent?.trim() ?? '',
		)
	}
	expect(visited).toEqual(['Apple', 'Banana'])

	const line = find(document, '.so-select__separator', HTMLElement)

	select.extensions.filter.query = 'Apple'
	await settle()
	expect(line.style.display).toBe('none')

	select.extensions.filter.clear()
	await settle()
	expect(line.style.display).not.toBe('none')
})
