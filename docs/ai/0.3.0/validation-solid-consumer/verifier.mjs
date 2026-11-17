import { chromium } from 'playwright'
import { spawn, spawnSync } from 'node:child_process'
import { readFile, writeFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'
const root = dirname(fileURLToPath(import.meta.url))
const hash = (b) => createHash('sha256').update(b).digest('hex')
const evidence = {
	schemaVersion: 1,
	status: 'RUNNING',
	docsRevision: '7ccbde9db519476a26a8e40839cf2e3eddbe8d7c',
	node: process.version,
	checks: [],
	limitations: [],
	diagnostics: [],
	authoredCorrections: [
		'Initial extraction attempted mkdir with empty parent; generated files were correct.',
		'PowerShell JSON BOM removed.',
		'Verifier corrected Select textContent to inputValue and explicit gridcell role to native td locator.',
	],
	inputFiles: JSON.parse(await readFile(join(root, 'input-hashes.json'), 'utf8')),
}
const check = async (name, fn) => {
	await fn()
	evidence.checks.push({ name, result: 'PASS' })
	console.log('PASS', name)
}
evidence.documentationFindings = [
	{
		originalDocsRevision: 'e5a005fc2b428963e6974a58bf3366bedbfc3723',
		observation:
			'Cold first HTTP response had empty app async boundary; preserved original-cold-ssr.txt. Subsequent request rendered the form.',
		resolution: 'Corrected public app.tsx adds Router root Suspense. Cold no-JS now passes.',
		fixedDocsRevision: '7ccbde9db519476a26a8e40839cf2e3eddbe8d7c',
	},
]
for (const [name, args] of [
	['strict types and negative prop guard', ['node_modules/typescript/bin/tsc', '--noEmit']],
	['production build', ['node_modules/vite/bin/vite.js', 'build']],
]) {
	const r = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8' })
	evidence.checks.push({ name, result: r.status === 0 ? 'PASS' : 'FAIL', exitCode: r.status })
	if (r.status !== 0) throw Error(name + ' ' + r.stderr + ' ' + r.stdout)
}
const ls = spawnSync('npm ls --all --json', { cwd: root, encoding: 'utf8', shell: true })
evidence.npmLs = { exitCode: ls.status, problems: JSON.parse(ls.stdout || '{}').problems || [] }
assert.equal(ls.status, 0)
const server = spawn(process.execPath, ['.output/server/index.mjs'], {
	cwd: root,
	env: { ...process.env, PORT: '0', HOST: '127.0.0.1' },
	stdio: ['ignore', 'pipe', 'pipe'],
})
let browser
try {
	const url = await new Promise((resolve, reject) => {
		let out = ''
		const timer = setTimeout(() => reject(Error('server timeout ' + out)), 15000)
		server.stdout.on('data', (b) => {
			out += b
			const m = out.match(/http:\/\/(?:127\.0\.0\.1|localhost):\d+/)
			if (m) {
				clearTimeout(timer)
				resolve(m[0])
			}
		})
		server.stderr.on('data', (b) => {
			out += b
			console.log('SERVER STDERR', String(b))
		})
		server.on('exit', (code) => reject(Error('server exit ' + code + ' ' + out)))
	})
	browser = await chromium.launch()
	evidence.chromium = browser.version()
	const page = await browser.newPage()
	await page.addInitScript(() => {
		window.__lifecycle = []
		window.addEventListener('workshop-lifecycle', (e) => window.__lifecycle.push(e.detail))
	})
	page.on('console', (m) => {
		if (['error', 'warning'].includes(m.type())) {
			console.log('DIAG', m.text())
			evidence.diagnostics.push({ kind: m.type(), text: m.text() })
		}
	})
	page.on('pageerror', (e) => evidence.diagnostics.push({ kind: 'pageerror', text: e.message }))
	page.on('requestfailed', (r) =>
		evidence.diagnostics.push({ kind: 'requestfailed', text: r.url(), reason: r.failure() }),
	)
	const refs = async (p) =>
		p.evaluate(() => {
			const attrs = ['aria-controls', 'aria-labelledby', 'aria-describedby']
			return [...document.querySelectorAll('*')].flatMap((el) =>
				attrs.flatMap((attr) =>
					(el.getAttribute(attr) || '')
						.split(/\s+/)
						.filter((id) => id && !document.getElementById(id))
						.map((id) => ({
							attr,
							id,
							role: el.getAttribute('role'),
							label: el.getAttribute('aria-label'),
							class: el.className,
							hidden:
								!!el.closest('[hidden], [aria-hidden="true"]') ||
								getComputedStyle(el).display === 'none',
						})),
				),
			)
		})
	const values = async () => JSON.parse(await page.getByTestId('values').textContent())
	await check('cold no-JavaScript SSR first home request', async () => {
		const c = await browser.newContext({ javaScriptEnabled: false })
		const p = await c.newPage()
		await p.goto(url)
		assert.equal(await p.getByRole('textbox', { name: 'Attendee name' }).inputValue(), '')
		await writeFile(join(root, 'cold-ssr.txt'), await p.content())
		evidence.limitations.push({ phase: 'cold-SSR', missingTargets: await refs(p) })
		await c.close()
	})
	await page.goto(url)
	await page.getByRole('button', { name: 'Reserve seat', exact: true }).waitFor()
	await check('initial hydration and selected text', async () => {
		assert.deepEqual(await values(), {
			attendee: '',
			consent: false,
			session: 'clay',
			day: '2026-11-20',
		})
		assert.equal(
			await page.getByRole('combobox', { name: 'Workshop session' }).inputValue(),
			'Clay sculpture',
		)
	})
	await check('visible label focuses Input and typed callback payload', async () => {
		await page.getByText('Attendee name', { exact: true }).click()
		assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'INPUT')
		await page.getByRole('textbox', { name: 'Attendee name' }).fill('Mira')
		assert.equal((await values()).attendee, 'Mira')
		assert.equal(JSON.parse(await page.getByTestId('payload').textContent()).newValue, 'Mira')
	})
	await check('checkbox Space', async () => {
		await page.getByRole('checkbox', { name: 'Agree to studio rules' }).focus()
		await page.keyboard.press('Space')
		assert.equal((await values()).consent, true)
	})
	await check('Select keyboard End Enter Escape', async () => {
		const s = page.getByRole('combobox', { name: 'Workshop session' })
		await s.focus()
		await page.keyboard.press('ArrowDown')
		await page.getByRole('option').first().waitFor()
		await page.keyboard.press('End')
		await page.keyboard.press('Enter')
		assert.equal((await values()).session, 'wood')
		await s.click()
		await page.keyboard.press('Escape')
		assert.equal(await s.getAttribute('aria-expanded'), 'false')
	})
	await check('calendar ArrowRight Enter Escape', async () => {
		await page.getByRole('button', { name: 'Choose date', exact: true }).click()
		const day = page.locator('td[tabindex="0"]')
		await day.focus()
		await page.keyboard.press('ArrowRight')
		await page.keyboard.press('Enter')
		assert.equal((await values()).day, '2026-11-21')
		await page.getByRole('button', { name: 'Choose date', exact: true }).click()
		await page.keyboard.press('Escape')
	})
	evidence.limitations.push({
		phase: 'hydrated-calendar-closed',
		missingTargets: await refs(page),
	})
	await check('reverse prop updates and form submit', async () => {
		await page.getByRole('button', { name: 'Use guest registration' }).click()
		assert.deepEqual(await values(), {
			attendee: 'Guest',
			consent: true,
			session: 'ink',
			day: '2026-11-22',
		})
		assert.equal(
			await page.getByRole('textbox', { name: 'Attendee name' }).inputValue(),
			'Guest',
		)
		await page.getByRole('button', { name: 'Register workshop' }).click()
		await page.getByRole('status').filter({ hasText: 'Registration recorded' }).waitFor()
	})
	await check('Accordion live header preserves focus', async () => {
		const h = page.getByRole('button', { name: 'Materials included — collapsed' })
		await h.focus()
		await page.keyboard.press('Enter')
		await page.getByRole('button', { name: 'Materials included — expanded' }).waitFor()
		assert.match(await page.evaluate(() => document.activeElement?.textContent), /expanded/)
	})
	await check('controller root ref and three remounts', async () => {
		for (let i = 0; i < 3; i++) {
			assert.equal(await page.getByTestId('controller-count').textContent(), '0')
			await page.getByRole('button', { name: 'Focus seat action' }).click()
			assert.equal(
				await page.evaluate(() => document.activeElement?.textContent),
				'Reserve seat',
			)
			await page.keyboard.press('Enter')
			assert.equal(await page.getByTestId('controller-count').textContent(), '1')
			await page.getByRole('button', { name: 'Toggle seat counter' }).click()
			await page.getByRole('button', { name: 'Toggle seat counter' }).click()
		}
	})
	await check('client route disposal and return', async () => {
		await page.getByRole('link', { name: 'Visit studio information' }).click()
		await page.getByRole('heading', { name: 'Studio information' }).waitFor()
		await page.getByRole('link', { name: 'Return to registration' }).click()
		await page.getByTestId('controller-count').waitFor()
		assert.equal(await page.getByTestId('controller-count').textContent(), '0')
		assert.equal((await values()).attendee, '')
		const logs = await page.evaluate(() => window.__lifecycle)
		assert.equal(logs.filter((x) => x === 'mount').length, 5)
		assert.equal(logs.filter((x) => x.kind === 'cleanup').length, 4)
		assert.deepEqual(
			logs.filter((x) => x.kind === 'cleanup').map((x) => x.finalCount),
			[1, 1, 1, 0],
		)
		evidence.lifecycle = logs
	})
	await check('unique IDs and rendered Oren icons', async () => {
		const data = await page.evaluate(() => ({
			ids: [...document.querySelectorAll('[id]')].map((e) => e.id),
			svgs: document.querySelectorAll('[data-so-theme="oren"] svg').length,
			theme: !!document.querySelector('link[rel="stylesheet"]'),
		}))
		assert.equal(new Set(data.ids).size, data.ids.length)
		assert(data.svgs > 0)
		assert(data.theme)
		evidence.rendering = data
	})
	await check('two independent no-JavaScript SSR requests after mutations', async () => {
		await page.getByRole('textbox', { name: 'Attendee name' }).fill('Browser mutation')
		for (let i = 0; i < 2; i++) {
			const context = await browser.newContext({ javaScriptEnabled: false })
			const p = await context.newPage()
			await p.goto(url)
			assert.equal(await p.getByRole('textbox', { name: 'Attendee name' }).inputValue(), '')
			assert.deepEqual(JSON.parse(await p.getByTestId('values').textContent()), {
				attendee: '',
				consent: false,
				session: 'clay',
				day: '2026-11-20',
			})
			assert.equal(
				await p.getByRole('combobox', { name: 'Workshop session' }).inputValue(),
				'Clay sculpture',
			)
			assert.equal(await p.getByTestId('controller-count').textContent(), '0')
			evidence.limitations.push({ phase: 'SSR-' + i, missingTargets: await refs(p) })
			await context.close()
		}
	})
	await check('bounded documented ARIA gaps', async () => {
		for (const entry of evidence.limitations) {
			const gaps = entry.missingTargets
			if (entry.phase.includes('SSR')) {
				assert.equal(gaps.length, 2)
				assert(gaps.every((g) => g.attr === 'aria-controls'))
			} else {
				assert.equal(gaps.length, 1)
				assert.equal(gaps[0].attr, 'aria-labelledby')
				assert.match(gaps[0].id, /-picker-0$/)
				assert.match(gaps[0].class, /so-popover__panel/)
				assert.equal(gaps[0].hidden, true)
			}
		}
	})
	await check('unfiltered browser diagnostics', async () =>
		assert.deepEqual(evidence.diagnostics, []),
	)
	evidence.status = 'PASS'
} catch (e) {
	evidence.status = 'FAIL'
	evidence.failure = e.stack
	console.error(e.stack)
	process.exitCode = 1
} finally {
	await browser?.close()
	server.kill()
	const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
	evidence.packages = { ...pkg.dependencies, ...pkg.devDependencies }
	const lock = await readFile(join(root, 'package-lock.json'))
	evidence.lockSha256 = hash(lock)
	evidence.publishedSoxa = Object.entries(JSON.parse(lock).packages)
		.filter(([p]) => p.includes('node_modules/@soxa-ui/'))
		.map(([path, p]) => ({
			path,
			version: p.version,
			resolved: p.resolved,
			integrity: p.integrity,
		}))
	evidence.sourceHashes = {}
	async function walk(dir) {
		for (const entry of await readdir(dir, { withFileTypes: true })) {
			if (['node_modules', '.output', '.git'].includes(entry.name)) continue
			const p = join(dir, entry.name)
			if (entry.isDirectory()) await walk(p)
			else if (!['evidence.json', 'package-lock.json'].includes(entry.name))
				evidence.sourceHashes[relative(root, p).replaceAll('\\', '/')] = hash(
					await readFile(p),
				)
		}
	}
	await walk(root)
	await writeFile(join(root, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
}
