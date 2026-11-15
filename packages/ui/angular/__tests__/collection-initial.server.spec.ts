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
