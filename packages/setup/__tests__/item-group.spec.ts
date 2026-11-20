/**
 * Группа разметки входит в группировку коллекции — без фреймворка.
 *
 * Сборка — так, как её делают адаптеры: у списка свой контекст и фасад
 * коллекции на его наборе; у группы — свой контекст, где проводка
 * (`TItemGroupExtension`) опускает по лифту ключ группы вместе с движком её
 * коллекции, а при приёме регистрирует подпись в группировке; у элемента —
 * свой контекст и фасад элемента на его наборе, и вход в коллекцию кладёт
 * ключ группы в его `meta` — тем же каналом, что метка `_.group` в данных.
 * Лифт здесь — дерево, как у фреймворков: `up()` читает слой родителя,
 * `down()` пишет в свой.
 *
 * Порядок показанного — `core/__tests__/collection.group.spec.ts`; разметка и
 * стрелки — `ui/vue/__tests__/list-groups.spec.ts`, `ui/vue/__tests__/menu.spec.ts`
 * и группы «группы» в спеках ListBox остальных адаптеров.
 */

import { describe, it, expect, vi } from 'vitest'
import { TListBox, TMenu, TMenuSubmenu, TSelect, createEngineListBox } from '@soxa-ui/core'
import type {
	IListBoxItem,
	TGroupSection,
	TListBoxCollection,
	TMenuCollectionFacade,
} from '@soxa-ui/core'
import {
	ListBoxCollectionDescriptor,
	ListBoxCollectionItemDescriptor,
	ListBoxDescriptor,
	ListBoxGroupDescriptor,
	ListBoxItemDescriptor,
	MenuCollectionDescriptor,
	MenuCollectionItemDescriptor,
	MenuDescriptor,
	MenuGroupDescriptor,
	MenuItemDescriptor,
	MenuSubmenuCollectionDescriptor,
	MenuSubmenuDescriptor,
	SelectCollectionDescriptor,
	SelectCollectionItemDescriptor,
	SelectDescriptor,
	SelectGroupDescriptor,
	SelectItemDescriptor,
	TabsCollectionDescriptor,
	TabsDescriptor,
} from '../content/descriptors'
import {
	TCollectionExtension,
	TCollectionItemExtension,
	TItemGroupExtension,
} from '../content/extensions'
import { ITEM_GROUP_ELEVATOR } from '../content/extensions/item-group/keys'
import { createAdapterContext } from '../protected/adapter'
import type { IAdapterContext } from '../protected/adapter'
import { CommonProfile } from '../protected/naming'
import { childOf, elevatorOf, required, type TElevatorLayer } from './helpers'

/** Принять контексты, как рантайм адаптера: подписка на состояние и `attach`. */
function accept(contexts: readonly IAdapterContext[]): void {
	for (const context of contexts) context.connect(CommonProfile).state.subscribe(() => {})
	for (const context of contexts) context.attach()
}

/**
 * Список — свой контекст и фасад коллекции на его наборе; движок — свой или
 * снаружи. Расширения — фасада: у него они с типом набора ListBox.
 */
function mountList(layer: TElevatorLayer, engine?: TListBoxCollection) {
	const own = createAdapterContext(ListBoxDescriptor(), { ctrl: new TListBox() })
	const facade = createAdapterContext(
		ListBoxCollectionDescriptor(),
		{ options: { owner: own.instance, engine } },
		{ bundle: own.bundle },
	).use(TCollectionExtension, { elevator: elevatorOf(layer) })

	accept([own, facade])

	return { extensions: facade.instance.extensions }
}

/** Группа списка разметкой: свой контекст с проводкой группы, ещё не принятый. */
function assembleGroup(layer: TElevatorLayer, props: object) {
	return createAdapterContext(ListBoxGroupDescriptor(), { props }).use(TItemGroupExtension, {
		elevator: elevatorOf(layer),
	})
}

/** Группа списка, принятая сразу после сборки, как во Vue. */
function mountGroup(layer: TElevatorLayer, props: object) {
	const group = assembleGroup(layer, props)

	accept([group])

	return group
}

