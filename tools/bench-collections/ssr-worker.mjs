import { performance } from 'node:perf_hooks'
import { setImmediate as turn, setTimeout as delay } from 'node:timers/promises'
import { queryObjects } from 'node:v8'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { JSDOM } from 'jsdom'
import { quality } from './quality.mjs'

const [variant, framework, kind, mode, library, nArg, output] = process.argv.slice(2)
const n = Number(nArg)
const diagnostics = []
for (const name of ['warn', 'error']) {
	const original = console[name]
	console[name] = (...args) => {
		diagnostics.push({ level: name, message: args.map(String).join(' ') })
		original.apply(console, args)
	}
}
const { render, prototypes } = await import(
	pathToFileURL(
		resolve(import.meta.dirname, `dist/${variant}/${framework}/server/${framework}.js`),
	)
)
const items = Array.from({ length: n }, (_, i) => ({
	value: `v${i}`,
	text: `Item ${i}`,
	_: kind === 'tabs' ? { active: i === 1 } : { selected: i === 1 },
}))
const spec = {
	n,
	kind,
	mode,
	library,
	items,
	source: {
		items,
		...(kind === 'tabs' ? { panels: items.map((item) => ({ value: item.value })) } : {}),
	},
}
const settle = async () => {
	await turn()
	await delay(0)
	global.gc()
	await turn()
	global.gc()
	await turn()
}
const counts = () =>
	library === 'soxa'
		? Object.fromEntries(
				Object.entries(prototypes).map(([name, ctor]) => [name, queryObjects(ctor)]),
			)
		: null
const memory = () => ({ ...process.memoryUsage(), peakRSS: process.resourceUsage().maxRSS * 1024 })
try {
	let html = await render(spec)
	let dom = new JSDOM(html)
	const verified = quality(dom.window.document, n, kind, library)
	const outputBytes = Buffer.byteLength(html)
	dom.window.close()
	dom = undefined
	html = undefined
	for (let i = 0; i < 3; i++) {
		await render(spec)
		await settle()
	}
	const times = []
	for (let i = 0; i < 9; i++) {
		await settle()
		const start = performance.now()
		await render(spec)
		times.push(performance.now() - start)
	}
	await settle()
	const baseline = memory(),
		baselineObjects = counts(),
		rounds = []
	for (let round = 0; round < 3; round++) {
		for (let i = 0; i < 3; i++) await render(spec)
		const beforeGC = memory()
		await settle()
		rounds.push({ requests: (round + 1) * 3, beforeGC, afterGC: memory(), objects: counts() })
	}
	await delay(1200)
	await settle()
	const settled = { memory: memory(), objects: counts() }
	const sorted = [...times].sort((a, b) => a - b)
	writeFileSync(
		output,
		JSON.stringify(
			{
				variant,
				framework,
				kind,
				mode,
				library,
				n,
				surface: 'ssr',
				quality: verified,
				diagnostics,
				outputBytes,
				latency: { medianMs: sorted[4], p95Ms: sorted[8], samplesMs: times },
				baseline,
				baselineObjects,
				rounds,
				settled,
				node: process.version,
			},
			null,
			2,
		),
	)
} catch (error) {
	writeFileSync(
		output,
		JSON.stringify(
			{
				variant,
				framework,
				kind,
				mode,
				library,
				n,
				surface: 'ssr',
				error: String(error.stack ?? error),
			},
			null,
			2,
		),
	)
	process.exitCode = 1
}
