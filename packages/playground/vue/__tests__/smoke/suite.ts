/**
 * Стенд обязан открываться на каждом компоненте — у каждого фреймворка.
 *
 * Смысл проверки шире, чем «страница не упала». Страница строится из
 * дескриптора и рисует компонент **всеми** его пропами разом, в двух режимах —
 * пропом и через экземпляр ядра. Если компонент падает на каком-то сочетании,
 * ломается здесь, а не глазами через месяц. Прежнее демо такой проверки не
 * имело и потому годами показывало не то.
 *
 * Проверки одного фреймворка, а спек — файл на фреймворк (`vue.spec.ts` и
 * соседи): Vitest раздаёт воркерам файлы, а не тесты внутри файла, и один файл
 * на все фреймворки шёл в CI восемь минут одним воркером, пока остальные спеки
 * стенда заканчивали за минуту. Проверки между фреймворками —
 * `common.spec.ts`.
 */

import { describe, it, expect } from 'vitest'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import {
	COLLECTION_ITEMS,
	COMPONENTS,
	findComponent,
	propControls,
} from '@soxa-ui/playground-shared'
import { availableOf, showcaseOf } from '../../src/catalog'
import { hostOf } from '../../src/hosts'
import { useIconPack } from '../../src/composables/useIconPack'
import OverviewPage from '../../src/views/OverviewPage.vue'
import PropRow from '../../src/components/PropRow.vue'
import CodeView from '../../src/components/CodeView.vue'
import {
	IDS,
	ariaLabels,
	buttonTexts,
	controlledBy,
	dialogPanels,
	draws,
	enter,
	fieldNotes,
	fieldText,
	firstLines,
	invalidMarks,
	mountOptions,
	nextFrame,
	openPage,
	ringNames,
	rowComponentOf,
	rowOf,
	rowless,
	sectionsIn,
	selectedAfterTwoClicks,
	stagesOf,
	track,
	unlinkedHeads,
	useSmokeHooks,
} from './harness'

/**
 * Код колонок пишет хост фреймворка — своим синтаксисом, и файл примера для
 * «Открыть в VS Code» у него того же синтаксиса. Строка на каждый фреймворк
 * стенда, у хоста которого есть генератор кода: такой хост без строки уронит
 * проверку, а не пропустит её.
 */
const WIDTH_CODE: Record<string, { number: string; text: string; extension: string }> = {
	vue: { number: ':width="40"', text: `:width="'10%'"`, extension: 'vue' },
	react: { number: 'width={40}', text: 'width="10%"', extension: 'tsx' },
	svelte: { number: 'width={40}', text: 'width="10%"', extension: 'svelte' },
	solid: { number: 'width={40}', text: 'width="10%"', extension: 'tsx' },
	// Атрибутом, а тип пропа (`[Number, String]`) читает `40` числом, `10%` —
	// строкой: в коде то же значение, что у компонента
	webc: { number: 'width="40"', text: 'width="10%"', extension: 'html' },
}