/** Элемент списка разметкой — два контекста на одном наборе, как у Vue. */
function mountItem(layer: TElevatorLayer, props: object, ctrl?: IListBoxItem) {
	const own = createAdapterContext(ListBoxItemDescriptor(), { ctrl, props })
	const item = createAdapterContext(
		ListBoxCollectionItemDescriptor(),
		{ props },
		{ bundle: own.bundle },
	).use(TCollectionItemExtension, { adapter: own, elevator: elevatorOf(layer) })

	accept([item, own])

	return { instance: own.instance, contexts: [item, own] }
}

/** Снять контексты, как рантайм адаптера: фасад раньше своего. */
function unmount(contexts: readonly IAdapterContext[]): void {
	for (const context of contexts) context.destroy()
}

const values = (items: ReadonlyArray<{ readonly value?: unknown }>): unknown[] =>
	items.map((item) => item.value)

/** Секции коротко: ключ, подпись группы (`null` — без группы) и значения элементов. */
const brief = (sections: ReadonlyArray<TGroupSection<{ readonly value?: unknown }>>) =>
	sections.map(({ key, group, items }) => [
		key,
		group === null ? null : (group.label ?? ''),
		values(items),
	])

/**
 * «Вода» над группой «Фрукты», «Сок» — под ней: пункт вне группы пишут и над
 * группами, и стрелки идут, как пункты стоят.
 */
function fruits() {
	const listLayer = childOf()
	const list = mountList(listLayer)
	const water = mountItem(childOf(listLayer), { value: 'water' })
	const groupLayer = childOf(listLayer)
	const group = mountGroup(groupLayer, { label: 'Фрукты' })
	const apple = mountItem(childOf(groupLayer), { value: 'apple' })
	const pear = mountItem(childOf(groupLayer), { value: 'pear' })
	const juice = mountItem(childOf(listLayer), { value: 'juice' })

	return { list, group, water, apple, pear, juice }
}

describe('группа разметки — в группировке коллекции', () => {
	it('элемент в группе получает её ключ: секции — с её подписью, по месту в разметке', () => {
		const { list, apple } = fruits()
		const { batch, group, meta } = list.extensions
		const [, section] = group.sections
		const key = required(section.group, 'группа секции').key

		expect(values(batch.shown)).toEqual(['water', 'apple', 'pear', 'juice'])
		expect(brief(group.sections)).toEqual([
			['free', null, ['water']],
			[`group:${key}`, 'Фрукты', ['apple', 'pear']],
			['free~1', null, ['juice']],
		])
		// Ключ — метка `group` в отметках элемента: того же канала, что `_.group`
		expect(meta.get(apple.instance)?.group).toBe(key)
		// Группы разметки в `groups` не пишутся
		expect(group.groups).toEqual([])
	})

	it('ключ — от экземпляра: у соседних групп без подписи — разные группы', () => {
		const listLayer = childOf()
		const list = mountList(listLayer)
		const firstLayer = childOf(listLayer)

		mountGroup(firstLayer, {})
		mountItem(childOf(firstLayer), { value: 'apple' })

		const secondLayer = childOf(listLayer)

		mountGroup(secondLayer, {})
		mountItem(childOf(secondLayer), { value: 'carrot' })

		const keys = list.extensions.group.sections.map((section) => section.group?.key)

		expect(keys).toHaveLength(2)
		expect(new Set(keys).size).toBe(2)
	})

	it('смена подписи — новая подпись секции, без новой выборки', () => {
		const { list, group } = fruits()
		const shown = vi.fn()

		list.extensions.batch.events.on('change:shown', shown)

		group.instance.label = 'Ягоды'

		expect(list.extensions.group.sections[1].group?.label).toBe('Ягоды')
		expect(shown).not.toHaveBeenCalled()
	})

	it('снятие группы снимает её подпись', () => {
		const { list, group } = fruits()

		unmount([group])

		expect(list.extensions.group.sections[1].group).not.toHaveProperty('label')
	})

	it('снятая вместе с элементами группа уходит из секций', () => {
		const { list, group, apple, pear } = fruits()

		unmount([...apple.contexts, ...pear.contexts, group])

		expect(brief(list.extensions.group.sections)).toEqual([['free', null, ['water', 'juice']]])
	})

	/**
	 * React's order: the children's effects run before the parent's, and the
	 * items join the collection before their group is accepted. The group
	 * enters the grouping with its first item, so the section has its label
	 * from the start, and the group's own acceptance changes nothing
	 * (benchmarks/parity/README.md).
	 */
	it('подпись — с первым элементом: группа входит раньше своего приёма', () => {
		const listLayer = childOf()
		const list = mountList(listLayer)
		const groupLayer = childOf(listLayer)
		const group = assembleGroup(groupLayer, { label: 'Фрукты' })
		const sections = vi.fn()

		list.extensions.group.events.on('change:sections', ({ newValue }) => sections(newValue))
		mountItem(childOf(groupLayer), { value: 'apple' })

		expect(brief(list.extensions.group.sections)).toEqual([
			[expect.stringMatching(/^group:/), 'Фрукты', ['apple']],
		])

		const before = sections.mock.calls.length

		accept([group])

		expect(list.extensions.group.sections[0].group?.label).toBe('Фрукты')
		expect(sections).toHaveBeenCalledTimes(before)
	})
})

