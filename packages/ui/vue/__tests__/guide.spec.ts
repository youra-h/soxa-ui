import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { TGuide, type IGuideStep } from '@soxa-ui/core'
import { Guide } from '@soxa-ui/vue'

const tick = async (): Promise<void> => {
	await nextTick()
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	await nextTick()
}

const button = (text: string): HTMLButtonElement | undefined =>
	Array.from(document.querySelectorAll<HTMLButtonElement>('.so-guide button')).find(
		(node) => node.textContent?.trim() === text,
	)

afterEach(() => {
	document.body.innerHTML = ''
})

describe('Guide', () => {
	it('starts centered, follows a DOM target and keeps it usable', async () => {
		const target = document.createElement('button')
		target.textContent = 'Editor control'
		document.body.append(target)
		const ctrl = new TGuide({
			steps: [
				{ id: 'intro', title: 'Introduction', mode: 'modal' },
				{
					id: 'toolbar',
					title: 'Toolbar',
					anchor: { element: () => target },
					advanceOn: { source: target, event: 'click' },
				},
			],
		})
		const wrapper = mount(Guide, { props: { ctrl }, attachTo: document.body })

		target.focus()
		ctrl.start()
		await tick()
		const panel = document.querySelector('.so-guide')
		expect(panel?.getAttribute('aria-modal')).toBe('true')
		expect(panel?.getAttribute('aria-label')).toBe('Introduction')
		expect(document.querySelector('.so-guide__decoration > .so-backdrop')).not.toBeNull()

		button('Next')?.click()
		await tick()
		expect(panel?.getAttribute('aria-modal')).toBeNull()
		expect(panel?.hasAttribute('data-placement')).toBe(true)
		expect(document.querySelector('.so-guide__spotlight')).not.toBeNull()
		expect(document.querySelector('.so-guide__decoration > .so-backdrop')).toBeNull()
		expect(target.hasAttribute('aria-hidden')).toBe(false)

		target.click()
		await tick()
		expect(ctrl.visible).toBe(false)
		expect(document.activeElement).toBe(target)
		wrapper.unmount()
	})

	it('updates a viewport point and removes old event subscriptions', async () => {
		const events = new EventTarget()
		const add = vi.spyOn(events, 'addEventListener')
		const step: IGuideStep = {
			id: 'point',
			title: 'Select the cube',
			anchor: { point: { x: 48, y: 80 } },
			advanceOn: { source: events, event: 'cube:selected' },
		}
		const last: IGuideStep = { id: 'finish', title: 'Finish' }
		const ctrl = new TGuide({ steps: [step, last] })
		const wrapper = mount(Guide, { props: { ctrl }, attachTo: document.body })
		ctrl.start()
		await tick()

		let marker = document.querySelector<HTMLElement>('.so-guide__spotlight')
		expect(marker?.style.left).toBe('48px')
		expect(add).toHaveBeenCalledTimes(1)

		ctrl.steps = [{ ...step, anchor: { point: { x: 160, y: 120 } } }, last]
		await tick()
		marker = document.querySelector<HTMLElement>('.so-guide__spotlight')
		expect(marker?.style.left).toBe('160px')
		expect(add).toHaveBeenCalledTimes(1)

		events.dispatchEvent(new Event('cube:selected'))
		expect(ctrl.step).toBe(last)
		events.dispatchEvent(new Event('cube:selected'))
		expect(ctrl.step).toBe(last)

		ctrl.previous()
		await tick()
		wrapper.unmount()
		events.dispatchEvent(new Event('cube:selected'))
		expect(ctrl.step?.id).toBe(step.id)
	})
})
