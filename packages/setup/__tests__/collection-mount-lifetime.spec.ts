// @vitest-environment jsdom

/**
 * Сторож: монтирование коллекции над владельцем и движком снаружи не оставляет
 * на них ничего — ни подписок, ни перехватчиков, ни слушателей.
 *
 * Владелец (`ctrl`) и движок (`engine`), переданные снаружи, живут дольше
 * монтирования, и каждое монтирование вешает на них своё: плагины набора —
 * подписки, обмен адаптера — слушателя всех событий (`listen`) на шину
 * владельца, фасад коллекции — пробросы с расширений движка (`relayAll`, на
 * перехватчиках `use`). Раньше пробросы фасада не снимались ни в одном
 * адаптере: с каждым монтированием на движке прибавлялось по перехватчику на
 * расширение. Теперь проброс держит источник, только пока фасад слушают
 * (`TEvented`), и уходит вместе с обменом адаптера.
 *
 * Монтирование — как у адаптеров: свой контекст над `ctrl`, контекст фасада
 * на его наборе с движком в опциях и расширением коллекции; приём — подписка
 * обмена обоих на состояние и события и `attach`; снятие — отписка и
 * `destroy`. Шпионы ставятся после создания владельца и движка, поэтому
 * подписки самого ядра в сверку не попадают. Монтирований три: утечка растёт с
 * каждым.
 *
 * Перекрытые монтирования — новое принято раньше, чем снято прежнее, — идут и
 * с `ctrl` снаружи, и без него, когда у каждой сборки свой инстанс и свой
 * владелец, в обоих порядках снятия: привязку владельца держит последнее
 * живое монтирование из тех, что её брали.
 *
 * Идёт по всем фасадам коллекций из экспорта: новая коллекция без строки в
 * таблице роняет сторож.
 */

