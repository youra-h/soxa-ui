import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { serve, checkPage, missingReferences } from './consumer-browser.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const directory =
	process.env.SOXA_ANGULAR_SMOKE_DIR || mkdtempSync(join(tmpdir(), 'soxa-angular-docs-smoke-'))
const npmCli = process.env.npm_execpath
if (!npmCli) throw new Error('Run with npm run check:ai-docs:angular')
const run = (args, cwd) => execFileSync(process.execPath, args, { cwd, stdio: 'inherit' })
async function eventually(read, expected) {
	const deadline = Date.now() + 5000
	while (Date.now() < deadline) {
		if ((await read()) === expected) return
		await new Promise((done) => setTimeout(done, 25))
	}
	assert.equal(await read(), expected)
}
const source = join(root, 'docs/ai/0.3.0/examples/angular')
console.log('Angular consumer workspace: ' + directory)

for (const ssr of [false, true]) {
	const cwd = join(directory, ssr ? 'ssr' : 'csr')
	cpSync(source, cwd, { recursive: true })
	if (!ssr) {
		const p = join(cwd, 'angular.json')
		const config = JSON.parse(readFileSync(p, 'utf8'))
		const options = config.projects.app.architect.build.options
		for (const key of ['server', 'outputMode', 'ssr', 'security']) delete options[key]
		writeFileSync(p, JSON.stringify(config))
		const appConfig = join(cwd, 'src/app/app.config.ts')
		writeFileSync(
			appConfig,
			readFileSync(appConfig, 'utf8')
				.replace('provideAttrs(), provideClientHydration()', 'provideAttrs()')
				.replace("import { provideClientHydration } from '@angular/platform-browser'", ''),
		)
	}
	run([npmCli, 'install', '--no-audit', '--no-fund'], cwd)
	const manifest = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8'))
	const lock = JSON.parse(readFileSync(join(cwd, 'package-lock.json'), 'utf8'))
	for (const [name, version] of Object.entries({
		...manifest.dependencies,
		...manifest.devDependencies,
	})) {
		const entries = Object.entries(lock.packages).filter(([path]) =>
			path.endsWith('node_modules/' + name),
		)
		if (name.startsWith('@soxa-ui/'))
			assert.equal(entries.length, 1, 'One published copy: ' + name)
		const installed = lock.packages['node_modules/' + name]
		assert.equal(installed.version, version)
		assert.ok(installed.resolved.startsWith('https://registry.npmjs.org/'))
	}
	run(
		[
			'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
			'-p',
			'tsconfig.app.json',
			'--noEmit',
		],
		cwd,
	)
	const app = join(cwd, 'src/app/app.ts')
	const original = readFileSync(app, 'utf8')
	writeFileSync(app, original.replace('text="Reset name"', '[text]="42"'))
	let rejected = false
	try {
		execFileSync(
			process.execPath,
			[
				'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
				'-p',
				'tsconfig.app.json',
				'--noEmit',
			],
			{ cwd, encoding: 'utf8', stdio: 'pipe' },
		)
	} catch (error) {
		assert.match(
			error.stdout + error.stderr,
			/Type 'number' is not assignable to type 'string'/,
		)
		rejected = true
	} finally {
		writeFileSync(app, original)
	}
	assert.ok(rejected, 'Angular must reject an invalid component template input')
	run(['node_modules/@angular/cli/bin/ng.js', 'build'], cwd)
	const browser = await chromium.launch({ headless: true })
	let production
	try {
		if (ssr) production = await serve(cwd, ['dist/app/server/server.mjs'])
		else {
			writeFileSync(
				join(cwd, 'static-server.mjs'),
				`import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';import {extname,join} from 'node:path';const types={'.js':'text/javascript','.css':'text/css','.html':'text/html'};const server=createServer(async(req,res)=>{try {const file=join('dist/app/browser',req.url==='/'?'index.html':req.url);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.statusCode=404;res.end()}});server.listen(0,'127.0.0.1',()=>console.log('http://127.0.0.1:'+server.address().port));`,
			)
			production = await serve(cwd, ['static-server.mjs'])
		}
		await checkPage(browser, production.url, ssr, {
			afterInteractions: async (page, input) => {
				await page.getByRole('button', { name: 'Reset name', exact: true }).click()
				await eventually(() => input.inputValue(), 'Reset')
				assert.equal(await input.inputValue(), 'Reset')
				const email = page.getByRole('textbox', { name: 'Contact email', exact: true })
				await email.fill('next@example.com')
				await email.blur()
				await page
					.getByTestId('form-state')
					.filter({ hasText: 'next@example.com|true' })
					.waitFor()
				await page.getByRole('button', { name: 'Toggle disabled', exact: true }).click()
				await eventually(() => email.isDisabled(), true)
				assert.ok(await email.isDisabled())
				await page.getByRole('button', { name: 'Toggle disabled', exact: true }).click()
				await eventually(() => email.isEnabled(), true)
				assert.ok(await email.isEnabled())
				await page.getByRole('button', { name: 'Reset form', exact: true }).click()
				await eventually(() => email.inputValue(), '')
				assert.equal(await email.inputValue(), '')
				await page.getByTestId('form-state').filter({ hasText: 'null|false' }).waitFor()
				console.log('Hydrated references:', JSON.stringify(await missingReferences(page)))
			},
			validateSSRReferences: (broken) => {
				console.log('Raw SSR references:', JSON.stringify(broken))
				assert.deepEqual(broken, [])
			},
		})
	} finally {
		production?.server.kill()
		await browser.close()
	}
}
console.log(
	'Published 0.3.0 Angular strict ngc/negative guard/production CSR+SSR/browser passed (' +
		directory +
		')',
)