describe('ключ берёт только элемент, которого вход добавляет в коллекцию', () => {
	it('элемент из данных в группе секции сохраняет свою метку', () => {
		const source = createEngineListBox({
			items: [{ value: 'apple', _: { group: 'fruit' } }, { value: 'water' }],
		})
		const listLayer = childOf()
		const list = mountList(listLayer, source)
		const apple = required(list.extensions.batch.items[0], 'элемент из данных')
		const groupLayer = childOf(listLayer)

		// Группа, которую владелец рисует по секции из данных, и элемент в ней
		mountGroup(groupLayer, { label: 'Фрукты' })
		mountItem(childOf(groupLayer), {}, apple)

		expect(list.extensions.meta.get(apple)?.group).toBe('fruit')
		expect(brief(list.extensions.group.sections)).toEqual([
			['group:fruit', '', ['apple']],
			['free', null, ['water']],
		])
	})
})

describe('ключ — только из своей коллекции', () => {
	/** Меню — свой контекст и фасад меню на его наборе; расширения — фасада. */
	function mountMenu(layer: TElevatorLayer): TMenuCollectionFacade['extensions'] {
		const own = createAdapterContext(MenuDescriptor(), { ctrl: new TMenu({ open: true }) })
		const facade = createAdapterContext(
			MenuCollectionDescriptor(),
			{ options: { owner: own.instance } },
			{ bundle: own.bundle },
		).use(TCollectionExtension, { elevator: elevatorOf(layer) })

		accept([own, facade])

		return facade.instance.extensions
	}

	/** Пункт с подменю — три контекста на одном наборе, как у Vue. */
	function mountSubmenu(layer: TElevatorLayer, props: object) {
		const submenu = new TMenuSubmenu(props)
		const own = createAdapterContext(MenuSubmenuDescriptor(), { ctrl: submenu, props })
		const elevator = elevatorOf(layer)
		const item = createAdapterContext(
			MenuCollectionItemDescriptor(),
			{ props },
			{ bundle: own.bundle },
		).use(TCollectionItemExtension, { adapter: own, elevator })
		const facade = createAdapterContext(
			MenuSubmenuCollectionDescriptor(),
			{ options: { owner: own.instance } },
			{ bundle: own.bundle },
		).use(TCollectionExtension, { elevator })

		accept([item, own, facade])

		return { submenu, extensions: facade.instance.extensions }
	}

	/** Пункт-действие разметкой. */
	function mountMenuItem(layer: TElevatorLayer, props: object): void {
		const own = createAdapterContext(MenuItemDescriptor(), { props })
		const item = createAdapterContext(
			MenuCollectionItemDescriptor(),
			{ props },
			{ bundle: own.bundle },
		).use(TCollectionItemExtension, { adapter: own, elevator: elevatorOf(layer) })

		accept([item, own])
	}

	it('пункт подменю ключа группы меню не берёт: он — элемент подменю', () => {
		const menuLayer = childOf()
		const menu = mountMenu(menuLayer)
		const groupLayer = childOf(menuLayer)

		accept([
			createAdapterContext(MenuGroupDescriptor(), { props: { label: 'Ещё' } }).use(
				TItemGroupExtension,
				{ elevator: elevatorOf(groupLayer) },
			),
		])

		const shareLayer = childOf(groupLayer)
		const share = mountSubmenu(shareLayer, { value: 'share' })

		mountMenuItem(childOf(shareLayer), { value: 'link' })
		mountMenuItem(childOf(shareLayer), { value: 'mail' })

		// Пункт с подменю — в группе меню над ним
		expect(brief(menu.group.sections)).toEqual([
			[expect.stringMatching(/^group:/), 'Ещё', ['share']],
		])
		// Его пункты — элементы его коллекции, и группы у них нет
		expect(brief(share.extensions.group.sections)).toEqual([['free', null, ['link', 'mail']]])
	})

	it('группа вне коллекции с группировкой опускает пустую связку', () => {
		const loose = childOf()

		mountGroup(loose, { label: 'Сама по себе' })

		const tabsLayer = childOf()
		const tabs = createAdapterContext(TabsDescriptor(), {})
		const facade = createAdapterContext(
			TabsCollectionDescriptor(),
			{ options: { owner: tabs.instance } },
			{ bundle: tabs.bundle },
		).use(TCollectionExtension, { elevator: elevatorOf(tabsLayer) })

		accept([tabs, facade])

		const inTabs = childOf(tabsLayer)

		mountGroup(inTabs, { label: 'В табах' })

		expect(loose.values.get(ITEM_GROUP_ELEVATOR)).toBeNull()
		expect(inTabs.values.get(ITEM_GROUP_ELEVATOR)).toBeNull()
	})
})

