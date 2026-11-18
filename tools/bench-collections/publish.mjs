import { createHash } from 'node:crypto'
import {
	copyFileSync,
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from 'node:fs'
import { cpus, platform, release, totalmem } from 'node:os'
import { relative, resolve } from 'node:path'

const run = process.argv.find((arg) => arg.startsWith('--run='))?.slice(6) ?? '2026-11-18-1000'
if (!/^[\w-]+$/.test(run)) throw Error('Run name must be a simple path segment')
const base = import.meta.dirname
const root = resolve(base, '../..')
const input = resolve(base, 'results', run)
const report = resolve(root, 'benchmarks/collections')
const output = resolve(report, 'raw', run)
if (existsSync(output)) throw Error('Published runs are append-only; choose a new run name')
const names = {
	vue: 'Vue',
	react: 'React',
	solid: 'Solid',
	svelte: 'Svelte',
	angular: 'Angular',
	webc: 'Web Components',
}
const frameworks = Object.keys(names)
const read = (file) => JSON.parse(readFileSync(file, 'utf8'))
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex')
const files = (dir) =>
	readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(dir, entry.name)
		return entry.isDirectory() ? files(path) : [path]
	})
const forward = (path) => path.replaceAll('\\', '/')
const cells = readdirSync(input)
	.filter((name) => name !== 'index.json' && name.endsWith('.json'))
	.map((file) => {
		const cell = read(resolve(input, file))
		return {
			...cell,
			surface: cell.surface ?? (file.endsWith('-client.json') ? 'client' : 'ssr'),
			id: file.slice(0, -5),
		}
	})
const expected = []
for (const framework of frameworks) {
	const libraries = [
		'soxa',
		...(['vue', 'react', 'solid', 'svelte'].includes(framework) ? ['ark'] : []),
		...(framework === 'react' ? ['shadcn', 'mui'] : []),
	]
	for (const library of libraries)
		for (const kind of ['tabs', 'tags'])
			for (const surface of ['ssr', 'client'])
				for (const [variant, mode] of library === 'soxa'
					? [
							['before', 'declarative'],
							['after', 'declarative'],
							['before', 'data'],
							['after', 'data'],
							['after', 'initial'],
						]
					: [['after', 'native']])
					expected.push([variant, framework, library, kind, mode, surface].join('-'))
}
const missing = expected.filter((id) => !cells.some((cell) => cell.id === id))
const stale = cells.filter(
	(cell) => cell.surface === 'client' && cell.protocol !== 'client-v3-isolated-phases',
)
const missingActions = cells.filter(
	(cell) => cell.surface === 'client' && !cell.error && !cell.interaction,
)
if (missing.length || cells.length !== expected.length || stale.length || missingActions.length)
	throw Error(
		JSON.stringify({
			expected: expected.length,
			actual: cells.length,
			missing,
			stale: stale.map((c) => c.id),
			missingActions: missingActions.map((c) => c.id),
		}),
	)
const order = (cell) =>
	cell.library === 'soxa'
		? [
				'before-declarative',
				'after-declarative',
				'before-data',
				'after-data',
				'after-initial',
			].indexOf(`${cell.variant}-${cell.mode}`)
		: { ark: 5, shadcn: 6, mui: 7 }[cell.library]
cells.sort(
	(a, b) =>
		frameworks.indexOf(a.framework) - frameworks.indexOf(b.framework) ||
		a.kind.localeCompare(b.kind) ||
		a.surface.localeCompare(b.surface) ||
		order(a) - order(b),
)
const get = (framework, kind, surface, variant, mode, library = 'soxa') =>
	cells.find(
		(cell) =>
			cell.framework === framework &&
			cell.kind === kind &&
			cell.surface === surface &&
			cell.variant === variant &&
			cell.mode === mode &&
			cell.library === library,
	)
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
const number = (value, digits = 1) => (Number.isFinite(value) ? value.toFixed(digits) : '—')
const change = (before, after) =>
	Number.isFinite(before) && Number.isFinite(after)
		? `${after >= before ? '+' : ''}${number((after / before - 1) * 100)}%`
		: '—'
