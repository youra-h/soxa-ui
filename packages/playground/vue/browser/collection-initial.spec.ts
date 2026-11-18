import { createEngineTabs } from '@soxa-ui/core'
import { describe, it, expect, afterEach } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { userEvent } from 'vitest/browser'
import { Tabs, Tags } from '@soxa-ui/vue'
import { render, cleanup } from './render'
import '@soxa-ui/theme-oren'

afterEach(cleanup)
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
function find(selector: string): HTMLElement {
	const node = document.querySelector(selector)
	if (!(node instanceof HTMLElement)) throw new Error('Missing ' + selector)
	return node
}
describe('initial collection native browser input', () => {
	it('enters at the prepared active tab, arrows and click retain reciprocal links', async () => {
		const initial = {
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
			],
			panels: [
				{ value: 'a', id: 'panel-a' },
				{ value: 'b', id: 'panel-b' },
			],
		}
		const engine = createEngineTabs({ items: initial.items })
		render(
			defineComponent({
				render: () =>
					h('div', [
						h('button', { id: 'before-initial' }, 'Before'),
						h(
							Tabs,
							{ initial, engine },
							{
								content: () => [
									h(Tabs.Content, { initial: 0 }, () => 'A panel'),
									h(Tabs.Content, { initial: 1 }, () => 'B panel'),
								],
							},
						),
					]),
			}),
		)
		await nextTick()
		await frame()
		await frame()
		await userEvent.click(find('#before-initial'))
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement).toBe(find('#tab-b'))
		expect(find('#tab-b').getAttribute('aria-controls')).toBe('panel-b')
		expect(find('#panel-b').getAttribute('aria-labelledby')).toBe('tab-b')
		await userEvent.keyboard('{ArrowLeft}')
		expect(engine.extensions.activation.activeItem?.value).toBe('a')
		await expect.poll(() => find('[role=tab]').getAttribute('aria-selected')).toBe('true')
		expect(document.activeElement).toBe(find('[role=tab]'))
		expect(find('[role=tab]').getAttribute('aria-controls')).toBe('panel-a')
		expect(find('#panel-a').getAttribute('aria-labelledby')).toBe(find('[role=tab]').id)
		await userEvent.click(find('#tab-b'))
		await expect.poll(() => find('#tab-b').getAttribute('aria-selected')).toBe('true')
		expect(document.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
	})
	it('enters Tags at the declared selected item through the same source', async () => {
		render(
			defineComponent({
				render: () =>
					h('div', [
						h('button', { id: 'before-tags' }, 'Before'),
						h(Tags, {
							mode: 'single',
							initial: {
								items: [
									{ value: 'a', text: 'A' },
									{ value: 'b', text: 'B', _: { selected: true } },
								],
							},
						}),
					]),
			}),
		)
		await nextTick()
		await frame()
		await frame()
		await userEvent.click(find('#before-tags'))
		await userEvent.keyboard('{Tab}')
		expect(document.activeElement?.textContent).toBe('B')
		expect(document.querySelectorAll('[role=option][tabindex="0"]')).toHaveLength(1)
	})
})
