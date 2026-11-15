import { chromium } from 'playwright'
import { tailwindProblems } from './tailwind-browser.ts'
import type { Browser, ConsoleMessage, Page } from 'playwright'

/**
 * The page of every project in Chromium — the browser Playwright installs, the
 * revision of the root `package-lock.json` (packages/playground/AGENTS.md,
 * «Браузерный прогон»).
 *
 * Every project draws the same page: a button that opens a dialog, a field, a
 * select with three cities, a table of two rows and a date picker, with the
 * oren theme and the Material icons. The page is judged by what a user sees,
 * not by the markup of a framework.
 */

/** How long the page has to come alive: the hydration of the heaviest framework, with room. */
const ALIVE_MS = 30_000

/** One wait of a step: the list opened, the dialog appeared. */
const STEP_MS = 5_000

/** Root classes of the components of the page: the server and the browser draw all of them. */
const PARTS = ['so-button', 'so-input', 'so-select', 'so-table', 'so-date-picker']

/** Where the markup of the page falls short; an empty list — nothing. */
async function markupProblems(page: Page): Promise<string[]> {
	return page.evaluate((parts) => {
		const problems: string[] = []

		for (const part of parts) {
			if (document.getElementsByClassName(part).length === 0) {
				problems.push(`нет .${part}`)
			}
		}

		const table = document.querySelector('table.so-table')

		if (table === null || !(table.textContent ?? '').includes('Boris')) {
			problems.push('в таблице нет строк')
		}

		// The arrow of the select is a role icon: drawn, it has shapes — a missing
		// role draws an empty `<svg>`
		const arrow = document.querySelector('.so-select__arrow svg')

		if (arrow === null || arrow.childElementCount === 0) {
			problems.push('у стрелки Select нет иконки: пакет иконок не подключён')
		}

		const fixture = document.querySelector('[data-initial-source]')
		if (fixture) {
			const tabs = [...fixture.querySelectorAll('[role="tab"]')]
			const panel = fixture.querySelector('[role="tabpanel"]')
			if (
				tabs.length !== 2 ||
				tabs[0].getAttribute('tabindex') !== '-1' ||
				tabs[1].getAttribute('tabindex') !== '0' ||
				tabs[1].getAttribute('aria-selected') !== 'true'
			)
				problems.push(
					'Initial collection membership or roving stop differs from its declared source',
				)
			if (
				tabs[1]?.id !== 'privacy-tab' ||
				panel?.id !== 'privacy-panel' ||
				tabs[1]?.getAttribute('aria-controls') !== panel?.id ||
				panel?.getAttribute('aria-labelledby') !== tabs[1]?.id
			)
				problems.push('Initial collection reciprocal document links are inconsistent')
		}
		return problems
	}, PARTS)
}

/** A console message as the report shows it. */
function describeMessage(message: ConsoleMessage): string {
	const { url, lineNumber } = message.location()
	const at = url === '' ? '' : ` (${url}:${lineNumber})`

	return `console.${message.type()}: ${message.text()}${at}`
}

/**
 * The server's HTML with JavaScript off — what the server rendered, parsed by
 * the browser: the components are in it, with the icons the server drew.
 */
async function serverProblems(browser: Browser, url: string): Promise<string[]> {
	const context = await browser.newContext({ javaScriptEnabled: false })

	try {
		const page = await context.newPage()
		const response = await page.goto(url)

		if (response === null || response.status() !== 200) {
			return [`сервер ответил ${response?.status() ?? 'ничем'}`]
		}

		return (await markupProblems(page)).map((problem) => `разметка сервера: ${problem}`)
	} finally {
		await context.close()
	}
}

/**
 * Opens the select: clicks its field until the list appears. A page from the
 * server stands before it is hydrated, and a click on it then is the browser's
 * own — focus, nothing else; the next one, after hydration, opens the list. A
 * click on an open list would close it, so the list is looked at first.
 */
async function openSelect(page: Page): Promise<boolean> {
	const field = page.getByRole('combobox', { name: 'City' })
	const option = page.getByRole('option', { name: 'Moscow' })
	const until = Date.now() + ALIVE_MS

	while (Date.now() < until) {
		if (await option.isVisible()) {
			return true
		}

		await field.click({ timeout: ALIVE_MS })

		try {
			await option.waitFor({ state: 'visible', timeout: 1_000 })
			return true
		} catch {
			// Not yet alive: the next click
		}
	}

	return false
}

/** Waits until `check` holds, for `STEP_MS` at most. */
async function holds(check: () => Promise<boolean>): Promise<boolean> {
	const until = Date.now() + STEP_MS

	while (Date.now() < until) {
		if (await check()) {
			return true
		}

		await new Promise((resolve) => setTimeout(resolve, 100))
	}

	return false
}

