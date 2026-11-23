/**
 * Серверный рендер компонентов Svelte: компоненты собраны для сервера, рисует
 * их `render` из `svelte/server` — как сервер приложения.
 *
 * Состояние на сервере приходит той же подпиской на связку, что и в браузере,
 * а эффекты не выполняются вовсе. Поэтому разметка сервера — это ровно то, что
 * компонент рисует с первой отрисовки: наборы ядра, классы и раскладка, — а
 * телепорта Frame нет, как у React: содержимое в цели появляется после
 * гидратации.
 *
 * Гидратацию разметки сервера — части поля даты, панель с `contained`, стиль
 * корня и текст поля — проверяет прогон гидратации (`hydration/`).
 */

import { describe, it, expect } from 'vitest'
import { createRawSnippet } from 'svelte'
import { createAttachmentKey } from 'svelte/attachments'
import { render } from 'svelte/server'
import type { TAriaAttributes } from '@soxa-ui/core'
import {
	Button,
	CheckBox,
	DateInput,
	DatePicker,
	Dialog,
	AlertDialog,
	Drawer,
	Frame,
	Icon,
	Input,
	NumberInput,
	Popover,
	ProgressLinear,
	ProgressSpinner,
	Rating,
	Scroller,
	Separator,
	Skeleton,
	Slider,
	Textarea,
	Toasts,
	Tooltip,
	roleIcon,
} from '@soxa-ui/svelte'
import RootRef, { type TRootKind } from './RootRef.test.svelte'

/** Содержимое панели. */
const content = createRawSnippet(() => ({ render: () => '<span>Панель</span>' }))

/**
 * Триггер поповера и подсказки: кнопка, которая печатает ссылки из scope —
 * так видно, что сторона связки дошла до серверной разметки.
 */
const trigger = createRawSnippet((scope: () => { triggerAria: TAriaAttributes }) => ({
	render: () => {
		const aria = scope().triggerAria
		const link = aria['aria-controls'] ?? aria['aria-describedby'] ?? ''

		return `<button data-link="${link}">Открыть</button>`
	},
}))

/**
 * Разметка сервера без комментариев: в них Svelte пишет метки гидратации
 * блоков и id монтирования (`<!--$s1-->`), а проверяется сама разметка.
 */
const markup = (body: string) => body.replace(/<!--[\s\S]*?-->/g, '')

describe('Frame · серверный рендер', () => {
	it('без contained — пусто: телепорта на сервере нет', () => {
		const body = markup(render(Frame, { props: { visible: true, children: content } }).body)

		expect(body).toBe('')
	})

	it('contained — на месте, вместе с содержимым и раскладкой', () => {
		const body = markup(
			render(Frame, { props: { contained: true, visible: true, children: content } }).body,
		)

		expect(body).toMatch(/^<div [^>]*class="so-frame"/)
		expect(body).toContain('data-contained="true"')
		// Внутри контейнера — `absolute` без координат: место решает тема. Номера
		// слоя на сервере нет: его открывает узел, а счётчик у сервера свой
		expect(body).toMatch(/style="position: absolute; [^"]*z-index: 0"/)
		expect(body).not.toContain('data-layer')
		expect(body).not.toMatch(/style="[^"]*\b(left|top):/)
		expect(body).toContain('<span>Панель</span>')
	})
})

/**
 * Оверлеи на сервере: телепорта там нет, как у Frame, — панель, окно и регион
 * тостов появляются после гидратации. Что стоит на месте, сервер рисует:
 * корень поповера и подсказки с триггером, панель поповера и выезжающую
 * панель с `contained`, приложение под менеджером тостов.
 */
