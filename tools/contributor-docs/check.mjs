import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../..')
const directory = resolve(root, 'docs/contributing')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const json = (path) => JSON.parse(read(path))
const manifest = json('docs/contributing/manifest.json')
const frameworks = ['vue', 'react', 'angular', 'solid', 'svelte', 'webc']
const hash = (value) => createHash('sha256').update(value.replace(/\r\n/g, '\n')).digest('hex')
function requireThat(condition, message) {
	if (!condition) throw new Error(message)
}
function localPath(base, path) {
	const target = resolve(base, path)
	const name = relative(root, target)
	requireThat(name !== '..' && !name.startsWith(`..${sep}`), `Path escapes repository: ${path}`)
	requireThat(existsSync(target), `Missing local path: ${path}`)
	return target
}

requireThat(manifest.schemaVersion === 1, 'Unsupported guide manifest schema')
requireThat(manifest.audience === 'contributor' && !manifest.consumerCorpus, 'Wrong audience')
requireThat(/^[a-f0-9]{40}$/.test(manifest.sourceRevision), 'Expected full source revision')
requireThat(manifest.validationScope === 'structural-source-walkthrough', 'Unverified scope')
requireThat(manifest.modules.length === new Set(manifest.modules).size, 'Duplicate module')
const entry = read('docs/contributing/README.md')
requireThat(entry.includes(manifest.sourceRevision), 'Entry revision differs from manifest')
requireThat(entry.includes(`**${manifest.componentPackageVersion}**`), 'Entry version differs')
requireThat(
	json('packages/core/package.json').version === manifest.componentPackageVersion,
	'Source version drift',
)

let links = 0
for (const module of manifest.modules) {
	const file = localPath(directory, module)
	const content = readFileSync(file, 'utf8')
	requireThat(content.trim().startsWith('# '), `Missing module heading: ${module}`)
	for (const [, href] of content.matchAll(/\]\(([^)]+)\)/g)) {
		if (href.startsWith('https://')) continue
		requireThat(!href.includes('://'), `Unsupported link: ${href}`)
		localPath(dirname(file), decodeURIComponent(href.split('#')[0]))
		links++
	}
}

const witnesses = new Set()
for (const witness of manifest.witnesses) {
	requireThat(!witnesses.has(witness.path), `Duplicate witness: ${witness.path}`)
	witnesses.add(witness.path)
	localPath(root, witness.path)
	const source = execFileSync('git', ['show', `${manifest.sourceRevision}:${witness.path}`], {
		cwd: root,
		encoding: 'utf8',
		maxBuffer: 16 * 1024 * 1024,
	})
	requireThat(hash(source) === witness.sha256, `Pinned mismatch: ${witness.path}`)
	requireThat(
		hash(read(witness.path)) === witness.sha256,
		`Checkout drift; review guide: ${witness.path}`,
	)
}

const adapters = manifest.example.adapters
requireThat(manifest.example.component === 'button', 'Unexpected example')
requireThat(
	adapters.length === 6 && new Set(adapters.map((a) => a.framework)).size === 6,
	'Expected six unique adapters',
)
const inventory = json('tools/public-api/exports.json')
const button = json('docs/api/generated/contract.json').components.find((c) => c.id === 'button')
requireThat(button, 'Button missing from generated API')
for (const framework of frameworks) {
	const adapter = adapters.find((a) => a.framework === framework)
	requireThat(adapter, `Missing adapter: ${framework}`)
	for (const key of ['view', 'setup', 'componentExport', 'rootExport', 'test']) {
		requireThat(witnesses.has(adapter[key]), `Missing ${framework} ${key} witness`)
	}
	const exported = button.frameworks[framework]?.exportName
	requireThat(
		exported && inventory[framework].values.includes(exported),
		`Missing public ${framework} Button export`,
	)
	requireThat(
		read(adapter.componentExport).includes(exported) ||
			(framework === 'angular' &&
				read(adapter.componentExport).includes("export * from './button.component'") &&
				read(adapter.view).includes(`export class ${exported}`)),
		`Missing component export: ${framework}`,
	)
}
requireThat(
	inventory.webc.subpaths['./button'].values.includes('TButtonElement'),
	'Missing WebC subpath inventory',
)
requireThat(
	json('packages/ui/webc/package.json').exports['./button'],
	'Missing WebC package export',
)
const theme = json('packages/themes/base/theme-contract.json')
requireThat(
	theme.roots.some((part) => part.name === 'so-button'),
	'Missing theme root',
)
requireThat(
	theme.parts.some((part) => part.name === 'so-button__text'),
	'Missing text part',
)
requireThat(
	read('packages/themes/base/src/index.css').includes('./components/button.css'),
	'Missing Base import',
)
requireThat(
	read('packages/themes/oren/src/index.scss').includes('components/button/button'),
	'Missing Oren import',
)
requireThat(
	read('packages/ui/angular/src/components/button/manifest.ts').includes(
		'ButtonDescriptor as descriptor',
	),
	'Missing discovery manifest',
)
requireThat(
	read('packages/playground/shared/src/registry.ts').includes('ButtonDescriptor'),
	'Missing playground discovery',
)
console.log(
	`Contributor guide: ${manifest.modules.length} modules, ${links} local links, ${witnesses.size} pinned witnesses, six Button adapters verified.`,
)
console.log(
	`Source: ${manifest.sourceRevision}; component version: ${manifest.componentPackageVersion}. Structural checks only.`,
)
