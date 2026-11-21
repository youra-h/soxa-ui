import type { Browser, Page } from 'playwright'

const SIZES = ['sm', 'normal', 'lg', 'xl', '2xl'] as const
const FONTS = [14, 16, 18, 20, 24]
const HEIGHTS = [28, 32, 36, 40, 44]
const PADDING = [7.5, 10, 12.5, 15, 17.5]
const INDENTS = [6, 8, 10, 12, 14]
const ROW_HEIGHTS = [28, 32, 36, 40, 44]

type TMetrics = Record<string, number>

/** Read rendered geometry, including logical and physical sides in RTL. */
async function metrics(page: Page, selector: string): Promise<TMetrics> {
	return page.locator(selector).evaluate((node) => {
		const css = getComputedStyle(node)
		return {
			font: parseFloat(css.fontSize),
			height: node.getBoundingClientRect().height,
			left: parseFloat(css.paddingLeft),
			right: parseFloat(css.paddingRight),
			top: parseFloat(css.paddingTop),
			bottom: parseFloat(css.paddingBottom),
			start: parseFloat(css.paddingInlineStart),
			end: parseFloat(css.paddingInlineEnd),
			indent: parseFloat(css.textIndent),
			radius: parseFloat(css.borderTopLeftRadius),
		}
	})
}

function compare(actual: TMetrics, expected: TMetrics, label: string, problems: string[]): void {
	for (const [property, value] of Object.entries(expected)) {
		if (Math.abs(actual[property] - value) > 0.1 || !Number.isFinite(actual[property])) {
			problems.push(
				label + ': ' + property + ' = ' + actual[property] + ', expected ' + value,
			)
		}
	}
}

/** The consumer recipe must preserve the same geometry as Oren on its own. */
async function measure(page: Page, label: string, problems: string[]): Promise<TMetrics[]> {
	const result: TMetrics[] = []
	for (const [i, size] of SIZES.entries()) {
		const scope = '[data-size="' + size + '"]'
		const selectors = [
			scope + ' > .so-button',
			scope + ' > .so-input',
			scope + ' > .so-input > input',
			scope + ' .so-select__field',
			scope + ' .so-select__field > input',
		]
		const expected: TMetrics[] = [
			{
				font: FONTS[i],
				height: HEIGHTS[i],
				left: PADDING[i],
				right: PADDING[i],
				top: 0,
				bottom: 0,
			},
			{ height: HEIGHTS[i], left: 0, right: 0, top: 0, bottom: 0 },
			{ font: FONTS[i], indent: INDENTS[i], left: 0, right: 0, top: 0, bottom: 0 },
			{ height: HEIGHTS[i], left: 0, right: 0, top: 0, bottom: 0 },
			{ font: FONTS[i], indent: INDENTS[i], left: 0, right: 0, top: 0, bottom: 0 },
		]
		for (const [j, selector] of selectors.entries()) {
			const actual = await metrics(page, selector)
			compare(actual, expected[j], label + '/' + size + '/' + selector, problems)
			result.push(actual)
		}
		const field = page.getByRole('combobox', { name: 'Select ' + size, exact: true })
		await field.click()
		const option = page
			.getByRole('option', { name: 'Moscow', exact: true })
			.filter({ visible: true })
		await option.waitFor({ state: 'visible' })
		const row = await metrics(page, '.so-select-item > .so-button:visible:has-text("Moscow")')
		compare(
			row,
			{
				font: FONTS[i],
				height: ROW_HEIGHTS[i],
				left: PADDING[i],
				right: PADDING[i],
				start: PADDING[i],
				end: PADDING[i],
				top: 8,
				bottom: 8,
			},
			label + '/' + size + '/option',
			problems,
		)
		result.push(row)
		await option.click()
		await option.waitFor({ state: 'hidden' })
		if ((await field.inputValue()) !== 'Moscow')
			problems.push(label + '/' + size + ': Select did not choose Moscow')
	}
	return result
}

/** Independent HTML entries keep the complete Oren stylesheet out of the component page. */
export async function tailwindProblems(browser: Browser, url: string): Promise<string[]> {
	const context = await browser.newContext()
	const problems: string[] = []
	context.on('page', (page) => {
		page.on('console', (message) => {
			if (['error', 'warning'].includes(message.type()))
				problems.push('console.' + message.type() + ': ' + message.text())
		})
		page.on('pageerror', (error) => problems.push('pageerror: ' + error.message))
		page.on('requestfailed', (request) => problems.push('requestfailed: ' + request.url()))
	})
	try {
		for (const scheme of ['light', 'dark']) {
			for (const dir of ['ltr', 'rtl']) {
				let baseline: TMetrics[] = []
				for (const entry of ['baseline.html', 'index.html', 'components.html']) {
					const page = await context.newPage()
					const label = entry + '/' + scheme + '/' + dir
					await page.goto(new URL(entry, url).href)
					await page.evaluate(
						({ scheme, dir }) => {
							document.documentElement.dataset.soTheme = 'oren-' + scheme
							document.documentElement.dir = dir
						},
						{ scheme, dir },
					)
					const colorScheme = await page.evaluate(
						() => getComputedStyle(document.documentElement).colorScheme,
					)
					if (colorScheme !== scheme)
						problems.push(label + ': color-scheme = ' + colorScheme)
					const values = await measure(page, label, problems)
					if (entry === 'baseline.html') baseline = values
					else {
						values.forEach((value, i) =>
							compare(value, baseline[i], label + '/baseline/' + i, problems),
						)
						compare(
							await metrics(page, '.so-button:has-text("Utility override")'),
							{ left: 0, right: 0, radius: 0 },
							label + '/utilities',
							problems,
						)
						const plain = await page.locator('#plain').evaluate((node) => {
							const css = (selector: string) => {
								const element = node.querySelector(selector)
								if (element === null)
									throw new Error('Missing plain HTML: ' + selector)
								return getComputedStyle(element)
							}
							return {
								button: css('button').padding,
								input: css('input').padding,
								border: css('input').borderWidth,
								list: css('ul').listStyleType,
								listPadding: css('ul').padding,
								heading: css('h1').fontSize,
								weight: css('h1').fontWeight,
								margin: css('h1').margin,
							}
						})
						const expected: Record<string, string> = {
							button: '0px',
							input: '0px',
							border: '0px',
							list: 'none',
							listPadding: '0px',
							heading: '16px',
							weight: '400',
							margin: '0px',
						}
						for (const [key, value] of Object.entries(plain)) {
							if (value !== expected[key])
								problems.push(label + '/Preflight/' + key + ' = ' + value)
						}
					}
					await page.close()
				}
			}
		}
	} catch (error) {
		problems.push(
			'Tailwind consumer: ' + (error instanceof Error ? error.message : String(error)),
		)
	} finally {
		await context.close()
	}
	return problems
}
