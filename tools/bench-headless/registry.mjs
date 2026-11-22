import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const names = ['@soxa-ui/react', '@ark-ui/react', 'radix-ui']
const result = { checkedAt: new Date().toISOString(), packages: {} }
for (const name of names) {
	const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`)
	if (!response.ok) throw new Error(`${name}: ${response.status}`)
	const data = await response.json()
	const version = manifest.dependencies[name]
	const pkg = data.versions[version]
	result.packages[name] = {
		version,
		published: data.time[version],
		license: pkg.license,
		repository: pkg.repository,
		homepage: pkg.homepage,
		peerDependencies: pkg.peerDependencies,
		dependencies: pkg.dependencies,
		exports: pkg.exports,
		tarball: pkg.dist.tarball,
		integrity: pkg.dist.integrity,
	}
}
const argument = process.argv.indexOf('--out')
const directory =
	argument === -1
		? path.resolve(
				root,
				'../../benchmarks/headless/results',
				`registry-${new Date().toISOString().replace(/[:.]/g, '-')}`,
			)
		: path.resolve(process.argv[argument + 1])
await mkdir(directory, { recursive: true })
await writeFile(path.join(directory, 'registry.json'), JSON.stringify(result, null, 2) + '\n', {
	flag: 'wx',
})
console.log(directory)
