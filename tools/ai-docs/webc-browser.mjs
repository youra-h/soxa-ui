import assert from 'node:assert/strict'
import { missingReferences } from './consumer-browser.mjs'

/** Exercise the published browser adapter without aliases to library sources. */
export async function checkWebc(browser, url, { legacy = true } = {}) {
	const page = await browser.newPage()
	const diagnostics = []
	page.on('console', (message) => {
		if (['warning', 'error'].includes(message.type())) diagnostics.push(message.text())
	})
	page.on('pageerror', (error) => diagnostics.push(error.message))
	page.on('requestfailed', (request) => diagnostics.push(request.url()))
	const checks = []
	try {
		await page.goto(url)
		await page.getByTestId('mounted').waitFor()
		const input = page.getByRole('textbox', { name: 'Traveler name', exact: true })
		await input.fill('Anna')
		await page.getByTestId('change').filter({ hasText: 'Anna' }).waitFor()
		await page.getByText('Traveler name', { exact: true }).click()
		assert.equal(await input.evaluate((el) => el === document.activeElement), true)
		checks.push('typed input value event and visible label focus')

		const checkbox = page.getByRole('checkbox', { name: 'Accept travel policy' })
		await checkbox.focus()
		await page.keyboard.press('Space')
		assert.equal(await checkbox.isChecked(), true)
		checks.push('checkbox keyboard and accessible name')

		const select = page.getByRole('combobox', { name: 'Destination', exact: true })
		await select.focus()
		await page.keyboard.press('ArrowDown')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor()
		await page.keyboard.press('End')
		await page.keyboard.press('Enter')
		await page.getByTestId('values').filter({ hasText: '|msk|' }).waitFor()
		checks.push('Select keyboard changes application value')

		const picker = page.locator('[data-field="departure"]')
		await picker.locator('button').last().click()
		await page.locator('.so-calendar').waitFor({ state: 'visible' })
		await page
			.getByRole('gridcell', { name: 'Saturday, November 14, 2026', exact: true })
			.focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Enter')
		await page.getByTestId('values').filter({ hasText: '|2026-11-15' }).waitFor()
		await page.locator('.so-calendar').waitFor({ state: 'hidden' })
		checks.push('DatePicker Calendar keyboard and value')

		await page.getByRole('button', { name: 'Travel help', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByText('Bring your travel documents.', { exact: true }).waitFor()
		checks.push('compound Accordion light DOM and keyboard')

		await page.getByRole('button', { name: 'Save preferences', exact: true }).click()
		const submitted = JSON.parse(await page.getByTestId('saved').textContent())
		assert.equal(submitted.traveler, 'Anna')
		assert.equal(submitted.destination, 'Moscow')
		assert.equal(submitted.destinationCode, 'msk')
		assert.equal(submitted.departure, '2026-11-15')
		checks.push('native form submission through real fields')

		await page.getByRole('button', { name: 'Restore defaults', exact: true }).click()
		assert.equal(await input.inputValue(), 'Alex')
		await page.getByTestId('values').filter({ hasText: 'Alex|false|kzn|2026-11-14' }).waitFor()
		await page.getByRole('button', { name: 'Try hiding', exact: true }).click()
		await page.getByTestId('canceled').filter({ hasText: 'Hide canceled' }).waitFor()
		assert.equal(
			await page.getByRole('button', { name: 'Keep me visible', exact: true }).isVisible(),
			true,
		)
		checks.push('reverse property writes and cancelable before event')

		const ariaObservations = await missingReferences(page)
		assert.equal(ariaObservations.length, legacy ? 1 : 0)
		for (const issue of ariaObservations) {
			assert.equal(issue.attr, 'aria-labelledby')
			assert.equal(issue.role, 'dialog')
			assert.equal(issue.hidden, true)
			assert.equal(issue.withinDatePicker, true)
			assert.match(issue.id, /-picker-0$/)
			assert.equal(issue.classes, 'so-popover__panel so-frame')
		}
		const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
		assert.equal(new Set(ids).size, ids.length)
		assert.ok((await page.locator('.so-select svg path').count()) > 0)
		checks.push('unique ids and registered theme icons')

		await page.evaluate(() => {
			const host = document.querySelector('[data-field="traveler"]')
			const section = document.querySelector('[data-testid="mounted"]')
			globalThis.webcDetached = {
				host,
				section,
				output: section.querySelector('[data-testid="change"]'),
			}
		})
		for (let i = 0; i < 3; i++) {
			await picker.locator('button').last().click()
			await page.locator('.so-calendar').waitFor({ state: 'visible' })
			// A modal calendar hides outside controls; simulate application/route unmount.
			await page.locator('body > button').evaluate((button) => button.click())
			assert.equal(await page.locator('.so-date-picker__panel').count(), 0)
			assert.equal(await page.locator('.so-select__panel').count(), 0)
			if (i === 0) {
				assert.equal(
					await page.evaluate(() => {
						const { host, output } = globalThis.webcDetached
						const before = output.textContent
						host.dispatchEvent(
							new CustomEvent('so:change:value', {
								detail: { newValue: 'disposed' },
							}),
						)
						return output.textContent === before
					}),
					true,
				)
			}
			await page.getByRole('button', { name: 'Toggle travel form', exact: true }).click()
			await page.getByTestId('mounted').waitFor()
			assert.equal(await input.inputValue(), '')
		}
		checks.push('three remounts remove open layers and abort application listeners')
		assert.deepEqual(diagnostics, [])
		checks.push('clean browser console and network')
		return { checks, ariaObservations, diagnostics }
	} finally {
		await page.close()
	}
}
