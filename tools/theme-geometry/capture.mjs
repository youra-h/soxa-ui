import { createServer } from 'vite'
import { chromium } from 'playwright'
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { gzipSync, gunzipSync } from 'node:zlib'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const phase = process.argv[2]
if (!['before', 'after'].includes(phase))
	throw new Error('Use: node tools/theme-geometry/capture.mjs before|after')
const output = resolve(root, 'reports/theme-geometry/2026-11-21', process.argv[3] ?? phase)
if (existsSync(output))
	throw new Error('Snapshot already exists; choose a new snapshot name as the third argument.')
mkdirSync(output, { recursive: true })
const css = resolve(
	root,
	phase === 'before'
		? 'reports/theme-geometry/2026-11-21/before/theme.css.gz'
		: 'packages/themes/oren/dist/index.css',
)
const cssBytes = css.endsWith('.gz') ? gunzipSync(readFileSync(css)) : readFileSync(css)
writeFileSync(resolve(output, 'theme.css.gz'), gzipSync(cssBytes, { level: 9 }))
const server = await createServer({
	configFile: resolve(root, 'packages/playground/vue/vite.config.ts'),
	root,
	server: { host: '127.0.0.1', port: 5178, strictPort: true },
})
let browser
try {
	await server.listen()
	browser = await chromium.launch()
	const page = await browser.newPage({
		viewport: { width: 1840, height: 1150 },
		deviceScaleFactor: 1,
		reducedMotion: 'reduce',
	})
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	await page.route('**/packages/themes/oren/dist/index.css', (route) =>
		route.fulfill({ contentType: 'text/css', body: cssBytes.toString('utf8') }),
	)
	await page.goto('http://127.0.0.1:5178/tools/theme-geometry/preview.html')
	await page.waitForSelector('html[data-ready="true"]')
	await page.evaluate(() => document.fonts.ready)
	for (const scheme of ['oren', 'oren-dark']) {
		await page
			.locator('html')
			.evaluate((node, value) => node.setAttribute('data-so-theme', value), scheme)
		await page.screenshot({
			path: resolve(output, `${scheme}.png`),
			fullPage: true,
			animations: 'disabled',
		})
	}
	await page.locator('.matrix').evaluate((node) => {
		node.style.setProperty('--so-radius', '0px')
		node.querySelector('.so-input').style.setProperty('--so-input-radius', '12px')
	})
	await page.screenshot({
		path: resolve(output, 'overrides.png'),
		fullPage: true,
		animations: 'disabled',
	})
	await page.locator('.matrix').evaluate((node) => {
		node.style.removeProperty('--so-radius')
		node.querySelector('.so-input').style.removeProperty('--so-input-radius')
	})
	const metrics = await page.locator('.cell').evaluateAll((cells) =>
		cells.map((cell) => ({
			size: cell.getAttribute('data-size'),
			parts: [
				...cell.querySelectorAll(
					'.so-input, .so-input__leading, .so-date-input, .so-list-box, .so-button, .so-alert, .so-alert__content, .so-toasts-item__card, .so-toasts-item__body',
				),
			].map((node) => {
				const style = getComputedStyle(node)
				return {
					class: node.className,
					radius: style.borderRadius,
					gap: style.gap,
					padding: style.padding,
					marginBlockStart: style.marginBlockStart,
					width: node.getBoundingClientRect().width,
					height: node.getBoundingClientRect().height,
				}
			}),
		})),
	)
	writeFileSync(
		resolve(output, 'metrics.json'),
		JSON.stringify(
			{
				cssSha256: createHash('sha256').update(cssBytes).digest('hex'),
				errors,
				metrics,
			},
			null,
			2,
		) + '\n',
	)
	if (errors.length) throw new Error(errors.join('\n'))
	console.log(output)
} finally {
	await browser?.close()
	await server.close()
}
