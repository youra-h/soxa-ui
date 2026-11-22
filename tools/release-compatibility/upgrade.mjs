import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export function upgradeGuideFor(manifest) {
	const component = manifest.packages.find((pkg) => pkg.scope === 'components')
	const first = manifest.packages[0]
	if (!first) throw new Error('No release packages for an upgrade guide')
	const slug = component
		? component.version
		: first.name.replace('@soxa-ui/', '') + '-' + first.version
	return 'docs/upgrade/' + slug + '.md'
}

export function requireUpgradeGuide(root, manifest) {
	const guide = upgradeGuideFor(manifest)
	if (!existsSync(join(root, guide)))
		throw new Error('Write and review the consumer upgrade guide before versioning: ' + guide)
	const text = readFileSync(join(root, guide), 'utf8')
	for (const heading of ['## Who is affected', '## Before', '## After', '## Verification'])
		if (!text.includes(heading)) throw new Error('Missing ' + heading + ' in ' + guide)
	if (
		!readFileSync(join(root, 'docs/upgrade/README.md'), 'utf8').includes(
			guide.slice('docs/upgrade/'.length),
		)
	)
		throw new Error('Upgrade index must link ' + guide)
	return guide
}
