// Quick SSR median for local iteration: node --expose-gc quick.mjs <variant> <fw> <kind> <mode> [n]
import { performance } from 'node:perf_hooks'
const [variant, framework, kind, mode, nArg = '1000'] = process.argv.slice(2)
const n = Number(nArg)
const { render } = await import(`./dist/${variant}/${framework}/server/${framework}.js`)
const items = Array.from({ length: n }, (_, i) => ({
	value: `v${i}`,
	text: `Item ${i}`,
	_: kind === 'tabs' ? { active: i === 1 } : { selected: i === 1 },
}))
const spec = {
	n,
	kind,
	mode,
	library: 'soxa',
	items,
	source: {
		items,
		...(kind === 'tabs' ? { panels: items.map((item) => ({ value: item.value })) } : {}),
	},
}
for (let i = 0; i < 3; i++) await render(spec)
const times = []
for (let i = 0; i < 7; i++) {
	global.gc()
	const start = performance.now()
	await render(spec)
	times.push(performance.now() - start)
}
times.sort((a, b) => a - b)
global.gc()
console.log(
	`${variant} ${framework} ${kind} ${mode}: median ${times[3].toFixed(1)} ms, heap ${(process.memoryUsage().heapUsed / 2 ** 20).toFixed(1)} MiB`,
)
