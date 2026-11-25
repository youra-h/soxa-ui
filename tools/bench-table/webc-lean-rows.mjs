import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import { once } from 'node:events'
import { createServer } from 'node:http'
import path from 'node:path'
import { chromium } from 'playwright'
import { build, loadConfigFromFile } from 'vite'
import { types, urlOf } from './pages.mjs'

const dist = path.resolve('results/webc-lean-rows')
const leanRowTemplate = `
const leanRows = new URLSearchParams(location.search).has('leanRows')

function fillLeanRow(ctx: TTableContext, item: ITableRow, tr: HTMLTableRowElement): void {
	const facade = ctx.facade
	if (!facade) return

	const selecting = ctx.state.mode === 'multiple'
	if (selecting && tr.cells.length === 0) {
		const cell = tr.insertCell()
		cell.className = 'so-table-row__select'
		const checkbox = createDetail(tr.ownerDocument, TCheckBoxElement, { embedded: 'table.select' })
		checkbox.ctrl = facade.extensions.table.acquireCheckBox(item)
		cell.appendChild(checkbox)
	}

	const columns = facade.shownColumns
	const offset = Number(selecting)
	const data = item.data
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i]
		let cell = tr.cells[i + offset]
		if (!cell) {
			cell = tr.insertCell()
			cell.className = 'so-table-row__cell'
			cell.dataset.align = column.align
		}
		const text = data ? String(Reflect.get(data, column.field) ?? '') : ''
		if (cell.textContent !== text) cell.textContent = text
	}
}
`

// The benchmark patches the table template during this build. Both variants
// keep its collection, header, checkboxes, and keyed row loop.
const marker = 'function drawnOf(ctx: TTableContext,'
const { config } = await loadConfigFromFile(
	{ command: 'build', mode: 'production' },
	'vite.config.ts',
)
config.configFile = false
config.logLevel = 'error'
config.build.rollupOptions.input = { webc: path.join(import.meta.dirname, 'webc.html') }
config.build.outDir = dist
config.plugins.push({
	name: 'soxa-table-row-only-benchmark',
	enforce: 'pre',
	transform(code, id) {
		if (!id.endsWith('/packages/ui/webc/src/components/table/table.template.ts')) return
		const create = 'const row = createItem(ownerDocument, TTableRowElement)'
		const binding = "bind(['drawn', 'columnCount'], (ctx) => {"
		const update = "if (entry.kind === 'filler') fillerOf(node, entry.style, span)"
		for (const token of [marker, create, binding, update]) {
			if (!code.includes(token)) throw new Error('Table template changed: ' + token)
		}
		return code
			.replace(marker, leanRowTemplate + '\n' + marker)
			.replace(
				create,
				"if (leanRows) {\n\t\tconst row = ownerDocument.createElement('tr');\n\t\trow.className = 'so-table-row';\n\t\tfillLeanRow(ctx, entry.item, row);\n\t\treturn row;\n\t}\n\n\t" +
					create,
			)
			.replace(
				binding,
				"bind(leanRows ? ['drawn', 'columnCount', 'items', 'shownColumns'] : ['drawn', 'columnCount'], (ctx) => {",
			)
			.replace(
				update,
				update + '\n\t\t\t\t\telse if (leanRows) fillLeanRow(ctx, entry.item, node)',
			)
	},
})
await build(config)

const server = createServer((req, res) => {
	const file = path.join(dist, new URL(req.url, 'http://localhost').pathname)
	const stream = fs.createReadStream(file)
	stream.on('error', () => res.writeHead(404).end())
	res.setHeader('Content-Type', types[path.extname(file)] ?? 'application/octet-stream')
	stream.pipe(res)
}).listen(0, '127.0.0.1')
await once(server, 'listening')
const prefix = 'http://127.0.0.1:' + server.address().port + '/'
const soxa = 'soxa+fit=none+width=3248+track'
const trials = [soxa, soxa + '+leanRows', 'carbon', 'spectrum']
const results = []
const rawFile = path.resolve('results/webc-lean-rows.json')
let browser

