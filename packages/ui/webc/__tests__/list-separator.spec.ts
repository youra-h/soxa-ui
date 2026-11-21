import { afterEach, it, expect } from 'vitest'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import {
	TListBoxElement,
	TListBoxSeparatorElement,
	TSelectElement,
	TSelectSeparatorElement,
} from '@soxa-ui/webc'

function find(selector: string): HTMLElement {
	const node = document.querySelector(selector)

	if (!(node instanceof HTMLElement)) throw new Error(selector)
	return node
}
async function settle(): Promise<void> {
	for (let frame = 0; frame < 3; frame++) {
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
		await Promise.resolve()
	}
}
afterEach(() => {
	document.body.innerHTML = ''
})

it('silent registered parts stay outside collections, arrows skip them and filtering hides and restores them', async () => {
	const list = createEngineListBox()
	const select = createEngineSelect()
	const listNode = document.createElement('div', { is: 'so-list-box' })
	const selectNode = document.createElement('div', { is: 'so-select' })

	if (!(listNode instanceof TListBoxElement) || !(selectNode instanceof TSelectElement))
		throw new Error('list registration missing')

	listNode.engine = list
	selectNode.engine = select
	selectNode.editable = true
	selectNode.editableMode = 'filter'
	for (const [node, block] of [
		[listNode, 'so-list-box'],
		[selectNode, 'so-select'],
	] as const) {
		node.innerHTML =
			'<div is="' +
			block +
			'-group" label="First"><div is="' +
			block +
			'-item" value="a" text="Apple"></div></div>' +
			'<div is="' +
			block +
			'-separator"></div>' +
			'<div is="' +
			block +
			'-group" label="Second"><div is="' +
			block +
			'-item" value="b" text="Banana"></div></div>'
		document.body.append(node)
	}
	await settle()

	expect(find('.so-list-box__separator')).toBeInstanceOf(TListBoxSeparatorElement)
	expect(find('.so-select__separator')).toBeInstanceOf(TSelectSeparatorElement)
	for (const block of ['so-list-box', 'so-select']) {
		const line = find('.' + block + '__separator')

		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
	}
	expect(list.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])
	expect(select.extensions.batch.items).toHaveLength(2)

	const node = find('.so-list-box__list')
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

	const line = find('.so-select__separator')

	select.extensions.filter.query = 'Apple'
	await settle()
	expect(line.style.display).toBe('none')

	select.extensions.filter.clear()
	await settle()
	expect(line.style.display).not.toBe('none')
})
