import { describe, it, expect, vi } from 'vitest'
import { StrictMode, act } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import { Tabs, Tags } from '@soxa-ui/react'
import { createEngineTabs } from '@soxa-ui/core'

const initial = {
	items: [
		{ value: 'a', text: 'A' },
		{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
	],
	panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
}
function Example({ automatic = false }: { automatic?: boolean }) {
	return (
		<Tabs
			initial={initial}
			content={
				<>
					<Tabs.Content initial={0}>Panel A</Tabs.Content>
					<Tabs.Content initial={1}>Panel B</Tabs.Content>
				</>
			}
		>
			{automatic ? undefined : (
				<>
					<div>
						<Tabs.Item initial={0} />
					</div>
					<Tabs.Item initial={1} />
				</>
			)}
		</Tabs>
	)
}
function assertLinks(container: Element) {
	const tabs = [...container.querySelectorAll('[role=tab]')]
	expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual(['false', 'true'])
	expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	const panel = container.querySelector('[role=tabpanel]')
	expect(panel?.id).toBe('panel-b')
	expect(tabs[1].id).toBe('tab-b')
	expect(tabs[1].getAttribute('aria-controls')).toBe(panel?.id)
	expect(panel?.getAttribute('aria-labelledby')).toBe(tabs[1].id)
}

describe('explicit initial collections', () => {
	it.each([false, true])(
		'serializes complete membership and reciprocal ids, automatic=%s',
		(automatic) => {
			const container = document.createElement('div')
			container.innerHTML = renderToString(<Example automatic={automatic} />)
			assertLinks(container)
		},
	)
	it('hydrates the same nodes under StrictMode and keeps the engine authoritative', async () => {
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<StrictMode>
				<Example />
			</StrictMode>,
		)
		document.body.append(container)
		const before = [...container.querySelectorAll('[role=tab]')]
		const recover = vi.fn()
		let root: ReturnType<typeof hydrateRoot> | undefined
		await act(async () => {
			root = hydrateRoot(
				container,
				<StrictMode>
					<Example />
				</StrictMode>,
				{ onRecoverableError: recover },
			)
		})
		assertLinks(container)
		expect([...container.querySelectorAll('[role=tab]')]).toEqual(before)
		expect(recover).not.toHaveBeenCalled()
		await act(async () => root?.unmount())
		container.remove()
	})
	it('does not write external item aria during server rendering', () => {
		const engine = createEngineTabs({ items: initial.items })
		const before = engine.extensions.batch.items.map((item) => item.aria.toObject())
		renderToString(
			<Tabs
				initial={initial}
				engine={engine}
				content={<Tabs.Content initial={1}>B</Tabs.Content>}
			/>,
		)
		expect(engine.extensions.batch.items.map((item) => item.aria.toObject())).toEqual(before)
	})
	it('prepares Tags selection through the same source', () => {
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<Tags
				mode="single"
				initial={{
					items: [
						{ value: 'a', text: 'A' },
						{ value: 'b', text: 'B', _: { selected: true } },
					],
				}}
			>
				<Tags.Item initial={0} />
				<Tags.Item initial={1} />
			</Tags>,
		)
		expect(
			[...container.querySelectorAll('[role=option]')].map((item) =>
				item.getAttribute('aria-selected'),
			),
		).toEqual(['false', 'true'])
	})
})

describe('initial source SSR behavior matrix', () => {
	it.each([0, 1, -1])('serializes first, second or no active item (%s)', (active) => {
		const source = {
			items: [0, 1].map((value) => ({
				value,
				text: String(value),
				_: { active: value === active },
			})),
			panels: [{ value: 0 }, { value: 1 }],
		}
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<Tabs
				initial={source}
				content={
					<>
						<Tabs.Content initial={0}>Zero</Tabs.Content>
						<Tabs.Content initial={1}>One</Tabs.Content>
					</>
				}
			/>,
		)
		expect(
			[...container.querySelectorAll('[role=tab]')].map((tab) =>
				tab.getAttribute('aria-selected'),
			),
		).toEqual([String(active === 0), String(active === 1)])
		expect(container.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
		expect(container.querySelectorAll('[role=tabpanel]')).toHaveLength(active < 0 ? 0 : 1)
	})
	it.each(['disabled', 'visible', 'rendered'])(
		'respects initial %s through existing engine policies',
		(field) => {
			const container = document.createElement('div')
			const source = {
				items: [
					{ value: 'a', text: 'A', [field]: field === 'disabled' },
					{ value: 'b', text: 'B' },
				],
			}
			container.innerHTML = renderToString(<Tabs initial={source} />)
			expect(container.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
			expect(container.querySelector('[role=tab][tabindex="0"]')?.textContent).toBe('B')
		},
	)
	it('keeps duplicate and omitted values as distinct identities', () => {
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<Tabs
				initial={{
					items: [
						{ text: 'A' },
						{ text: 'B' },
						{ value: 'x', text: 'C' },
						{ value: 'x', text: 'D', _: { active: true } },
					],
				}}
			/>,
		)
		const tabs = [...container.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.textContent)).toEqual(['A', 'B', 'C', 'D'])
		expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4)
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0'])
	})
	it('resolves panels serialized before tabs from the same declared relationship', () => {
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<Tabs initial={initial} leading={<Tabs.Content initial={1}>Early B</Tabs.Content>} />,
		)
		assertLinks(container)
	})
	it('never evaluates inactive nested children to discover their membership', () => {
		const Inactive = vi.fn(() => <Tabs initial={{ items: [{ text: 'Hidden' }] }} />)
		const nested = {
			items: [{ value: 'n', text: 'Nested', _: { active: true } }],
			panels: [{ value: 'n', id: 'nested-panel' }],
		}
		const container = document.createElement('div')
		container.innerHTML = renderToString(
			<Tabs
				initial={initial}
				content={
					<>
						<Tabs.Content initial={0}>
							<Inactive />
						</Tabs.Content>
						<Tabs.Content initial={1}>
							<Tabs
								initial={nested}
								content={<Tabs.Content initial={0}>Nested body</Tabs.Content>}
							/>
						</Tabs.Content>
					</>
				}
			/>,
		)
		expect(Inactive).not.toHaveBeenCalled()
		expect(container.querySelectorAll('[role=tab]')).toHaveLength(3)
		expect(container.textContent).not.toContain('Hidden')
		expect(container.querySelector('#nested-panel')).not.toBeNull()
	})
})
