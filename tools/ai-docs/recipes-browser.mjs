import assert from 'node:assert/strict'

/** Exercise public recipes against a production consumer, including retained-controller teardown. */
export async function checkRecipes(browser, url, custom, replacementIcon) {
	const page = await browser.newPage()
	const diagnostics = []
	page.on('pageerror', (error) => diagnostics.push(error.message))
	page.on('console', (message) => {
		if (['error', 'warning'].includes(message.type())) diagnostics.push(message.text())
	})
	page.on('requestfailed', (request) => diagnostics.push(request.url()))
	const output = async (id, value) => {
		await page
			.getByTestId(id)
			.filter({ hasText: new RegExp('^' + value + '$') })
			.waitFor()
	}
	const click = (name) => page.getByRole('button', { name, exact: true }).click()
	try {
		await page.goto(url + (custom ? '/custom.html' : '/'))
		const save = page.getByRole('button', { name: 'Save', exact: true })
		await save.waitFor()
		await page.waitForFunction(
			() =>
				parseFloat(
					getComputedStyle(document.querySelector('.so-tabs__bar')).getPropertyValue(
						'--so-tabs-active-size',
					),
				) > 0,
		)
		assert.equal(await save.evaluate((el) => getComputedStyle(el).height), '48px')
		assert.equal(
			await save.evaluate((el) =>
				el.classList.contains(
					'so-button--view-' +
						(location.pathname.includes('custom') ? 'soft' : 'outlined'),
				),
			),
			true,
		)
		await save.focus()
		await page.keyboard.press('Enter')
		await output('audit', 'screen:Saved 1')
		await output('notifications', '1')
		await output('surface-event', 'audit:record')
		await page.keyboard.press('Space')
		await output('audit', 'screen:Saved 2')
		await output('notifications', '2')
		await click('Change controller')
		await output('audit', 'screen:External 1')
		await click('Update plugin prop')
		await click('Change controller')
		await output('audit', 'updated:External 2')
		await click('Reset plugin prop')
		await click('Change controller')
		await output('audit', 'audit:External 3')

		for (let cycle = 0; cycle < 3; cycle++) {
			const before = Number(await page.getByTestId('notifications').textContent())
			await click('Toggle control')
			await page
				.locator('.so-button--variant-' + (custom ? 'studio' : 'accent'))
				.waitFor({ state: 'detached' })
			await click('Change controller')
			await output('notifications', String(before))
			const retired = await page.getByTestId('stale').textContent()
			await click('Change controller')
			assert.equal(await page.getByTestId('stale').textContent(), retired)
			await click('Toggle control')
			await click('Change controller')
			await output('notifications', String(before + 1))
			assert.equal(await page.getByTestId('stale').textContent(), retired)
		}

		const icon = page.locator('svg[aria-label="Replacement close icon"]')
		await icon.waitFor()
		assert.equal(
			await icon.evaluate((el, source) => {
				const expected = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
				expected.innerHTML = source.body
				return (
					el.innerHTML === expected.innerHTML &&
					el.getAttribute('viewBox') === source.viewBox
				)
			}, replacementIcon),
			true,
		)
		const iconBody = await icon.innerHTML()
		const bar = page.locator('.so-tabs__bar')
		await page.waitForFunction(
			() =>
				parseFloat(
					getComputedStyle(document.querySelector('.so-tabs__bar')).getPropertyValue(
						'--so-tabs-active-size',
					),
				) > 0,
		)
		const geometry = await bar.evaluate((el) => ({
			size: getComputedStyle(el).getPropertyValue('--so-tabs-active-size'),
			mark: getComputedStyle(el, '::after').width,
		}))
		if (custom) assert.ok(parseFloat(geometry.mark) > 0)
		const rtl = []
		for (const dir of ['ltr', 'rtl']) {
			await page.locator('html').evaluate((el, value) => el.setAttribute('dir', value), dir)
			const first = page.getByRole('tab', { name: 'First', exact: true })
			await first.click()
			await first.focus()
			await page.keyboard.press(dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight')
			assert.equal(
				await page
					.getByRole('tab', { name: 'Second', exact: true })
					.getAttribute('aria-selected'),
				'true',
			)
			const sw = page.getByRole('switch', { name: 'Enabled', exact: true })
			await sw.focus()
			await page.keyboard.press('Space')
			assert.equal(await sw.isChecked(), dir === 'ltr')
			const direction = await bar.evaluate((el) => getComputedStyle(el).direction)
			assert.equal(direction, dir)
			rtl.push({ direction, keyboard: true })
		}
		await page
			.locator('html')
			.evaluate(
				(el, value) => el.setAttribute('data-so-theme', value),
				custom ? 'studio-dark' : 'oren-dark',
			)
		assert.equal(
			await page.locator('html').evaluate((el) => getComputedStyle(el).colorScheme),
			'dark',
		)
		await click('Reduce motion')
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), 'reduce')
		await click('Full motion')
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), 'full')
		await page.emulateMedia({ reducedMotion: 'reduce' })
		await click('System motion')
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), null)
		assert.deepEqual(diagnostics, [])
		return {
			controllerAndPlugin: true,
			propUpdateAndReset: true,
			mountCycles: 3,
			stalePluginUnsubscribed: true,
			keyboard: ['Enter', 'Space', 'Tabs arrows'],
			rtl,
			darkScheme: true,
			motionModes: ['reduce', 'full', 'system-with-reduced-preference'],
			geometry,
			iconBody,
			diagnostics,
		}
	} finally {
		await page.close()
	}
}
