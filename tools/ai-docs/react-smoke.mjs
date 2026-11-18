import { documentationRelease } from './release.mjs'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage, missingReferences } from './consumer-browser.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const release = documentationRelease(root)
const { version, legacy } = release
const directory = mkdtempSync(join(tmpdir(), 'soxa-react-docs-smoke-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:react')
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' })
const put = (cwd, file, text) => {
	mkdirSync(dirname(join(cwd, file)), { recursive: true })
	writeFileSync(join(cwd, file), text)
}
const manifest = JSON.parse(readFileSync(join(root, `docs/ai/${version}/manifest.json`), 'utf8'))
const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
cpSync(join(root, 'docs/ai'), join(directory, 'docs/ai'), { recursive: true })
cpSync(join(root, 'tools/ai-docs'), join(directory, 'tools/ai-docs'), { recursive: true })
const examples = join(directory, `docs/ai/${version}/examples`)
const pins = { react: '19.3.0', 'react-dom': '19.3.0' }
const types = {
	typescript: '6.0.2',
	'@types/react': '19.2.14',
	'@types/react-dom': '19.2.3',
	'@types/node': '24.10.0',
}
const compilerOptions = {
	target: 'ES2022',
	module: 'ESNext',
	moduleResolution: 'Bundler',
	strict: true,
	skipLibCheck: false,
	noEmit: true,
	jsx: 'react-jsx',
	lib: ['ES2024', 'DOM', 'DOM.Iterable'],
	esModuleInterop: true,
}

function install(cwd, framework) {
	const packageJson = {
		private: true,
		type: 'module',
		dependencies: { ...manifest.packages, ...pins, ...framework },
		devDependencies: types,
	}
	put(cwd, 'package.json', JSON.stringify(packageJson))
	run([npmCli, 'install', '--ignore-scripts', '--no-audit', '--no-fund'], cwd)
	const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
	for (const [name, version] of Object.entries({
		...manifest.packages,
		...pins,
		...framework,
		...types,
	})) {
		const entries = Object.entries(lock.packages).filter(([path]) =>
			path.endsWith('node_modules/' + name),
		)
		assert.equal(entries.length, 1, 'One published copy: ' + name)
		assert.equal(entries[0][1].version, version)
		assert.ok(entries[0][1].resolved.startsWith('https://registry.npmjs.org/'))
	}
}

const vite = join(directory, 'vite-consumer')
mkdirSync(vite)
cpSync(join(examples, 'react'), vite, { recursive: true })
put(
	vite,
	'index.html',
	'<html lang="en"><head><link rel="icon" href="data:,"><title>React recipes</title></head><body><div id="root"></div><script type="module" src="/main.tsx"></script></body></html>',
)
put(
	vite,
	'vite.config.mjs',
	"import react from '@vitejs/plugin-react'\nexport default { plugins: [react()] }\n",
)
put(vite, 'tsconfig.json', JSON.stringify({ compilerOptions, include: ['*.tsx'] }))
install(vite, { vite: '8.2.2', '@vitejs/plugin-react': '6.0.1' })
run(
	[
		join(directory, 'tools/ai-docs/cli.mjs'),
		'--manifest',
		join(directory, `docs/ai/${version}/manifest.json`),
		'--package',
		join(vite, 'node_modules/@soxa-ui/setup'),
		'--revision',
		revision,
		'--out',
		join(directory, 'dist/corpus'),
	],
	directory,
)
run(['node_modules/typescript/bin/tsc', '--noEmit'], vite)
run(['node_modules/vite/bin/vite.js', 'build'], vite)

const next = join(directory, 'next-consumer')
mkdirSync(next)
cpSync(join(examples, 'next'), next, { recursive: true })
cpSync(join(examples, 'react/TravelRecipes.tsx'), join(next, 'recipes/TravelRecipes.tsx'), {
	recursive: true,
})
cpSync(join(examples, 'react/CtrlExample.tsx'), join(next, 'recipes/CtrlExample.tsx'))
put(
	next,
	'tsconfig.json',
	JSON.stringify({
		compilerOptions: { ...compilerOptions, jsx: 'preserve', plugins: [{ name: 'next' }] },
		include: ['**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
		exclude: ['node_modules'],
	}),
)
install(next, { next: '16.2.3' })
run(['node_modules/next/dist/bin/next', 'typegen'], next)
run(['node_modules/typescript/bin/tsc', '--noEmit'], next)
run(['node_modules/next/dist/bin/next', 'build', '--webpack'], next)

const browser = await chromium.launch({ headless: true })
try {
	for (const [cwd, args, ssr] of [
		[vite, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '0'], false],
		[
			vite,
			['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '0'],
			false,
		],
		[
			next,
			['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '0'],
			true,
		],
	]) {
		const production = await serve(cwd, args)
		try {
			await checkPage(browser, production.url, ssr, {
				afterInteractions: async (page, input) => {
					await page.getByRole('button', { name: 'Reset name', exact: true }).click()
					assert.equal(await input.inputValue(), 'Reset')
					if (ssr) {
						const inactive = page.getByRole('tab', { name: 'Privacy', exact: true })
						const expected = await inactive.getAttribute('aria-controls')
						const broken = await checkedReferences(page)
						assert.equal(
							broken.length,
							1,
							'Only the inactive Tabs content is unmounted after hydration',
						)
						assert.equal(broken[0].attr, 'aria-controls')
						assert.equal(broken[0].id, expected)
						await inactive.click()
						await page.getByRole('tabpanel', { name: 'Privacy', exact: true }).waitFor()
						const switched = await checkedReferences(page)
						assert.equal(switched.length, 1)
						assert.equal(switched[0].attr, 'aria-controls')
						assert.equal(
							switched[0].id,
							await page
								.getByRole('tab', { name: 'General', exact: true })
								.getAttribute('aria-controls'),
						)
					} else assert.deepEqual(await checkedReferences(page), [])
				},
				validateSSRReferences: (broken) => {
					if (!legacy) {
						assert.equal(broken.length, 2)
						assert.ok(
							broken.every(
								(entry) =>
									entry.role === 'tab' &&
									entry.attr === 'aria-controls' &&
									entry.id.endsWith('-panel'),
							),
						)
						return
					}
					assert.equal(broken.length, 4, 'Exact known 0.3.0 raw SSR reference gaps')
					assert.ok(broken.every((entry) => entry.attr === 'aria-controls'))
					assert.equal(
						broken.filter(
							(entry) =>
								entry.role === 'combobox' &&
								entry.label === 'Destination' &&
								entry.id.endsWith('-list'),
						).length,
						1,
					)
					assert.equal(
						broken.filter(
							(entry) =>
								entry.classes.includes('so-date-picker__trigger') &&
								entry.label === 'Choose date' &&
								entry.id.endsWith('-panel'),
						).length,
						1,
					)
					assert.equal(
						broken.filter(
							(entry) => entry.role === 'tab' && entry.id.endsWith('-panel'),
						).length,
						2,
					)
				},
			})
			if (ssr) {
				const context = await browser.newContext({ javaScriptEnabled: false })
				try {
					const page = await context.newPage()
					await page.goto(production.url)
					await page.getByRole('tab', { name: 'General', exact: true }).waitFor()
					assert.equal(
						await page.getByText('General settings', { exact: true }).count(),
						0,
						'Known 0.3.0 active Tabs SSR content gap',
					)
					assert.equal(
						await page.locator('.so-calendar').count(),
						0,
						'Portal calendar is client mounted',
					)
					assert.ok(
						(
							await page
								.locator('html')
								.evaluate((el) => getComputedStyle(el).colorScheme)
						).includes('light'),
					)
				} finally {
					await context.close()
				}
			}
		} finally {
			production.server.kill()
		}
	}
} finally {
	await browser.close()
}
console.log(
	'Published ' +
		version +
		': React StrictMode and Next types/build/browser/SSR passed (' +
		directory +
		')',
)

async function checkedReferences(page) {
	const missing = await missingReferences(page)
	const hiddenPickerLabels = missing.filter(
		(entry) =>
			entry.attr === 'aria-labelledby' &&
			entry.role === 'dialog' &&
			entry.classes === 'so-frame so-popover__panel' &&
			entry.hidden &&
			entry.withinDatePicker &&
			entry.id.endsWith('-picker-0'),
	)
	assert.equal(
		hiddenPickerLabels.length,
		legacy ? 1 : 0,
		'Release-specific hidden Calendar picker labels',
	)
	return missing.filter((entry) => !hiddenPickerLabels.includes(entry))
}
