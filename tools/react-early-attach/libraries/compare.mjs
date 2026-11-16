import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const fixture =
	process.env.TABS_COMPARE_DIR ?? mkdtempSync(path.join(tmpdir(), 'soxa-tabs-libraries-'))
const results = path.join(here, 'results')
mkdirSync(results, { recursive: true })
const dependencies = {
	'@ark-ui/react': '5.40.0',
	'@radix-ui/react-tabs': '1.2.1',
	'@base-ui/react': '1.9.0',
	'radix-ui': '1.8.1',
	cn: '0.5.2',
	'class-variance-authority': '0.7.1',
	react: '19.3.1',
	'react-dom': '19.3.1',
	jsdom: '31.0.1',
	tsx: '4.23.15',
}
if (existsSync(path.join(fixture, 'package.json'))) {
	const prior = JSON.parse(readFileSync(path.join(fixture, 'package.json'), 'utf8'))
	if (prior.name !== 'soxa-tabs-libraries-experiment' || prior.private !== true)
		throw new Error('Unexpected fixture directory')
}
writeFileSync(
	path.join(fixture, 'package.json'),
	JSON.stringify(
		{ name: 'soxa-tabs-libraries-experiment', private: true, type: 'module', dependencies },
		null,
		2,
	),
)
writeFileSync(
	path.join(fixture, 'tsconfig.json'),
	JSON.stringify({ compilerOptions: { jsx: 'react-jsx' } }),
)
cpSync(path.join(here, 'fixture'), fixture, { recursive: true })
const provenance = []
for (const [name, url] of [
	['shadcn-radix', 'https://ui.shadcn.com/r/styles/new-york-v4/tabs.json'],
	['shadcn-base', 'https://ui.shadcn.com/r/styles/base-nova/tabs.json'],
]) {
	const response = await fetch(url)
	if (!response.ok) throw new Error(`${url}: ${response.status}`)
	const raw = await response.text()
	const registry = JSON.parse(raw)
	const source = registry.files.find((file) => file.path.endsWith('/tabs.tsx'))?.content
	if (!source) throw new Error('Missing official tabs source')
	const savedSource = path.join(results, name + '-registry.json')
	if (existsSync(savedSource)) {
		const priorSource = JSON.parse(readFileSync(savedSource, 'utf8')).files.find((file) =>
			file.path.endsWith('/tabs.tsx'),
		)?.content
		if (priorSource !== source)
			throw new Error(
				'Upstream shadcn source changed; review before updating the saved fixture',
			)
	}
	writeFileSync(path.join(fixture, name + '.tsx'), source)
	provenance.push({
		name,
		url,
		sha256: createHash('sha256').update(source).digest('hex'),
		path: registry.files[0].path,
	})
	writeFileSync(path.join(results, name + '-registry.json'), raw)
}
const licenseResponse = await fetch(
	'https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md',
)
if (!licenseResponse.ok) throw new Error('Cannot retrieve shadcn source license')
writeFileSync(path.join(results, 'shadcn-LICENSE.md'), await licenseResponse.text())
console.log('Fixture: ' + fixture)
const run = (args, options = {}) => {
	const child = spawnSync(process.execPath, args, {
		cwd: fixture,
		stdio: 'inherit',
		timeout: 180000,
		env: process.env,
		...options,
	})
	if (child.error) throw child.error
	if (child.status !== 0) throw new Error(`Child exited ${child.status}: ${args.join(' ')}`)
}
if (!existsSync(path.join(fixture, 'node_modules'))) {
	const npm =
		process.env.npm_execpath ??
		path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js')
	const savedLock = path.join(results, 'dependencies.lock.json')
	if (existsSync(savedLock)) cpSync(savedLock, path.join(fixture, 'package-lock.json'))
	run([
		npm,
		existsSync(savedLock) ? 'ci' : 'install',
		'--ignore-scripts',
		'--no-audit',
		'--no-fund',
	])
}
const lock = JSON.parse(readFileSync(path.join(fixture, 'package-lock.json'), 'utf8'))
for (const [name, version] of Object.entries(dependencies)) {
	if (lock.packages['node_modules/' + name]?.version !== version)
		throw new Error('Dependency mismatch: ' + name)
}
writeFileSync(path.join(results, 'dependencies.lock.json'), JSON.stringify(lock, null, 2))
run(['--import', 'tsx', 'server.tsx'])
for (const library of ['ark', 'radix', 'shadcn-radix', 'shadcn-base'])
	run(['--import', 'tsx', 'client.tsx', library])
const server = JSON.parse(readFileSync(path.join(fixture, 'server-results.json'), 'utf8'))
const clients = Object.fromEntries(
	['ark', 'radix', 'shadcn-radix', 'shadcn-base'].map((name) => [
		name,
		JSON.parse(readFileSync(path.join(fixture, name + '-client.json'), 'utf8')),
	]),
)
const report = {
	date: new Date().toISOString(),
	node: process.version,
	dependencies,
	provenance,
	server,
	clients,
	limits: 'Functional SSR and jsdom tests. No private registry/engine or heap audit; absence of a memory leak is not established. CSS, real keyboard/layout, Next/RSC and other adapters are outside this experiment.',
}
writeFileSync(path.join(results, 'comparison.json'), JSON.stringify(report, null, 2))
console.log(
	JSON.stringify(
		{
			results: path.join(results, 'comparison.json'),
			serverCases: server.length,
			clients: Object.keys(clients),
		},
		null,
		2,
	),
)