describe('оверлеи · серверный рендер', () => {
	it('Popover — корень с триггером и его связкой, панели нет', () => {
		const body = markup(render(Popover, { props: { trigger, children: content } }).body)

		expect(body).toMatch(/^<span [^>]*class="so-popover"/)
		expect(body).toMatch(/<button data-link="[^"]+-panel">Открыть<\/button><\/span>$/)
		expect(body).not.toContain('so-popover__panel')
		expect(body).not.toContain('<span>Панель</span>')
	})

	it('Popover с contained — панель в корне, вместе с содержимым', () => {
		const body = markup(
			render(Popover, { props: { trigger, children: content, contained: true } }).body,
		)

		expect(body).toMatch(/^<span [^>]*class="so-popover"/)
		expect(body).toMatch(/<div [^>]*class="so-frame so-popover__panel"/)
		expect(body).toContain('data-contained="true"')
		expect(body).toContain('role="dialog"')
		expect(body).toContain('<span>Панель</span>')
	})

	it('Tooltip — корень с триггером и ссылкой на панель, панели нет', () => {
		const body = markup(render(Tooltip, { props: { trigger, children: content } }).body)

		expect(body).toMatch(/^<span [^>]*class="so-tooltip"/)
		expect(body).toMatch(/<button data-link="[^"]+">Открыть<\/button><\/span>$/)
		expect(body).not.toContain('so-tooltip__panel')
	})

	it('AlertDialog omits the server portal', () => {
		expect(markup(render(AlertDialog, { props: { visible: true } }).body)).toBe('')
	})

	it('Dialog — пусто: телепорта на сервере нет', () => {
		const body = markup(render(Dialog, { props: { visible: true, children: content } }).body)

		expect(body).toBe('')
	})

	it('Drawer — пусто, а с contained — подложка и панель на месте', () => {
		const teleported = markup(render(Drawer, { props: { children: content } }).body)
		const contained = markup(
			render(Drawer, { props: { contained: true, children: content } }).body,
		)

		expect(teleported).toBe('')
		expect(contained).toMatch(
			/^<div class="so-backdrop so-drawer__backdrop" style="[^"]*display: none"[^>]*><\/div><div [^>]*role="dialog"/,
		)
		expect(contained).toContain('class="so-drawer so-drawer--placement-end"')
		expect(contained).toContain('<div class="so-drawer__body"><span>Панель</span></div>')
	})

	/**
	 * Номер слоя выдаёт счётчик процесса, и у сервера он свой: попади он в
	 * разметку, гидратация с браузером не сошлась бы. Открывает номер узел, а на
	 * сервере узла нет — у открытой панели и её подложки номера нет, `z-index` — 0.
	 */
	it('Drawer с contained, открытый, — без номера слоя у панели и подложки', () => {
		const body = markup(
			render(Drawer, { props: { contained: true, visible: true, children: content } }).body,
		)

		expect(body.match(/data-open="true"/g)).toHaveLength(2)
		expect(body).not.toContain('data-layer')
		expect(body.match(/z-index: 0\b/g)).toHaveLength(2)
	})

	it('Toasts — приложение без региона', () => {
		const body = markup(render(Toasts, { props: { children: content } }).body)

		expect(body).toBe('<span>Панель</span>')
	})
})

/**
 * Поле даты и DatePicker на сервере. Части сервер рисует нередактируемыми, с
 * `id` от `$props.id()` и текстом ядра содержимым узла: в браузере текст части
 * пишет `TextSpan` свойством `textContent`, а на сервере attachment-ов нет.
 * Панели DatePicker на сервере нет, как у всех оверлеев: сервер рисует его
 * полем с кнопкой календаря, а панель с календарём появляется в браузере.
 */
