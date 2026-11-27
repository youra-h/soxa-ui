import { Component } from '@angular/core'
import { describe, expect, it } from 'vitest'
import { SlotDirective, TTreeComponent } from '@soxa-ui/angular'
import { find, findIn, mountHost, nextFrame } from './mount'
const items = [
	{ value: 'files', text: 'Files', children: [{ value: 'readme', text: 'Readme' }] },
	{ value: 'help', text: 'Help', href: '/help' },
]

@Component({
	standalone: true,
	imports: [SlotDirective, TTreeComponent],
	template: `
		<div so-tree [items]="items" mode="multiple">
			<ng-template slot="item-icon" let-item="item"
				><span [attr.data-icon]="item.value"></span
			></ng-template>
		</div>
	`,
})
class Harness {
	readonly items = items
}

describe('Tree', () => {
	it('opens nested groups and passes item context to icon templates', async () => {
		const fixture = mountHost(Harness)
		await nextFrame()

		const branch = findIn(fixture, '[role="treeitem"]', HTMLElement)
		branch.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
		fixture.detectChanges()

		const child = find(branch, '[role="group"] [role="treeitem"]', HTMLElement)
		expect(child.querySelector('[data-icon="readme"]')).not.toBeNull()
		child.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
		fixture.detectChanges()
		expect(child.getAttribute('aria-selected')).toBe('true')
		expect(findIn(fixture, 'a[role="treeitem"]', HTMLAnchorElement).getAttribute('href')).toBe(
			'/help',
		)
	})
})
