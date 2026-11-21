import { afterEach, describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, defineComponent, nextTick } from 'vue'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import { ListBox, Select, ListBoxSeparator, SelectSeparator } from '@soxa-ui/vue'

let wrapper: ReturnType<typeof mount> | undefined

afterEach(() => {
	wrapper?.unmount()
	document.body.innerHTML = ''
})

async function settle(): Promise<void> {
	await nextTick()
	for (let frame = 0; frame < 3; frame++)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	await nextTick()
}

function find(selector: string): HTMLElement {
	const node = document.querySelector(selector)

	if (!(node instanceof HTMLElement)) throw new Error(selector)
	return node
}

describe('manual list separators', () => {
	it('ListBox line is silent and outside keyboard navigation', async () => {
		const engine = createEngineListBox()

		wrapper = mount(
			defineComponent({
				render: () =>
					h(ListBox, { engine }, () => [
						h(ListBox.Group, { label: 'First' }, () =>
							h(ListBox.Item, { value: 'a', text: 'Apple' }),
						),
						h(ListBox.Separator),
						h(ListBox.Group, { label: 'Second' }, () =>
							h(ListBox.Item, { value: 'b', text: 'Banana' }),
						),
					]),
			}),
			{ attachTo: document.body },
		)
		await settle()

		const line = find('.so-list-box__separator')

		expect(ListBox.Separator).toBe(ListBoxSeparator)
		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
		expect(engine.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])

		const list = find('.so-list-box__list')
		const visited: string[] = []

		list.focus()
		for (let step = 0; step < 2; step++) {
			list.dispatchEvent(
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
	})

	it('Select line hides and returns with its neighboring groups', async () => {
		const engine = createEngineSelect()

		wrapper = mount(
			defineComponent({
				render: () =>
					h(Select, { engine, editable: true, editableMode: 'filter' }, () => [
						h(Select.Group, { label: 'First' }, () =>
							h(Select.Item, { value: 'a', text: 'Apple' }),
						),
						h(Select.Separator),
						h(Select.Group, { label: 'Second' }, () =>
							h(Select.Item, { value: 'b', text: 'Banana' }),
						),
					]),
			}),
			{ attachTo: document.body },
		)
		await settle()

		const line = find('.so-select__separator')

		expect(Select.Separator).toBe(SelectSeparator)
		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
		expect(engine.extensions.batch.items).toHaveLength(2)

		engine.extensions.filter.query = 'Apple'
		await settle()
		expect(line.style.display).toBe('none')

		engine.extensions.filter.clear()
		await settle()
		expect(line.style.display).not.toBe('none')
	})
})