const time = (cell) => cell?.latency?.[cell.surface === 'ssr' ? 'medianMs' : 'medianDomMs']
const label = (cell) =>
	cell.library === 'soxa'
		? `${cell.variant === 'before' ? 'До' : 'После'}: ${cell.mode === 'data' ? 'items' : cell.mode === 'declarative' ? 'дети' : 'initial'}`
		: { ark: 'Ark UI', shadcn: 'shadcn/ui (Radix)', mui: 'MUI' }[cell.library]
const quality = (cell) =>
	cell.status === 'not-applicable'
		? 'N/A'
		: !cell.quality
			? 'не завершён'
			: cell.quality.valid
				? 'OK'
				: `FAIL: ${Object.entries(cell.quality.checks)
						.filter(([, value]) => !value)
						.map(([key]) => key)
						.join(', ')}`
const metric = (cell, render) =>
	cell.error || cell.status === 'not-applicable' ? '—' : render(cell)
const title = (cell) => `[${label(cell)}](raw/${run}/${cell.id}.json)`
const table = (headers, rows) =>
	`| ${headers.join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.join(' | ')} |`).join('\n')}\n`
const comparisonRows = []
for (const framework of frameworks)
	for (const kind of ['tabs', 'tags'])
		for (const surface of ['ssr', 'client']) {
			const before = get(framework, kind, surface, 'before', 'data')
			const after = get(framework, kind, surface, 'after', 'data')
			const initial = get(framework, kind, surface, 'after', 'initial')
			comparisonRows.push([
				names[framework],
				kind,
				surface,
				number(time(before)),
				number(time(after)),
				change(time(before), time(after)),
				number(time(initial)),
				change(time(before), time(initial)),
			])
		}
mkdirSync(output, { recursive: true })
const index = cells.map((cell) => {
	const file = `${cell.id}.json`
	copyFileSync(resolve(input, file), resolve(output, file))
	return { id: cell.id, file, sha256: hash(resolve(output, file)) }
})
copyFileSync(resolve(base, 'results/controls.json'), resolve(output, 'controls.json'))
copyFileSync(resolve(base, 'shadcn/provenance.json'), resolve(output, 'shadcn.json'))
const profiles = readdirSync(resolve(base, 'results'))
	.filter((name) => name.startsWith('profile-') && name.endsWith('.json'))
	.map((file) => {
		const { profile, ...summary } = read(resolve(base, 'results', file))
		const directory = resolve(output, 'profiles')
		mkdirSync(directory, { recursive: true })
		writeFileSync(resolve(directory, file), JSON.stringify(summary, null, 2) + '\n')
		const trace = file.replace('.json', '.cpuprofile')
		writeFileSync(resolve(directory, trace), JSON.stringify(profile) + '\n')
		return {
			summary: `profiles/${file}`,
			trace: `profiles/${trace}`,
			sha256: hash(resolve(directory, trace)),
		}
	})
const versions = { ...read(resolve(base, 'package.json')).dependencies }
for (const name of ['@angular/core', 'vite', 'typescript', 'playwright', '@tailwindcss/node'])
	versions[name] = read(resolve(root, 'node_modules', name, 'package.json')).version
const instrumentationWarning = (item) =>
	item.message.includes('ExperimentalWarning: v8.queryObjects()')
const manifest = {
	run,
	exportedAt: new Date().toISOString(),
	revisions: read(resolve(base, '.cache/provenance.json')).revisions,
	versions,
	node: process.version,
	browsers: [...new Set(cells.map((cell) => cell.browser).filter(Boolean))],
	host: {
		platform: platform(),
		release: release(),
		cpu: cpus()[0].model,
		logicalCPUs: cpus().length,
		totalMemoryBytes: totalmem(),
	},
	protocol: {
		n: 1000,
		client: 'client-v3-isolated-phases',
		ssrWarmups: 3,
		ssrSamples: 9,
		ssrMemoryRequests: 9,
		clientWarmups: 3,
		clientSamples: 7,
		clientMemoryCycles: 7,
		viewport: [1440, 900],
		dpr: 1,
		timeoutMs: 180000,
	},
	coverage: {
		expected: expected.length,
		recorded: cells.length,
		notApplicable: cells
			.filter((cell) => cell.status === 'not-applicable')
			.map((cell) => cell.id),
		failedRuns: cells
			.filter((cell) => cell.error)
			.map((cell) => ({ id: cell.id, stage: cell.stage, timedOut: cell.timedOut })),
		failedQuality: cells
			.filter((cell) => cell.quality && !cell.quality.valid)
			.map((cell) => ({ id: cell.id, checks: cell.quality.checks })),
		failedActions: cells
			.filter(
				(cell) => cell.interaction?.error || cell.interaction?.tabEntry?.valid === false,
			)
			.map((cell) => ({ id: cell.id, interaction: cell.interaction })),
		diagnostics: cells.flatMap((cell) => [
			...(cell.errors ?? []).map((message) => ({ id: cell.id, phase: 'mount', message })),
			...(cell.interaction?.errors ?? []).map((message) => ({
				id: cell.id,
				phase: 'selection',
				message,
			})),
			...(cell.diagnostics ?? [])
				.filter((item) => !instrumentationWarning(item))
				.map((item) => ({ id: cell.id, ...item })),
		]),
		instrumentationWarnings: cells.filter((cell) =>
			cell.diagnostics?.some(instrumentationWarning),
		).length,
	},
	locks: ['package-lock.json', 'tools/bench-collections/package-lock.json'].map((file) => ({
		file,
		sha256: hash(resolve(root, file)),
	})),
	fixtures: files(base)
		.filter(
			(file) =>
				!forward(relative(base, file))
					.split('/')
					.some((segment) =>
						['node_modules', '.cache', 'dist', 'results'].includes(segment),
					),
		)
		.map((file) => ({ file: forward(relative(root, file)), sha256: hash(file) })),
	builds: files(resolve(base, 'dist')).map((file) => ({
		file: forward(relative(base, file)),
		bytes: statSync(file).size,
		sha256: hash(file),
	})),
	results: index,
	profiles,
}
writeFileSync(resolve(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
writeFileSync(
	resolve(output, 'comparison.csv'),
	[
		'framework,kind,surface,beforeItemsMs,afterItemsMs,itemsChange,initialMs,initialVsBeforeItems',
		...comparisonRows.map((row) => row.join(',')),
	].join('\n') + '\n',
)
for (const framework of frameworks) {
	let journal = `## ${run} — 1000 Tabs / Tags\n\n[Методика](README.md), [выводы](report.md), [manifest](raw/${run}/manifest.json).\n\nВремя — медиана в мс. Память — MiB, остаток heap — KiB. «Дети» — 1000 декларативных элементов; «items» — прежний API данных. FAIL сохраняется рядом с измерением. Тайм-аут не получает медиану из частичных данных.\n\n`
	for (const kind of ['tabs', 'tags']) {
		journal += `### ${kind === 'tabs' ? 'Tabs' : 'Tags'}: SSR\n\n`
		const ssr = cells.filter(
			(cell) => cell.framework === framework && cell.kind === kind && cell.surface === 'ssr',
		)
		journal += table(
			[
				'Путь / raw',
				'HTML',
				'SSR мс',
				'HTML KiB',
				'Max heap до GC MiB',
				'Δ heap после GC KiB',
				'Δ модели / bundles',
				'Peak RSS процесса MiB',
			],
			ssr.map((cell) => [
				title(cell),
				quality(cell),
				metric(cell, (c) => number(time(c))),
				metric(cell, (c) => number(c.outputBytes / 1024)),
				metric(cell, (c) =>
					number(Math.max(...c.rounds.map((r) => r.beforeGC.heapUsed)) / 2 ** 20),
				),
				metric(cell, (c) =>
					number((c.settled.memory.heapUsed - c.baseline.heapUsed) / 1024),
				),
				metric(cell, (c) =>
					c.library === 'soxa'
						? `${c.settled.objects.component - c.baselineObjects.component} / ${c.settled.objects.bundle - c.baselineObjects.bundle}`
						: 'N/A',
				),
				metric(cell, (c) => number(c.settled.memory.peakRSS / 2 ** 20)),
			]),
		)
		journal +=
			'\nMax heap до GC — максимум трёх контрольных точек, не профиль всех аллокаций. Отрицательный остаток не означает экономию памяти: освобождаются временные объекты прогрева и измерителя. Peak RSS включает JSDOM и загрузку модулей.\n\n'
		journal += `### ${kind === 'tabs' ? 'Tabs' : 'Tags'}: клиент\n\n`
		const client = cells.filter(
			(cell) =>
				cell.framework === framework && cell.kind === kind && cell.surface === 'client',
		)
		journal += table(
			[
				'Путь / raw',
				'Начальное состояние',
				'DOM мс',
				'2 кадра мс',
				'Живая heap сверх базы MiB',
				'Остаток heap KiB',
				'Остаток узлов / listeners',
				'Статус',
			],
			client.map((cell) => [
				title(cell),
				quality(cell),
				metric(cell, (c) => number(time(c))),
				metric(cell, (c) => number(c.latency.medianPaintMs)),
				metric(cell, (c) =>
					number(
						(median(c.rounds.map((r) => r.mounted.heapUsed)) - c.baseline.heapUsed) /
							2 ** 20,
					),
				),
				metric(cell, (c) => number((c.settled.heapUsed - c.baseline.heapUsed) / 1024)),
				metric(
					cell,
					(c) =>
						`${c.settled.nodes - c.baseline.nodes} / ${c.settled.listeners - c.baseline.listeners}`,
				),
				cell.error
					? `${cell.timedOut ? 'тайм-аут 180 с' : 'ошибка'}: ${cell.stage ?? '—'}`
					: cell.errors?.length
						? `${cell.errors.length} диагностик`
						: 'завершён',
			]),
		)
		journal +=
			'\nПамять измеряется в отдельных семи циклах после серии времени. Малый остаток heap сам по себе не доказывает утечку; траектория каждого цикла сохранена в raw.\n\n'
		journal += `### ${kind === 'tabs' ? 'Tabs' : 'Tags'}: смена выбора\n\n`
		journal +=
			table(
				['Путь', 'DOM выбора мс', '2 кадра мс', 'Tab входит в выбранный', 'Статус'],
				client.map((cell) => [
					label(cell),
					number(cell.interaction?.medianDomMs),
					number(cell.interaction?.medianPaintMs),
					kind !== 'tabs'
						? 'N/A'
						: cell.interaction?.tabEntry
							? cell.interaction.tabEntry.valid
								? 'да'
								: `нет (index ${cell.interaction.tabEntry.index})`
							: 'не проверен',
					!cell.interaction
						? 'не выполнен: основной прогон не завершён'
						: cell.interaction.error
							? `ошибка: ${cell.interaction.stage}`
							: cell.interaction.errors?.length
								? `${cell.interaction.errors.length} диагностик`
								: '7/7 изменений',
				]),
			) + '\n'
	}
	const dest = resolve(report, `${framework}.md`)
	const previous = existsSync(dest) ? readFileSync(dest, 'utf8') : `# ${names[framework]}\n\n`
	if (previous.includes(`## ${run} `)) throw Error(`Journal already contains run ${run}: ${dest}`)
	writeFileSync(dest, previous + journal)
}
writeFileSync(
	resolve(report, `comparison-${run}.md`),
	`# Сравнение корректных путей данных: ${run}\n\n[Методика](README.md). Медианы мс; знак + означает замедление. Для N/A и незавершённых прогонов значений нет.\n\n` +
		table(
			[
				'Фреймворк',
				'Коллекция',
				'Среда',
				'До items',
				'После items',
				'Δ items',
				'После initial',
				'initial / до items',
			],
			comparisonRows,
		),
)
process.stdout.write(JSON.stringify({ output, coverage: manifest.coverage }, null, 2) + '\n')