try {
	browser = await chromium.launch({
		args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'],
	})
	const n = Number(process.argv[2] ?? 5000)
	const repeats = Number(process.argv[3] ?? 3)
	const meta = {
		browser: browser.version(),
		n,
		repeats,
		date: new Date().toISOString(),
		baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
		carbon: JSON.parse(
			fs.readFileSync('node_modules/@carbon/web-components/package.json', 'utf8'),
		).version,
		spectrum: JSON.parse(
			fs.readFileSync('node_modules/@spectrum-web-components/table/package.json', 'utf8'),
		).version,
	}
	function hashBody(page) {
		return page.evaluate(async () => {
			const cells = Array.from(document.querySelectorAll('tbody tr'), (row) =>
				Array.from(row.cells)
					.slice(1)
					.map((cell) => cell.textContent)
					.join('\t'),
			).join('\n')
			const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cells))
			return Array.from(new Uint8Array(digest), (byte) =>
				byte.toString(16).padStart(2, '0'),
			).join('')
		})
	}
	for (let run = 0; run < repeats; run++) {
		for (const lib of trials) {
			const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
			const errors = []
			page.on('pageerror', (error) => errors.push(error.message))
			try {
				await page.goto(prefix + urlOf('webc:' + lib))
				await page.waitForFunction(() => 'bench' in window)

				const benchHeap = () => page.evaluate(() => (gc(), bench.info().heap))
				const baseline = await benchHeap()

				const render = await page.evaluate((n) => bench.render(n), n)
				const mounted = await page.evaluate(() => bench.info())
				const delta = (await benchHeap()) - baseline
				assert.equal(mounted.rows, n, lib)
				const shape = await page.evaluate((lib) => {
					const kind = lib.split('+')[0]
					const rowSelector =
						kind === 'carbon'
							? 'cds-table-body cds-table-row'
							: kind === 'spectrum'
								? 'sp-table-body sp-table-row'
								: 'tbody tr'
					const cellSelector =
						kind === 'carbon'
							? 'cds-table-cell'
							: kind === 'spectrum'
								? 'sp-table-cell'
								: 'td'
					const rows = Array.from(document.querySelectorAll(rowSelector))
					function seenInput(node) {
						return (
							node.matches('input[type="checkbox"]') ||
							Array.from(node.children).some(seenInput) ||
							(node.shadowRoot &&
								Array.from(node.shadowRoot.children).some(seenInput))
						)
					}
					return {
						cells: rows.reduce(
							(count, row) => count + row.querySelectorAll(cellSelector).length,
							0,
						),
						checkboxes: rows.filter(seenInput).length,
					}
				}, lib)
				assert.equal(shape.checkboxes, n, lib)
				assert.equal(shape.cells, n * (lib.startsWith('soxa') ? 21 : 20), lib)
				const result = { lib, run, render, baseline, mounted, delta, shape }
				if (run === 0) {
					const own = lib.startsWith('soxa')
					if (own) {
						assert.equal(
							await page.evaluate(
								() =>
									[...document.querySelectorAll('#app div')].filter(
										(node) => node instanceof customElements.get('so-table'),
									).length,
							),
							1,
							lib,
						)
						assert.equal(
							await page.evaluate(
								() =>
									[...document.querySelectorAll('tbody tr')].filter(
										(node) =>
											node instanceof customElements.get('so-table-row'),
									).length,
							),
							lib.includes('leanRows') ? 0 : n,
							lib,
						)
						result.initialHash = await hashBody(page)
						const input = page.locator('tbody tr:first-child input').first()
						const header = page.locator('thead input').first()
						await input.press('Space')
						await page.waitForFunction(() => bench.info().checked === 1)
						assert.equal(await header.evaluate((el) => el.indeterminate), true, lib)
						await input.press('Space')
						await page.waitForFunction(() => bench.info().checked === 0)
					}
					result.select = await page.evaluate(() => bench.selectAll())
					assert.equal(await page.evaluate(() => bench.info().checked), n, lib)
					result.deselect = await page.evaluate(() => bench.selectAll())
					assert.equal(await page.evaluate(() => bench.info().checked), 0, lib)
					result.sortAsc = await page.evaluate(() => bench.sort())
					result.firstAsc = await page.evaluate(() => bench.info().first)
					if (own) result.ascHash = await hashBody(page)
					result.sortDesc = await page.evaluate(() => bench.sort())
					result.firstDesc = await page.evaluate(() => bench.info().first)
					if (own) result.descHash = await hashBody(page)
					assert.notEqual(result.firstAsc, result.firstDesc, lib)
					result.replace = await page.evaluate((n) => bench.replace(n, 7), n)
					assert.equal(await page.evaluate(() => bench.info().rows), n, lib)
					result.afterReplaceFirst = await page.evaluate(() => bench.info().first)
					if (own) result.replacedHash = await hashBody(page)
				}
				await page.evaluate(() => bench.clear())
				assert.equal(await page.evaluate(() => bench.info().rows), 0, lib)
				assert.deepEqual(errors, [], lib)
				results.push(result)
				fs.writeFileSync(rawFile, JSON.stringify({ ...meta, results }, null, 2))
				console.log(JSON.stringify(result))
			} finally {
				await page.close()
			}
		}
	}
	for (const key of ['initialHash', 'ascHash', 'descHash', 'replacedHash']) {
		assert.equal(results[0][key], results[1][key], key)
	}
	fs.writeFileSync(rawFile, JSON.stringify({ ...meta, parityPassed: true, results }, null, 2))
} finally {
	await browser?.close()
	server.close()
}