describe('DateInput и DatePicker · серверный рендер', () => {
	/** Части поля по порядку — с открывающим тегом и текстом. */
	const segmentsOf = (body: string) =>
		body.match(/<span class="so-date-input__segment"[^>]*>[^<]*<\/span>/g) ?? []

	/** Тип части — по её `data-type`. */
	const typeOf = (segment: string) => /data-type="([^"]+)"/.exec(segment)?.[1]

	it('DateInput — группа, части с id и текстом, нередактируемые; значение — в скрытом поле', () => {
		const body = markup(
			render(DateInput, { props: { value: '2026-05-12', name: 'birthday' } }).body,
		)
		const segments = segmentsOf(body)

		expect(body).toMatch(/^<div [^>]*role="group"[^>]*class="so-date-input /)
		// en-US: месяц, день, год — по `formatToParts`
		expect(segments.map(typeOf)).toEqual(['month', 'day', 'year'])
		expect(segments.map((segment) => />([^<]*)<\/span>$/.exec(segment)?.[1])).toEqual([
			'05',
			'12',
			'2026',
		])
		expect(
			segments.every((segment) => new RegExp(`id="[^"]+-${typeOf(segment)}"`).test(segment)),
		).toBe(true)
		expect(segments.every((segment) => segment.includes('role="spinbutton"'))).toBe(true)
		expect(body).not.toContain('contenteditable')
		expect(body).not.toContain('inputmode')
		expect(body).toMatch(/<span class="so-date-input__literal" aria-hidden="true">\/<\/span>/)
		expect(body).toMatch(/<input type="hidden" name="birthday" value="2026-05-12"\/?>/)
		// Ряд — дата с разделителями, без текста между частями
		expect(
			/<span class="so-date-input__segments"[^>]*>([\s\S]*?)<\/span><input/
				.exec(body)?.[1]
				?.replace(/<[^>]*>/g, ''),
		).toBe('05/12/2026')
	})

	it('DatePicker — поле и кнопка календаря со связкой, панели и календаря нет', () => {
		const body = markup(render(DatePicker, { props: { value: '2026-09-10' } }).body)
		const [, controls] = /aria-controls="([^"]+)"/.exec(body) ?? []

		expect(body).toMatch(/^<div [^>]*class="so-date-picker /)
		expect(body).toMatch(
			/<div role="group"[^>]*class="so-date-input [^"]*so-date-picker__field/,
		)
		expect(body).toMatch(/<button [^>]*class="[^"]*so-date-picker__trigger[^"]*"/)
		expect(body).toContain('aria-haspopup="dialog"')
		expect(body).toContain('aria-expanded="false"')
		expect(body).toContain('data-selected="false"')
		// The browser connects the trigger only after its popup mounts.
		expect(controls).toBeUndefined()
		expect(body).not.toContain(`id="${controls}"`)
		expect(body).not.toContain('so-date-picker__panel')
		expect(body).not.toContain('so-calendar')
		expect(body).toContain('value="2026-09-10"')
	})

	it('DatePicker с диапазоном — корень-группа, поля концов названы', () => {
		const body = markup(
			render(DatePicker, { props: { mode: 'range', aria_label: 'Поездка' } }).body,
		)

		expect(body).toMatch(/^<div [^>]*role="group"/)
		expect(body).toMatch(/^<div [^>]*aria-label="Поездка"/)
		expect(body).toMatch(/class="so-date-input [^"]*so-date-picker__start/)
		expect(body).toContain('aria-label="Start date"')
		expect(body).toContain('aria-label="End date"')
		expect(body).toContain('<span class="so-date-picker__dash" aria-hidden="true">–</span>')
	})
})

describe('Button · серверный рендер', () => {
	it('классы ядра и потребителя, наборы и текст', () => {
		const body = markup(
			render(Button, {
				props: { text: 'Сохранить', size: 'lg', variant: 'brand', class: 'app-save' },
			}).body,
		)

		expect(body).toMatch(/^<button /)
		expect(body).toContain(
			'class="so-button so-button--size-lg so-button--variant-brand app-save"',
		)
		expect(body).toContain('data-disabled="false"')
		expect(body).toContain('<span class="so-button__text">Сохранить</span>')
	})

	it('выключенная: нативный disabled на <button>, aria-disabled — на другом теге', () => {
		const native = markup(render(Button, { props: { disabled: true } }).body)
		const link = markup(render(Button, { props: { tag: 'a', disabled: true } }).body)

		expect(native).toMatch(/^<button [^>]*\bdisabled\b/)
		expect(native).toContain('data-disabled="true"')
		expect(link).toMatch(/^<a [^>]*aria-disabled="true"/)
		expect(link).not.toMatch(/^<a [^>]* disabled/)
	})

	it('скрытая — display: none в стиле корня', () => {
		const body = markup(render(Button, { props: { visible: false } }).body)

		expect(body).toMatch(/^<button [^>]*style="display: none"/)
	})

	/**
	 * В браузере стиль корня ставит attachment по свойствам, а на сервере
	 * attachment-ов нет: стиль уходит строкой атрибута, слои — в том же порядке.
	 */
	it('стиль потребителя — строкой, поверх него display: none скрытой', () => {
		const body = markup(render(Button, { props: { visible: false, style: 'color: red' } }).body)

		expect(body).toMatch(/^<button [^>]*style="color: red; display: none"/)
	})

	/** Attachment едет в атрибутах корня и на сервере, но узла там нет: он ждёт браузера. */
	it('attachment потребителя не выполняется и разметку не меняет', () => {
		const nodes: Element[] = []
		const attach = (node: Element) => {
			nodes.push(node)
		}
		const plain = markup(render(Button, { props: { text: 'Сохранить' } }).body)
		const attached = markup(
			render(Button, { props: { text: 'Сохранить', [createAttachmentKey()]: attach } }).body,
		)

		expect(attached).toBe(plain)
		expect(nodes).toHaveLength(0)
	})
})

