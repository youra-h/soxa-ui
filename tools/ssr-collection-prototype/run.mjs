import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const npmCli = process.env.npm_execpath

if (!npmCli) throw new Error('Run with npm run check:ssr-collection-prototype')

const args = process.argv.slice(2)
const nativeOnly = args.includes('--native-only')
const reuseIndex = args.indexOf('--reuse')
const reused = reuseIndex === -1 ? undefined : args[reuseIndex + 1]
const expectedArgs = nativeOnly ? 1 : 0

if (args.length !== expectedArgs + (reused ? 2 : 0) || (reused && !isAbsolute(reused))) {
	throw new Error(
		'Usage: npm run check:ssr-collection-prototype -- [--native-only] [--reuse <absolute-fixture-directory>]',
	)
}

const directory = reused
	? realpathSync(reused)
	: mkdtempSync(join(tmpdir(), 'soxa-ssr-collection-prototype-'))

if (reused) {
	const repository = realpathSync(fileURLToPath(new URL('../../', import.meta.url)))
	const fromRepository = relative(repository, directory)
	const fixture = JSON.parse(readFileSync(join(directory, 'package.json'), 'utf8'))

	if (
		fromRepository !== '..' &&
		!fromRepository.startsWith('..' + sep) &&
		!isAbsolute(fromRepository)
	) {
		throw new Error('A reused fixture must be outside the repository')
	}

	if (fixture.name !== 'soxa-ssr-collection-prototype' || fixture.private !== true) {
		throw new Error('Only reuse a temporary fixture created by this tool')
	}
}
const dependencies = {
	'@soxa-ui/core': '0.4.0',
	'@soxa-ui/react': '0.4.0',
	'@soxa-ui/vue': '0.4.0',
	react: '19.3.1',
	'react-dom': '19.3.1',
	vue: '3.5.44',
	'@vue/server-renderer': '3.5.44',
	jsdom: '30.1.3',
	'@soxa-ui/svelte': '0.4.0',
	'@soxa-ui/solid': '0.4.0',
	'@soxa-ui/angular': '0.4.0',
	svelte: '5.57.2',
	'solid-js': '1.9.17',
	vite: '8.3.4',
	'vite-plugin-solid': '2.11.14',
	'@sveltejs/vite-plugin-svelte': '7.3.1',
	'@angular/common': '22.2.3',
	'@angular/compiler': '22.2.3',
	'@angular/core': '22.2.3',
	'@angular/forms': '22.2.3',
	'@angular/platform-browser': '22.2.3',
	'@angular/platform-server': '22.2.3',
	rxjs: '7.8.2',
}

cpSync(new URL('./fixture/', import.meta.url), directory, { recursive: true })
if (!reused) {
	writeFileSync(
		join(directory, 'package.json'),
		JSON.stringify(
			{
				name: 'soxa-ssr-collection-prototype',
				private: true,
				type: 'module',
				dependencies,
			},
			null,
			2,
		),
	)
	console.log('Experiment directory: ' + directory)
	execFileSync(
		process.execPath,
		[npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'],
		{
			cwd: directory,
			stdio: 'inherit',
		},
	)
}

const lock = JSON.parse(readFileSync(join(directory, 'package-lock.json'), 'utf8'))

for (const [name, version] of Object.entries(dependencies)) {
	const installed = lock.packages['node_modules/' + name]
	const actual = JSON.parse(
		readFileSync(join(directory, 'node_modules', name, 'package.json'), 'utf8'),
	)

	if (
		installed?.version !== version ||
		actual.version !== version ||
		!installed.resolved?.startsWith('https://registry.npmjs.org/')
	) {
		throw new Error('Expected published dependency: ' + name + '@' + version)
	}
}

if (!nativeOnly) {
	execFileSync(process.execPath, ['hydration.mjs'], { cwd: directory, stdio: 'inherit' })
	execFileSync(process.execPath, ['--expose-gc', 'check.mjs'], {
		cwd: directory,
		stdio: 'inherit',
	})
	execFileSync(process.execPath, ['--expose-gc', 'cross-check.mjs'], {
		cwd: directory,
		stdio: 'inherit',
	})
	for (const framework of ['vue', 'svelte', 'solid']) {
		execFileSync(process.execPath, ['cross-hydration.mjs', framework], {
			cwd: directory,
			stdio: 'inherit',
		})
	}
	execFileSync(process.execPath, ['cross-angular.mjs'], { cwd: directory, stdio: 'inherit' })
	for (const scenario of ['sync', 'conditional', 'nested']) {
		execFileSync(process.execPath, ['cross-angular-hydration.mjs', scenario], {
			cwd: directory,
			stdio: 'inherit',
		})
	}
	execFileSync(process.execPath, ['cross-summary.mjs'], { cwd: directory, stdio: 'inherit' })
	console.log('Evidence: ' + join(directory, 'report.json'))
	console.log('Cross-adapter evidence: ' + join(directory, 'cross-results.json'))
}

execFileSync(process.execPath, ['native-transport.mjs'], { cwd: directory, stdio: 'inherit' })
console.log('Native transport evidence: ' + join(directory, 'native-transport-results.json'))
