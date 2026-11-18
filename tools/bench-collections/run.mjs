import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { serve } from '../bench-pages/serve.mjs'
import { browserCase } from './browser-run.mjs'
const args = process.argv.slice(2)
const option = (name, fallback) =>
	args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback
const frameworks = option('fw', 'vue,react,solid,svelte,angular,webc').split(',')
const kinds = option('kind', 'tabs,tags').split(',')
const variants = option('variant', 'before,after').split(',')
const surfaces = option('surface', 'ssr,client').split(',')
const n = Number(option('n', '1000'))
const libraries = option('libs', 'soxa,ark,shadcn,mui').split(',')
const folder = resolve(import.meta.dirname, 'results', option('run', '1000'))
mkdirSync(folder, { recursive: true })
let index = []
try {
	index = JSON.parse(readFileSync(resolve(folder, 'index.json'), 'utf8'))
} catch {}
const cells = []
for (const variant of variants)
	for (const framework of frameworks)
		for (const library of libraries) {
			if (library !== 'soxa' && variant === 'before') continue
			if (library === 'ark' && !['react', 'vue', 'solid', 'svelte'].includes(framework))
				continue
			if (['mui', 'shadcn'].includes(library) && framework !== 'react') continue
			const modes =
				library !== 'soxa'
					? ['native']
					: option('modes', '')
						? option('modes', '').split(',')
						: variant === 'before'
							? ['declarative', 'data']
							: ['declarative', 'data', 'initial']
			for (const kind of kinds)
				for (const mode of modes)
					for (const surface of surfaces) {
						cells.push({ variant, framework, kind, mode, library, n, surface })
					}
		}
const modeOrder = [
	'before-declarative',
	'after-declarative',
	'before-data',
	'after-data',
	'after-initial',
	'after-native',
]
cells.sort(
	(a, b) =>
		frameworks.indexOf(a.framework) - frameworks.indexOf(b.framework) ||
		kinds.indexOf(a.kind) - kinds.indexOf(b.kind) ||
		surfaces.indexOf(a.surface) - surfaces.indexOf(b.surface) ||
		libraries.indexOf(a.library) - libraries.indexOf(b.library) ||
		modeOrder.indexOf(`${a.variant}-${a.mode}`) - modeOrder.indexOf(`${b.variant}-${b.mode}`),
)
for (const cell of cells) {
	const { variant, framework, kind, mode, library, surface } = cell
	const id = [variant, framework, library, kind, mode, surface].join('-')
	const output = resolve(folder, id + '.json')
	if (args.includes('--resume')) {
		try {
			const saved = JSON.parse(readFileSync(output, 'utf8'))
			if (
				(!saved.error || args.includes('--keep-errors')) &&
				saved.n === n &&
				(surface !== 'client' || saved.protocol === 'client-v3-isolated-phases')
			)
				continue
		} catch {}
	}
	process.stdout.write(id + '\n')
	if (surface === 'ssr' && framework === 'webc')
		writeFileSync(
			output,
			JSON.stringify(
				{
					...cell,
					status: 'not-applicable',
					reason: 'No supported Web Components server renderer in Soxa.',
				},
				null,
				2,
			),
		)
	else if (surface === 'ssr') {
		const result = spawnSync(
			process.execPath,
			[
				'--expose-gc',
				resolve(import.meta.dirname, 'ssr-worker.mjs'),
				variant,
				framework,
				kind,
				mode,
				library,
				String(n),
				output,
			],
			{
				encoding: 'utf8',
				env: { ...process.env, NODE_ENV: 'production' },
				timeout: 180000,
				maxBuffer: 2 * 1024 * 1024,
			},
		)
		if (result.error || result.status !== 0) {
			let existing
			try {
				existing = JSON.parse(readFileSync(output, 'utf8'))
			} catch {}
			if (!existing)
				writeFileSync(
					output,
					JSON.stringify(
						{
							...cell,
							error:
								result.stderr || result.error?.message || `exit ${result.status}`,
						},
						null,
						2,
					),
				)
		}
	} else {
		const { server, base } = serve(
			resolve(import.meta.dirname, `dist/${variant}/${framework}/client`),
		)
		try {
			await browserCase(base, `${framework}.html`, cell, output)
		} finally {
			await new Promise((resolve) => server.close(resolve))
		}
	}
	const result = JSON.parse(readFileSync(output, 'utf8'))
	index = index.filter((row) => row.id !== id)
	index.push({ id, file: output, result })
	writeFileSync(resolve(folder, 'index.json'), JSON.stringify(index, null, 2))
	process.stdout.write(
		JSON.stringify({
			quality: result.quality,
			error: result.error,
			ssrMs: result.latency?.medianMs,
			domMs: result.latency?.medianDomMs,
			action: result.action,
			objects: result.settled?.objects ?? {
				component: result.settled?.component,
				bundle: result.settled?.bundle,
			},
		}) + '\n',
	)
}