/** Дымовые проверки фреймворка — всё, что о нём одном. */
export function describeSmoke(framework: string): void {
	useSmokeHooks()

	/** Сам фреймворк, если его хост рисует все эти компоненты: проверка компонента — только там, где он есть. */
	const drawing = (...components: string[]) =>
		draws(framework, ...components) ? [framework] : []

	it.each(drawing('dialog'))('%s: modal reaches both preview columns', async (framework) => {
		const wrapper = await openPage(framework, 'dialog')
		const row = rowOf(wrapper, 'modal')
		await enter(row, false)

		expect((await dialogPanels(row)).map((panel) => panel.hasAttribute('aria-modal'))).toEqual([
			false,
			false,
		])

		await enter(row, true)
		expect((await dialogPanels(row)).map((panel) => panel.getAttribute('aria-modal'))).toEqual([
			'true',
			'true',
		])
		expect(firstLines()).toEqual([])
	})

	describe(`каталог хоста ${framework}`, () => {
		/**
		 * Ключи карты превью — те же идентификаторы, что в общем реестре. Опечатка
		 * (`list_box` вместо `list-box`) не сломает ничего заметного: компонент
		 * просто молча исчезнет из меню, потому что каталог строится пересечением.
		 */
		it('каждое превью соответствует записи реестра', () => {
			const known = new Set(COMPONENTS.map((entry) => entry.id))

			expect(hostOf(framework).previews.filter((id) => !known.has(id))).toEqual([])
		})

		it('витрина показывает все готовые компоненты хоста, каждый — нарисованным', async () => {
			const page = track(mount(OverviewPage, { ...mountOptions, props: { framework } }))

			await nextTick()
			await nextFrame()

			const cells = page.findAll('.pg-cell')

			expect(cells).toHaveLength(showcaseOf(hostOf(framework)).length)
			expect(
				cells.filter((cell) => !cell.find('.pg-cell__stage .pg-mount > *').exists()),
			).toEqual([])
			expect(firstLines()).toEqual([])
		})
	})

	/**
	 * Копии превью (`count`) — одним корнем, рядом: так стенд замера страниц
	 * (`tools/bench-pages`) ставит десятки компонентов на страницу. У копий
	 * пропсы общие, у каждой свой экземпляр, а снятие уносит все.
	 */

	describe('manual separator fixtures', () => {
		for (const component of ['list-box', 'select']) {
			it.each(drawing(component))(
				'%s: ' + component + ' fixture draws a silent manual line',
				async (framework) => {
					const node = document.body.appendChild(document.createElement('div'))
					const mounted = hostOf(framework).mount(node, {
						component,
						fixture: component + '-separators',
						props: {},
					})

					try {
						await nextFrame()
						await nextFrame()
						await nextFrame()

						const block = component === 'select' ? 'so-select' : 'so-list-box'
						const input = node.querySelector('input[role="combobox"]')
						const list =
							component === 'select'
								? document.getElementById(
										input?.getAttribute('aria-controls') ?? '',
									)
								: node.querySelector('.so-list-box__list')
						const line = list?.querySelector('.' + block + '__separator')

						expect(line?.getAttribute('aria-hidden')).toBe('true')
						expect(line?.hasAttribute('role')).toBe(false)
						expect(line && getComputedStyle(line).display).not.toBe('none')
						expect(list?.querySelectorAll('[role="option"]')).toHaveLength(2)
						expect(firstLines()).toEqual([])
					} finally {
						mounted.unmount()
						node.remove()
					}
				},
			)
		}
	})

	describe('копии превью', () => {
		it.each(drawing('button', 'list-box'))(
			'%s: count рисует копии рядом, снятие уносит все',
			async (framework) => {
				const node = document.body.appendChild(document.createElement('div'))

				try {
					const buttons = hostOf(framework).mount(node, {
						component: 'button',
						props: { text: 'Копия' },
						count: 3,
					})

					await nextFrame()

					expect(
						[...node.querySelectorAll('.so-button')].map((button) =>
							button.textContent?.trim(),
						),
					).toEqual(['Копия', 'Копия', 'Копия'])

					buttons.unmount()

					expect(node.querySelector('.so-button')).toBeNull()

					const lists = hostOf(framework).mount(node, {
						component: 'list-box',
						props: {},
						count: 2,
					})

					await nextFrame()

					expect(
						[...node.querySelectorAll('.so-list-box')].map(
							(list) => list.querySelectorAll('.so-list-box-item').length,
						),
					).toEqual([COLLECTION_ITEMS.length, COLLECTION_ITEMS.length])

					lists.unmount()

					expect(node.querySelector('.so-list-box')).toBeNull()
					expect(firstLines()).toEqual([])
				} finally {
					node.remove()
				}
			},
		)
	})

	/**
	 * Значения, которые превью задаёт компоненту само, лежат не в разметке хоста, а
	 * в общих данных (`PREVIEW_PROPS`), и витрине их отдаёт оболочка. Забудь она
	 * их — ячейка осталась бы нарисованной, но кнопка — без подписи, а кольцо —
	 * без имени, и проверка выше этого не увидела бы.
	 */
	describe('пропсы превью на витрине', () => {
		/** Ячейка витрины по подписи компонента. */
		function cellOf(wrapper: VueWrapper, label: string): DOMWrapper<Element> {
			const found = wrapper
				.findAll('.pg-cell')
				.find((cell) => cell.get('.pg-cell__title').text() === label)

			if (!found) throw new Error(`на витрине нет ${label}`)

			return found
		}

		it.each(drawing('button', 'progress-spinner'))(
			'%s: кнопка — с подписью превью, кольцо — с именем',
			async (framework) => {
				const page = track(mount(OverviewPage, { ...mountOptions, props: { framework } }))

				await nextTick()
				await nextFrame()

				expect(cellOf(page, 'Button').get('.so-button').text()).toBe('Кнопка')
				expect(
					cellOf(page, 'ProgressSpinner')
						.get('.so-progress-spinner')
						.attributes('aria-label'),
				).toBe('Загрузка')
			},
		)
	})

	describe('страница компонента', () => {
		const PAGES = availableOf(hostOf(framework)).map(
			(entry) => [framework, entry.id, entry] as const,
		)

		it.each(PAGES)(
			'%s/%s открывается и рисует строку на каждый проп, имя и описание — у её редактора',
			async (framework, id, entry) => {
				const wrapper = await openPage(framework, id)

				// Все три группы: коллекционные свойства (`mode`) объявлены на
				// фасаде, плагинные (`aria_label`) — на плагинах. Счёт из того же
				// источника, из которого строится страница, а не своей копией фильтра
				const { componentControls, collectionControls, pluginControls } =
					propControls(entry)
				const rows =
					componentControls.length + collectionControls.length + pluginControls.length

				expect(wrapper.findAll('.pg-prop')).toHaveLength(rows)
				expect(unlinkedHeads(wrapper)).toEqual([])
				expect(firstLines()).toEqual([])
			},
		)

		/**
		 * Панель оверлея плагины слоя находят по пометке владельцем (`data-owner`
		 * — от id монтирования) первой в документе: жест, фокус и немой фон. На
		 * странице превью по два на строку, и совпавшая пометка увела бы их на
		 * чужую панель — какую, решает порядок панелей в документе, а он меняется,
		 * когда панели уходят и возвращаются. Превью Vue — отдельные приложения, и
		 * `useId` у каждого считает заново: пометки различает только свой
		 * `idPrefix` приложения (`src/hosts/vue/index.ts`).
		 */
		it.each(PAGES)(
			'%s/%s: пометки панелей владельцами не повторяются',
			async (framework, id) => {
				await openPage(framework, id)

				const marks = [...document.querySelectorAll('[data-owner]')].map((node) =>
					node.getAttribute('data-owner'),
				)

				expect(marks.filter((mark, index) => marks.indexOf(mark) !== index)).toEqual([])
			},
		)

		/**
		 * Адрес компонента переживает смену фреймворка, а компонента у нового может
		 * не быть: страница говорит об этом и ведёт на витрину фреймворка.
		 */
		const missing = COMPONENTS.find((entry) => !hostOf(framework).previews.includes(entry.id))
		const MISSING = missing ? [[framework, missing.id, missing.label] as const] : []

		it.each(MISSING)(
			'%s/%s: компонента у фреймворка нет — пустое состояние со ссылкой на витрину',
			async (framework, id, label) => {
				const wrapper = await openPage(framework, id)

				expect(wrapper.findAll('.pg-prop')).toHaveLength(0)
				expect(wrapper.get('.pg-empty').text()).toContain(label)
				expect(wrapper.get('.pg-empty a').attributes('href')).toBe(`#/${framework}`)
			},
		)

		/**
		 * Страница, на которой строк нет ни в одной группе: править нечего, а
		 * показать есть что — у DragAndDrop пропов нет, а перестановка коллекций
		 * внутри есть. Её рисует одна сцена с колонками строки — пропсами и над
		 * экземпляром, — без поля и кода; заголовка свойств нет. Список — из того
		 * же источника, что строки (`rowless`); что он не пуст, проверяет
		 * `common.spec.ts`.
		 */
		it.each(PAGES.filter(([, , entry]) => rowless(entry)))(
			'%s/%s: без строк — одна сцена, обе колонки нарисованы',
			async (framework, id) => {
				const wrapper = await openPage(framework, id)
				const scenes = wrapper.findAll('.pg-scene')

				expect(wrapper.findAll('.pg-prop')).toHaveLength(0)
				expect(wrapper.find('.pg__group').exists()).toBe(false)
				expect(scenes).toHaveLength(1)

				const columns = scenes[0].findAll('.pg-col')

				expect(columns.map((column) => column.get('.pg-col__head').text())).toEqual([
					'Component',
					'Component Instance',
				])
				expect(
					columns.filter(
						(column) => !column.find('.pg-col__stage .pg-mount > *').exists(),
					),
				).toEqual([])
				expect(scenes[0].findAllComponents(CodeView)).toHaveLength(0)
				expect(firstLines()).toEqual([])
			},
		)
	})

	/**
	 * Превью DragAndDrop — три коллекции в обёртке, и обёртка доходит до каждой:
	 * элементы Tabs, ListBox и Accordion перетаскиваемые в обеих колонках. Что
	 * перетаскивание переставляет на экране, проверяет браузер
	 * (`browser/drag-and-drop.spec.ts`).
	 */
	describe('превью drag-and-drop', () => {
		it.each(drawing('drag-and-drop'))(
			'%s: элементы трёх коллекций перетаскиваемые в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'drag-and-drop')
				const stages = wrapper.findAll('.pg-col__stage')
				const items = ['.so-tabs-item', '.so-list-box-item', '.so-accordion-item']
				/** Перетаскиваемость элементов каждой коллекции сцены. */
				const draggable = (stage: DOMWrapper<Element>) =>
					items.map((selector) =>
						stage.findAll(selector).map((node) => node.attributes('draggable')),
					)

				expect(stages).toHaveLength(2)

				for (const stage of stages) {
					expect(draggable(stage)).toEqual(
						items.map(() => COLLECTION_ITEMS.map(() => 'true')),
					)
				}
			},
		)
	})

	/**
	 * Регрессия слота `content`: `Tabs.Content`, положенный в превью не в тот
	 * слот, физически оказывается внутри `[role="tablist"]` — панель рядом с
	 * табами, а не рядом со списком. Проверяем DOM, а не консоль: страница уже
	 * ловит предупреждения целиком, а эта проверка — про саму структуру.
	 */
	describe('превью tabs', () => {
		it.each(drawing('tabs'))('%s: панель не лежит внутри списка табов', async (framework) => {
			const wrapper = await openPage(framework, 'tabs')
			const stages = wrapper.findAll('.pg-col__stage')

			expect(stages.length).toBeGreaterThan(0)

			for (const stage of stages) {
				const list = stage.find('.so-tabs__list')

				expect(list.exists()).toBe(true)
				expect(list.findAll('.so-tabs-content')).toHaveLength(0)
				expect(stage.findAll('.so-tabs-content').length).toBeGreaterThan(0)
			}
		})
	})

	/**
	 * Область контекстного меню — одна разметка на все хосты: превью сравнивают
	 * колонками. Это нативная кнопка: меню над ней вызывает и Shift+F10, а он идёт
	 * элементу под фокусом, — и в обходе Tab у кнопки свои роль и имя, без
	 * `tabindex` (WCAG 4.1.2); у `div` с `tabindex` их нет. Связки с меню у
	 * области нет: Enter меню не открывает. Режим область берёт из пропсов
	 * колонки, поэтому она — в колонке пропа.
	 */
	describe('превью menu', () => {
		it.each(drawing('menu'))(
			'%s: область контекстного меню — нативная кнопка без связки с меню',
			async (framework) => {
				const wrapper = await openPage(framework, 'menu')
				const row = rowOf(wrapper, 'openOn')

				await enter(row, 'contextmenu')

				const area = stagesOf(row)[0].get('.so-menu > button:not(.so-button)').element

				expect(area.getAttribute('type')).toBe('button')
				expect(area.hasAttribute('tabindex')).toBe(false)
				expect(area.hasAttribute('aria-haspopup')).toBe(false)
				expect(area.textContent?.trim()).toBe('Правая кнопка, долгое касание или Shift+F10')
				expect(firstLines()).toEqual([])
			},
		)
	})

	/**
	 * Переход между страницами — то, чего дымовая проверка выше не видит.
	 *
	 * Она монтирует `ComponentPage` заново на каждый идентификатор, а в браузере
	 * маршрут `/:framework/:id` обслуживает **один и тот же** экземпляр страницы:
	 * меняется только проп `id`. Строки пропов при этом переиспользуются, и всё,
	 * что строка успела завести в `setup`, остаётся от прежнего компонента.
	 *
	 * Так и вышло: правая колонка ListBox рисовала корень с классами Button —
	 * `ctrl` в ней оставался экземпляром `TButton`, а элементы приходили уже
	 * списочные.
	 */
	describe('переход между компонентами', () => {
		/**
		 * Корни превью в сценах страницы — элементы, которые стоят в раскладке
		 * ячейки. Свой корень хоста в раскладке не участвует (`display: contents`),
		 * и корни превью — его дети: `pg-angular-root` у Angular и
		 * `<so-locale-provider>` у Web Components. У провайдера это правило `:host`
		 * его теневого корня, а jsdom правил теневого корня не считает, поэтому
		 * провайдер узнаётся по имени.
		 */
		function previewRoots(wrapper: VueWrapper): Element[] {
			const boxless = (element: Element): boolean =>
				element.localName === 'so-locale-provider' ||
				getComputedStyle(element).display === 'contents'
			const inLayout = (element: Element): Element[] =>
				boxless(element) ? [...element.children].flatMap(inLayout) : [element]

			return wrapper
				.findAll('.pg-col__stage > .pg-mount')
				.flatMap((mount) => [...mount.element.children].flatMap(inLayout))
		}

		it.each(drawing('button', 'list-box'))(
			'%s: колонки показывают новый компонент, а не прежний',
			async (framework) => {
				const wrapper = await openPage(framework, 'button')

				await wrapper.setProps({ id: 'list-box' })
				await nextTick()
				await nextFrame()

				const roots = previewRoots(wrapper)

				expect(roots.length).toBeGreaterThan(0)
				expect(roots.every((root) => root.classList.contains('so-list-box'))).toBe(true)
			},
		)
	})

	/**
	 * Коллекционные свойства — вторая группа на странице.
	 *
	 * `mode` объявлен на фасаде коллекции, а не на компоненте, и страница долго
	 * его не показывала: строки строились только из компонентного дескриптора.
	 * Проверка идёт до самой коллекции, а не до наличия строки: правая колонка
	 * пишет `mode` не в инстанс, а в фасад поверх своего движка, и молчаливо не
	 * сработать там есть чему.
	 */
	describe('свойства коллекции', () => {
		const MODE_PAGES = ['list-box', 'select', 'accordion', 'calendar'].flatMap((id) =>
			drawing(id).map((framework) => [framework, id] as const),
		)

		it.each(MODE_PAGES)('%s/%s показывает строку mode', async (framework, id) => {
			const wrapper = await openPage(framework, id)

			expect(rowOf(wrapper, 'mode').exists()).toBe(true)
		})

		it.each(drawing('list-box'))(
			'%s: переключение mode доходит до коллекции в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'list-box')
				const row = rowOf(wrapper, 'mode')

				await enter(row, 'multiple')

				// Наблюдаемое следствие `multiple` — два выбранных разом. У ListBox
				// режим в DOM не выведен, и проверять его можно только поведением
				expect(await selectedAfterTwoClicks(row)).toEqual([2, 2])
			},
		)

		/**
		 * Выбор у календаря свой, дат, а не стандартный: движок второй колонки
		 * доставляет фасад календаря, и `mode` обязан доехать до его выбора, а не
		 * до чужого. Признак режима — `aria-multiselectable` у сетки: несколько
		 * дней выбирают в `multiple` и `range`.
		 */
		it.each(drawing('calendar'))(
			'%s: mode календаря доходит до коллекции в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'calendar')
				const row = rowOf(wrapper, 'mode')

				const multiselectable = () =>
					row
						.findAll('.so-calendar__grid')
						.map((grid) => grid.attributes('aria-multiselectable'))

				expect(multiselectable()).toEqual([undefined, undefined])

				await enter(row, 'range')

				expect(multiselectable()).toEqual(['true', 'true'])
			},
		)
	})

	/**
	 * Свойства плагинов — третья группа на странице.
	 *
	 * Проверка идёт до DOM, а не до наличия строки: правая колонка пишет проп не в
	 * инстанс, а в плагин из bundle, который приходит событием `bundle:create`, и
	 * молчаливо не сработать там есть чему. `aria_label` виден сразу — атрибутом
	 * `aria-label` на корне кнопки.
	 */
	describe('свойства плагинов', () => {
		it.each(drawing('button'))(
			'%s: aria_label доходит до DOM в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'button')

				await enter(rowOf(wrapper, 'aria_label'), 'Закрыть')

				expect(ariaLabels(rowOf(wrapper, 'aria_label'))).toEqual(['Закрыть', 'Закрыть'])
			},
		)

		/**
		 * Смена пакета иконок рисует сцены заново, и правая колонка монтируется с
		 * новым bundle, чей плагин стартует без имени и снимает его с инстанса.
		 * Значение обязано доехать и до этого bundle.
		 */
		it.each(drawing('button'))(
			'%s: значение переживает перемонтирование колонок',
			async (framework) => {
				const { version } = useIconPack()
				const wrapper = await openPage(framework, 'button')

				await enter(rowOf(wrapper, 'aria_label'), 'Закрыть')

				version.value++

				try {
					await nextTick()
					await nextFrame()

					expect(ariaLabels(rowOf(wrapper, 'aria_label'))).toEqual(['Закрыть', 'Закрыть'])
				} finally {
					version.value--
				}
			},
		)
	})

	/**
	 * Пресет строки: `removeOnBackspace` виден только в `editable` + `multiple`,
	 * `indicator` у ListBox нужен там, где выбрано несколько элементов, `offset`
	 * у Dialog виден у окна, растянутого по экрану, текст `error` у Field — только
	 * при `invalid`, сообщение `invalid` — только с текстом ошибки, а линии
	 * `groupSeparators` у ListBox, Select и Menu — только на составе с группами,
	 * которого у превью нет.
	 *
	 * Проверяем DOM обеих колонок, а не сам пресет: во второй колонке он едет
	 * разметкой рядом с `ctrl`, и доехать до инстанса и фасада коллекции там
	 * есть чему не сработать. Признаки Select — теги (есть только в `multiple`) и
	 * снятый `readonly` у поля (снимает только `editable`). У ListBox режим в DOM
	 * не выведен, и признак — поведение: после кликов по двум разным элементам
	 * оба остаются выбранными только в `multiple`. У окна признак — переменные
	 * размера и отступа на его панели. У поля формы — что стоит под контролом,
	 * подсказка или ошибка, и отметка ошибки у самого контрола (`aria-invalid`).
	 * У групп — сколько групп и линий между ними: у ListBox — в самом списке, у
	 * Select — в списке панели, у Menu — в панели. Панели телепортированы, и
	 * колонку со своей связывает ссылка `aria-controls` — поля Select и кнопки
	 * меню.
	 */
	describe('пресет строки', () => {
		it.each(drawing('select'))(
			'%s: removeOnBackspace рисует Select в editable + multiple в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'select')
				const stages = stagesOf(rowOf(wrapper, 'removeOnBackspace'))

				expect(stages).toHaveLength(2)

				for (const stage of stages) {
					expect(stage.find('.so-select__tags').exists()).toBe(true)
					expect(
						stage.find('.so-select__field input').attributes('readonly'),
					).toBeUndefined()
				}
			},
		)

		it.each(drawing('select'))('%s: соседние строки пресет не получают', async (framework) => {
			const wrapper = await openPage(framework, 'select')

			for (const stage of stagesOf(rowOf(wrapper, 'closeOnSelect'))) {
				expect(stage.find('.so-select__tags').exists()).toBe(false)
			}
		})

		it.each(drawing('list-box'))(
			'%s: indicator рисует ListBox в multiple в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'list-box')

				expect(await selectedAfterTwoClicks(rowOf(wrapper, 'indicator'))).toEqual([2, 2])
			},
		)

		it.each(drawing('list-box'))(
			'%s: соседние строки ListBox пресет не получают',
			async (framework) => {
				const wrapper = await openPage(framework, 'list-box')

				expect(await selectedAfterTwoClicks(rowOf(wrapper, 'view'))).toEqual([1, 1])
			},
		)

		/**
		 * Разделитель встаёт только между секциями групп, а превью рисует состав без
		 * групп — у Menu ещё и с ручными `Menu.Separator`, которых свойство не
		 * трогает: снятый флаг не менял ничего. Пресет строки отдаёт состав с
		 * группами данными, как блок групп: две группы и элемент без группы — три
		 * секции и две линии между ними. У ListBox и Select линий по умолчанию нет,
		 * у Menu — есть.
		 */
		it.each(drawing('list-box'))(
			'%s: groupSeparators ставит и снимает линии между группами ListBox в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'list-box')
				const row = rowOf(wrapper, 'groupSeparators')
				const sections = () =>
					stagesOf(row).map((stage) =>
						sectionsIn(stage.element, '.so-list-box-group', '.so-list-box__separator'),
					)

				expect(sections()).toEqual([
					[2, 0],
					[2, 0],
				])

				await enter(row, true)
				expect(sections()).toEqual([
					[2, 2],
					[2, 2],
				])

				await enter(row, false)
				expect(sections()).toEqual([
					[2, 0],
					[2, 0],
				])
				expect(firstLines()).toEqual([])
			},
		)

		it.each(drawing('select'))(
			'%s: groupSeparators ставит и снимает линии между группами в списке Select в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'select')
				const row = rowOf(wrapper, 'groupSeparators')

				// The panel's options from data are drawn with its first opening: open
				// and close the Select of each column by its arrow, the options stay
				for (const stage of stagesOf(row)) {
					for (let click = 0; click < 2; click++) {
						await stage.get('.so-select__arrow').trigger('click')
						await nextTick()
						await nextFrame()
					}
				}

				const sections = () =>
					stagesOf(row).map((stage) =>
						sectionsIn(
							controlledBy(stage, '.so-select__field input'),
							'.so-select-group',
							'.so-select__separator',
						),
					)

				expect(sections()).toEqual([
					[2, 0],
					[2, 0],
				])

				await enter(row, true)
				expect(sections()).toEqual([
					[2, 2],
					[2, 2],
				])

				await enter(row, false)
				expect(sections()).toEqual([
					[2, 0],
					[2, 0],
				])
				expect(firstLines()).toEqual([])
			},
		)

		it.each(drawing('menu'))(
			'%s: снятый groupSeparators убирает линии между группами в панели Menu в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'menu')
				const row = rowOf(wrapper, 'groupSeparators')

				// The panel's items are drawn with its first opening: open and close
				// the menu of each column, the items stay
				for (const stage of stagesOf(row)) {
					for (let click = 0; click < 2; click++) {
						await stage.get('.so-button').trigger('click')
						await nextTick()
						await nextFrame()
					}
				}

				const sections = () =>
					stagesOf(row).map((stage) =>
						sectionsIn(
							controlledBy(stage, '.so-button'),
							'.so-menu-group',
							'.so-menu-separator',
						),
					)

				expect(sections()).toEqual([
					[2, 2],
					[2, 2],
				])

				await enter(row, false)
				expect(sections()).toEqual([
					[2, 0],
					[2, 0],
				])
				expect(firstLines()).toEqual([])
			},
		)

		/**
		 * Отступ у центра — поля области, по центру которой стоит окно: окно меньше
		 * экрана от него не сдвигается. Строка растягивает окно по области (`auto`
		 * — «по экрану с отступом»), и отступ виден зазором до краёв экрана.
		 */
		it.each(drawing('dialog'))(
			'%s: offset рисует Dialog по экрану с отступом в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'dialog')

				const sizes = async (name: string) =>
					(await dialogPanels(rowOf(wrapper, name))).map((panel) => [
						panel.style.getPropertyValue('--so-dialog-width'),
						panel.style.getPropertyValue('--so-dialog-height'),
					])

				expect(await sizes('offset')).toEqual([
					['auto', 'auto'],
					['auto', 'auto'],
				])
				expect(await sizes('placement')).toEqual([
					['', ''],
					['', ''],
				])
			},
		)

		/**
		 * `offset={40}` в коде колонки пропа — синтаксисом хоста, как `WIDTH_CODE`
		 * у заглушки. Хост с окном и генератором кода без строки уронит проверку.
		 */
		const OFFSET_CODE: Record<string, string> = {
			vue: ':offset="40"',
			react: 'offset={40}',
			svelte: 'offset={40}',
			solid: 'offset={40}',
			webc: 'offset="40"',
		}

		/**
		 * Набор — в само поле строки, а не значением мимо контрола: проверяется
		 * преобразование текста. `10%` уходит строкой как есть, `40` — числом, и
		 * окно получает его пикселями.
		 */
		it.each(drawing('dialog'))(
			'%s: набранное в поле offset доходит до окна обеих колонок',
			async (framework) => {
				const wrapper = await openPage(framework, 'dialog')
				const row = rowOf(wrapper, 'offset')
				const field = row.find('.pg-prop__head > .so-field__control input')
				const tops = async () =>
					(await dialogPanels(row)).map((panel) =>
						panel.style.getPropertyValue('--so-dialog-offset-top'),
					)

				await field.setValue('10%')
				await nextTick()
				await nextFrame()

				expect(await tops()).toEqual(['10%', '10%'])

				await field.setValue('40')
				await nextTick()
				await nextFrame()

				expect(await tops()).toEqual(['40px', '40px'])

				// Пиксели окно получило бы и от строки '40' — число видно по коду
				// колонок: он учит задавать пиксели числом. Код пишет хост, у
				// которого есть генератор
				const [propCode, instanceCode] = rowComponentOf(wrapper, 'offset')
					.findAllComponents(CodeView)
					.map((view) => view.props('code'))

				if (hostOf(framework).snippets) {
					expect(propCode).toContain(OFFSET_CODE[framework])
					expect(instanceCode).toContain('instance.offset = 40')
				}
			},
		)

		/**
		 * Строка `error` — с пресетом `invalid`: набранный текст встаёт ошибкой на
		 * место подсказки. Стёртый — проп не задан: первая колонка его не передаёт,
		 * и поле берёт текст превью, а экземпляр второй — умолчание декларации.
		 * Обе обязаны вернуться к подсказке: текст ошибки в умолчаниях превью
		 * оставил бы первую на ошибке, а вторую — на подсказке.
		 */
		it.each(drawing('field'))(
			'%s: текст error встаёт у Field на место подсказки в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'field')
				const row = rowOf(wrapper, 'error')

				// Пресет доехал до обеих колонок: контрол помечен ошибкой сразу, а
				// пока текста ошибки нет, под ним подсказка
				expect(invalidMarks(row)).toEqual(['true', 'true'])
				expect(fieldNotes(row)).toEqual([['подсказка'], ['подсказка']])

				await enter(row, 'Нужен домен')
				expect(fieldNotes(row)).toEqual([['ошибка: Нужен домен'], ['ошибка: Нужен домен']])

				await enter(row, '')
				expect(fieldNotes(row)).toEqual([['подсказка'], ['подсказка']])
			},
		)

		it.each(drawing('field'))(
			'%s: invalid показывает у Field ошибку с текстом пресета в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'field')
				const row = rowOf(wrapper, 'invalid')

				expect(fieldNotes(row)).toEqual([['подсказка'], ['подсказка']])

				await enter(row, true)

				expect(fieldNotes(row)).toEqual([['ошибка: Нет @'], ['ошибка: Нет @']])
			},
		)

		it.each(drawing('field'))(
			'%s: соседние строки Field пресет не получают',
			async (framework) => {
				const wrapper = await openPage(framework, 'field')

				expect(invalidMarks(rowOf(wrapper, 'helper'))).toEqual([undefined, undefined])
			},
		)
	})

	/**
	 * Очищенное поле — «проп не задан», и колонки обязаны показывать одно.
	 *
	 * Первая колонка такой проп не передаёт, и связка возвращает свойство к
	 * умолчанию декларации (`TLine.reset`). Вторая пишет в экземпляр сама и
	 * писала туда `undefined` — значение вне типа свойства: у ProgressLinear
	 * шкала осталась бы без конца (`aria-valuemax="undefined"`). По случаю на
	 * каждую ветку записи: свойство компонента, коллекции и плагина.
	 */
	describe('очищенное поле', () => {
		/**
		 * Строка `max` — с пресетом `value: 40`, и по доле видно, куда встала
		 * шкала. Строка `value` для этой проверки не годится: умолчание доли —
		 * ноль, и `undefined`, записанный мимо правила, полоса рисует так же —
		 * пустой, с `aria-valuenow="0"`.
		 */
		it.each(drawing('progress-linear'))(
			'%s: возвращает умолчание — шкала ProgressLinear снова до 100 в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'progress-linear')
				const row = rowOf(wrapper, 'max')
				const scales = () =>
					row
						.findAll('.pg-col__stage .so-progress-linear')
						.map(
							(bar) =>
								`${bar.attributes('aria-valuenow')} из ${bar.attributes('aria-valuemax')}`,
						)

				await enter(row, 50)
				expect(scales()).toEqual(['40 из 50', '40 из 50'])

				await enter(row, undefined)
				expect(scales()).toEqual(['40 из 100', '40 из 100'])
			},
		)

		/**
		 * У `mode` фасадов умолчания нет: «не задано» его сеттер не принимает, и
		 * сбрасывать не к чему. Первая колонка режим оставляет — вторая тоже.
		 */
		it.each(drawing('list-box'))(
			'%s: без умолчания не пишет ничего — ListBox остаётся в multiple в обеих колонках',
			async (framework) => {
				const wrapper = await openPage(framework, 'list-box')
				const row = rowOf(wrapper, 'mode')

				await enter(row, 'multiple')
				await enter(row, undefined)

				expect(await selectedAfterTwoClicks(row)).toEqual([2, 2])
			},
		)

		/**
		 * Значим ключ умолчания, а не значение: `aria_label` объявлен с умолчанием
		 * `undefined`, и пишется оно, как любое другое. Проверка «умолчание не
		 * `undefined`» оставила бы плагину второй колонки прежнее имя.
		 */
		it.each(drawing('button'))(
			'%s: пишет и объявленное undefined — имя уходит из обеих колонок',
			async (framework) => {
				const wrapper = await openPage(framework, 'button')
				const row = rowOf(wrapper, 'aria_label')

				await enter(row, 'Закрыть')
				expect(ariaLabels(row)).toEqual(['Закрыть', 'Закрыть'])

				await enter(row, '')
				expect(ariaLabels(row)).toEqual([undefined, undefined])
			},
		)
	})

	/**
	 * Значение, которое превью задаёт компоненту само, — подпись кнопки, имя
	 * кольца — лежит в общих данных (`PREVIEW_PROPS`), а раздаёт его оболочка.
	 * Строка такого пропа открывается с ним, а в разметку колонок свой проп не
	 * кладёт. Пока значение лежало в разметке хоста, поле строки открывалось
	 * пустым при видимой подписи, стёртое — давало колонке пропа подпись превью, а
	 * экземпляру умолчание, и смена фреймворка возвращала экземпляру подпись
	 * превью поверх набранной: разметку рядом с `ctrl` сборка пишет при каждом
	 * монтировании.
	 *
	 * По случаю на ветку записи второй колонки: свойство компонента — экземпляру
	 * при создании, свойство плагина — плагину на `bundle:create`.
	 */
	describe('значение превью в строке', () => {
		const CASES = [
			{
				component: 'button',
				prop: 'text',
				preview: 'Кнопка',
				shown: buttonTexts,
				// Умолчание `text` — пустая строка: подписи нет
				cleared: '',
			},
			{
				component: 'progress-spinner',
				prop: 'aria_label',
				preview: 'Загрузка',
				shown: ringNames,
				// Умолчание доступного имени — не задано: атрибута нет
				cleared: undefined,
			},
		]

		const ROWS = CASES.flatMap((item) =>
			drawing(item.component).map((framework) => [framework, item.component, item] as const),
		)

		it.each(ROWS)(
			'%s/%s: строка открывается со значением превью — в поле и в обеих колонках',
			async (framework, component, { prop, preview, shown }) => {
				const row = rowOf(await openPage(framework, component), prop)

				expect(fieldText(row)).toBe(preview)
				expect(shown(row)).toEqual([preview, preview])
				expect(firstLines()).toEqual([])
			},
		)

		it.each(ROWS)(
			'%s/%s: набранное и стёртое — одно в обеих колонках',
			async (framework, component, { prop, shown, cleared }) => {
				const wrapper = await openPage(framework, component)

				await enter(rowOf(wrapper, prop), 'Набранное')
				expect(shown(rowOf(wrapper, prop))).toEqual(['Набранное', 'Набранное'])

				await enter(rowOf(wrapper, prop), '')
				expect(shown(rowOf(wrapper, prop))).toEqual([cleared, cleared])
			},
		)

		/**
		 * Строка и экземпляр живут в оболочке, и хост нового фреймворка рисует
		 * вторую колонку тем же экземпляром. Его сборка пишет экземпляру разметку
		 * превью — значения превью там больше нет, и набранное остаётся. Переход —
		 * с первого другого фреймворка, у которого компонент есть.
		 */
		const SWITCHES = ROWS.flatMap(([framework, component, item]) => {
			const from = IDS.find((other) => other !== framework && draws(other, component))

			return from ? [[framework, component, from, item] as const] : []
		})

		it.each(SWITCHES)(
			'%s/%s: набранное переживает переход на фреймворк — с %s, обе колонки',
			async (framework, component, from, { prop, shown }) => {
				const wrapper = await openPage(from, component)

				await enter(rowOf(wrapper, prop), 'Набранное')

				await wrapper.setProps({ framework })
				await nextTick()
				await nextFrame()

				expect(shown(rowOf(wrapper, prop))).toEqual(['Набранное', 'Набранное'])
				expect(firstLines()).toEqual([])
			},
		)

		/**
		 * Коллекционного пропа среди значений превью нет, а путь у него свой —
		 * конструктор фасада второй колонки. Проверяется он строкой со значением
		 * превью, подложенным в её контрол: `mode` списка — сразу множественный в
		 * обеих колонках.
		 */
		it.each(drawing('list-box'))(
			'%s: значение превью свойства коллекции фасад получает при создании',
			async (framework) => {
				const entry = findComponent('list-box')
				const control = entry
					? propControls(entry).collectionControls.find(({ name }) => name === 'mode')
					: undefined

				if (!entry || !control) throw new Error('нет строки mode у ListBox')

				const row = track(
					mount(PropRow, {
						...mountOptions,
						props: {
							entry,
							control: { ...control, initial: 'multiple' },
							host: hostOf(framework),
							sink: () => () => {},
						},
					}),
				)

				await nextTick()
				await nextFrame()

				expect(await selectedAfterTwoClicks(row.find('.pg-prop'))).toEqual([2, 2])
			},
		)
	})

	/**
	 * Набранное в поле «число или текст» уходит в код тем же значением, что и
	 * компоненту: `40` — числом, `10%` — строкой. По превью их не отличить —
	 * ширину в пикселях заглушка получила бы и от строки `'40'`, — а код учит
	 * задавать пиксели числом. Заглушка — у всех хостов стенда, и проверка идёт
	 * на каждом, у которого есть генератор кода. У хоста без генератора блоков
	 * кода нет вовсе (Angular).
	 */
	describe('код колонок', () => {
		const coded = drawing('skeleton').filter((framework) => hostOf(framework).snippets)

		it.each(coded)(
			'%s: набранное в поле — в коде обеих колонок синтаксисом хоста',
			async (framework) => {
				const expected = WIDTH_CODE[framework]
				const wrapper = await openPage(framework, 'skeleton')
				const field = rowOf(wrapper, 'width').find(
					'.pg-prop__head > .so-field__control input',
				)
				const views = () => rowComponentOf(wrapper, 'width').findAllComponents(CodeView)
				const codes = () => views().map((view) => view.props('code'))

				expect(views().map((view) => view.props('extension'))).toEqual([
					expected.extension,
					expected.extension,
				])

				await field.setValue('40')
				await nextTick()

				expect(codes()[0]).toContain(expected.number)
				expect(codes()[1]).toContain('instance.width = 40')

				await field.setValue('10%')
				await nextTick()

				expect(codes()[0]).toContain(expected.text)
				expect(codes()[1]).toContain("instance.width = '10%'")
			},
		)

		it.each(drawing('skeleton').filter((framework) => !coded.includes(framework)))(
			'%s: генератора кода нет — у колонок нет блоков кода',
			async (framework) => {
				const wrapper = await openPage(framework, 'skeleton')

				expect(rowComponentOf(wrapper, 'width').findAllComponents(CodeView)).toHaveLength(0)
				expect(firstLines()).toEqual([])
			},
		)
	})
}
