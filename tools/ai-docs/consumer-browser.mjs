import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { stripVTControlCharacters } from 'node:util'

export async function serve(cwd, args, { probe = true } = {}) {
	const server = spawn(process.execPath, args, {
		cwd,
		env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
		stdio: ['ignore', 'pipe', 'pipe'],
	})
	let output = ''
	server.stdout.on('data', (chunk) => {
		output += chunk
	})
	server.stderr.on('data', (chunk) => {
		output += chunk
	})
	try {
		const deadline = Date.now() + 30000
		while (Date.now() < deadline) {
			// Both servers announce the actual ephemeral port after binding it.
			const url = stripVTControlCharacters(output).match(/http:\/\/127\.0\.0\.1:\d+/)?.[0]
			if (url) {
				try {
					if (!probe || (await fetch(url)).ok) return { server, url }
				} catch {}
			}
			if (server.exitCode !== null) throw new Error('Server exited: ' + output)
			await new Promise((done) => setTimeout(done, 100))
		}
		throw new Error('Server startup timeout: ' + output)
	} catch (error) {
		server.kill()
		throw error
	}
}

export async function checkPage(
	browser,
	url,
	ssr,
	{ afterInteractions, validateSSRReferences = (broken) => assert.deepEqual(broken, []) } = {},
) {
	const page = await browser.newPage()
	const errors = []
	page.on('console', (msg) => {
		if (['warning', 'error'].includes(msg.type())) errors.push(msg.text())
	})
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('requestfailed', (request) => errors.push(request.url()))
	try {
		await page.goto(url)
		await page.getByTestId('mounted').waitFor()
		const input = page.getByRole('textbox', { name: 'Traveler name', exact: true })
		assert.equal(await input.inputValue(), '')
		assert.ok((await page.getByTestId('values').textContent()).includes('|kzn|2026-11-14'))
		await page.getByText('Traveler name', { exact: true }).click()
		assert.equal(await input.evaluate((el) => el === document.activeElement), true)
		await input.fill('Anna')
		assert.equal(await page.getByTestId('change').textContent(), 'Anna')

		const checkbox = page.getByRole('checkbox', { name: 'Accept travel policy' })
		await checkbox.focus()
		await page.keyboard.press('Space')
		assert.equal(await checkbox.isChecked(), true)

		const select = page.getByRole('combobox', { name: 'Destination', exact: true })
		await select.focus()
		await page.keyboard.press('ArrowDown')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor()
		await page.keyboard.press('End')
		await page.keyboard.press('Enter')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor({ state: 'hidden' })
		assert.ok((await page.getByTestId('values').textContent()).includes('|msk|'))
		await select.click()
		await page.keyboard.press('Escape')
		await page.getByRole('option', { name: 'Moscow', exact: true }).waitFor({ state: 'hidden' })

		await page.getByRole('button', { name: 'Travel help: closed', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByRole('button', { name: 'Travel help: open', exact: true }).waitFor()
		await page.getByText('Bring your travel documents.', { exact: true }).waitFor()

		const picker = page.locator('.so-date-picker')
		await picker.locator('button').last().click()
		await page.locator('.so-calendar').waitFor({ state: 'visible' })
		await page
			.getByRole('gridcell', { name: 'Saturday, November 14, 2026', exact: true })
			.focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Enter')
		await page.locator('.so-calendar').waitFor({ state: 'hidden' })
		assert.ok((await page.getByTestId('values').textContent()).includes('|2026-11-15'))
		await page.getByRole('group', { name: 'Departure', exact: true }).waitFor()
		await picker.locator('button').last().click()
		await page.keyboard.press('Escape')
		await page.locator('.so-calendar').waitFor({ state: 'hidden' })

		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: /^Controller action/ }).click()
			await page.getByText('Controller clicks: 1', { exact: true }).waitFor()
			await page.getByRole('button', { name: 'Toggle controller', exact: true }).click()
			await page.getByRole('button', { name: 'Toggle controller', exact: true }).click()
			await page.getByText('Controller clicks: 0', { exact: true }).waitFor()
		}

		await page.getByRole('button', { name: 'Save preferences', exact: true }).focus()
		await page.keyboard.press('Enter')
		await page.getByText('Preferences saved', { exact: true }).waitFor()
		await input.focus()
		await page.keyboard.press('Tab')
		assert.equal(await checkbox.evaluate((el) => el === document.activeElement), true)

		await afterInteractions?.(page, input)
		const ids = await page.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
		assert.equal(new Set(ids).size, ids.length, 'Hydrated ids are unique')
		assert.deepEqual(errors, [])
	} finally {
		await page.close()
	}

	// A fresh SSR request must not reuse the mutated hydrated form/controller.
	if (ssr) {
		const context = await browser.newContext({ javaScriptEnabled: false })
		const raw = await context.newPage()
		try {
			for (let i = 0; i < 2; i++) {
				await raw.goto(url)
				assert.equal(
					await raw
						.getByRole('textbox', { name: 'Traveler name', exact: true })
						.inputValue(),
					'',
				)
				assert.equal(
					await raw.getByRole('checkbox', { name: 'Accept travel policy' }).isChecked(),
					false,
				)
				assert.ok(
					(await raw.getByTestId('values').textContent()).includes('|kzn|2026-11-14'),
				)
				await raw.getByText('Controller clicks: 0', { exact: true }).waitFor()
				assert.equal((await raw.locator('.so-select svg path').count()) > 0, true)
				const ids = await raw.locator('[id]').evaluateAll((els) => els.map((el) => el.id))
				assert.equal(new Set(ids).size, ids.length, 'SSR ids are unique')
				validateSSRReferences(await missingReferences(raw))
			}
		} finally {
			await context.close()
		}
	}
}

