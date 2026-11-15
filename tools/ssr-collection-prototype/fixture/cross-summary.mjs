import { readFileSync, writeFileSync } from 'node:fs'
import { cpus } from 'node:os'

const read = (name) => JSON.parse(readFileSync('./' + name, 'utf8'))
const report = {
	checkedAt: new Date().toISOString(),
	environment: {
		node: process.version,
		platform: process.platform,
		cpu: cpus()[0]?.model,
		dependencies: read('package.json').dependencies,
	},
	...read('cross-report.json'),
	hydration: Object.fromEntries(
		['vue', 'svelte', 'solid'].map((framework) => [
			framework,
			read('cross-hydration-' + framework + '.json'),
		]),
	),
	angular: {
		ssr: read('cross-angular.json').map(({ html: _html, ...result }) => result),
		hydration: ['sync', 'conditional', 'nested'].map((scenario) =>
			read('cross-hydration-angular-' + scenario + '.json'),
		),
	},
	disposition:
		'Synchronous proof of concept succeeds independently in Vue, Svelte and Solid. The ordinal collector is rejected for general use: scanning inactive panels shifts scopes. This does not prove a shared production mechanism is required.',
	limits: [
		'Published packages in isolated fixtures, not production adapter changes.',
		'Hydration runs in jsdom with ResizeObserver stubbed; no layout or full framework application claim.',
		'Request-local ordinal identity is experimental and not a public API.',
		'Dynamic client additions, async/streamed boundaries, external engine/ctrl ownership and cleanup need separate production checks.',
		'Timing is a local fixture measurement with 100 tabs, not a production performance guarantee.',
	],
}
writeFileSync('./cross-results.json', JSON.stringify(report, null, 2))
console.log('Cross-adapter evidence: cross-results.json')
