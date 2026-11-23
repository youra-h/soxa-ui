import { afterEach, it, expect } from 'vitest'
import { Component } from '@angular/core'
import { TAlertDialogComponent } from '@soxa-ui/angular'
import { hydrate, leavePage, loadPage, renderOnServer } from './server'
import { nextFrame } from './mount'
@Component({
	selector: 'app-root',
	imports: [TAlertDialogComponent],
	template:
		'<div so-alert-dialog visible class="probe"><span slot="title">Delete?</span>Cannot undo</div>',
})
class AlertDialogPage {}
afterEach(leavePage)
it('hydrates the hidden server host into one named modal and safe actions', async () => {
	const html = await renderOnServer(AlertDialogPage)
	loadPage(html)
	const host = document.querySelector('.probe')
	expect(host?.children).toHaveLength(0)
	const app = await hydrate(AlertDialogPage)
	await app.whenStable()
	await nextFrame()
	expect(document.querySelector('.so-alert-dialog')).toBe(host)
	expect(host?.getAttribute('role')).toBe('alertdialog')
	expect(document.querySelectorAll('.so-backdrop:has(+ .so-alert-dialog)')).toHaveLength(1)
	expect(document.getElementById(host?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
		'Delete?',
	)
	expect(
		document.getElementById(host?.getAttribute('aria-describedby') ?? '')?.textContent,
	).toContain('Cannot undo')
})
