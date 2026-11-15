const consumerUrl = process.env.CONSUMER_URL || 'http://127.0.0.1:4149'
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import fs from 'node:fs'
const browser = await chromium.launch({ headless: true })
const results = []
const errors = []
const verify = async (name, fn) => {
	await fn()
	results.push({ name, status: 'pass' })
}
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('requestfailed', (request) => errors.push(request.url()))
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => {
	if (['error', 'warning'].includes(m.type())) errors.push(m.text())
})
const raw1 = await fetch(consumerUrl + '/?request=first').then((r) => r.text())
fs.writeFileSync('raw-request-1.html', raw1)
await verify('dynamic raw HTML initial values and hydration metadata', () => {
	assert.match(raw1, /Library collection reservation/)
	assert.match(raw1, /Ada/)
	assert.match(raw1, /ada@library.example/)
	assert.match(raw1, /ngh=/)
	assert.doesNotMatch(raw1, /Collection reserved/)
})
const nojs = await browser.newContext({ javaScriptEnabled: false })
const staticPage = await nojs.newPage()
await staticPage.goto(consumerUrl + '/?request=nojs')
await verify('raw SSR usable without JavaScript', async () => {
	assert.equal(await staticPage.getByLabel('Borrower', { exact: true }).inputValue(), 'Ada')
	assert.equal(
		await staticPage.getByRole('combobox', { name: 'Pickup desk' }).inputValue(),
		'North reading room',
	)
})
await nojs.close()
await page.goto(consumerUrl + '/')
await page.getByTestId('hydrated').waitFor()
await verify('initial hydration and accessible labels', async () => {
	assert.equal(await page.getByTestId('state').textContent(), 'Ada|north|true')
	assert.equal(
		await page.getByLabel('Contact address', { exact: true }).inputValue(),
		'ada@library.example',
	)
})
await page.getByLabel('Borrower', { exact: true }).fill('Grace')
await verify('typed model and Soxa event synchronized', async () => {
	await page.waitForFunction(
		() => document.querySelector('[data-testid="event"]')?.textContent === 'Grace',
	)
	assert.equal(await page.getByTestId('state').textContent(), 'Grace|north|true')
})
await page.getByLabel('Contact address', { exact: true }).fill('grace@archive.example')
await page.getByLabel('Contact address', { exact: true }).press('Tab')
await verify('Reactive FormControl user change and touched', async () => {
	await page.waitForFunction(
		() =>
			document.querySelector('[data-testid="form"]')?.textContent ===
			'grace@archive.example|true',
	)
})
await page.getByRole('button', { name: 'Toggle contact', exact: true }).click()
await verify('form disable', async () => {
	await page.waitForFunction(() => document.querySelectorAll('input')[1].disabled)
	assert.equal(await page.getByLabel('Contact address', { exact: true }).isDisabled(), true)
})
await page.getByRole('button', { name: 'Toggle contact', exact: true }).click()
await page.getByRole('button', { name: 'Clear contact', exact: true }).click()
await verify('nullable reset', async () => {
	await page.waitForFunction(
		() => document.querySelector('[data-testid="form"]')?.textContent === 'null|false',
	)
	assert.equal(await page.getByLabel('Contact address', { exact: true }).inputValue(), '')
	assert.equal(await page.getByTestId('form').textContent(), 'null|false')
})
const combo = page.getByRole('combobox', { name: 'Pickup desk' })
await combo.focus()
await combo.press('ArrowDown')
await verify('composite Select keyboard opens', async () => {
	await page
		.getByRole('option', { name: 'South archive', exact: true })
		.waitFor({ state: 'visible' })
	assert.equal(await combo.getAttribute('aria-expanded'), 'true')
})
await combo.press('ArrowDown')
await combo.press('Enter')
await verify('composite Select keyboard selection updates ngModel', async () => {
	await page.waitForFunction(
		() => document.querySelector('[data-testid="state"]')?.textContent === 'Grace|south|true',
	)
	assert.equal(await combo.inputValue(), 'South archive')
})
await page.getByLabel('Email receipt', { exact: true }).uncheck()
await page.getByRole('button', { name: 'Reserve collection', exact: true }).click()
await verify('checkbox model and action output', async () => {
	await page.waitForFunction(
		() => document.querySelector('[data-testid="state"]')?.textContent === 'Grace|south|false',
	)
	assert.equal(await page.getByTestId('state').textContent(), 'Grace|south|false')
	await page.getByRole('status').filter({ hasText: 'Collection reserved' }).waitFor()
})
const raw2 = await fetch(consumerUrl + '/?request=second').then((r) => r.text())
fs.writeFileSync('raw-request-2.html', raw2)
await verify('second dynamic request isolates component state', () => {
	assert.match(raw2, /Ada/)
	assert.match(raw2, /ada@library.example/)
	assert.doesNotMatch(raw2, /Grace|grace@archive|Collection reserved/)
})
const fresh = await browser.newContext()
const page2 = await fresh.newPage()
await page2.goto(consumerUrl + '/?request=fresh')
await page2.getByTestId('hydrated').waitFor()
await verify('fresh hydration restores initial state', async () =>
	assert.equal(await page2.getByTestId('state').textContent(), 'Ada|north|true'),
)
await verify('hydrated IDs unique and ARIA references resolve', async () => {
	const checks = await page.evaluate(() => {
		const ids = [...document.querySelectorAll('[id]')].map((x) => x.id)
		const refs = [
			...document.querySelectorAll('[aria-labelledby],[aria-describedby],[aria-controls]'),
		].flatMap((x) =>
			['aria-labelledby', 'aria-describedby', 'aria-controls'].flatMap((a) =>
				(x.getAttribute(a) || '').split(/\s+/).filter(Boolean),
			),
		)
		return {
			duplicates: ids.filter((x, i) => ids.indexOf(x) !== i),
			missing: refs.filter((id) => !document.getElementById(id)),
		}
	})
	assert.deepEqual(checks, { duplicates: [], missing: [] })
})
await verify('no browser console warnings/errors or hydration errors', () =>
	assert.deepEqual(errors, []),
)
fs.writeFileSync('browser-results.json', JSON.stringify({ results, errors }, null, 2))
await page.screenshot({ path: 'complete.png' })
await browser.close()
console.log(JSON.stringify({ results, errors }, null, 2))
