// @vitest-environment jsdom
import { afterAll, expect, it } from 'vitest'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server.node'
import { writeFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { Tabs } from '@soxa-ui/react'
import {
	TIsolatedExecution,
	installIsolationHooks,
	removeIsolationHooks,
	setEarlyClient,
} from './scope.mjs'

installIsolationHooks()
Reflect.set(globalThis, 'IS_REACT_ACT_ENVIRONMENT', true)
Reflect.set(
	globalThis,
	'ResizeObserver',
	class {
		observe() {}
		unobserve() {}
		disconnect() {}
	},
)
const rows: object[] = []
function Tree() {
	return (
		<Tabs content={<Tabs.Content value="b">PANEL-b</Tabs.Content>}>
			<Tabs.Item value="a" text="A" />
			<Tabs.Item value="b" text="B" active />
		</Tabs>
	)
}

for (const early of [false, true]) {
	it(`records hydration with fresh client variables, early=${early}`, async () => {
		const scope = new TIsolatedExecution()
		let html = ''
		try {
			html = scope.run(() => renderToString(<Tree />))
		} finally {
			scope.dispose()
		}
		const container = document.createElement('div')
		container.innerHTML = html
		document.body.append(container)
		const original = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
		const diagnostics: string[] = [],
			recoverable: string[] = []
		const error = console.error,
			warn = console.warn
		console.error = (...args) => {
			diagnostics.push(args.map(String).join(' '))
			error(...args)
		}
		console.warn = (...args) => {
			diagnostics.push(args.map(String).join(' '))
			warn(...args)
		}
		let root: ReturnType<typeof hydrateRoot> | undefined
		setEarlyClient(early)
		try {
			await act(async () => {
				root = hydrateRoot(container, <Tree />, {
					onRecoverableError: (error) => recoverable.push(String(error)),
				})
			})
			const sameNodes = original.every((node) => container.contains(node))
			rows.push({
				name: early ? 'matching-early-client' : 'legacy-client',
				sameNodes,
				diagnostics,
				recoverable,
				panel: container.querySelector('[role="tabpanel"]')?.textContent,
			})
			if (early) {
				expect(recoverable).toHaveLength(0)
				expect(sameNodes).toBe(true)
			} else expect(recoverable.length).toBeGreaterThan(0)
		} finally {
			await act(async () => root?.unmount())
			setEarlyClient(false)
			console.error = error
			console.warn = warn
			container.remove()
		}
	})
}
afterAll(() => {
	removeIsolationHooks()
	const directory = path.join(import.meta.dirname, 'results')
	mkdirSync(directory, { recursive: true })
	writeFileSync(path.join(directory, 'client.json'), JSON.stringify(rows, null, 2))
})