export async function checkReleaseAppearance(page) {
	const opener = page.getByRole('button', { name: 'Open blurred dialog' })
	const dialog = page.getByRole('dialog', { name: 'Travel details' })
	const backdrop = page.locator('.so-backdrop--view-blur')
	await opener.click()
	await dialog.waitFor()
	await backdrop.waitFor()
	assert.equal(await backdrop.evaluate((el) => getComputedStyle(el).backdropFilter), 'blur(3px)')
	await page.addStyleTag({ content: '.so-backdrop { --so-backdrop-blur: 6px; }' })
	assert.equal(await backdrop.evaluate((el) => getComputedStyle(el).backdropFilter), 'blur(6px)')
	await page.keyboard.press('Escape')
	await dialog.waitFor({ state: 'hidden' })
	assert.equal(await opener.evaluate((el) => el === document.activeElement), true)

	await page.getByRole('button', { name: 'Show soft notification' }).click()
	const soft = page
		.locator('.so-toasts--view-soft .so-toasts-item')
		.filter({ hasText: 'Itinerary saved' })
	await soft.waitFor()
	await page.getByRole('button', { name: 'Show outlined notification' }).click()
	const outlined = page
		.locator('.so-toasts-item--view-outlined')
		.filter({ hasText: 'Itinerary shared' })
	await outlined.waitFor()

	for (const scheme of ['oren', 'oren-dark']) {
		await page
			.locator('html')
			.evaluate((el, value) => el.setAttribute('data-so-theme', value), scheme)
		assert.notEqual(
			await soft.evaluate((el) =>
				getComputedStyle(el).getPropertyValue('--so-toasts-item-fill').trim(),
			),
			'',
		)
		assert.equal(
			await outlined.evaluate((el) =>
				getComputedStyle(el).getPropertyValue('--so-toasts-item-fill').trim(),
			),
			'',
		)
	}
}

export async function missingReferences(page) {
	return page.evaluate(() =>
		Array.from(
			document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]'),
		).flatMap((el) =>
			['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap((attr) =>
				(el.getAttribute(attr) || '')
					.split(/\s+/)
					.filter(Boolean)
					.filter((id) => !document.getElementById(id))
					.map((id) => ({
						id,
						attr,
						role: el.getAttribute('role'),
						label: el.getAttribute('aria-label'),
						classes: el.className,
						hidden: el.getClientRects().length === 0,
						withinDatePicker: Boolean(el.closest('.so-date-picker__panel')),
					})),
			),
		),
	)
}
