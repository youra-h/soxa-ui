import { describe, it, expect, afterEach, vi } from 'vitest'
import { TTabs, TEvented, createEngineTabs } from '@soxa-ui/core'
import { Component, type ApplicationRef } from '@angular/core'
import {
	TTabsComponent,
	TTabsItemComponent,
	TTabsContentComponent,
	TTagsComponent,
	TTagsItemComponent,
} from '@soxa-ui/angular'
import { SlotDirective, type ICollectionInitialSource } from '@soxa-ui/angular'
import { renderOnServer, hydrate, loadPage, leavePage } from './server'

@Component({
	selector: 'initial-probe',
	imports: [
		TTabsComponent,
		TTabsItemComponent,
		TTabsContentComponent,
		TTagsComponent,
		TTagsItemComponent,
	],
	template: `
		<div so-tabs [initial]="initial">
			<div><div so-tabs-item [initial]="0"></div></div>
			<div so-tabs-item [initial]="1"></div>
			<div so-tabs-content slot="content" [initial]="0">A</div>
			<div so-tabs-content slot="content" [initial]="1">B</div>
		</div>
		<div so-tags mode="single" [initial]="tags">
			<div so-tags-item [initial]="0"></div>
			<div so-tags-item [initial]="1"></div>
		</div>
	`,
})
class Example {
	initial = {
		items: [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
		],
		panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
	}
	tags = {
		items: [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', _: { selected: true } },
		],
	}
}
let externalEngine: ReturnType<typeof createEngineTabs> | undefined
@Component({
	selector: 'initial-external-probe',
	imports: [TTabsComponent, TTabsContentComponent],
	template:
		'<div so-tabs [initial]="initial" [engine]="engine"><div so-tabs-content slot="content" [initial]="1">External B</div></div>',
})
class ExternalExample extends Example {
	engine = externalEngine
}
let app: ApplicationRef | undefined
afterEach(() => {
	app?.destroy()
	app = undefined
	leavePage()
})
function check(root: ParentNode) {
	const tabs = [...root.querySelectorAll('[role=tab]')]
	expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '0'])
	expect(tabs[1].id).toBe('tab-b')
	expect(tabs[1].getAttribute('aria-controls')).toBe('panel-b')
	expect(root.querySelector('#panel-b')?.getAttribute('aria-labelledby')).toBe('tab-b')
	expect(
		[...root.querySelectorAll('[role=option]')].map((item) => item.getAttribute('tabindex')),
	).toEqual(['-1', '0'])
}
describe('initial source real Angular SSR', () => {
	it('preserves an external owner and releases all server mount subscriptions', async () => {
		const initial = new Example().initial
		const owner = new TTabs()
		const engine = createEngineTabs({ owner, items: initial.items })
		externalEngine = engine
		const items = [...engine.extensions.batch.items]
		const buses = [
			engine.events,
			engine.getCore().driver.events,
			...Object.values(engine.extensions).map((extension) => extension?.events),
			...items.map((item) => item.events),
		].filter((bus) => bus instanceof TEvented)
		const tracked = buses.map((bus) => ({ on: vi.spyOn(bus, 'on'), off: vi.spyOn(bus, 'off') }))
		const before = items.map((item) => ({
			aria: item.aria.toObject(),
			closeAria: item.closeAria.toObject(),
			dataset: item.dataset.toObject(),
		}))
		try {
			const html = await renderOnServer(ExternalExample)
			expect(html).toContain('External B')
			const live = tracked.reduce(
				(sum, { on, off }) =>
					sum +
					on.mock.calls.filter(
						([event, handler]) =>
							!off.mock.calls.some(([e, h]) => e === event && h === handler),
					).length,
				0,
			)
			expect({
				owner: engine.options.get('owner') === owner,
				items: engine.extensions.batch.items,
				attributes: items.map((item) => ({
					aria: item.aria.toObject(),
					closeAria: item.closeAria.toObject(),
					dataset: item.dataset.toObject(),
				})),
				live,
			}).toEqual({ owner: true, items, attributes: before, live: 0 })
		} finally {
			externalEngine = undefined
			vi.restoreAllMocks()
		}
	})
	it('prepares membership and links and hydrates the same nodes', async () => {
		const html = await renderOnServer(Example)
		check(new DOMParser().parseFromString(html, 'text/html'))
		loadPage(html)
		const before = [...document.querySelectorAll('[role=tab]')]
		app = await hydrate(Example)
		check(document)
		expect([...document.querySelectorAll('[role=tab]')]).toEqual(before)
	})
})

