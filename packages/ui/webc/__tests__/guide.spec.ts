import { afterEach, describe, expect, it } from 'vitest'
import { TGuide } from '@soxa-ui/core'
import { TGuideElement } from '@soxa-ui/webc/guide'

const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

afterEach(() => {
	document.body.innerHTML = ''
})

describe('Guide element', () => {
	it('teleports the decoration with the host and advances from its action', async () => {
		const ctrl = new TGuide({
			steps: [
				{ id: 'welcome', title: 'Welcome', mode: 'modal' },
				{ id: 'point', title: 'Point', anchor: { point: { x: 48, y: 60 } } },
			],
		})
		const container = document.createElement('div')
		const guide = new TGuideElement()
		guide.ctrl = ctrl
		container.append(guide)
		document.body.append(container)
		await frame()

		ctrl.start()
		await frame()

		expect(guide.parentElement).toBe(document.body)
		expect(guide.previousElementSibling?.classList.contains('so-guide__decoration')).toBe(true)
		expect(guide.querySelector('h2')?.textContent).toBe('Welcome')
		const next = Array.from(guide.querySelectorAll('button')).find(
			(button) => button.textContent?.trim() === 'Next',
		)

		expect(next).toBeDefined()
		next?.click()
		await frame()

		expect(ctrl.step?.id).toBe('point')
		expect(guide.getAttribute('aria-modal')).toBeNull()
		expect(
			guide.previousElementSibling
				?.querySelector('.so-guide__spotlight')
				?.getAttribute('style'),
		).toContain('left: 48px')
	})
})
