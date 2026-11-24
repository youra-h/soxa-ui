/**
 * Scroller во Vue — проводка на настоящей разметке.
 *
 * Модель проверяет ядро, счёт краёв — тест плагина, раскладку и листание —
 * `playground/vue/browser/scroller.spec.ts`: в jsdom у вьюпорта нет ни
 * ширины, ни прокрутки. Здесь важно, что состав, состояния и наборы доезжают
 * туда, куда должны: `data-*` на корень, роль потребителя и `tabindex` — на
 * вьюпорт, выключенность — на кнопки.
 */

import { describe, it, expect, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { renderToString } from 'vue/server-renderer'
import { defineComponent, h, nextTick, ref, type VNode } from 'vue'
import { LocaleProvider, Scroller } from '@soxa-ui/vue'
import { TScroller } from '@soxa-ui/core'
import { enUS, extendLocale, ruRU } from '@soxa-ui/plugins'

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve))

let wrapper: ReturnType<typeof mount> | null = null

afterEach(() => {
	wrapper?.unmount()
	wrapper = null
	document.body.innerHTML = ''
})

/** Смонтировать и дождаться кадра: корень плагины получают через `requestAnimationFrame`. */
async function render(content: () => VNode): Promise<void> {
	wrapper = mount(defineComponent({ render: content }), { attachTo: document.body })

	await nextTick()
	await nextFrame()
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
function find(selector: string): HTMLElement {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

const root = () => find('.so-scroller')
const viewport = () => find('.so-scroller__viewport')

/** Содержимое ленты — произвольная разметка: коллекции у неё нет. */
const content = () => [h('span', { class: 'so-test-item' }, 'Первый')]

it('renders both arrows disabled with Firefox state restoration off', async () => {
	const template = document.createElement('template')
	template.innerHTML = await renderToString(h(Scroller, null, { default: content }))

	for (const direction of ['prev', 'next']) {
		const arrow = template.content.querySelector(`button.so-scroller__${direction}`)
		expect(arrow?.getAttribute('autocomplete')).toBe('off')
		expect(arrow?.hasAttribute('disabled')).toBe(true)
	}
})

describe('состав', () => {
	it('корень — ряд из кнопки, вьюпорта и кнопки, в этом порядке', async () => {
		await render(() => h(Scroller, null, { default: content }))

		expect([...root().children].map((node) => node.className)).toEqual([
			'so-button so-button--size-normal so-scroller__prev',
			'so-scroller__viewport',
			'so-button so-button--size-normal so-scroller__next',
		])
	})

	it('содержимое лежит прямо во вьюпорте — обёртки между ними нет', async () => {
		await render(() => h(Scroller, null, { default: content }))

		expect(viewport().children[0]?.className).toBe('so-test-item')
	})

	it('значок кнопки переопределяется своим слотом', async () => {
		await render(() =>
			h(Scroller, null, {
				default: content,
				'prev-icon': () => h('i', { class: 'so-test-prev' }),
				'next-icon': () => h('i', { class: 'so-test-next' }),
			}),
		)

		expect(find('.so-scroller__prev .so-test-prev')).toBeTruthy()
		expect(find('.so-scroller__next .so-test-next')).toBeTruthy()
	})
})

describe('состояние на корне', () => {
	it('оба признака стоят с первой отрисовки', async () => {
		await render(() => h(Scroller, null, { default: content }))

		expect(root().dataset.canPrev).toBe('false')
		expect(root().dataset.canNext).toBe('false')
	})

	/**
	 * Замер идёт из плагина, а здесь мерить нечего: в jsdom у вьюпорта нули.
	 * Поэтому факт приносит инстанс — та же вторая поверхность управления.
	 */
	it('замер доезжает до темы и до кнопок', async () => {
		const ctrl = new TScroller()

		await render(() => h(Scroller, { ctrl }, { default: content }))

		ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		await nextTick()

		expect(root().dataset.canPrev).toBe('false')
		expect(root().dataset.canNext).toBe('true')
		expect(find('.so-scroller__prev').hasAttribute('disabled')).toBe(true)
		expect(find('.so-scroller__next').hasAttribute('disabled')).toBe(false)
	})

	it('выключенная лента гасит обе кнопки', async () => {
		const ctrl = new TScroller({ disabled: true })

		await render(() => h(Scroller, { ctrl }, { default: content }))

		ctrl.notifyViewport({ canPrev: true, canNext: true, hasTabStops: false })
		await nextTick()

		expect(find('.so-scroller__prev').hasAttribute('disabled')).toBe(true)
		expect(find('.so-scroller__next').hasAttribute('disabled')).toBe(true)
	})
})

describe('вьюпорт', () => {
	it('роль ряда приходит от потребителя и стоит на вьюпорте, а не на корне', async () => {
		await render(() => h(Scroller, { viewportAria: { role: 'listbox' } }, { default: content }))

		expect(viewport().getAttribute('role')).toBe('listbox')
		expect(root().hasAttribute('role')).toBe(false)
	})

	it('становится остановкой Tab, когда листать есть куда, а своих остановок нет', async () => {
		const ctrl = new TScroller()

		await render(() => h(Scroller, { ctrl }, { default: content }))

		expect(viewport().hasAttribute('tabindex')).toBe(false)

		ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		await nextTick()

		expect(viewport().getAttribute('tabindex')).toBe('0')
	})

	it('свои остановки внутри снимают остановку с самой ленты', async () => {
		const ctrl = new TScroller()

		await render(() => h(Scroller, { ctrl }, { default: content }))

		ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: true })
		await nextTick()

		expect(viewport().hasAttribute('tabindex')).toBe(false)
	})

	/** Ряд с roving tabindex сам решает, кому быть остановкой: его значение сильнее. */
	it('tabindex от потребителя сильнее нашего', async () => {
		const ctrl = new TScroller()

		await render(() =>
			h(Scroller, { ctrl, viewportAria: { tabindex: '-1' } }, { default: content }),
		)

		ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		await nextTick()

		expect(viewport().getAttribute('tabindex')).toBe('-1')
	})
})

describe('имена кнопок', () => {
	it('приходят от локали поддерева и обновляются вместе с ней', async () => {
		const locale = ref(ruRU)

		await render(() =>
			h(LocaleProvider, { locale: locale.value }, () =>
				h(Scroller, null, { default: content }),
			),
		)

		expect(find('.so-scroller__prev').getAttribute('aria-label')).toBe('Прокрутить назад')
		expect(find('.so-scroller__next').getAttribute('aria-label')).toBe('Прокрутить вперёд')

		locale.value = extendLocale(enUS, { translations: { scroller: { prev: 'К началу' } } })
		await nextTick()

		expect(find('.so-scroller__prev').getAttribute('aria-label')).toBe('К началу')
	})
})
