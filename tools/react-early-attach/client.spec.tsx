// @vitest-environment jsdom
import { afterAll, expect, it } from 'vitest'
import { StrictMode, act } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server.node'
import { Tabs } from '@soxa-ui/react'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const mode = process.env.ATTACH_MODE ?? 'baseline'
const rows: object[] = []
const diagnostics: string[] = []
const appliedModes: string[] = []
Reflect.set(globalThis, '__attachProbe', (_built: object, _engine: object, appliedMode: string) => {
	appliedModes.push(appliedMode)
})
const error = console.error
const warn = console.warn
console.error = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	error(...args)
}
console.warn = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	warn(...args)
}
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
function Tree() {
	return (
		<Tabs
			content={
				<>
					<Tabs.Content value="a">PANEL-a</Tabs.Content>
					<Tabs.Content value="b">PANEL-b</Tabs.Content>
				</>
			}
		>
			<Tabs.Item value="a" text="A" />
			<Tabs.Item value="b" text="B" active />
		</Tabs>
	)
}
function snapshot(container: HTMLElement) {
	return {
		tabs: [...container.querySelectorAll('[role="tab"]')].map((tab) => ({
			text: tab.textContent,
			selected: tab.getAttribute('aria-selected'),
			tabIndex: tab.getAttribute('tabindex'),
		})),
		panels: [...container.querySelectorAll('[role="tabpanel"]')].map(
			(panel) => panel.textContent,
		),
	}
}

it('records real React hydration and subsequent switching', async () => {
	const container = document.createElement('div')
	container.innerHTML = renderToString(<Tree />)
	const server = snapshot(container)
	document.body.append(container)
	const before = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
	const recoverable: string[] = []
	let root: ReturnType<typeof hydrateRoot> | undefined
	try {
		await act(async () => {
			root = hydrateRoot(container, <Tree />, {
				onRecoverableError: (error) => recoverable.push(String(error)),
			})
		})
		const hydrated = snapshot(container)
		const sameNodes = before.every((node) => container.contains(node))
		await act(async () => {
			container.querySelector<HTMLButtonElement>('[role="tab"]')?.click()
		})
		rows.push({
			name: 'hydration-and-switch',
			server,
			sameNodes,
			recoverable,
			hydrated,
			afterClick: snapshot(container),
		})
	} catch (failure) {
		rows.push({ name: 'hydration-and-switch', error: String(failure) })
	} finally {
		await act(async () => root?.unmount())
		container.remove()
	}
	expect(document.body.children).toHaveLength(0)
	expect(appliedModes.length).toBeGreaterThan(0)
	expect(appliedModes.every((appliedMode) => appliedMode === mode)).toBe(true)
})

it('records StrictMode effect replay and unmount', async () => {
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	try {
		await act(async () =>
			root.render(
				<StrictMode>
					<Tree />
				</StrictMode>,
			),
		)
		rows.push({ name: 'strict-mode', state: snapshot(container) })
	} catch (failure) {
		rows.push({ name: 'strict-mode', error: String(failure) })
	} finally {
		await act(async () => root.unmount())
		container.remove()
	}
	expect(document.body.children).toHaveLength(0)
})

afterAll(() => {
	Reflect.deleteProperty(globalThis, '__attachProbe')
	console.error = error
	console.warn = warn
	const directory = path.resolve(import.meta.dirname, 'results')
	mkdirSync(directory, { recursive: true })
	writeFileSync(
		path.join(directory, mode + '-client.json'),
		JSON.stringify({ mode, appliedModes, diagnostics, rows }, null, 2),
	)
})
