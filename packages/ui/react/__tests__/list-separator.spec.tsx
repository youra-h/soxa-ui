import { describe, it, expect } from 'vitest'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import { ListBox, Select, ListBoxSeparator, SelectSeparator } from '@soxa-ui/react'
import { mount, nextFrame, find } from './mount'
import { act } from 'react'

async function settle(): Promise<void> {
	await nextFrame()
	await nextFrame()
	await nextFrame()
}

describe('manual list separators', () => {
	it('ListBox line has silent semantics and does not enter keyboard navigation', async () => {
		const engine = createEngineListBox()

		mount(
			<ListBox engine={engine}>
				<ListBox.Group label="First">
					<ListBox.Item value="a" text="Apple" />
				</ListBox.Group>
				<ListBox.Separator />
				<ListBox.Group label="Second">
					<ListBox.Item value="b" text="Banana" />
				</ListBox.Group>
			</ListBox>,
		)
		await settle()

		const line = find(document, '.so-list-box__separator', HTMLElement)

		expect(ListBox.Separator).toBe(ListBoxSeparator)
		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
		expect(engine.extensions.batch.items.map((item) => item.value)).toEqual(['a', 'b'])

		const list = find(document, '.so-list-box__list', HTMLElement)
		const visited: string[] = []

		act(() => list.focus())
		for (let step = 0; step < 2; step++) {
			act(() =>
				list.dispatchEvent(
					new KeyboardEvent('keydown', {
						key: 'ArrowDown',
						bubbles: true,
						cancelable: true,
					}),
				),
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

	it('Select line hides with filtered groups and returns when the filter clears', async () => {
		const engine = createEngineSelect()

		mount(
			<Select engine={engine} editable editableMode="filter">
				<Select.Group label="First">
					<Select.Item value="a" text="Apple" />
				</Select.Group>
				<Select.Separator />
				<Select.Group label="Second">
					<Select.Item value="b" text="Banana" />
				</Select.Group>
			</Select>,
		)
		await settle()

		const line = find(document, '.so-select__separator', HTMLElement)

		expect(Select.Separator).toBe(SelectSeparator)
		expect(line.getAttribute('aria-hidden')).toBe('true')
		expect(line.hasAttribute('role')).toBe(false)
		expect(line.style.display).not.toBe('none')
		expect(engine.extensions.batch.items).toHaveLength(2)

		act(() => {
			engine.extensions.filter.query = 'Apple'
		})
		await settle()

		expect(line.style.display).toBe('none')
		expect(engine.extensions.batch.items).toHaveLength(2)

		act(() => engine.extensions.filter.clear())
		await settle()

		expect(line.style.display).not.toBe('none')
	})
})