/**
 * What the user does on the page and what goes wrong: the list opens and
 * chooses, the dialog opens, closes and opens again. The problems of the steps
 * go to `problems`; a step that throws stops the rest.
 */
async function use(page: Page, url: string, problems: string[]): Promise<void> {
	const response = await page.goto(url)

	if (response === null || response.status() !== 200) {
		problems.push(`страница ответила ${response?.status() ?? 'ничем'}`)
		return
	}

	if (!(await openSelect(page))) {
		problems.push('клик по полю Select не открыл список')
		return
	}

	problems.push(...(await markupProblems(page)))

	// The theme is in the page: oren gives the root its color scheme
	const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)

	if (scheme !== 'light') {
		problems.push(`тема oren не подключена: color-scheme корня — «${scheme}»`)
	}

	await page.getByRole('option', { name: 'Moscow' }).click()

	const field = page.getByRole('combobox', { name: 'City' })

	if (!(await holds(async () => (await field.inputValue()) === 'Moscow'))) {
		problems.push(`выбор в Select не дошёл до поля: «${await field.inputValue()}»`)
	}

	const initialTabs = page.locator('[data-initial-source]')
	if (await initialTabs.count()) {
		const first = initialTabs.getByRole('tab', { name: 'General', exact: true })
		await first.click()
		if (!(await holds(async () => (await first.getAttribute('aria-selected')) === 'true')))
			problems.push('Hydrated initial collection did not activate the clicked tab')
		await first.focus()
		await page.keyboard.press('ArrowRight')
		const next = initialTabs.getByRole('tab', { name: 'Privacy', exact: true })
		if (
			!(await holds(
				async () => await next.evaluate((node) => node === document.activeElement),
			))
		)
			problems.push('Hydrated initial collection did not move keyboard focus')
	}

	const openDialog = page.getByRole('button', { name: 'Open dialog' })
	const dialog = page.getByRole('dialog', { name: 'Settings' })
	await openDialog.click()

	if (!(await holds(() => dialog.isVisible()))) {
		problems.push('кнопка не открыла Dialog')
	} else {
		if (
			!(await holds(() =>
				dialog.evaluate((node) => node.contains(node.ownerDocument.activeElement)),
			))
		) {
			problems.push('Dialog не получил фокус после открытия')
			return
		}

		// Closing changes visibility inside the component. The owning prop must
		// receive the new boolean value so the dialog can close and open again.
		await page.keyboard.press('Escape')

		if (!(await holds(async () => !(await dialog.isVisible())))) {
			problems.push('Escape не закрыл Dialog')
		} else {
			await openDialog.click()

			if (!(await holds(() => dialog.isVisible()))) {
				problems.push('кнопка не открыла Dialog повторно после закрытия')
			}
		}
	}

	// What the last step logs comes a little later than the step
	await page.waitForTimeout(500)
}

/** What the live page does wrong; an empty list — nothing. */
async function livePageProblems(browser: Browser, url: string): Promise<string[]> {
	const context = await browser.newContext()
	const problems: string[] = []

	try {
		const page = await context.newPage()

		// Errors and warnings of the page are defects, with no filter by text:
		// hydration reports a mismatch only there, and the library its
		// diagnostics (a missing icon, a part out of place)
		page.on('console', (message) => {
			if (message.type() === 'error' || message.type() === 'warning') {
				problems.push(describeMessage(message))
			}
		})
		page.on('pageerror', (error) => problems.push(`исключение: ${error.message}`))
		page.on('requestfailed', (request) =>
			problems.push(`запрос не прошёл: ${request.url()} — ${request.failure()?.errorText}`),
		)

		// What the page logged explains a step that failed, so it is kept
		await use(page, url, problems).catch((error: unknown) =>
			problems.push(
				`шаг не выполнен: ${error instanceof Error ? error.message : String(error)}`,
			),
		)
	} finally {
		await context.close()
	}

	return problems
}

/**
 * The page at `url` in Chromium: with a server render — first the server's HTML,
 * then the live page.
 */
export async function pageProblems(url: string, ssr: boolean): Promise<string[]> {
	const browser = await chromium.launch()

	try {
		return [
			...(ssr ? await serverProblems(browser, url) : []),
			...(await livePageProblems(browser, url)),
		]
	} finally {
		await browser.close()
	}
}

/** Both isolated CSS entries run the common smoke and the Tailwind geometry matrix. */
export async function tailwindPageProblems(url: string): Promise<string[]> {
	const browser = await chromium.launch()
	try {
		return [
			...(await livePageProblems(browser, url)),
			...(await livePageProblems(browser, new URL('components.html', url).href)),
			...(await tailwindProblems(browser, url)),
		]
	} finally {
		await browser.close()
	}
}
