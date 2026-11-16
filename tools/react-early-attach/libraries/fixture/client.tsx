import { JSDOM } from 'jsdom'
import { writeFileSync } from 'node:fs'
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
	url: 'http://localhost/',
	pretendToBeVisual: true,
})
for (const name of [
	'window',
	'document',
	'navigator',
	'HTMLElement',
	'HTMLButtonElement',
	'HTMLInputElement',
	'Element',
	'Node',
	'NodeFilter',
	'MutationObserver',
	'Event',
	'MouseEvent',
	'KeyboardEvent',
	'CustomEvent',
	'getComputedStyle',
	'requestAnimationFrame',
	'cancelAnimationFrame',
]) {
	const value = dom.window[name]
	if (value !== undefined)
		Object.defineProperty(globalThis, name, {
			configurable: true,
			writable: true,
			value:
				typeof value === 'function' &&
				['getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame'].includes(name)
					? value.bind(dom.window)
					: value,
		})
}
class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
}
Object.assign(globalThis, { ResizeObserver, IS_REACT_ACT_ENVIRONMENT: true })
const React = await import('react')
const { act, StrictMode } = React
const { createRoot, hydrateRoot } = await import('react-dom/client')
const { renderToString } = await import('react-dom/server')
const { Example, resource } = await import('./components')
const { snapshot } = await import('./snapshot')
const library = process.argv[2]
const rows = []
let diagnostics = []
const warn = console.warn,
	error = console.error
console.warn = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	warn(...args)
}
console.error = (...args) => {
	diagnostics.push(args.map(String).join(' '))
	error(...args)
}
const settle = async () => {
	await new Promise((resolve) => setTimeout(resolve, 35))
}
async function test(name, fn) {
	diagnostics = []
	const container = document.createElement('div')
	document.body.append(container)
	const roots = []
	try {
		const result = await fn(container, roots)
		rows.push({ name, ...result, diagnostics: [...diagnostics] })
	} catch (failure) {
		rows.push({ name, error: String(failure), diagnostics: [...diagnostics] })
	} finally {
		await act(async () => {
			for (const root of roots) root.unmount()
			await settle()
		})
		container.remove()
	}
}
async function activate(container, text) {
	const tab = [...container.querySelectorAll('[role="tab"]')].find(
		(tab) => tab.textContent === text && !tab.closest('[hidden]'),
	)
	if (!tab) throw new Error('Missing tab ' + text)
	await act(async () => {
		tab.focus()
		tab.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
		tab.click()
		await settle()
	})
}
await test('sync-hydration', async (container, roots) => {
	const tree = <Example library={library} />
	container.innerHTML = renderToString(tree)
	const original = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
	const server = snapshot(document, container),
		recoverable = []
	await act(async () => {
		roots.push(
			hydrateRoot(container, tree, {
				onRecoverableError: (failure) => recoverable.push(String(failure)),
			}),
		)
		await settle()
	})
	const hydrated = snapshot(document, container)
	const sameNodes = original.every((node) => container.contains(node))
	await activate(container, 'A')
	return { server, hydrated, sameNodes, recoverable, afterClick: snapshot(document, container) }
})
await test('fallback-resolve-keyboard', async (container, roots) => {
	const gate = resource(false),
		changes = []
	const tree = (
		<Example
			library={library}
			selected="a"
			gate={gate}
			scenario="suspended"
			onChange={(value) => changes.push(value)}
		/>
	)
	const root = createRoot(container)
	roots.push(root)
	await act(async () => {
		root.render(tree)
		await settle()
	})
	const fallback = snapshot(document, container)
	await activate(container, 'A')
	await act(async () => {
		document.activeElement?.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }),
		)
		await settle()
	})
	const whileSuspended = snapshot(document, container)
	await act(async () => {
		gate.resolve()
		await settle()
	})
	const resolved = snapshot(document, container)
	await activate(container, 'B')
	return {
		fallback,
		whileSuspended,
		resolved,
		afterClick: snapshot(document, container),
		changes,
	}
})
await test('abandoned-branch-no-retry', async (container, roots) => {
	const gate = resource(false),
		root = createRoot(container)
	roots.push(root)
	await act(async () => {
		root.render(<Example library={library} selected="a" gate={gate} scenario="suspended" />)
		await settle()
	})
	const fallback = snapshot(document, container)
	await act(async () => {
		root.render(
			<Example
				library={library}
				selected="a"
				gate={gate}
				scenario="suspended"
				show={false}
			/>,
		)
		await settle()
	})
	await activate(container, 'A')
	await act(async () => {
		document.activeElement?.dispatchEvent(
			new KeyboardEvent('keydown', { key: 'ArrowRight', code: 'ArrowRight', bubbles: true }),
		)
		await settle()
	})
	return { fallback, afterRemoval: snapshot(document, container) }
})
await test('strict-mode', async (container, roots) => {
	const root = createRoot(container)
	roots.push(root)
	await act(async () => {
		root.render(
			<StrictMode>
				<Example library={library} />
			</StrictMode>,
		)
		await settle()
	})
	await activate(container, 'A')
	return { state: snapshot(document, container) }
})
console.warn = warn
console.error = error
writeFileSync(library + '-client.json', JSON.stringify(rows, null, 2))
console.log(library + ': ' + rows.length + ' client cases')
dom.window.close()
