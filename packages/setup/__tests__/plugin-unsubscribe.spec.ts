// @vitest-environment jsdom

/**
 * Сторож: уничтоженный набор снимает с долгоживущих шин всё, что повесили на
 * них его плагины.
 *
 * Шина владельца переживает набор, когда приложение передаёт свой `ctrl`:
 * каждое монтирование ставит ему новый набор. Шины расширений движка
 * переживают его, когда движок пришёл снаружи (`engine`). Подписка, которую
 * `destroy()` не снял, копит на них обработчики уничтоженных плагинов. Вреда
 * не видно — у мёртвого плагина обнулены ссылки, и обработчик ничего не
 * делает, — поэтому стережётся тестом, а не ревью. Подписываются на такие шины
 * методом базы (`TBasePlugin._listenTo`), и отписку он делает сам.
 *
 * Сверка — по шпионам на `on` и `off` шины, как в describe «уничтожение»
 * `plugins/__tests__/modal-focus.plugin.spec.ts`: каждая пара «событие,
 * обработчик», повешенная на шину, после уничтожения найдена среди снятых.
 * Шпионы ставятся до сборки, но после создания владельца и движка, поэтому
 * подписки самого ядра — владельца на свою шину и расширений движка на
 * владельца — в сверку не попадают.
 *
 * Идёт по всем дескрипторам экспорта: новый плагин и новая коллекция попадут
 * под проверку сами.
 */

import { describe, it, expect } from 'vitest'
import {
	TAccordion,
	TToggleGroup,
	TStepper,
	TBreadcrumbs,
	TCalendar,
	TListBox,
	TMenu,
	TMenuSubmenu,
	TPagination,
	TRadioGroup,
	TSelect,
	TTable,
	TTabs,
	TTags,
	TToasts,
	createEngineAccordion,
	createEngineToggleGroup,
	createEngineStepper,
	createEngineBreadcrumbs,
	createEngineCalendar,
	createEngineListBox,
	createEngineTree,
	TTree,
	createEngineMenu,
	createEnginePagination,
	createEngineRadioGroup,
	createEngineSelect,
	createEngineTable,
	createEngineTabs,
	createEngineTags,
	createEngineToasts,
} from '@soxa-ui/core'
import type { TCollectionEngine } from '@soxa-ui/core'
import { TCollectionBundlesPlugin } from '@soxa-ui/plugins'
import { FrameDescriptor, TabsDescriptor } from '../content/descriptors'
import { createAdapterContext } from '../protected/adapter'
import type { IComponentDescriptor } from '../protected/define'
import {
	exportedDescriptors,
	leftovers,
	required,
	spyBus,
	subscribed,
	type IBusSpy,
} from './helpers'

/** Собрать компонент над своим `ctrl` и уничтожить. */
function mountOwner(descriptor: IComponentDescriptor): IBusSpy[] {
	const ctrl = new descriptor.ctor()
	const spies = spyBus('владелец', ctrl)

	createAdapterContext(descriptor, { ctrl }).destroy()

	return spies
}

/** Владелец и его движок — так их собирает приложение, передавая `engine` снаружи. */
type TOwnedEngine = { readonly owner: object; readonly engine: TCollectionEngine<any, any> }

/**
 * Движок каждой коллекции, чей набор держит реестр bundles, — фабрикой ядра.
 * Коллекция без строки здесь роняет сторож ниже.
 */
