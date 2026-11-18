import { Session } from 'node:inspector'
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const [variant, framework, kind, mode] = process.argv.slice(2)
const { render } = await import(`./dist/${variant}/${framework}/server/${framework}.js`)
const items = Array.from({ length: 1000 }, (_, i) => ({
	value: `v${i}`,
	text: `Item ${i}`,
	_: kind === 'tabs' ? { active: i === 1 } : { selected: i === 1 },
}))
const spec = {
	n: 1000,
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
await new Promise((resolve) => setImmediate(resolve))
global.gc()
const session = new Session()
session.connect()
const post = (name, args = {}) =>
	new Promise((resolve, reject) =>
		session.post(name, args, (error, result) => (error ? reject(error) : resolve(result))),
	)
await post('Profiler.enable')
await post('Profiler.setSamplingInterval', { interval: 100 })
await post('Profiler.start')
for (let i = 0; i < 5; i++) await render(spec)
const { profile } = await post('Profiler.stop')
session.disconnect()
const nodes = new Map(profile.nodes.map((n) => [n.id, n]))
const totals = new Map()
profile.samples?.forEach((id, i) => {
	const frame = nodes.get(id).callFrame
	const name = frame.functionName || '(anonymous)'
	totals.set(name, (totals.get(name) || 0) + (profile.timeDeltas?.[i] ?? 100))
})
writeFileSync(
	resolve(import.meta.dirname, `results/profile-${variant}-${framework}-${kind}-${mode}.json`),
	JSON.stringify(
		{
			variant,
			framework,
			kind,
			mode,
			renders: 5,
			scope: 'Separate CPU profiling run; not latency samples.',
			top: [...totals].sort((a, b) => b[1] - a[1]).slice(0, 25),
			profile,
		},
		null,
		2,
	),
)
