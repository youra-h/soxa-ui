import {
	createAdapterContext,
	createCollectionInitialSource,
	collectionInitialSourceOf,
	resolveCollectionInitialItem,
	resolveCollectionInitialPanel,
	TCollectionInitialExtension,
	TCollectionExtension,
	TCollectionItemExtension,
	TabsDescriptor,
	TabsCollectionDescriptor,
	TabsItemDescriptor,
	TabsCollectionItemDescriptor,
	ITEM_CONTEXT_ELEVATOR,
} from '@soxa-ui/setup'
import { createElevatorFactory } from './helpers'
import { describe, expect, it, vi } from 'vitest'
import {
	activationOf,
	batchOf,
	createEngine,
	createEngineTabs,
	createEngineTags,
	TTabs,
	TTabsItem,
	TTags,
	TTagsItem,
} from '@soxa-ui/core'
import { TCollectionInitialSource } from '../content/extensions/collection/initial-source.class'

const mount = { createId: (part: string) => `owner-${part}` }

function tabs(initial: unknown) {
	const source = new TCollectionInitialSource({ initial, panelDefaultValue: '' })
	const engine = createEngineTabs({ owner: new TTabs() })

	source.materialize(engine, mount)

	return { source, engine }
}

describe('collection initial source', () => {
	it('materializes through the existing factory, batch and metadata channels once', () => {
		const { source, engine } = tabs({
			items: [
				{ value: 'first', text: 'First' },
				{ value: 'second', _: { active: true } },
			],
		})
		const [first, second] = engine.extensions.batch.items
		const apply = vi.spyOn(engine.extensions.meta, 'apply')
		const update = vi.spyOn(engine.extensions.batch, 'update')

		expect(first).toBeInstanceOf(TTabsItem)
		expect(source.item(1, TTabsItem)).toBe(second)
		expect(engine.extensions.activation.activeItem).toBe(second)

		engine.extensions.activation.activate(first)
		source.materialize(engine, { createId: () => 'replayed-id' })

		expect(source.item(0, TTabsItem)).toBe(first)
		expect(source.item(1, TTabsItem)).toBe(second)
		expect(engine.extensions.activation.activeItem).toBe(first)
		expect(source.link(first)?.tabId).toBe('owner-initial-tab-0')
		expect(apply).not.toHaveBeenCalled()
		expect(update).not.toHaveBeenCalled()
	})

	it('uses the same mechanism for Tags selection without a second selection store', () => {
		const source = new TCollectionInitialSource({
			initial: { items: [{ value: 'first' }, { value: 'second', _: { selected: true } }] },
		})
		const engine = createEngineTags({ owner: new TTags() })

		engine.extensions.selection.mode = 'single'

		source.materialize(engine, mount)

		const [first, second] = engine.extensions.batch.items

		expect(source.item(1, TTagsItem)).toBe(second)
		expect(engine.extensions.selection.isSelected(second)).toBe(true)

		engine.extensions.selection.select(first)
		source.materialize(engine, mount)

		expect(engine.extensions.selection.isSelected(first)).toBe(true)
		expect(engine.extensions.selection.isSelected(second)).toBe(false)
	})

	it('captures plain data once, including nested metadata, without retaining mutable input', () => {
		const input = {
			items: [{ value: 'a', text: 'Before', _: { active: true, group: { key: 'before' } } }],
			panels: [{ value: 'a', id: 'before-panel' }],
		}
		const source = new TCollectionInitialSource({ initial: input })

		input.items[0].text = 'After'
		input.items[0]._.active = false
		input.items[0]._.group.key = 'after'
		input.panels[0].id = 'after-panel'

		const engine = createEngineTabs({ owner: new TTabs() })

		source.materialize(engine, mount)

		expect(source.item(0, TTabsItem).text).toBe('Before')
		expect(engine.extensions.activation.activeItem).toBe(source.item(0, TTabsItem))
		expect(source.source.items[0]._).toEqual({ active: true, group: { key: 'before' } })
		expect(source.panel(0).id).toBe('before-panel')
		expect(Object.isFrozen(source.source.items[0])).toBe(true)
	})

	it('preserves duplicate and undefined values as distinct models and ordinal identities', () => {
		const { source, engine } = tabs({
			items: [{ value: 'same' }, { value: 'same' }, {}, {}],
			panels: [
				{ value: 'same', id: 'earlier-panel' },
				{ value: 'same', id: 'later-panel' },
				{},
			],
		})
		const items = engine.extensions.batch.items

		expect(new Set(items).size).toBe(4)
		expect(source.item(0, TTabsItem)).toBe(items[0])
		expect(source.item(1, TTabsItem)).toBe(items[1])
		expect(source.item(2, TTabsItem)).toBe(items[2])
		expect(source.item(3, TTabsItem)).toBe(items[3])
		expect(source.link(items[0])).toEqual({
			tabId: 'owner-initial-tab-0',
			panelId: 'later-panel',
		})
		expect(source.link(items[1])?.panelId).toBe('owner-initial-panel-1')
		expect(source.panelLink(0)).toBe(source.link(items[0]))
		expect(source.panelLink(1)).toBe(source.link(items[0]))
		expect(source.panelLink(2)).toBe(source.link(items[2]))
	})

	it('finds the first live value in current engine order after duplicate reordering or replacement', () => {
		const { source, engine } = tabs({
			items: [
				{ value: 'same', id: 'first' },
				{ value: 'same', id: 'second' },
			],
			panels: [{ value: 'same' }],
		})
		const [first, second] = engine.extensions.batch.items

		engine.extensions.batch.items = [second, first]
		expect(source.panelLink(0)).toBe(source.link(second))

		const replacement = new TTabsItem({ value: 'same' })
		engine.extensions.batch.items = [replacement, second, first]

		expect(source.panelLink(0)).toBeUndefined()
		expect(engine.extensions.batch.items).toEqual([replacement, second, first])
	})
	it('prepares both link ends from the owner before either part mounts', () => {
		const { source } = tabs({
			items: [{ value: 'a', id: 'custom-tab' }, { value: 'b' }],
			panels: [{ value: 'b', id: 'custom-panel' }, { value: 'a' }],
		})
		const first = source.item(0, TTabsItem)
		const second = source.item(1, TTabsItem)

		expect(source.link(first)).toEqual({
			tabId: 'custom-tab',
			panelId: 'owner-initial-panel-0',
		})
		expect(source.panelLink(0)).toBe(source.link(second))
		expect(source.panelLink(1)).toBe(source.link(first))
		expect(source.link(second)?.panelId).toBe('custom-panel')
	})

	it('leaves an external engine and its exact models unchanged while preparing or rejecting input', () => {
		const engine = createEngineTabs({
			owner: new TTabs(),
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B', _: { active: true } },
			],
		})
		const original = [...engine.extensions.batch.items]
		const aria = original.map((item) => item.aria.toObject())
		const owner = engine.options.get('owner')
		const updates = vi.spyOn(engine.extensions.batch, 'update')
		const meta = vi.spyOn(engine.extensions.meta, 'apply')
		const initial = {
			items: [
				{ value: 'a', text: 'A' },
				{ value: 'b', text: 'B', _: { active: true } },
			],
			panels: [{ value: 'a' }, { value: 'b', id: 'custom-panel' }],
		}
		const source = new TCollectionInitialSource({ initial, engine })

		source.materialize(engine, mount)

		expect(source.engine).toBe(engine)
		expect(source.item(0, TTabsItem, original[0])).toBe(original[0])
		expect(source.item(1, TTabsItem, original[1])).toBe(original[1])
		expect(engine.extensions.batch.items).toEqual(original)
		expect(original.map((item) => item.aria.toObject())).toEqual(aria)
		expect(engine.options.get('owner')).toBe(owner)
		expect(updates).not.toHaveBeenCalled()
		expect(meta).not.toHaveBeenCalled()

		expect(
			() =>
				new TCollectionInitialSource({
					initial: { items: [{ value: 'a' }, { value: 'different' }] },
					engine,
				}),
		).toThrow('differs at value')
		expect(
			() =>
				new TCollectionInitialSource({
					initial: { items: [{ value: 'a' }, { value: 'b', _: { active: false } }] },
					engine,
				}),
		).toThrow('differs at _.active')

		expect(engine.extensions.activation.activeItem).toBe(original[1])
		expect(engine.extensions.batch.items).toEqual(original)
		expect(updates).not.toHaveBeenCalled()
		expect(meta).not.toHaveBeenCalled()
	})

	it('compares captured external plain metadata by content without replacing it', () => {
		const group = { labels: ['one', 'two'], nested: { rank: 2 } }
		const engine = createEngineTabs({
			owner: new TTabs(),
			items: [{ value: 'a', _: { group } }],
		})
		const item = engine.extensions.batch.items[0]
		const metadata = engine.extensions.meta.get(item)
		const source = new TCollectionInitialSource({
			initial: {
				items: [
					{ value: 'a', _: { group: { labels: ['one', 'two'], nested: { rank: 2 } } } },
				],
			},
			engine,
		})

		source.materialize(engine, mount)

		expect(engine.extensions.meta.get(item)).toBe(metadata)
		expect(engine.extensions.meta.get(item)?.group).toBe(group)
		expect(
			() =>
				new TCollectionInitialSource({
					initial: {
						items: [
							{ value: 'a', _: { group: { labels: ['one'], nested: { rank: 2 } } } },
						],
					},
					engine,
				}),
		).toThrow('differs at _.group')
		expect(engine.extensions.meta.get(item)?.group).toBe(group)
	})
	it('does not complete a raw external engine while checking the source', () => {
		const engine = createEngine({ items: [{ value: 'a' }] })
		const extensions = Object.keys(engine.extensions)
		const models = batchOf(engine)?.items

		expect(
			() =>
				new TCollectionInitialSource({
					initial: { items: [{ value: 'a' }] },
					engine,
				}),
		).toThrow('existing complete engine')

		expect(Object.keys(engine.extensions)).toEqual(extensions)
		expect(batchOf(engine)?.items).toEqual(models)
	})

	it.each([
		undefined,
		null,
		[],
		{},
		{ items: null },
		{ items: [null] },
		{ items: [new TTabsItem()] },
		{ items: [{ value: {} }] },
		{ items: [{ id: 3 }] },
		{ items: [{ _: [] }] },
		{ items: [{ active: true }] },
		{ items: [{ selected: true }] },
		{ items: [{ text: () => 'late' }] },
		{ items: [], panels: {} },
		{ items: [], panels: [null] },
		{ items: [], panels: [{ active: true }] },
		{ items: [], unexpected: true },
	])('rejects malformed sources before any engine writes: %j', (initial) => {
		expect(() => new TCollectionInitialSource({ initial })).toThrow()
	})

	it('rejects cycles and symbol keys while accepting explicit undefined values', () => {
		const cycle: Record<string, unknown> = {}

		cycle.self = cycle

		expect(() => new TCollectionInitialSource({ initial: { items: [cycle] } })).toThrow(
			'cyclic',
		)
		expect(
			() =>
				new TCollectionInitialSource({
					initial: { items: [{ [Symbol('hidden')]: true }] },
				}),
		).toThrow('symbol keys')

		const { source } = tabs({ items: [{ value: undefined }] })

		expect(source.item(0, TTabsItem).value).toBe(new TTabsItem().value)
	})

	it('rejects mixed sources and invalid ordinals or ctrl without changing an engine', () => {
		expect(
			() =>
				new TCollectionInitialSource({
					initial: { items: [] },
					items: [],
				}),
		).toThrow('cannot be supplied together')

		const { source, engine } = tabs({ items: [{ value: 'a' }], panels: [{ value: 'a' }] })
		const item = source.item(0, TTabsItem)

		for (const ordinal of [-1, 1, 0.5, NaN, '0', undefined]) {
			expect(() => source.item(ordinal, TTabsItem)).toThrow('ordinal')
			expect(() => source.panel(ordinal)).toThrow('ordinal')
		}

		expect(() => source.item(0, TTagsItem)).toThrow('different component type')
		expect(() => source.item(0, TTabsItem, new TTabsItem())).toThrow('same item')
		expect(source.item(0, TTabsItem, item)).toBe(item)
		expect(engine.extensions.batch.items).toEqual([item])
		expect(() => source.materialize(createEngineTabs({ owner: new TTabs() }), mount)).toThrow(
			'shared',
		)
	})

	it('isolates owners and requests, and has no listener lifetime of its own', () => {
		const input = { items: [{ value: 'a', _: { active: true } }] }
		const first = tabs(input)
		const second = tabs(input)
		const firstItem = first.source.item(0, TTabsItem)
		const secondItem = second.source.item(0, TTabsItem)

		expect(firstItem).not.toBe(secondItem)
		expect(first.source.engine).not.toBe(second.source.engine)

		activationOf(first.engine)?.reset()

		expect(activationOf(first.engine)?.activeItem).toBeUndefined()
		expect(activationOf(second.engine)?.activeItem).toBe(secondItem)

		const subscribe = vi.spyOn(secondItem.events, 'on')
		const use = vi.spyOn(secondItem.events, 'use')
		const listen = vi.spyOn(secondItem.events, 'listen')

		second.source.link(secondItem)
		second.source.item(0, TTabsItem)
		second.source.materialize(second.engine, mount)

		expect(subscribe).not.toHaveBeenCalled()
		expect(use).not.toHaveBeenCalled()
		expect(listen).not.toHaveBeenCalled()
	})
})

