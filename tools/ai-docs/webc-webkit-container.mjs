import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, resolve } from 'node:path'
import { checkWebc } from './webc-browser.mjs'

// This entry runs only in the matching Playwright Linux image with read-only mounts.
const { webkit } = await import('/playwright-core/index.mjs')
const directory = '/consumer'
const server = createServer(async (request, response) => {
	const pathname = new URL(request.url, 'http://localhost').pathname
	const file = resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname))
	if (!file.startsWith(directory + '/')) {
		response.writeHead(403).end()
		return
	}
	try {
		response.setHeader(
			'Content-Type',
			{ '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html' }[extname(file)] ||
				'application/octet-stream',
		)
		response.end(await readFile(file))
	} catch {
		response.writeHead(404).end()
	}
})
await new Promise((done) => server.listen(0, '127.0.0.1', done))
const browser = await webkit.launch()
try {
	const url = 'http://127.0.0.1:' + server.address().port
	const result = await checkWebc(browser, url)
	const page = await browser.newPage()
	const errors = []
	page.on('pageerror', (error) => errors.push(error.message))
	page.on('console', (message) => {
		if (['warning', 'error'].includes(message.type())) errors.push(message.text())
	})
	page.on('requestfailed', (request) => errors.push(request.url()))
	try {
		await page.goto(url + '/upgrade.html')
		await page.getByText('Enhanced in browser', { exact: true }).waitFor()
		assert.equal(
			await page.getByRole('textbox', { name: 'Enhanced field', exact: true }).inputValue(),
			'Server seed',
		)
		assert.deepEqual(errors, [])
	} finally {
		await page.close()
	}
	console.log(
		JSON.stringify({
			engine: 'webkit',
			browserVersion: browser.version(),
			nodeVersion: process.version,
			serverHTMLClientUpgrade: true,
			...result,
		}),
	)
} finally {
	await browser.close()
	server.close()
}
