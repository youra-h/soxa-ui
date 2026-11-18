import { vi } from 'vitest'
import { TEvented, type TCollectionEngine, type ITabsItem } from '@soxa-ui/core'
import { createEngineTabs } from '@soxa-ui/core'
import { Tabs } from '@soxa-ui/react'
export const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b' }],
}

type TInitial = typeof initial
export function Example({
	source = initial,
	engine,
}: {
	source?: TInitial
	engine?: ReturnType<typeof createEngineTabs>
}) {
	return (
		<Tabs
			initial={source}
			engine={engine}
			content={
				<>
					<Tabs.Content initial={0}>Panel A</Tabs.Content>
					<Tabs.Content initial={1}>Panel B</Tabs.Content>
				</>
			}
		/>
	)
}

export function selected(container: Element): (string | null)[] {
	return [...container.querySelectorAll('[role=tab]')].map((tab) =>
		tab.getAttribute('aria-selected'),
	)
}

export function externalSnapshot(engine: ReturnType<typeof createEngineTabs>) {
	const items = engine.extensions.batch.items
	return {
		items: [...items],
		props: items.map((item) => ({
			value: item.value,
			text: item.text,
			disabled: item.disabled,
			rendered: item.rendered,
			visible: item.visible,
			aria: item.aria.toObject(),
			closeAria: item.closeAria.toObject(),
			dataset: item.dataset.toObject(),
		})),
		meta: items.map((item) => ({ ...engine.extensions.meta.get(item) })),
		active: engine.extensions.activation.activeItem,
		owner: engine.options.get('owner'),
	}
}

/** Tracks new subscriptions without relying on private event emitter storage. */
export function watchSubscriptions(engine: TCollectionEngine<any, any>) {
	const extensions: Readonly<Record<string, { events?: unknown }>> = engine.extensions
	const buses = [
		engine.events,
		engine.getCore().driver.events,
		...Object.values(extensions).map((extension) => extension.events),
		...engine.extensions.batch.items.map((item: ITabsItem) => item.events),
	].filter((bus): bus is TEvented<any> => bus instanceof TEvented)
	const tracked = buses.map((bus) => {
		const on = bus.on.bind(bus)
		const off = bus.off.bind(bus)
		const listen = bus.listen.bind(bus)
		const unlisten = bus.unlisten.bind(bus)
		const useMiddleware = bus.use.bind(bus)
		const events = new Map<unknown, Set<unknown>>()
		const listeners: unknown[] = []
		let middleware = 0
		vi.spyOn(bus, 'on').mockImplementation((event, handler) => {
			const handlers = events.get(event) ?? new Set<unknown>()
			handlers.add(handler)
			events.set(event, handlers)
			on(event, handler)
		})
		vi.spyOn(bus, 'off').mockImplementation((event, handler) => {
			events.get(event)?.delete(handler)
			off(event, handler)
		})
		vi.spyOn(bus, 'listen').mockImplementation((listener) => {
			listeners.push(listener)
			listen(listener)
		})
		vi.spyOn(bus, 'unlisten').mockImplementation((listener) => {
			const index = listeners.indexOf(listener)
			if (index >= 0) listeners.splice(index, 1)
			unlisten(listener)
		})
		vi.spyOn(bus, 'use').mockImplementation((handler) => {
			middleware++
			const release = useMiddleware(handler)
			let released = false
			return () => {
				if (!released) middleware--
				released = true
				release()
			}
		})
		return () =>
			middleware +
			listeners.length +
			[...events.values()].reduce((sum, handlers) => sum + handlers.size, 0)
	})
	return Object.assign(() => tracked.reduce((sum, count) => sum + count(), 0), {
		details: () =>
			tracked
				.map((count, index) => ({ bus: index, count: count() }))
				.filter((bus) => bus.count > 0),
	})
}