describe('collection initial resolution through the existing owner lift', () => {
	function prepared() {
		const elevator = createElevatorFactory().factory
		const source = createCollectionInitialSource({
			initial: {
				items: [
					{ value: 'a', text: 'A' },
					{ value: 'b', text: 'B', _: { active: true } },
				],
				panels: [{ value: 'a' }, { value: 'b', id: 'custom-panel' }],
			},
		})
		const owner = createAdapterContext(TabsDescriptor(), { mountId: 'owner' })
		const facade = createAdapterContext(
			TabsCollectionDescriptor(),
			{ options: { owner: owner.instance } },
			{ bundle: owner.bundle },
		)
			.use(TCollectionInitialExtension, { source, elevator })
			.use(TCollectionExtension, { elevator })

		if (!source) throw new Error('Expected a prepared source.')

		return { source, owner, facade, elevator }
	}

	it('resolves to the exact factory model before create, then uses the existing registrar', () => {
		const { source, owner, facade, elevator } = prepared()
		const options = resolveCollectionInitialItem(
			TabsItemDescriptor(),
			{ props: { initial: 1, 'data-extra': 'allowed' } },
			elevator,
		)
		const item = createAdapterContext(TabsItemDescriptor(), options)
		const membership = createAdapterContext(
			TabsCollectionItemDescriptor(),
			{ props: options.props },
			{ bundle: item.bundle },
		).use(TCollectionItemExtension, { adapter: item, elevator })
		const models = [...facade.instance.items]
		const apply = vi.spyOn(facade.instance.engine.extensions.meta, 'apply')

		expect(options.ctrl).toBe(source.item(1, TTabsItem))
		expect(item.instance).toBe(models[1])
		expect(collectionInitialSourceOf(elevator)).toBe(source)
		expect(facade.instance.activeItem).toBe(models[1])

		item.attach()
		membership.attach()

		expect(apply).not.toHaveBeenCalled()
		expect(facade.instance.items).toEqual(models)

		membership.destroy()
		item.destroy()

		expect(facade.instance.items).toEqual(models)
		expect(facade.instance.activeItem).toBe(models[1])

		facade.destroy()
		owner.destroy()
	})

	it('does not resurrect a removed or replaced data model on an ordinal remount', () => {
		const { source, owner, facade, elevator } = prepared()
		const options = resolveCollectionInitialItem(
			TabsItemDescriptor(),
			{ props: { initial: 0 } },
			elevator,
		)
		const item = createAdapterContext(TabsItemDescriptor(), options)
		const membership = createAdapterContext(
			TabsCollectionItemDescriptor(),
			{ props: options.props },
			{ bundle: item.bundle },
		).use(TCollectionItemExtension, { adapter: item, elevator })
		const engine = facade.instance.engine

		item.attach()
		membership.attach()
		membership.destroy()
		item.destroy()
		engine.extensions.batch.items = []

		expect(() =>
			resolveCollectionInitialItem(TabsItemDescriptor(), { props: { initial: 0 } }, elevator),
		).toThrow('no longer in its owner engine')
		expect(engine.extensions.batch.items).toEqual([])

		engine.extensions.batch.items = [{ value: 'replacement', _: { active: true } }]
		const replacement = engine.extensions.batch.items[0]
		const updates = vi.spyOn(engine.extensions.batch, 'update')
		source.materialize(engine, mount)

		expect(() =>
			resolveCollectionInitialItem(TabsItemDescriptor(), { props: { initial: 0 } }, elevator),
		).toThrow('no longer in its owner engine')
		expect(engine.extensions.batch.items).toEqual([replacement])
		expect(engine.extensions.activation.activeItem).toBe(replacement)
		expect(source.panelLink(0)).toBeUndefined()
		expect(updates).not.toHaveBeenCalled()

		facade.destroy()
		owner.destroy()
	})
	it('resolves panel input without registering a panel as an item', () => {
		const { source, owner, facade, elevator } = prepared()
		const options = resolveCollectionInitialPanel(
			{ props: { initial: 1, 'data-extra': 'allowed' } },
			elevator,
		)

		expect(options.props).toEqual({
			initial: 1,
			value: 'b',
			id: 'custom-panel',
			'data-extra': 'allowed',
		})
		expect(facade.instance.items).toEqual(source.items)

		facade.destroy()
		owner.destroy()
	})

	it('diagnoses conflicts and wrong ctrl before creating an item context', () => {
		const { owner, facade, elevator } = prepared()
		const original = [...facade.instance.items]

		for (const name of [
			'value',
			'active',
			'selected',
			'id',
			'text',
			'disabled',
			'visible',
			'rendered',
			'closable',
		]) {
			expect(() =>
				resolveCollectionInitialItem(
					TabsItemDescriptor(),
					{
						props: {
							initial: 0,
							[name]: name === 'active' || name === 'selected' ? false : 'own',
						},
					},
					elevator,
				),
			).toThrow('declared source')
		}

		expect(() =>
			resolveCollectionInitialItem(
				TabsItemDescriptor(),
				{ ctrl: new TTabsItem(), props: { initial: 0 } },
				elevator,
			),
		).toThrow('same item')

		expect(facade.instance.items).toEqual(original)

		facade.destroy()
		owner.destroy()
	})

	it('masks a foreign intervening engine and preserves a legacy input unchanged', () => {
		const { owner, facade, elevator } = prepared()
		const legacy = { props: { value: 'independent' } }

		elevator(ITEM_CONTEXT_ELEVATOR).down(createEngineTags())

		expect(collectionInitialSourceOf(elevator)).toBeUndefined()
		expect(() =>
			resolveCollectionInitialItem(TabsItemDescriptor(), { props: { initial: 0 } }, elevator),
		).toThrow('own prepared owner')
		expect(resolveCollectionInitialItem(TabsItemDescriptor(), legacy, elevator)).toBe(legacy)
		expect(resolveCollectionInitialPanel(legacy, elevator)).toBe(legacy)
		expect(createCollectionInitialSource({ items: [] })).toBeUndefined()
		expect(() => createCollectionInitialSource({ initial: { items: [] }, engine: {} })).toThrow(
			'engine',
		)

		facade.destroy()
		owner.destroy()
	})

	it('shadows the source explicitly for a legacy collection owner', () => {
		const { owner, facade, elevator } = prepared()

		facade.use(TCollectionInitialExtension, { elevator })

		expect(collectionInitialSourceOf(elevator)).toBeUndefined()

		facade.destroy()
		owner.destroy()
	})
})
