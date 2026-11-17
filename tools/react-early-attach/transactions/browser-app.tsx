import { Suspense } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Tabs } from '@soxa-ui/react'
import { registrations } from './journal'

let root: Root | undefined
let ready = false
let release: () => void = () => {}
let pending: Promise<void>
let rolledBack = false
function Wait() {
	if (!ready) throw pending
	return null
}
function SomeComponent() {
	return (
		<>
			<Tabs.Item value="b" text="B" active />
			<Wait />
		</>
	)
}
function snapshot() {
	const engine = registrations.engines.at(-1)?.deref()
	const items = engine ? Reflect.get(engine, 'extensions').batch.items : []
	return {
		values: items.map((item) => item.value),
		modelIds: items.map((item) => item.uid),
		pending: registrations.size,
		counters: { ...registrations.counters },
		tabs: [...document.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent),
	}
}
Reflect.set(window, 'transactionHarness', {
	mount(beforeAttach = false) {
		root?.unmount()
		registrations.reset()
		registrations.configure(60)
		ready = false
		rolledBack = false
		pending = new Promise<void>((resolve) => {
			release = resolve
		})
		const container = document.getElementById('app')
		if (!container) throw new Error('Missing browser test root')
		root = createRoot(container)
		root.render(
			<Tabs
				content={
					<>
						<Tabs.Content value="a">PANEL-a</Tabs.Content>
						<Tabs.Content value="b">PANEL-b</Tabs.Content>
					</>
				}
			>
				<Tabs.Item value="a" text="A" />
				{beforeAttach ? (
					<Tabs.Item
						value="b"
						text="B"
						active
						ref={(node) => {
							if (node && !rolledBack) {
								rolledBack = true
								registrations.rollbackPending()
							}
						}}
					/>
				) : (
					<Suspense fallback={<span data-waiting="">WAITING</span>}>
						<SomeComponent />
					</Suspense>
				)}
			</Tabs>,
		)
	},
	resolve() {
		ready = true
		release()
	},
	snapshot,
	unmount() {
		root?.unmount()
		root = undefined
	},
})