function matrixSource(active: number): ICollectionInitialSource {
	return {
		items: [0, 1].map((value) => ({
			value,
			text: String(value),
			id: `matrix-tab-${value}`,
			_: { active: value === active },
		})),
		panels: [0, 1].map((value) => ({ value, id: `matrix-panel-${value}` })),
	}
}
let matrixInput: ICollectionInitialSource = matrixSource(1)
let matrixEarly = false
@Component({
	selector: 'initial-matrix-probe',
	imports: [TTabsComponent, TTabsContentComponent, SlotDirective],
	template: `
		<div so-tabs [initial]="initial">
			<ng-template slot="leading">
				@if (early) {
					<div so-tabs-content [initial]="1">Early</div>
				}
			</ng-template>
			<ng-container slot="content">
				@if (!early) {
					@for (panel of initial.panels ?? []; track $index) {
						<div so-tabs-content [initial]="$index">Panel {{ $index }}</div>
					}
				}
			</ng-container>
		</div>
	`,
})
class MatrixExample {
	initial = matrixInput
	early = matrixEarly
}
let nestedActive = 0
const enteredPanels = new Set<number>()
@Component({
	selector: 'initial-nested-probe',
	imports: [TTabsComponent, TTabsContentComponent, SlotDirective],
	template: `
		<div so-tabs [initial]="initial">
			<div so-tabs-content slot="content" [initial]="0">
				<ng-template slot="default"
					>{{ entered(0) }}
					<div so-tabs [initial]="nested">
						<div so-tabs-content slot="content" [initial]="0">Nested body</div>
					</div>
				</ng-template>
			</div>
			<div so-tabs-content slot="content" [initial]="1">
				<ng-template slot="default"
					>{{ entered(1) }}
					<div so-tabs [initial]="nested">
						<div so-tabs-content slot="content" [initial]="0">Nested body</div>
					</div>
				</ng-template>
			</div>
		</div>
	`,
})
class NestedExample {
	initial = matrixSource(nestedActive)
	nested = {
		items: [{ value: 0, text: 'Nested', id: 'nested-tab', _: { active: true } }],
		panels: [{ value: 0, id: 'nested-panel' }],
	}
	entered(index: number) {
		enteredPanels.add(index)
		return ''
	}
}
function parseServer(html: string) {
	return new DOMParser().parseFromString(html, 'text/html')
}
describe('initial source native SSR matrix', () => {
	it.each([0, 1, -1])('serializes active position %s before JavaScript', async (active) => {
		matrixInput = matrixSource(active)
		matrixEarly = false
		const root = parseServer(await renderOnServer(MatrixExample))
		const tabs = [...root.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
			String(active === 0),
			String(active === 1),
		])
		expect(root.querySelectorAll('[role=tab][tabindex="0"]')).toHaveLength(1)
		// Angular keeps consumer-owned panel hosts and hides the inactive ones.
		const hosts = [...root.querySelectorAll<HTMLElement>('[role=tabpanel]')]
		expect(hosts).toHaveLength(2)
		hosts.forEach((panel, ordinal) => {
			expect(panel.getAttribute('aria-labelledby')).toBe(tabs[ordinal].id)
			expect(tabs[ordinal].getAttribute('aria-controls')).toBe(panel.id)
			if (ordinal !== active) expect(panel.textContent).toBe('')
		})
		const panels = hosts.filter((panel) => panel.style.display !== 'none')
		expect(panels).toHaveLength(active < 0 ? 0 : 1)
		if (active >= 0) {
			expect(tabs[active].getAttribute('aria-controls')).toBe(panels[0].id)
			expect(panels[0].getAttribute('aria-labelledby')).toBe(tabs[active].id)
		}
	})
	it.each(['disabled', 'visible', 'rendered'])('respects initial %s', async (field) => {
		matrixInput = { items: [{ text: 'A', [field]: field === 'disabled' }, { text: 'B' }] }
		matrixEarly = false
		const root = parseServer(await renderOnServer(MatrixExample))
		expect(
			[...root.querySelectorAll('[role=tab][tabindex="0"]')].map((tab) => tab.textContent),
		).toEqual(['B'])
	})
	it('keeps duplicate and omitted values as distinct native identities', async () => {
		matrixInput = {
			items: [
				{ text: 'A' },
				{ text: 'B' },
				{ value: 'x', text: 'C' },
				{ value: 'x', text: 'D', _: { active: true } },
			],
		}
		matrixEarly = false
		const root = parseServer(await renderOnServer(MatrixExample))
		const tabs = [...root.querySelectorAll('[role=tab]')]
		expect(tabs.map((tab) => tab.textContent)).toEqual(['A', 'B', 'C', 'D'])
		expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4)
		expect(tabs.map((tab) => tab.getAttribute('tabindex'))).toEqual(['-1', '-1', '-1', '0'])
	})
	it('links a panel serialized before the native tab list', async () => {
		matrixInput = matrixSource(1)
		matrixEarly = true
		const root = parseServer(await renderOnServer(MatrixExample))
		expect(root.querySelector('#matrix-tab-1')?.getAttribute('aria-controls')).toBe(
			'matrix-panel-1',
		)
		expect(root.querySelector('#matrix-panel-1')?.getAttribute('aria-labelledby')).toBe(
			'matrix-tab-1',
		)
	})
	it.each([0, 1])(
		'isolates nested owners and skips inactive templates, active=%s',
		async (active) => {
			nestedActive = active
			enteredPanels.clear()
			const root = parseServer(await renderOnServer(NestedExample))
			expect([...enteredPanels]).toEqual([active])
			expect(root.querySelectorAll('[role=tab]')).toHaveLength(3)
			expect(root.querySelector('#nested-panel')?.getAttribute('aria-labelledby')).toBe(
				'nested-tab',
			)
			expect(root.querySelector('#nested-tab')?.getAttribute('aria-controls')).toBe(
				'nested-panel',
			)
		},
	)
})