describe('стиль и наборы на сервере', () => {
	it('Icon по роли — <svg> иконки с размером и скрытием от скринридера', () => {
		const body = markup(render(Icon, { props: { tag: roleIcon('check'), width: 20 } }).body)

		expect(body).toMatch(/^<svg [^>]*class="so-icon so-icon--size-normal"/)
		expect(body).toContain('aria-hidden="true"')
		expect(body).toContain('style="width: 20px"')
		expect(body).toContain('<path')
	})

	it('ProgressSpinner — доля в стиле корня, роль и значения', () => {
		const body = markup(render(ProgressSpinner, { props: { value: 40 } }).body)

		expect(body).toMatch(/^<span [^>]*role="progressbar"/)
		expect(body).toContain('aria-valuenow="40"')
		expect(body).toContain('style="--so-progress-spinner-fraction: 0.4"')
	})

	it('ProgressSpinner — стиль потребителя поверх доли', () => {
		const body = markup(
			render(ProgressSpinner, { props: { value: 40, style: 'color: red' } }).body,
		)

		expect(body).toContain('style="--so-progress-spinner-fraction: 0.4; color: red"')
	})

	it('ProgressLinear — доля процентом в стиле корня, роль и значения', () => {
		const body = markup(render(ProgressLinear, { props: { value: 40 } }).body)

		expect(body).toMatch(/^<span [^>]*role="progressbar"/)
		expect(body).toContain('aria-valuenow="40"')
		expect(body).toContain('style="--so-progress-linear-percent: 40%"')
		expect(body).toContain('<span class="so-progress-linear__range"></span>')
	})

	it('Rating — звёзды с долей заливки и поле со значением, как оно звучит', () => {
		const body = markup(render(Rating, { props: { value: 2, max: 3, name: 'score' } }).body)
		const stars = [...body.matchAll(/class="so-rating__star" style="([^"]*)"/g)]

		expect(body).toMatch(/^<span [^>]*class="so-rating so-rating--size-normal"/)
		expect(stars.map(([, style]) => style)).toEqual([
			'--so-rating-fraction: 1',
			'--so-rating-fraction: 1',
			'--so-rating-fraction: 0',
		])
		// Значок по умолчанию — svg роли в обоих слоях каждой звезды
		expect(body.match(/<svg class="so-rating__icon"/g)).toHaveLength(6)
		expect(body).toMatch(
			/<input class="so-rating__input" type="range" min="0" max="3" step="1" value="2" name="score" [^>]*aria-valuetext="2 of 3"/,
		)
	})

	it('Slider — ручки с позицией, поля с ходом и значением, заливка и подсказка', () => {
		const body = markup(render(Slider, { props: { value: [20, 70], tooltip: 'always' } }).body)
		const thumbs = [...body.matchAll(/class="so-slider__thumb" style="([^"]*)"/g)]
		const fields = [...body.matchAll(/<input class="so-slider__input" ([^>]*)\/>/g)]
		const tooltips = [...body.matchAll(/<span class="so-slider__tooltip"[^>]*>([^<]*)</g)]

		expect(body).toMatch(/^<span role="group" /)
		expect(body).toContain('style="--so-slider-range-start: 20%; --so-slider-range-end: 70%"')
		expect(thumbs.map(([, style]) => style)).toEqual([
			'--so-slider-position: 20%',
			'--so-slider-position: 70%',
		])
		// Ход поля — соседи: у первой ручки до второй, у второй — от первой
		expect(
			fields.map(([, attrs]) =>
				/min="(\d+)" max="(\d+)" step="1" value="(\d+)"/.exec(attrs)?.slice(1),
			),
		).toEqual([
			['0', '70', '20'],
			['20', '100', '70'],
		])
		expect(tooltips.map(([, text]) => text)).toEqual(['20', '70'])
	})

	it('Scroller — кнопки с именами и значками, вьюпорт с содержимым', () => {
		const body = markup(render(Scroller, { props: { children: content } }).body)

		expect(body).toMatch(/^<div [^>]*data-can-prev="false" data-can-next="false"/)
		expect(body).toMatch(/<button [^>]*so-scroller__prev" aria-label="Scroll back"/)
		expect(body).toMatch(/<button [^>]*so-scroller__next" aria-label="Scroll forward"/)
		expect(body.match(/<svg aria-hidden="true" class="so-icon /g)).toHaveLength(2)
		expect(body).toContain('<div class="so-scroller__viewport"><span>Панель</span></div>')
	})

	it('Skeleton — заглушка и содержимое, корень не скрыт', () => {
		const body = markup(render(Skeleton, { props: { children: content } }).body)

		expect(body).toContain('<div class="so-skeleton__placeholder" aria-hidden="true"></div>')
		expect(body).toContain('aria-busy="true"')
		expect(body).toContain('<span>Панель</span>')
		expect(body).not.toContain('display: none')
	})
})

/**
 * Связываемый `ref` пишет attachment корня, а на сервере attachment-ов нет:
 * `ref` не пишется вовсе, и в разметку он не попадает — компонент берёт его
 * из `$props()` сам, мимо атрибутов корня.
 */
describe('ref потребителя · серверный рендер', () => {
	const KINDS: readonly TRootKind[] = [
		'Button',
		'ComponentView',
		'Field',
		'Frame',
		'Icon',
		'Label',
		'ProgressSpinner',
		'ProgressLinear',
		'Skeleton',
		'Input',
		'NumberInput',
		'Textarea',
		'CheckBox',
		'Switch',
		'Slider',
		'Rating',
		'Tabs',
		'Tabs.Item',
		'Tabs.Content',
		'Accordion',
		'Accordion.Item',
		'RadioGroup',
		'RadioGroup.Item',
		'ListBox',
		'ListBox.Item',
		'Tags',
		'Tags.Item',
		'Select',
		'Select.Item',
		'Table',
		'Scroller',
		'Pagination',
		'Popover',
		'Tooltip',
		'Menu',
		'Menu.Item',
		'Menu.CheckboxItem',
		'Menu.RadioItem',
		'Menu.Submenu',
		'Menu.PopoverItem',
		'Menu.Group',
		'Menu.RadioGroup',
		'Menu.Separator',
		'Dialog',
		'Drawer',
		'Toasts',
	]

	it.each(KINDS)('%s: bind:ref не пишется, ref в разметке нет', (kind) => {
		const nodes: (Element | null)[] = []
		const body = markup(
			render(RootRef, { props: { kind, onRef: (node) => nodes.push(node) } }).body,
		)

		expect(nodes).toHaveLength(0)
		expect(body).not.toMatch(/\sref=/)
	})

	it('проп ref разметку не меняет — у кнопки и у полей', () => {
		const pairs = [
			[render(Button, { props: { ref: null } }), render(Button, { props: {} })],
			[render(Input, { props: { ref: null } }), render(Input, { props: {} })],
			[
				render(NumberInput, { props: { ref: null, value: 5, clearable: true } }),
				render(NumberInput, { props: { value: 5, clearable: true } }),
			],
			[
				render(Textarea, { props: { ref: null, value: 'текст', counter: true } }),
				render(Textarea, { props: { value: 'текст', counter: true } }),
			],
			[render(CheckBox, { props: { ref: null } }), render(CheckBox, { props: {} })],
		]

		for (const [withRef, without] of pairs) {
			expect(markup(withRef.body)).toBe(markup(without.body))
		}
	})
})

it('renders separator semantics on the server in both modes', () => {
	const semantic = markup(render(Separator, { props: { orientation: 'vertical' } }).body)
	const decorative = markup(render(Separator, { props: { decorative: true } }).body)

	expect(semantic).toContain('role="separator"')
	expect(semantic).toContain('aria-orientation="vertical"')
	expect(decorative).toContain('role="none"')
	expect(decorative).not.toContain('aria-orientation')
})
