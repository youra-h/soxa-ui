import { afterEach, describe, expect, it } from 'vitest'
import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { TGuideComponent } from '@soxa-ui/angular'
import { TGuide } from '@soxa-ui/core'
import { find, mountHost, nextFrame } from './mount'

@Component({
	imports: [TGuideComponent],
	template: '<div so-guide [ctrl]="ctrl"></div>',
})
class GuideHost {
	readonly ctrl = new TGuide({
		steps: [
			{ id: 'welcome', title: 'Welcome', mode: 'modal' },
			{ id: 'point', title: 'Point', anchor: { point: { x: 80, y: 90 } } },
		],
	})
}

afterEach(() => {
	TestBed.resetTestingModule()
	document.body.innerHTML = ''
})

describe('Guide', () => {
	it('updates the teleported decoration when a modal step becomes anchored', async () => {
		const fixture = mountHost(GuideHost)
		const guide = fixture.componentInstance.ctrl
		await fixture.whenStable()
		await nextFrame()

		guide.start()
		fixture.detectChanges()
		await fixture.whenStable()
		await nextFrame()

		const panel = find(document, '.so-guide', HTMLDivElement)
		expect(panel.getAttribute('aria-modal')).toBe('true')
		expect(panel.previousElementSibling?.querySelector('.so-backdrop')).not.toBeNull()

		const next = Array.from(panel.querySelectorAll('button')).find(
			(button) => button.textContent?.trim() === 'Next',
		)
		expect(next).toBeDefined()
		next?.click()
		fixture.detectChanges()
		await fixture.whenStable()
		await nextFrame()

		expect(panel.getAttribute('aria-modal')).toBeNull()
		expect(panel.querySelector('h2')?.textContent).toBe('Point')
		const marker = find(document, '.so-guide__spotlight', HTMLDivElement)
		expect(marker.style.left).toBe('80px')
	})
})
