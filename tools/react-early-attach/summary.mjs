import { readFileSync, writeFileSync } from 'node:fs'
import { JSDOM } from 'jsdom'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const summary = {
	revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
	node: process.version,
	react: JSON.parse(
		readFileSync(new URL('../../node_modules/react/package.json', import.meta.url), 'utf8'),
	).version,
	note: 'Recorded observations, including candidate failures. A green runner means the experiment executed, not that the candidate passes acceptance.',
	modes: [],
}
for (const mode of ['baseline', 'early', 'engine', 'engine-part']) {
	const read = (suffix) =>
		JSON.parse(readFileSync(new URL(`results/${mode}${suffix}.json`, import.meta.url), 'utf8'))
	const server = read('')
	const client = read('-client')
	const cases = server.rows.map((row) => {
		const html = row.result ?? row.html
		if (typeof html !== 'string') return row
		const dom = new JSDOM(html)
		const document = dom.window.document
		const tabs = [...document.querySelectorAll('[role="tab"]')].map((tab) => ({
			text: tab.textContent,
			id: tab.id,
			tabIndex: tab.getAttribute('tabindex'),
			selected: tab.getAttribute('aria-selected'),
			controls: tab.getAttribute('aria-controls'),
			targetExists: !!document.getElementById(tab.getAttribute('aria-controls')),
		}))
		const result = {
			...row,
			result: undefined,
			html: undefined,
			tabs,
			tabStops: tabs.filter((tab) => tab.tabIndex === '0').length,
			panels: [...document.querySelectorAll('[role="tabpanel"]')].map((panel) => ({
				id: panel.id,
				text: panel.textContent,
			})),
			options: [...document.querySelectorAll('[role="option"]')].map((option) => ({
				text: option.textContent,
				selected: option.getAttribute('aria-selected'),
			})),
		}
		dom.window.close()
		return result
	})
	summary.modes.push({ mode, diagnostics: server.diagnostics, cases, client })
}
writeFileSync(new URL('results/summary.json', import.meta.url), JSON.stringify(summary, null, 2))
console.log(JSON.stringify(summary, null, 2))
