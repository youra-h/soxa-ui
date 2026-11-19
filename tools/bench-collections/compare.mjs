// Two variants of one run side by side: node compare.mjs <run> [baseline=main] [candidate=head]
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const [run, baseline = 'main', candidate = 'head'] = process.argv.slice(2)
const folder = resolve(import.meta.dirname, 'results', run)
const index = JSON.parse(readFileSync(resolve(folder, 'index.json'), 'utf8'))
const cell = (variant, framework, kind, mode, surface) =>
	index.find(
		({ result: r }) =>
			r.variant === variant &&
			r.framework === framework &&
			r.kind === kind &&
			r.mode === mode &&
			r.surface === surface &&
			r.library === 'soxa',
	)?.result
const mib = (bytes) => (Number.isFinite(bytes) ? (bytes / 2 ** 20).toFixed(2) : '—')
const ms = (value) => (Number.isFinite(value) ? value.toFixed(1) : '—')
const change = (a, b) =>
	Number.isFinite(a) && Number.isFinite(b)
		? `${b >= a ? '+' : '−'}${Math.abs((b / a - 1) * 100).toFixed(1)}%`
		: '—'
const time = (r) =>
	r?.surface === 'ssr' ? r?.latency?.medianMs : (r?.latency?.medianDomMs ?? undefined)
const median = (values) => {
	const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)

	return sorted.length ? sorted[Math.floor(sorted.length / 2)] : undefined
}
// Client: the heap after GC with the collection mounted, over the empty page.
// Server: the peak heap of a round of requests before GC, over the warm base
const heap = (r) =>
	r?.surface === 'ssr'
		? median((r?.rounds ?? []).map((round) => round.beforeGC.heapUsed)) - r?.baseline?.heapUsed
		: median((r?.rounds ?? []).map((round) => round.mounted.heapUsed)) - r?.baseline?.heapUsed
const status = (r) =>
	!r
		? 'нет'
		: r.status === 'not-applicable'
			? 'N/A'
			: r.timedOut
				? `таймаут (${r.stage})`
				: r.error
					? 'ошибка'
					: r.quality?.valid === false
						? 'неверно'
						: ''

const rows = []
for (const surface of ['ssr', 'client'])
	for (const framework of ['vue', 'react', 'solid', 'svelte', 'angular', 'webc'])
		for (const kind of ['tabs', 'tags'])
			for (const mode of ['declarative', 'data', 'initial']) {
				const a = cell(baseline, framework, kind, mode, surface)
				const b = cell(candidate, framework, kind, mode, surface)

				if (a?.status === 'not-applicable') continue

				rows.push(
					`| ${surface} | ${framework} | ${kind} | ${mode} | ${ms(time(a))}${status(a) && ' ' + status(a)} | ${ms(time(b))}${status(b) && ' ' + status(b)} | ${change(time(a), time(b))} | ${mib(heap(a))} | ${mib(heap(b))} | ${change(heap(a), heap(b))} |`,
				)
			}

console.log(
	`| Поверхность | Адаптер | Коллекция | Путь | ${baseline}, мс | ${candidate}, мс | Время | ${baseline}, MiB | ${candidate}, MiB | Память |`,
)
console.log('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
console.log(rows.join('\n'))
