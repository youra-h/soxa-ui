import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
const fixture = process.argv[2]
if (!fixture) throw new Error('Pass the temporary fixture directory')
const sources = [
	[
		'@radix-ui/react-tabs/dist/index.mjs',
		/useControllableState|defaultProp:|context.value|makeTriggerId|makeContentId/,
	],
	['@radix-ui/react-collection/dist/index.mjs', /React.useEffect|itemMap.set|itemMap.delete/],
	['@ark-ui/react/dist/components/tabs/use-tabs.js', /machineProps|service|tabs.connect/],
	['@zag-js/tabs/dist/tabs.machine.js', /defaultValue:|value: prop\("value"\)/],
	[
		'@zag-js/tabs/dist/tabs.connect.js',
		/selected: context|getContentProps|aria-controls|aria-labelledby/,
	],
	['@zag-js/tabs/dist/tabs.dom.js', /getElements =|queryAll|getNextTriggerEl =/],
	[
		'@base-ui/react/tabs/root/TabsRoot.js',
		/defaultValue:|useControlled|default: defaultValueProp|valueProp|registerMountedTabPanel/,
	],
	['@base-ui/react/tabs/panel/TabsPanel.js', /open =|useIsoLayoutEffect|registerMountedTabPanel/],
]
const rows = sources.map(([file, pattern]) => {
	const text = readFileSync(path.join(fixture, 'node_modules', file), 'utf8')
	return {
		file,
		sha256: createHash('sha256').update(text).digest('hex'),
		matches: text
			.split(/\r?\n/)
			.flatMap((line, index) =>
				pattern.test(line) ? [{ line: index + 1, text: line.trim() }] : [],
			),
	}
})
writeFileSync(
	new URL('./results/source-audit.json', import.meta.url),
	JSON.stringify(rows, null, 2),
)