import { describe, it, expect } from 'vitest'
import {
	TStepper,
	createEngineStepper,
	createEngineTree,
	TTree,
	TBreadcrumbs,
	createEngineBreadcrumbs,
	TAccordion,
	TToggleGroup,
	TCalendar,
	TCollectionComponent,
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
	createEngineCalendar,
	createEngineListBox,
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
import {
	StepperDescriptor,
	StepperCollectionDescriptor,
	TreeCollectionDescriptor,
	TreeDescriptor,
	BreadcrumbsDescriptor,
	BreadcrumbsCollectionDescriptor,
	AccordionCollectionDescriptor,
	ToggleGroupCollectionDescriptor,
	AccordionDescriptor,
	ToggleGroupDescriptor,
	CalendarCollectionDescriptor,
	CalendarDescriptor,
	ListBoxCollectionDescriptor,
	ListBoxDescriptor,
	MenuCollectionDescriptor,
	MenuDescriptor,
	MenuSubmenuCollectionDescriptor,
	MenuSubmenuDescriptor,
	PaginationCollectionDescriptor,
	PaginationDescriptor,
	RadioGroupCollectionDescriptor,
	RadioGroupDescriptor,
	SelectCollectionDescriptor,
	SelectDescriptor,
	TableCollectionDescriptor,
	TableDescriptor,
	TabsCollectionDescriptor,
	TabsDescriptor,
	TagsCollectionDescriptor,
	TagsDescriptor,
	ToastsCollectionDescriptor,
	ToastsDescriptor,
} from '../content/descriptors'
import { TCollectionExtension } from '../content/extensions'
import type { TCollectionOwner } from '../content/extensions'
import { createAdapterContext } from '../protected/adapter'
import type { IAdapterContext, TContextContract } from '../protected/adapter'
import type { IComponentDescriptor, IPluginsContract } from '../protected/define'
import { CommonProfile } from '../protected/naming'
import {
	createElevatorFactory,
	exportedDescriptors,
	leftovers,
	required,
	spyBus,
	type IBusSpy,
} from './helpers'

/** Сколько раз коллекция монтируется и снимается. */
const MOUNTS = 3

/** Принятое монтирование: его владелец и снятие. */
type TMounted = {
	/** `ctrl` снаружи или инстанс, который монтирование собрало само. */
	readonly owner: object
	readonly unmount: () => void
}

/**
 * Монтирование над движком снаружи: над `ctrl` или, без него, со своим
 * инстансом — тогда у каждого монтирования свой владелец.
 */
type TMount = (ctrl?: object) => TMounted

/** Коллекция под сторожем: владелец и движок снаружи и её монтирование над ними. */
type TCollectionKit = () => {
	readonly owner: object
	readonly engine: TCollectionEngine<any, any>
	readonly mount: TMount
}

/**
 * Принять контексты, как это делает рантайм адаптера: обмен подписан на
 * состояние и события, `attach` — по порядку сборки. Снятие — отписка обмена
 * и `destroy`, фасад раньше владельца.
 */
function accept(contexts: readonly IAdapterContext[]): () => void {
	const offs = contexts.flatMap((context) => {
		const exchange = context.connect(CommonProfile)

		return [exchange.state.subscribe(() => {}), exchange.events.listen(() => {})]
	})

	for (const context of contexts) context.attach()

	return () => {
		offs.forEach((off) => off())

		for (const context of [...contexts].reverse()) context.destroy()
	}
}

/**
 * Смонтировать коллекцию так, как её монтируют адаптеры: свой контекст над
 * `ctrl` — или со своим инстансом, если `ctrl` нет, — и контекст фасада на его
 * наборе, с движком снаружи.
 */
function mountOver<TFacade extends TCollectionOwner, TPlugins extends IPluginsContract>(
	own: IComponentDescriptor,
	collectionDescriptor: IComponentDescriptor<TContextContract<TFacade, TPlugins>>,
	ctrl: object | undefined,
	engine: TCollectionEngine<any, any>,
): TMounted {
	const { factory: elevator } = createElevatorFactory()
	const adapter = createAdapterContext(own, { ctrl })
	const facade = createAdapterContext(
		collectionDescriptor,
		{ props: {}, options: { owner: adapter.instance, engine } },
		{ bundle: adapter.bundle },
	).use(TCollectionExtension, { elevator })

	return { owner: adapter.instance, unmount: accept([adapter, facade]) }
}

/** Коллекции экспорта — ключ по дескриптору фасада коллекции. */
const COLLECTIONS: Readonly<Record<string, TCollectionKit>> = {
	TreeCollectionDescriptor: () => {
		const owner = new TTree()
		const engine = createEngineTree()

		return {
			owner,
			engine,
			mount: (ctrl) => mountOver(TreeDescriptor(), TreeCollectionDescriptor(), ctrl, engine),
		}
	},
	StepperCollectionDescriptor: () => {
		const owner = new TStepper()
		const engine = createEngineStepper()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(StepperDescriptor(), StepperCollectionDescriptor(), ctrl, engine),
		}
	},
	BreadcrumbsCollectionDescriptor: () => {
		const owner = new TBreadcrumbs()
		const engine = createEngineBreadcrumbs()
		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(BreadcrumbsDescriptor(), BreadcrumbsCollectionDescriptor(), ctrl, engine),
		}
	},
	AccordionCollectionDescriptor: () => {
		const owner = new TAccordion()
		const engine = createEngineAccordion()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(AccordionDescriptor(), AccordionCollectionDescriptor(), ctrl, engine),
		}
	},
	ToggleGroupCollectionDescriptor: () => {
		const owner = new TToggleGroup()
		const engine = createEngineToggleGroup()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(ToggleGroupDescriptor(), ToggleGroupCollectionDescriptor(), ctrl, engine),
		}
	},
	CalendarCollectionDescriptor: () => {
		const owner = new TCalendar()
		const engine = createEngineCalendar()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(CalendarDescriptor(), CalendarCollectionDescriptor(), ctrl, engine),
		}
	},
	ListBoxCollectionDescriptor: () => {
		const owner = new TListBox()
		const engine = createEngineListBox()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(ListBoxDescriptor(), ListBoxCollectionDescriptor(), ctrl, engine),
		}
	},
	MenuCollectionDescriptor: () => {
		const owner = new TMenu()
		const engine = createEngineMenu()

		return {
			owner,
			engine,
			mount: (ctrl) => mountOver(MenuDescriptor(), MenuCollectionDescriptor(), ctrl, engine),
		}
	},
	// Пункт с подменю — владелец своих пунктов: фасад тот же, что у меню
	MenuSubmenuCollectionDescriptor: () => {
		const owner = new TMenuSubmenu()
		const engine = createEngineMenu()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(MenuSubmenuDescriptor(), MenuSubmenuCollectionDescriptor(), ctrl, engine),
		}
	},
	PaginationCollectionDescriptor: () => {
		const owner = new TPagination({ total: 100 })
		const engine = createEnginePagination()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(PaginationDescriptor(), PaginationCollectionDescriptor(), ctrl, engine),
		}
	},
	RadioGroupCollectionDescriptor: () => {
		const owner = new TRadioGroup()
		const engine = createEngineRadioGroup()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(RadioGroupDescriptor(), RadioGroupCollectionDescriptor(), ctrl, engine),
		}
	},
	SelectCollectionDescriptor: () => {
		const owner = new TSelect()
		const engine = createEngineSelect()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(SelectDescriptor(), SelectCollectionDescriptor(), ctrl, engine),
		}
	},
	TableCollectionDescriptor: () => {
		const owner = new TTable()
		const engine = createEngineTable()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(TableDescriptor(), TableCollectionDescriptor(), ctrl, engine),
		}
	},
	TabsCollectionDescriptor: () => {
		const owner = new TTabs()
		const engine = createEngineTabs()

		return {
			owner,
			engine,
			mount: (ctrl) => mountOver(TabsDescriptor(), TabsCollectionDescriptor(), ctrl, engine),
		}
	},
	TagsCollectionDescriptor: () => {
		const owner = new TTags()
		const engine = createEngineTags()

		return {
			owner,
			engine,
			mount: (ctrl) => mountOver(TagsDescriptor(), TagsCollectionDescriptor(), ctrl, engine),
		}
	},
	ToastsCollectionDescriptor: () => {
		const owner = new TToasts()
		const engine = createEngineToasts()

		return {
			owner,
			engine,
			mount: (ctrl) =>
				mountOver(ToastsDescriptor(), ToastsCollectionDescriptor(), ctrl, engine),
		}
	},
}

