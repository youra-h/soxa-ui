/**
 * Общее у дымовых спеков стенда: хуки страницы и консоли, монтирование
 * страницы и чтение её строк и колонок. Проверки — `suite.ts` (по
 * фреймворку) и `common.spec.ts` (между фреймворками).
 *
 * Компонент рисует хост фреймворка в своём корне, поэтому внутрь превью тест
 * смотрит по DOM: дерево компонентов оболочки корня хоста не видит.
 */

import { beforeAll, beforeEach, afterEach, vi } from 'vitest'
import { mount, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { useIcons } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { propControls } from '@soxa-ui/playground-shared'
import { FRAMEWORKS, hostOf, loadHost } from '../../src/hosts'
import { router } from '../../src/router'
import ComponentPage from '../../src/views/ComponentPage.vue'
import PropControl from '../../src/components/PropControl.vue'
import PropRow from '../../src/components/PropRow.vue'

export const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

/**
 * Хосты — загрузчиком, как их грузит роутер: мимо загрузчика оболочка хост
 * не импортирует, и тест тоже. Все, а не только свой: проверки перехода
 * между фреймворками рисуют страницу и чужим хостом.
 */
await Promise.all(FRAMEWORKS.map(({ id }) => loadHost(id)))

export const IDS = FRAMEWORKS.map(({ id }) => id)

/**
 * Предупреждения и ошибки в консоли.
 *
 * Стенд — единственное место, где компоненты рисуются всеми пропами разом, и
 * поэтому единственное, где такие предупреждения вообще всплывают. Первый же
 * запуск дал «emitted event "update:anchor_anchor" but it is neither declared
 * in the emits option»: `useEmits` перечислял только собственные пропы, а
 * `useAdapter` эмитил `update:` и по плагинным.
 *
 * Ошибка тихая — в консоли, но не в тестах. Поэтому здесь она превращается в
 * падение: любое предупреждение при отрисовке страницы означает, что контракт
 * компонента и его проводка разошлись. Vue пишет их в `console.warn`, React —
 * в `console.error`: ловятся оба.
 */
const warnings: string[] = []

/** Смонтированная страница теста — снимается после теста, даже упавшего. */
let page: VueWrapper | undefined

/** Хуки файла спека: иконки, консоль, роутер и снятие страницы после теста. */
export function useSmokeHooks(): void {
	beforeAll(async () => {
		useIcons(material)
		// Компоненты пишут в консоль события — в отчёте это шум
		vi.spyOn(console, 'log').mockImplementation(() => {})

		for (const method of ['warn', 'error'] as const) {
			vi.spyOn(console, method).mockImplementation((...args) => {
				warnings.push(args.map(String).join(' '))
			})
		}

		router.push('/')
		await router.isReady()
	})

	beforeEach(() => {
		warnings.length = 0
	})

	afterEach(() => {
		page?.unmount()
		page = undefined
	})
}

/** Страница теста: её снимет хук после теста. */
export function track<T extends VueWrapper>(wrapper: T): T {
	page = wrapper

	return wrapper
}

/** Первая строка предупреждения: дальше идёт дерево компонентов, оно шумит. */
export function firstLines(): string[] {
	return warnings.map((text) => text.split('\n')[0])
}

export const mountOptions = { global: { plugins: [router] }, attachTo: document.body }

/**
 * Страница компонента фреймворка. Часть проводки включается кадром позже:
 * `TElementPlugin` отдаёт узел через requestAnimationFrame, и только тогда
 * плагины вроде якоря Frame получают элемент и эмитят свои `update:`. Без
 * ожидания проверка предупреждений была бы вакуумной — до эмита тест не
 * доживал.
 */
export async function openPage(framework: string, id: string): Promise<VueWrapper> {
	const wrapper = track(mount(ComponentPage, { ...mountOptions, props: { framework, id } }))

	await nextTick()
	await nextFrame()

	return wrapper
}

/** Строка страницы по имени пропа; без неё проверять нечего. */
export function rowOf(wrapper: VueWrapper, name: string) {
	const found = wrapper
		.findAll('.pg-prop')
		.find((row) => row.find('.pg-prop__name').text() === name)

	if (!found) throw new Error(`нет строки ${name}`)

	return found
}

/** Строка компонентом — оболочки: по ней видно, что строка пережила перерисовку. */
export function rowComponentOf(wrapper: VueWrapper, name: string) {
	const found = wrapper
		.findAllComponents(PropRow)
		.find((row) => row.props('control').name === name)

	if (!found) throw new Error(`нет строки ${name}`)

	return found
}

/**
 * Значение — через контрол строки, тем же, что отдаёт он сам, — как клик
 * пользователя. Отрисовку Select и Input проверяют их собственные тесты.
 * Стёртое числовое поле и снятый выбор списка дают `undefined`, стёртое
 * текстовое — `''`.
 */
export async function enter(row: DOMWrapper<Element>, value: unknown): Promise<void> {
	const control = row.findComponent(PropControl)

	if (!control.exists()) throw new Error('у строки нет контрола')

	control.vm.$emit('update:modelValue', value)
	await nextTick()
	await nextFrame()
}

/** Сцены колонок строки: в первой — пропы, во второй — экземпляр. */
export const stagesOf = (row: DOMWrapper<Element>) => row.findAll('.pg-col__stage')

/**
 * Клики по двум разным элементам в каждой колонке строки ListBox — те же, что
 * в проверке строки `mode`. Результат — число выбранных по колонкам, а не общий
 * счёт по строке: упавшая проверка сразу показывает, в какой колонке режим не
 * доехал. Два выбранных — признак `multiple`: у ListBox режим в DOM не выведен.
 *
 * Выбор после клика рисует фреймворк превью на своём такте: Vue — к
 * `nextTick`, а Angular без Zone.js проверяет приложение по своему
 * планировщику, к кадру.
 */
export async function selectedAfterTwoClicks(row: DOMWrapper<Element>): Promise<number[]> {
	const stages = stagesOf(row)

	for (const stage of stages) {
		const items = stage.findAll('.so-list-box-item .so-button')

		await items[0].trigger('click')
		await items[1].trigger('click')
	}

	await nextTick()
	await nextFrame()

	return stages.map((stage) => stage.findAll('.so-list-box-item[data-selected="true"]').length)
}

/** Имя кнопки в каждой колонке строки. */
export const ariaLabels = (row: DOMWrapper<Element>) =>
	row.findAll('.pg-col__stage .so-button').map((button) => button.attributes('aria-label'))

/** Подпись кнопки в каждой колонке строки. */
export const buttonTexts = (row: DOMWrapper<Element>) =>
	stagesOf(row).map((stage) => stage.get('.so-button').text())

/** Имя кольца в каждой колонке строки. */
export const ringNames = (row: DOMWrapper<Element>) =>
	stagesOf(row).map((stage) => stage.get('.so-progress-spinner').attributes('aria-label'))

/** Текст в поле строки — то, что человек видит в редакторе пропа. */
export function fieldText(row: DOMWrapper<Element>): string {
	const field = row.get('.pg-prop__head > .so-field__control input').element

	if (!(field instanceof HTMLInputElement)) throw new Error('у строки нет поля ввода')

	return field.value
}

/**
 * Lists rows where Field fails to associate its label or help text with the editor.
 * The expected description comes from the prop metadata so missing help text is detected.
 */
export function unlinkedHeads(wrapper: VueWrapper): string[] {
	return wrapper.findAllComponents(PropRow).flatMap((row) => {
		const { name, description, kind } = row.props('control')
		const editorTag = kind === 'json' ? 'textarea' : 'input'
		const editor = row.get(`.pg-prop__head > .so-field__control ${editorTag}`).element
		const target = row.get('.pg-prop__head > .so-field__label').attributes('for')
		const helper = row.find('.pg-prop__head > .so-field__helper')
		const described = editor.getAttribute('aria-describedby')?.split(/\s+/) ?? []
		const labelled = editor.id !== '' && target === editor.id
		const explained =
			description === '' || (helper.exists() && described.includes(helper.element.id))

		return [
			...(labelled ? [] : [`${name}: подпись не ведёт на поле`]),
			...(explained ? [] : [`${name}: описания нет в aria-describedby поля`]),
		]
	})
}

/**
 * Что стоит под контролом поля в каждой колонке строки: подсказка или ошибка
 * со своим текстом. Видна одна из двух — ошибка встаёт на место подсказки, — а
 * список по колонке покажет и обе сразу, и ни одной.
 */
export const fieldNotes = (row: DOMWrapper<Element>) =>
	stagesOf(row).map((stage) => [
		...stage.findAll('.so-field__helper').map(() => 'подсказка'),
		...stage.findAll('.so-field__error-text').map((error) => `ошибка: ${error.text()}`),
	])

/** Отметка ошибки у контрола поля в каждой колонке строки — `aria-invalid` его `<input>`. */
export const invalidMarks = (row: DOMWrapper<Element>) =>
	stagesOf(row).map((stage) => stage.get('.so-field__control input').attributes('aria-invalid'))

/**
 * Панели окон строки по колонкам. Окно телепортировано в `body` из корня хоста,
 * и ни в DOM строки, ни в дереве её компонентов его нет. Панель колонки — та,
 * что открыла её кнопка: после нажатия видна ровно она. Закрывает её «Отмена»
 * в подвале — следующая колонка открывает свою.
 *
 * После нажатия — кадр: открытость — своё состояние превью, и хост Angular
 * перепроверяет его на такте приложения, задачей после нажатия, а не
 * микрозадачей, как остальные хосты.
 */
export async function dialogPanels(row: DOMWrapper<Element>): Promise<HTMLElement[]> {
	const panels: HTMLElement[] = []

	for (const stage of stagesOf(row)) {
		await stage.get('.so-button').trigger('click')
		await nextTick()
		await nextFrame()

		const open = [...document.querySelectorAll('.so-dialog')].filter(
			(panel): panel is HTMLElement =>
				panel instanceof HTMLElement && panel.style.display !== 'none',
		)

		if (open.length !== 1) throw new Error(`открытых окон ${open.length}, а не одно`)

		const cancel = [...open[0].querySelectorAll('.so-button')].find(
			(button) => button.textContent?.trim() === 'Отмена',
		)

		if (!(cancel instanceof HTMLElement)) throw new Error('в окне нет кнопки «Отмена»')

		panels.push(open[0])
		cancel.click()
		await nextTick()
		await nextFrame()
	}

	return panels
}

/**
 * Узел, на который ссылается `aria-controls` узла колонки: панель меню у его
 * кнопки, список Select у его поля. Оба телепортированы в `body` из корня
 * хоста, и в DOM строки их нет, а ссылка ведёт на свой: `id` у каждого превью
 * свои. Панель и список в документе и у закрытого компонента — открывать его
 * не нужно.
 */
export function controlledBy(stage: DOMWrapper<Element>, selector: string): Element {
	const id = stage.get(selector).attributes('aria-controls')
	const controlled = id ? document.getElementById(id) : null

	if (!controlled) throw new Error(`${selector}: узла по aria-controls нет`)

	return controlled
}

/** Секции групп в узле: `[групп, разделителей]`. */
export const sectionsIn = (node: Element, group: string, separator: string) => [
	node.querySelectorAll(group).length,
	node.querySelectorAll(separator).length,
]

/** Страница без строк: ни одного пропа ни в одной группе. */
export function rowless(entry: Parameters<typeof propControls>[0]): boolean {
	const { componentControls, collectionControls, pluginControls } = propControls(entry)

	return componentControls.length + collectionControls.length + pluginControls.length === 0
}

/** Рисует ли хост фреймворка все эти компоненты. */
export const draws = (framework: string, ...components: string[]) =>
	components.every((component) => hostOf(framework).previews.includes(component))
