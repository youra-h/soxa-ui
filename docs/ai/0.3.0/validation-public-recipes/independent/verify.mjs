import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, extname, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const app = resolve('packed-consumer')
const dist = resolve(app, 'dist')
const contracts = JSON.parse(
	execFileSync(process.execPath, ['inspect-contracts.mjs'], { cwd: app, encoding: 'utf8' }),
)
writeFileSync('installed-contracts.json', JSON.stringify(contracts, null, 2) + '\n')
const { chromium } = await import(
	process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright'
)
const server = createServer((req, res) => {
	if (req.url === '/favicon.ico') {
		res.writeHead(204)
		res.end()
		return
	}
	const pathname = new URL(req.url ?? '/', 'http://localhost').pathname
	const file = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname))
	if (!file.startsWith(dist + sep)) {
		res.writeHead(403)
		res.end()
		return
	}
	try {
		res.setHeader(
			'Content-Type',
			{ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' }[extname(file)] ??
				'application/octet-stream',
		)
		res.end(readFileSync(file))
	} catch {
		res.writeHead(404)
		res.end()
	}
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
assert.ok(address && typeof address !== 'string')
const browser = await chromium.launch({ headless: true })
const evidence = {
	schemaVersion: 1,
	publicInputs: JSON.parse(readFileSync('public-inputs.json', 'utf8')),
	node: process.version,
	browser: browser.version(),
	pages: [],
	packageChecks: null,
}
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
try {
	const pkg = JSON.parse(readFileSync(resolve(app, 'package.json'), 'utf8'))
	assert.equal(pkg.workspaces, undefined)
	const lock = JSON.parse(readFileSync(resolve(app, 'package-lock.json'), 'utf8'))
	const soxa = Object.entries(lock.packages).filter(([path]) =>
		path.startsWith('node_modules/@soxa-ui/'),
	)
	assert.equal(soxa.length, 8)
	for (const [path, entry] of soxa) {
		assert.equal(entry.version, '0.3.0', path)
		assert.match(entry.resolved, /^https:\/\/registry\.npmjs\.org\//, path)
		assert.equal(entry.link, undefined, path)
	}
	for (const [name, version] of Object.entries(pkg.dependencies))
		if (name.startsWith('@soxa-ui/')) assert.equal(version, '0.3.0')
	assert.doesNotMatch(readFileSync(resolve(app, 'vite.config.ts'), 'utf8'), /alias/)
	evidence.packageChecks = {
		packages: soxa.map(([path, entry]) => ({
			name: path.slice('node_modules/'.length),
			version: entry.version,
			resolved: entry.resolved,
			integrity: entry.integrity,
		})),
		noWorkspaces: true,
		noLibraryAliases: true,
		theme: lock.packages['node_modules/@example/soxa-theme'],
		lockSha256: hash(resolve(app, 'package-lock.json')),
		originalLockSha256: hash('consumer/package-lock.json'),
		themeTarballSha256: hash('example-soxa-theme-1.0.0.tgz'),
	}
	for (const entry of [
		{ path: '/', theme: 'oren' },
		{ path: '/custom.html', theme: 'studio' },
	]) {
		const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
		page.setDefaultTimeout(5000)
		const errors = []
		page.on('pageerror', (error) => errors.push(error.message))
		page.on('console', (message) => {
			if (['error', 'warning'].includes(message.type())) errors.push(message.text())
		})
		await page.goto(`http://127.0.0.1:${address.port}${entry.path}`)
		const report = page.locator('main > div > .so-button')
		await report.waitFor()
		assert.equal(await report.innerText(), 'Queue report')
		const output = (id) => page.getByTestId(id)
		const waitOutput = async (id, value) => {
			try {
				await page.waitForFunction(
					({ id, value }) =>
						document.querySelector(`[data-testid="${id}"]`)?.textContent === value,
					{ id, value },
				)
			} catch (error) {
				console.log(
					JSON.stringify({
						failedOutput: id,
						expected: value,
						body: await page.locator('main').innerText(),
					}),
				)
				throw error
			}
		}
		await report.focus()
		await page.keyboard.press('Enter')
		await waitOutput('audit', 'screen:Report queued 1')
		await waitOutput('notifications', '1')
		await waitOutput('surface-event', 'audit:record')
		await page.getByRole('button', { name: 'Update plugin prop', exact: true }).click()
		await page.getByRole('button', { name: 'Change controller', exact: true }).click()
		await waitOutput('audit', 'updated:Report changed 1')
		await page.getByRole('button', { name: 'Reset plugin prop', exact: true }).click()
		await page.getByRole('button', { name: 'Change controller', exact: true }).click()
		await waitOutput('audit', 'audit:Report changed 2')
		let notifications = 3
		for (let cycle = 0; cycle < 3; cycle++) {
			const retainedText = await report.innerText()
			await page.getByRole('button', { name: 'Toggle control', exact: true }).click()
			assert.equal(await report.count(), 0)
			await page.getByRole('button', { name: 'Change controller', exact: true }).click()
			await waitOutput('notifications', String(notifications))
			const retiredCount = await output('stale').innerText()
			await page.getByRole('button', { name: 'Change controller', exact: true }).click()
			assert.equal(await output('stale').innerText(), retiredCount)
			assert.equal(await output('notifications').innerText(), String(notifications))
			await page.getByRole('button', { name: 'Toggle control', exact: true }).click()
			await report.waitFor()
			await page.evaluate(
				() =>
					new Promise((resolve) =>
						requestAnimationFrame(() => requestAnimationFrame(resolve)),
					),
			)
			assert.notEqual(await report.innerText(), retainedText)
			await report.focus()
			await page.keyboard.press('Space')
			notifications++
			await waitOutput('notifications', String(notifications))
			await waitOutput('audit', `audit:Report queued ${cycle + 2}`)
			await waitOutput('surface-event', 'audit:record')
		}
		const tabs = page.getByRole('tab')
		assert.equal(await tabs.count(), 2)
		await tabs.nth(0).focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Space')
		await page.waitForFunction(
			() =>
				document.querySelectorAll('[role="tab"]')[1]?.getAttribute('aria-selected') ===
				'true',
		)
		const tabsGeometry = await page.locator('.so-tabs__bar').evaluate((el) => ({
			size: getComputedStyle(el).getPropertyValue('--so-tabs-active-size'),
			position: getComputedStyle(el).getPropertyValue('--so-tabs-active-pos'),
		}))
		assert.ok(parseFloat(tabsGeometry.size) > 0)
		const direction = async () =>
			page.locator('section[aria-label="Direction example"] .so-switch').evaluate((el) => ({
				direction: getComputedStyle(el).direction,
				sign: getComputedStyle(el).getPropertyValue('--so-dir-sign').trim(),
			}))
		const ltr = await direction()
		assert.deepEqual(ltr, { direction: 'ltr', sign: '1' })
		await page.locator('html').evaluate((el) => el.setAttribute('dir', 'rtl'))
		await page.waitForFunction(
			() =>
				getComputedStyle(document.querySelector('.so-switch'))
					.getPropertyValue('--so-dir-sign')
					.trim() === '-1',
		)
		const rtl = await direction()
		assert.deepEqual(rtl, { direction: 'rtl', sign: '-1' })
		const first = await tabs.nth(0).boundingBox()
		const second = await tabs.nth(1).boundingBox()
		assert.ok(first && second && first.x > second.x)
		const icon = page.locator('svg.so-icon')
		assert.equal(await icon.getAttribute('viewBox'), contracts.replacementIcon.viewBox)
		const normalizedIconBody = await page.evaluate((body) => {
			const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
			svg.innerHTML = body
			return svg.innerHTML
		}, contracts.replacementIcon.body)
		assert.equal(await icon.innerHTML(), normalizedIconBody)
		await page.getByRole('button', { name: 'Reduce motion', exact: true }).click()
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), 'reduce')
		await page.getByRole('button', { name: 'Full motion', exact: true }).click()
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), 'full')
		await page.getByRole('button', { name: 'System motion', exact: true }).click()
		assert.equal(await page.locator('html').getAttribute('data-so-motion'), null)
		await page.screenshot({ path: `${entry.theme}-rtl.png`, fullPage: true })
		assert.deepEqual(errors, [])
		evidence.pages.push({
			path: entry.path,
			theme: entry.theme,
			scenario: 'Queue report',
			keyboard: [
				'Enter activates retained controller',
				'Space activates after remount',
				'ArrowRight and Space select second tab',
			],
			pluginProps: ['screen', 'updated', 'audit default after omitted key'],
			pluginEvent: ['Vue surface audit:record', 'controller envelope audit:record'],
			cleanup: {
				remounts: 3,
				duplicateNotifications: 0,
				retiredPluginsStopReceiving: true,
				mutationsWhileHidden: 6,
				retainedController: true,
			},
			notifications,
			ltr,
			rtl,
			tabsGeometry,
			mirroredTabOrder: true,
			closeIconReplacement: true,
			motionModes: ['reduce', 'full', 'system'],
			consoleErrors: errors,
		})
		await page.close()
	}
	evidence.result = 'passed'
} finally {
	writeFileSync('consumer-acceptance.json', JSON.stringify(evidence, null, 2) + '\n')
	await browser.close()
	await new Promise((resolve) => server.close(resolve))
}
console.log(
	JSON.stringify(
		{ result: evidence.result, pages: evidence.pages.length, browser: evidence.browser },
		null,
		2,
	),
)
