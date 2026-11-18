import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
const folder = resolve(import.meta.dirname, 'shadcn')
mkdirSync(folder, { recursive: true })
const provenance = []
for (const name of ['tabs', 'toggle', 'toggle-group']) {
	const url = `https://ui.shadcn.com/r/styles/new-york-v4/${name}.json`
	const response = await fetch(url)
	if (!response.ok) throw Error(`${url}: ${response.status}`)
	const original = await response.text()
	const registry = JSON.parse(original)
	const content = registry.files[0].content
		.replaceAll('from "cn"', 'from "../shadcn-utils"')
		.replaceAll('from "@/registry/new-york-v4/ui/toggle"', 'from "./toggle"')
	writeFileSync(resolve(folder, name + '.tsx'), content)
	provenance.push({
		url,
		registrySha256: createHash('sha256').update(original).digest('hex'),
		sourceSha256: createHash('sha256').update(content).digest('hex'),
		adaptations: 'Only local import paths for cn and toggle.',
	})
}
const licenseUrl = 'https://raw.githubusercontent.com/shadcn-ui/ui/main/LICENSE.md'
const license = await fetch(licenseUrl)
if (!license.ok) throw Error('Cannot retrieve shadcn license')
writeFileSync(resolve(folder, 'LICENSE.md'), await license.text())
writeFileSync(
	resolve(folder, 'provenance.json'),
	JSON.stringify(
		{ retrievedAt: new Date().toISOString(), licenseUrl, files: provenance },
		null,
		2,
	),
)
// Use the benchmark's existing neutral application tokens; generate utilities for this snapshot.
writeFileSync(
	resolve(folder, 'globals.css'),
	readFileSync(
		resolve(import.meta.dirname, '../bench-compare/libs/react/shadcn/globals.css'),
		'utf8',
	).replace("@import 'tw-animate-css';", ''),
)
