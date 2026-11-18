import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { performance } from 'node:perf_hooks'
import { JSDOM } from 'jsdom'
import { createServer, build } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import solid from 'vite-plugin-solid'
import { newRun } from './cross-plan.mjs'
import { app } from './cross-vue.mjs'
import { renderToString as renderVue } from '@vue/server-renderer'

const plugins = () => [
	svelte(),
	solid({
		ssr: true,
		hot: false,
		extensions: ['.tsx', '.jsx'],
		include: [/\.tsx$/, /@soxa-ui[\\/]solid[\\/]dist[\\/]source[\\/].*\.jsx$/],
	}),
]
const server = await createServer({
	configFile: false,
	root: import.meta.dirname,
	plugins: plugins(),
	server: { middlewareMode: true, hmr: false, watch: null },
	ssr: {
		noExternal: [/solid-js/, /@soxa-ui\/solid/, /@soxa-ui\/svelte/, /svelte/],
		resolve: { conditions: ['node', 'solid', 'svelte'] },
	},
	resolve: { conditions: ['node', 'solid', 'svelte'] },
})
const observations = [],
	timing = []
const diagnostics = []
const savedWarn = console.warn
const savedError = console.error
console.warn = (...args) => diagnostics.push(args.map(String).join(' '))
console.error = (...args) => diagnostics.push(args.map(String).join(' '))
function inspect(html) {
	const dom = new JSDOM(html)
	const tabs = [...dom.window.document.querySelectorAll('[role="tab"]')]
	const result = {
		tabs: tabs.map((t) => t.textContent),
		stops: tabs.map((t) => t.getAttribute('tabindex')),
		panels: dom.window.document.querySelectorAll('[role="tabpanel"]').length,
		activeLinks: tabs
			.filter((t) => t.getAttribute('aria-selected') === 'true')
			.every(
				(t) =>
					dom.window.document
						.getElementById(t.getAttribute('aria-controls'))
						?.getAttribute('role') === 'tabpanel',
			),
	}
	dom.window.close()
	return result
}
const serialize = (plan) => [...plan].map(([id, items]) => [id, [...items]])
try {
	const Solid = await server.ssrLoadModule('/cross-solid.tsx')
	const solidWeb = await server.ssrLoadModule('solid-js/web')
	const Svelte = (await server.ssrLoadModule('/CrossPage.svelte')).default
	const svelteServer = await server.ssrLoadModule('svelte/server')
	const renderers = {
		vue: (props) => renderVue(app(props)),
		solid: (props) => solidWeb.renderToString(() => Solid.Page(props)),
		svelte: (props) => svelteServer.render(Svelte, { props }).body,
	}
	for (const [framework, render] of Object.entries(renderers)) {
		const fixtures = []
		for (const scenario of ['sync', 'conditional', 'nested', 'inactive-nested']) {
			const props = { scenario }
			const baseline = inspect(await render({ ...props, run: newRun('baseline') }))
			const scan = newRun('scan')
			await render({ ...props, candidate: true, run: scan })
			try {
				const html = await render({
					...props,
					candidate: true,
					run: newRun('render', scan.plan),
				})
				const candidate = inspect(html)
				assert.notEqual(
					scenario,
					'inactive-nested',
					'Ordinal scopes must reject the inactive nested declaration in this candidate',
				)
				assert.equal(
					candidate.stops.filter((s) => s === '0').length,
					scenario === 'nested' ? 2 : 1,
				)
				assert.equal(
					candidate.tabs.some((t) => t === 'Tab 1'),
					scenario !== 'conditional',
				)
				assert.equal(candidate.tabs.includes('Tab nested-1'), scenario === 'nested')
				assert.equal(candidate.panels, scenario === 'nested' ? 2 : 1)
				assert.equal(candidate.activeLinks, true)
				assert.deepEqual(diagnostics, [])
				observations.push({
					framework,
					scenario,
					baseline,
					candidate,
					scopes: scan.plan.size,
				})
				fixtures.push({
					props,
					html,
					plan: serialize(scan.plan),
					...(framework === 'solid'
						? {
								hydrationScript: /<script[^>]*>([\s\S]*?)<\/script>/.exec(
									solidWeb.generateHydrationScript(),
								)[1],
							}
						: {}),
				})
			} catch (error) {
				if (scenario !== 'inactive-nested') throw error
				assert.match(String(error), /Declaration missing/)
				observations.push({
					framework,
					scenario,
					baseline,
					rejected: String(error),
					diagnostics: diagnostics.splice(0),
					scopes: scan.plan.size,
				})
			}
		}
		writeFileSync('./cross-' + framework + '.json', JSON.stringify(fixtures, null, 2))
		const props = { count: 100 }
		const scan = newRun('scan')
		await render({ ...props, candidate: true, run: scan })
		const measures = { baseline: [], prepared: [], prototype: [], discovery: [] }
		for (let round = -3; round < 9; round++)
			for (const mode of round % 2
				? ['discovery', 'prototype', 'prepared', 'baseline']
				: ['baseline', 'prepared', 'prototype', 'discovery']) {
				globalThis.gc?.()
				const start = performance.now()
				if (mode === 'discovery') {
					await render({ ...props, candidate: true, run: newRun('scan') })
				} else if (mode === 'prototype') {
					const local = newRun('scan')
					await render({ ...props, candidate: true, run: local })
					await render({ ...props, candidate: true, run: newRun('render', local.plan) })
				} else
					await render({
						...props,
						candidate: mode === 'prepared',
						run: newRun(mode === 'prepared' ? 'render' : 'baseline', scan.plan),
					})
				if (round >= 0) measures[mode].push(performance.now() - start)
			}
		timing.push({
			framework,
			tabs: 100,
			warmups: 3,
			rounds: 9,
			samplesMs: measures,
			medianMs: Object.fromEntries(
				Object.entries(measures).map(([k, v]) => [k, [...v].sort((a, b) => a - b)[4]]),
			),
		})
	}
	assert.deepEqual(diagnostics, [])
	writeFileSync('./cross-report.json', JSON.stringify({ observations, timing }, null, 2))
} finally {
	await server.close()
	console.warn = savedWarn
	console.error = savedError
}
await build({
	configFile: false,
	root: import.meta.dirname,
	plugins: plugins(),
	define: {
		__VUE_OPTIONS_API__: true,
		__VUE_PROD_DEVTOOLS__: false,
		__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
		'process.env.NODE_ENV': JSON.stringify('development'),
	},
	resolve: { conditions: ['browser', 'solid', 'svelte'] },
	build: {
		lib: { entry: 'cross-client.mjs', formats: ['es'], fileName: 'cross-client' },
		outDir: 'client',
		minify: false,
	},
})
console.log(
	JSON.stringify(
		{ observations, timing: timing.map(({ samplesMs: _samplesMs, ...rest }) => rest) },
		null,
		2,
	),
)
