import { it, expect } from 'vitest'
import { Component } from '@angular/core'
import { createEngineListBox, createEngineSelect } from '@soxa-ui/core'
import {
	TListBoxComponent,
	TListBoxGroupComponent,
	TListBoxItemComponent,
	TListBoxSeparatorComponent,
	TSelectComponent,
	TSelectGroupComponent,
	TSelectItemComponent,
	TSelectSeparatorComponent,
} from '@soxa-ui/angular'
import { mountHost, nextFrame, find } from './mount'

@Component({
	selector: 'probe-list-separators',
	imports: [
		TListBoxComponent,
		TListBoxGroupComponent,
		TListBoxItemComponent,
		TListBoxSeparatorComponent,
		TSelectComponent,
		TSelectGroupComponent,
		TSelectItemComponent,
		TSelectSeparatorComponent,
	],
	template:
		'<div so-list-box [engine]="list">' +
		'<div so-list-box-group label="First"><div so-list-box-item value="a" text="Apple"></div></div>' +
		'<div so-list-box-separator></div>' +
		'<div so-list-box-group label="Second"><div so-list-box-item value="b" text="Banana"></div></div>' +
		'</div><div so-select [engine]="select" [editable]="true" editableMode="filter">' +
		'<div so-select-group label="First"><div so-select-item value="a" text="Apple"></div></div>' +
		'<div so-select-separator></div>' +
		'<div so-select-group label="Second"><div so-select-item value="b" text="Banana"></div></div>' +
		'</div>',
})
class Harness {
	readonly list = createEngineListBox()
	readonly select = createEngineSelect()
}

it('silent lines stay outside collections, arrows skip them and filtering hides and restores them', async () => {
	const fixture = mountHost(Harness)
	const { list, select } = fixture.componentInstance
	const settle = async (): Promise<void> => {
		fixture.detectChanges()
		for (let frame = 0; frame < 3; frame++) {
			await nextFrame()
			fixture.detectChanges()
		}
	}

	await settle()
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