/** Шины движка, которые переживают монтирование: сам движок, драйвер и каждое расширение. */
function spyEngine(engine: TCollectionEngine<any, any>): IBusSpy[] {
	const extensions: Readonly<Record<string, unknown>> = engine.extensions

	return [
		...spyBus('движок', engine),
		...spyBus('driver', engine.getCore().driver),
		...Object.entries(extensions).flatMap(([key, extension]) => spyBus(key, extension)),
	]
}

/** Шины, которые переживают монтирование: владелец и шины движка. */
function spyOutside(owner: object, engine: TCollectionEngine<any, any>): IBusSpy[] {
	return [...spyBus('владелец', owner), ...spyEngine(engine)]
}

describe('сторож: коллекция над владельцем и движком снаружи ничего на них не оставляет', () => {
	it('таблица покрывает каждый фасад коллекции из экспорта', () => {
		const facades = exportedDescriptors()
			.filter(([, descriptor]) => descriptor.ctor.prototype instanceof TCollectionComponent)
			.map(([name]) => name)

		expect(Object.keys(COLLECTIONS).sort()).toEqual(facades.sort())
	})

	it('шпионы видят пробросы фасада и слушателя обмена: пока Tabs смонтирован, они стоят', () => {
		const { owner, engine, mount } = required(COLLECTIONS.TabsCollectionDescriptor, 'Tabs')()
		const spies = spyOutside(owner, engine)
		const { unmount } = mount(owner)

		expect(leftovers(spies)).toEqual(
			expect.arrayContaining([
				'plain: use',
				'batch: use',
				'activation: use',
				'tabs: use',
				'владелец: listen',
			]),
		)

		unmount()
	})

	it.each(Object.entries(COLLECTIONS))('%s', (_name, kit) => {
		const { owner, engine, mount } = kit()
		const spies = spyOutside(owner, engine)

		for (let i = 0; i < MOUNTS; i++) mount(owner).unmount()

		expect(leftovers(spies)).toEqual([])
	})
})

/**
 * Перекрытие: каждая коллекция с `ctrl` снаружи — владелец у монтирований
 * один — и без него, когда у каждого монтирования свой инстанс.
 */
const OVERLAPS = Object.entries(COLLECTIONS).flatMap(([name, kit]) => [
	[`${name} · с ctrl`, kit, true] as const,
	[`${name} · без ctrl`, kit, false] as const,
])

/**
 * Новое монтирование над тем же движком бывает принято раньше, чем снято
 * прежнее: компонент перенесён к другому родителю за одну перерисовку, ветка
 * Svelte уходит анимацией. Привязку владельца держит последнее живое
 * монтирование из тех, что её брали: снятие прежнего её не трогает, а снятие
 * нового, пока прежнее живо, возвращает её прежнему.
 */
describe('сторож: новое монтирование принято раньше, чем снято прежнее — привязка у последнего живого', () => {
	it.each(OVERLAPS)('%s · прежнее снято первым', (_name, kit, external) => {
		const { owner, engine, mount } = kit()
		const spies = external ? spyOutside(owner, engine) : spyEngine(engine)
		const ctrl = external ? owner : undefined
		const first = mount(ctrl)
		const second = mount(ctrl)

		expect(engine.options.get('owner')).toBe(second.owner)

		first.unmount()

		expect(engine.options.get('owner')).toBe(second.owner)

		second.unmount()

		expect(engine.options.get('owner')).toBeUndefined()
		expect(leftovers(spies)).toEqual([])
	})

	it.each(OVERLAPS)('%s · новое снято первым', (_name, kit, external) => {
		const { owner, engine, mount } = kit()
		const spies = external ? spyOutside(owner, engine) : spyEngine(engine)
		const ctrl = external ? owner : undefined
		const first = mount(ctrl)
		const second = mount(ctrl)

		second.unmount()

		expect(engine.options.get('owner')).toBe(first.owner)

		first.unmount()

		expect(engine.options.get('owner')).toBeUndefined()
		expect(leftovers(spies)).toEqual([])
	})
})
