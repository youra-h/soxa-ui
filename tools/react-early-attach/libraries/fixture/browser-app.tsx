import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { Example, resource } from './components'
import { snapshot } from './snapshot'

let root
let gate
let library
let original = []
const recoverable = []
window.harness = {
	mount(name, html) {
		library = name
		const container = document.getElementById('app')
		if (root) root.unmount()
		if (html !== undefined) {
			container.innerHTML = html
			original = [...container.querySelectorAll('[role="tab"], [role="tabpanel"]')]
			root = hydrateRoot(container, <Example library={library} />, {
				onRecoverableError: (error) => recoverable.push(String(error)),
			})
		} else {
			gate = resource(false)
			root = createRoot(container)
			root.render(<Example library={library} selected="a" gate={gate} scenario="suspended" />)
		}
	},
	snapshot() {
		return {
			...snapshot(document),
			focused: document.activeElement?.textContent,
			sameNodes: original.every((node) => document.body.contains(node)),
			recoverable,
		}
	},
	resolve() {
		gate.resolve()
	},
	remove() {
		root.render(
			<Example
				library={library}
				selected="a"
				gate={gate}
				scenario="suspended"
				show={false}
			/>,
		)
	},
}