const ENGINES: Readonly<Record<string, () => TOwnedEngine>> = {
	AccordionDescriptor: () => {
		const owner = new TAccordion()

		return { owner, engine: createEngineAccordion({ owner }) }
	},
	ToggleGroupDescriptor: () => {
		const owner = new TToggleGroup()

		return { owner, engine: createEngineToggleGroup({ owner }) }
	},
	StepperDescriptor: () => {
		const owner = new TStepper()

		return { owner, engine: createEngineStepper({ owner }) }
	},
	BreadcrumbsDescriptor: () => {
		const owner = new TBreadcrumbs()

		return { owner, engine: createEngineBreadcrumbs({ owner }) }
	},
	CalendarDescriptor: () => {
		const owner = new TCalendar()

		return { owner, engine: createEngineCalendar({ owner }) }
	},
	TreeDescriptor: () => {
		const owner = new TTree()
		const engine = createEngineTree()

		engine.options.set({ owner })

		return { owner, engine }
	},
	ListBoxDescriptor: () => {
		const owner = new TListBox()

		return { owner, engine: createEngineListBox({ owner }) }
	},
	MenuDescriptor: () => {
		const owner = new TMenu()

		return { owner, engine: createEngineMenu({ owner }) }
	},
	// Пункт с подменю — владелец своих пунктов: его коллекция — та же, что у меню
	MenuSubmenuDescriptor: () => {
		const owner = new TMenuSubmenu()

		return { owner, engine: createEngineMenu({ owner }) }
	},
	PaginationDescriptor: () => {
		const owner = new TPagination({ total: 100 })

		return { owner, engine: createEnginePagination({ owner }) }
	},
	RadioGroupDescriptor: () => {
		const owner = new TRadioGroup()

		return { owner, engine: createEngineRadioGroup({ owner }) }
	},
	SelectDescriptor: () => {
		const owner = new TSelect()

		return { owner, engine: createEngineSelect({ owner }) }
	},
	TableDescriptor: () => {
		const owner = new TTable()

		return { owner, engine: createEngineTable({ owner }) }
	},
	TabsDescriptor: () => {
		const owner = new TTabs()

		return { owner, engine: createEngineTabs({ owner }) }
	},
	TagsDescriptor: () => {
		const owner = new TTags()

		return { owner, engine: createEngineTags({ owner }) }
	},
	ToastsDescriptor: () => {
		const owner = new TToasts()

		return { owner, engine: createEngineToasts({ owner }) }
	},
}

/**
 * Собрать коллекцию над своим `ctrl` и движком снаружи, привязать движок, как
 * это делает `TCollectionExtension`, и уничтожить.
 */
function mountEngine(name: string, descriptor: IComponentDescriptor): IBusSpy[] {
	const { owner, engine } = required(ENGINES[name], name)()

	expect(owner).toBeInstanceOf(descriptor.ctor)

	const extensions: Readonly<Record<string, unknown>> = engine.extensions
	const spies = [
		...spyBus('владелец', owner),
		...Object.entries(extensions).flatMap(([key, extension]) => spyBus(key, extension)),
	]
	const context = createAdapterContext(descriptor, { ctrl: owner })

	required(context.bundle?.get(TCollectionBundlesPlugin), 'реестр bundles').bindEngine(engine)
	context.destroy()

	return spies
}

describe('сторож: плагины снимают подписки с шины владельца', () => {
	const descriptors = exportedDescriptors().filter(
		([, descriptor]) => descriptor.plugins.length > 0,
	)

	it('дескрипторы с плагинами найдены в экспорте', () => {
		expect(descriptors.map(([name]) => name)).toEqual(
			expect.arrayContaining(['FrameDescriptor', 'SelectDescriptor', 'TooltipDescriptor']),
		)
	})

	it('шпионы видят подписки плагинов: у Frame — привязка и раскладка', () => {
		expect(subscribed(mountOwner(FrameDescriptor()))).toEqual(
			expect.arrayContaining(['владелец: show', 'владелец: change:x']),
		)
	})

	it.each(descriptors)('%s', (_name, descriptor) => {
		expect(leftovers(mountOwner(descriptor))).toEqual([])
	})
})

describe('сторож: плагины снимают подписки с шин движка', () => {
	const descriptors = exportedDescriptors().filter(([, descriptor]) =>
		descriptor.plugins.some((definition) => definition.ctor === TCollectionBundlesPlugin),
	)

	it('таблица движков покрывает каждую коллекцию с реестром bundles', () => {
		expect(Object.keys(ENGINES).sort()).toEqual(descriptors.map(([name]) => name).sort())
	})

	it('шпионы видят подписки плагинов: у Tabs — активация и состав', () => {
		expect(subscribed(mountEngine('TabsDescriptor', TabsDescriptor()))).toEqual(
			expect.arrayContaining(['activation: item:activated', 'plain: item:removed']),
		)
	})

	it.each(descriptors)('%s', (name, descriptor) => {
		expect(leftovers(mountEngine(name, descriptor))).toEqual([])
	})
})
