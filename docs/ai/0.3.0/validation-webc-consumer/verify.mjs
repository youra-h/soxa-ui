import { createServer } from 'node:http'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, extname } from 'node:path'
import { spawnSync } from 'node:child_process'
import assert from 'node:assert/strict'

const root = import.meta.dirname
const evidence = {
	scenario: 'Independent workshop signup from public JSON corpus',
	timestamp: new Date().toISOString(),
	node: process.version,
	scope: {
		sourceAccess:
			'Only copied corpus JSON and installed registry packages; Playwright borrowed solely as an executable test tool',
		browsers: ['Chromium'],
		ssr: 'Server-authored HTML enhancement only; no SSR/hydration assertion',
	},
	inputs: [],
	packages: {},
	commands: [],
	tests: [],
	errors: [],
	warnings: [],
	docsGaps: [],
	limits: [
		'No Safari, WebKit or Firefox run',
		'No all-component accessibility audit or heap-leak measurement',
		'No native form reset claim',
	],
}
evidence.originalInputHashes = JSON.parse(
	await readFile(resolve(root, 'original-input-hashes.json'), 'utf8').then((text) =>
		text.replace(/^\uFEFF/, ''),
	),
)
const retainedInputs = JSON.parse(await readFile(resolve(root, 'validation-inputs.json'), 'utf8'))
evidence.finalCorpusAssessment = {
	docsRevision: retainedInputs.docsRevision,
	refreshedGuidesRead: [
		'webc-installation',
		'webc-lifecycle',
		'webc-errors',
		'webc-environment',
		'webc-bindings',
		'webc-composition',
		'webc-validation',
	],
	construction:
		'Replaced detached innerHTML with document.createElement(tag, { is }) following the final consumer docs; repeated strict check, build and Chromium assertions. No independent WebKit claim.',
}
evidence.readRecords = [
	'webc-start',
	'webc-installation',
	'overview',
	'webc-bindings',
	'webc-composition',
	'webc-lifecycle',
	'webc-environment',
	'webc-errors',
	'webc-validation',
	'api-webc-input',
	'api-webc-check-box',
	'api-webc-select',
	'api-webc-select-item',
	'api-webc-date-picker',
	'api-webc-accordion',
	'api-webc-accordion-item',
	'api-webc-label',
	'api-webc-button',
]
evidence.install = {
	command: 'npm install --fetch-retries=0 --fetch-timeout=30000',
	exitCode: 0,
	packagesAdded: 32,
	audited: 33,
	highSeverityVulnerabilitiesReported: 4,
	dependencyChangesAppliedAfterAudit: false,
}
evidence.iterationNotes = [
	'Initial verification assumed data-field stayed on Input/Select owners; browser DOM showed it forwarded to the native input. Selectors now use public is/name and event source names are closure data.',
	'Calendar grid cells have implicit native td roles; verifier now uses accessible role/name rather than an explicit role attribute selector.',
	'Open modal hides outside controls from role lookup. Cleanup test simulates a host route change by programmatic activation, preserving the open layer until owner removal.',
]
evidence.docsGaps.push({
	severity: 'clarification',
	observation:
		'Arbitrary initial data-* attributes on Input and Select move onto generated native fields. A consumer cannot rely on the authored owner retaining those attributes after assembly.',
	blockedScenario: false,
})
let server, browser
const record = async (name, fn) => {
	const result = await fn()
	evidence.tests.push({ name, status: 'pass', result: result ?? true })
	return result
}
const save = async () =>
	writeFile(resolve(root, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
try {
	evidence.inputs = retainedInputs.inputs
	const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
	for (const [path, pkg] of Object.entries(lock.packages))
		if (path.includes('node_modules/@soxa-ui/'))
			evidence.packages[path] = {
				version: pkg.version,
				resolved: pkg.resolved,
				integrity: pkg.integrity,
			}
	for (const script of ['check', 'build']) {
		const executable = process.platform === 'win32' ? process.env.ComSpec || 'cmd.exe' : 'npm'
		const args =
			process.platform === 'win32'
				? ['/d', '/s', '/c', 'npm.cmd run ' + script]
				: ['run', script]
		const result = spawnSync(executable, args, { cwd: root, encoding: 'utf8' })
		evidence.commands.push({
			command: 'npm run ' + script,
			exitCode: result.status,
			stdout: result.stdout,
			stderr: result.stderr,
		})
		assert.equal(result.status, 0, script + ' failed')
		if (result.stderr?.includes('500 kB'))
			evidence.warnings.push(
				'Vite reports a chunk over its default 500 kB warning threshold with root registration.',
			)
	}
	const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
	server = createServer(async (req, res) => {
		try {
			const path = new URL(req.url, 'http://localhost').pathname
			const file = resolve(root, 'dist', path === '/' ? 'index.html' : '.' + path)
			const data = await readFile(file)
			res.setHeader(
				'content-type',
				{
					'.html': 'text/html',
					'.js': 'application/javascript',
					'.css': 'text/css',
					'.svg': 'image/svg+xml',
				}[extname(file)] || 'application/octet-stream',
			)
			res.end(data)
		} catch {
			res.statusCode = 404
			res.end('Not found')
		}
	})
	await new Promise((r) => server.listen(0, '127.0.0.1', r))
	const base = 'http://127.0.0.1:' + server.address().port
	browser = await chromium.launch({ headless: true })
	evidence.browserVersion = browser.version()
	const page = await browser.newPage()
	const runtime = []
	page.on('pageerror', (e) => runtime.push(String(e)))
	page.on('console', (message) => {
		if (['error', 'warning'].includes(message.type()))
			runtime.push(message.type() + ': ' + message.text())
	})
	await page.goto(base)
	await page.locator('[data-ready="true"]').waitFor()
	await writeFile(resolve(root, 'initial-dom.html'), await page.content())
	await record('Initial public property state and registration', async () => {
		const state = JSON.parse(await page.locator('#state').innerText())
		assert.deepEqual(state, {
			attendee: '',
			reminders: false,
			sessionCode: 'clay',
			date: '2026-11-21',
		})
		assert.equal(
			await page.locator('[is="so-select"][name="session"] input').inputValue(),
			'Clay handbuilding',
		)
		return state
	})
	await writeFile(resolve(root, 'initial-dom.html'), await page.content())
	// Scenario assertions follow. Debug snapshots are application evidence, not library source.
	await record(
		'Visible accessible label focuses Input; keyboard Input event updates application state',
		async () => {
			await page.getByText('Attendee name', { exact: true }).click()
			const input = page.getByRole('textbox', { name: 'Attendee name', exact: true })
			assert.equal(await input.evaluate((el) => el === document.activeElement), true)
			await input.pressSequentially('Taylor Reed')
			assert.equal(
				JSON.parse(await page.locator('#state').innerText()).attendee,
				'Taylor Reed',
			)
			const event = JSON.parse(await page.locator('#last-event').innerText())
			assert.equal(event.field, 'attendee')
			assert.equal(event.newValue, 'Taylor Reed')
			return event
		},
	)
	await record('CheckBox accessible name, label activation and keyboard Space', async () => {
		const checkbox = page.getByRole('checkbox', { name: 'Send session reminders', exact: true })
		await page.getByText('Send session reminders', { exact: true }).click()
		assert.equal(await checkbox.isChecked(), true)
		await checkbox.focus()
		await page.keyboard.press('Space')
		assert.equal(await checkbox.isChecked(), false)
		await page.keyboard.press('Space')
		assert.equal(JSON.parse(await page.locator('#state').innerText()).reminders, true)
	})
	await record(
		'Select visible label, accessible combobox, ArrowDown/Enter and domain code event',
		async () => {
			assert.equal(
				await page.getByText('Workshop session', { exact: true }).isVisible(),
				true,
			)
			const select = page.getByRole('combobox', { name: 'Workshop session', exact: true })
			await select.focus()
			await page.keyboard.press('ArrowDown')
			await page.keyboard.press('ArrowDown')
			await page.keyboard.press('Enter')
			await page.waitForFunction(
				() =>
					JSON.parse(document.querySelector('#state').textContent).sessionCode ===
					'print',
			)
			assert.equal(await select.inputValue(), 'Printmaking basics')
			return JSON.parse(await page.locator('#last-event').innerText())
		},
	)
	await writeFile(resolve(root, 'interactions-dom.html'), await page.content())
	await record('Compound Accordion keyboard controls authored default content', async () => {
		const header = page.getByRole('button', { name: 'Materials and access', exact: true })
		await header.focus()
		await page.keyboard.press('Enter')
		assert.equal(await header.getAttribute('aria-expanded'), 'true')
		assert.equal(
			await page.getByText('Clay, inks and step-free access are included.').isVisible(),
			true,
		)
		await page.keyboard.press('Space')
		assert.equal(await header.getAttribute('aria-expanded'), 'false')
	})
	await record('Cancelable before event preserves draft Button', async () => {
		await page.getByRole('button', { name: 'Try hide draft', exact: true }).click()
		assert.equal(await page.locator('#cancellation').innerText(), 'Draft remains available')
		assert.equal(
			await page.getByRole('button', { name: 'Keep draft', exact: true }).isVisible(),
			true,
		)
	})
	await record(
		'Reverse property writes update all controlled fields and native submission',
		async () => {
			await page.getByRole('button', { name: 'Load saved signup', exact: true }).click()
			assert.equal(
				await page
					.getByRole('textbox', { name: 'Attendee name', exact: true })
					.inputValue(),
				'Morgan Chen',
			)
			assert.equal(
				await page
					.getByRole('checkbox', { name: 'Send session reminders', exact: true })
					.isChecked(),
				true,
			)
			assert.equal(
				await page
					.getByRole('combobox', { name: 'Workshop session', exact: true })
					.inputValue(),
				'Printmaking basics',
			)
			assert.equal(await page.locator('input[name="date"]').inputValue(), '2026-12-05')
			await page.getByRole('button', { name: 'Reserve workshop', exact: true }).click()
			const reservation = JSON.parse(await page.locator('#reservation').innerText())
			assert.equal(reservation.fields.attendee, 'Morgan Chen')
			assert.equal(reservation.fields.session, 'Printmaking basics')
			assert.equal(reservation.fields.sessionCode, 'print')
			assert.equal(reservation.fields.date, '2026-12-05')
			assert.deepEqual(reservation.reservation, {
				attendee: 'Morgan Chen',
				sessionCode: 'print',
				date: '2026-12-05',
				reminders: true,
			})
			return reservation
		},
	)
	await writeFile(resolve(root, 'before-calendar-dom.html'), await page.content())
	await record('DatePicker accessible group and keyboard Calendar selection', async () => {
		assert.equal(await page.getByText('Workshop date', { exact: true }).isVisible(), true)
		assert.equal(
			await page.getByRole('group', { name: 'Workshop date', exact: true }).count(),
			1,
		)
		const trigger = page.locator('[data-field="date"] button')
		await trigger.focus()
		await page.keyboard.press('Enter')
		await page.getByRole('dialog').waitFor({ state: 'visible' })
		await writeFile(resolve(root, 'open-calendar-dom.html'), await page.content())
		const selected = page.getByRole('gridcell', {
			name: 'Saturday, December 5, 2026',
			exact: true,
		})
		await selected.focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Enter')
		await page.waitForFunction(
			() => JSON.parse(document.querySelector('#state').textContent).date === '2026-12-06',
		)
		return JSON.parse(await page.locator('#last-event').innerText())
	})
	await record(
		'IDs and ARIA references after Calendar close (published known limit bounded)',
		async () => {
			const result = await page.evaluate(() => {
				const ids = [...document.querySelectorAll('[id]')].map((el) => el.id)
				const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i)
				const missing = []
				for (const el of document.querySelectorAll(
					'[aria-labelledby],[aria-describedby],[aria-controls]',
				))
					for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls'])
						for (const id of (el.getAttribute(attr) || '').split(/\s+/).filter(Boolean))
							if (!document.getElementById(id))
								missing.push({
									tag: el.tagName,
									role: el.getAttribute('role'),
									attr,
									id,
									hidden:
										getComputedStyle(el).visibility === 'hidden' ||
										getComputedStyle(el).display === 'none' ||
										el.getAttribute('aria-hidden') === 'true',
								})
				return { duplicates, missing }
			})
			assert.deepEqual(result.duplicates, [])
			assert.ok(
				result.missing.length <= 1 &&
					result.missing.every(
						(m) =>
							m.role === 'dialog' &&
							m.attr === 'aria-labelledby' &&
							m.id.endsWith('-picker-0') &&
							m.hidden,
					),
				'Unexpected broken ARIA reference',
			)
			if (result.missing.length)
				evidence.limits.push(
					'Observed documented exact 0.3.0 missing hidden DatePicker dialog aria-labelledby target: ' +
						result.missing[0].id,
				)
			return result
		},
	)
	await record(
		'Three open-DatePicker unmount/remount cycles remove remote layers and abort application listeners',
		async () => {
			const cycles = []
			for (let i = 0; i < 3; i++) {
				const retained = await page
					.locator('[is="so-input"][name="attendee"]')
					.elementHandle()
				await page.locator('[data-field="date"] button').click()
				await page.getByRole('dialog').waitFor({ state: 'visible' })
				const count = await page.locator('#listener-count').innerText()
				// A host route change removes the owner while its modal layer is open.
				// The modal correctly excludes the outside route button from the accessibility tree.
				await page.locator('#route').evaluate((el) => el.click())
				assert.equal(await page.locator('[role="dialog"]').count(), 0)
				assert.equal(await page.locator('[role="listbox"]').count(), 0)
				await retained.evaluate((el) =>
					el.dispatchEvent(
						new CustomEvent('so:change:value', {
							detail: { newValue: 'detached', oldValue: '' },
						}),
					),
				)
				assert.equal(await page.locator('#listener-count').innerText(), count)
				await page.getByRole('button', { name: 'Reopen signup', exact: true }).click()
				await page.locator('[data-ready="true"]').waitFor()
				assert.equal(JSON.parse(await page.locator('#state').innerText()).attendee, '')
				cycles.push({ cycle: i + 1, detachedListenerAborted: true, dialogsAfterUnmount: 0 })
				await retained.dispose()
			}
			return cycles
		},
	)
	await record('No browser runtime errors or warnings in application flow', async () => {
		assert.deepEqual(runtime, [])
		return runtime
	})
	await record('Server HTML remains native with JavaScript disabled', async () => {
		const context = await browser.newContext({ javaScriptEnabled: false })
		const raw = await context.newPage()
		await raw.goto(base + '/upgrade.html')
		assert.equal(
			await raw.getByRole('button', { name: 'Read workshop schedule', exact: true }).count(),
			1,
		)
		assert.equal(await raw.locator('input').count(), 0)
		assert.equal(await raw.locator('#enhancement').innerText(), '')
		await context.close()
		return { nativeButton: true, generatedInputWithoutJS: false }
	})
	await record(
		'Server-authored HTML upgrades in browser and preserves seed and light DOM',
		async () => {
			await page.goto(base + '/upgrade.html')
			await page
				.locator('#enhancement')
				.filter({ hasText: 'Workshop draft enhanced' })
				.waitFor()
			assert.equal(
				await page
					.getByRole('textbox', { name: 'Draft attendee', exact: true })
					.inputValue(),
				'Server attendee',
			)
			const button = page.getByRole('button', { name: 'Read workshop schedule', exact: true })
			assert.equal(await button.count(), 1)
			assert.equal(await button.evaluate((el) => Boolean(el.ctrl)), true)
			assert.deepEqual(runtime, [])
			return { seed: 'Server attendee', assembledController: true, hydrationClaim: false }
		},
	)
	evidence.status = 'pass'
} catch (error) {
	evidence.status = 'fail'
	evidence.errors.push({ message: String(error).replaceAll(root, '<consumer>') })
	console.error(error)
	process.exitCode = 1
} finally {
	await browser?.close()
	if (server) await new Promise((r) => server.close(r))
	await save()
	console.log(
		JSON.stringify({
			status: evidence.status,
			testsPassed: evidence.tests.length,
			errors: evidence.errors,
			warnings: evidence.warnings,
		}),
	)
}