/**
 * Select's filter leaves options out of the shown ones; a markup group with
 * none of its options shown hides with its label (issue #905).
 */
describe('группа разметки без показанных элементов скрыта', () => {
	function mountSelect(layer: TElevatorLayer) {
		const own = createAdapterContext(SelectDescriptor(), { ctrl: new TSelect() })
		const facade = createAdapterContext(
			SelectCollectionDescriptor(),
			{ options: { owner: own.instance } },
			{ bundle: own.bundle },
		).use(TCollectionExtension, { elevator: elevatorOf(layer) })

		accept([own, facade])

		return facade.instance.extensions
	}

	function mountSelectGroup(layer: TElevatorLayer, props: object) {
		const group = createAdapterContext(SelectGroupDescriptor(), { props }).use(
			TItemGroupExtension,
			{ elevator: elevatorOf(layer) },
		)

		accept([group])

		return group.instance
	}

	function mountOption(layer: TElevatorLayer, props: object): void {
		const own = createAdapterContext(SelectItemDescriptor(), { props })
		const item = createAdapterContext(
			SelectCollectionItemDescriptor(),
			{ props },
			{ bundle: own.bundle },
		).use(TCollectionItemExtension, { adapter: own, elevator: elevatorOf(layer) })

		accept([item, own])
	}

	function cities() {
		const selectLayer = childOf()
		const extensions = mountSelect(selectLayer)
		const europeLayer = childOf(selectLayer)
		const europe = mountSelectGroup(europeLayer, { label: 'Europe' })

		mountOption(childOf(europeLayer), { value: 'berlin', text: 'Berlin' })
		mountOption(childOf(europeLayer), { value: 'paris', text: 'Paris' })

		const asiaLayer = childOf(selectLayer)
		const asia = mountSelectGroup(asiaLayer, { label: 'Asia' })

		mountOption(childOf(asiaLayer), { value: 'seoul', text: 'Seoul' })

		const emptyLayer = childOf(selectLayer)
		const empty = mountSelectGroup(emptyLayer, { label: 'Africa' })

		return { extensions, europe, asia, empty }
	}

	it('отбор, убравший все элементы группы, прячет её; снятый — возвращает', () => {
		const { extensions, europe, asia } = cities()

		expect([europe.visible, asia.visible]).toEqual([true, true])

		extensions.filter.query = 'par'

		expect([europe.visible, asia.visible]).toEqual([true, false])

		extensions.filter.clear()

		expect([europe.visible, asia.visible]).toEqual([true, true])
	})

	it('группа без элементов остаётся как есть', () => {
		const { extensions, empty } = cities()

		extensions.filter.query = 'par'

		expect(empty.visible).toBe(true)
	})

	it('без смены показа группы её `visible` решает потребитель', () => {
		const { extensions, europe } = cities()

		europe.visible = false
		extensions.filter.query = 'par'

		expect(europe.visible).toBe(false)
	})
})
