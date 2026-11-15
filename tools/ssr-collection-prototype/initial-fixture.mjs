import { createElement as h, Fragment } from 'react'
import { Tabs } from '@soxa-ui/react'
import { readdirSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { join, relative } from 'node:path'

export function input(n, nested) {
	return {
		items: Array.from({ length: n }, (_, i) => ({
			value: `v${i}`,
			text: `Item ${i}`,
			_: {
				active: i === 1,
				...(nested
					? {
							payload: {
								nodes: Array.from({ length: 16 }, (_, j) => ({
									key: j,
									data: [j, j + 1, j + 2],
								})),
							},
						}
					: {}),
			},
		})),
		panels: Array.from({ length: n }, (_, i) => ({ value: `v${i}` })),
	}
}

export function tree(source, prepared) {
	const panels = source.panels.map((panel, ordinal) =>
		h(
			Tabs.Content,
			{
				key: ordinal,
				...(prepared ? { initial: ordinal } : { value: panel.value }),
			},
			`Panel ${ordinal}`,
		),
	)
	return h(
		Tabs,
		prepared
			? { initial: source, content: h(Fragment, null, ...panels) }
			: {
					items: source.items,
					content: h(Fragment, null, ...panels),
				},
	)
}

export function distHash(packagePath) {
	const directory = fileURLToPath(new URL('../../' + packagePath + '/dist/', import.meta.url))
	const hash = createHash('sha256')
	function visit(folder) {
		for (const entry of readdirSync(folder, { withFileTypes: true }).sort((a, b) =>
			a.name.localeCompare(b.name),
		)) {
			const path = join(folder, entry.name)
			if (entry.isDirectory()) visit(path)
			else if (entry.name.endsWith('.js')) {
				hash.update(relative(directory, path))
				hash.update(readFileSync(path))
			}
		}
	}
	visit(directory)
	return hash.digest('hex')
}
