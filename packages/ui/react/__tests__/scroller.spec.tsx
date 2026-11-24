/**
 * Scroller в React — проводка на настоящей разметке.
 *
 * Модель проверяет ядро, счёт краёв — тест плагина, раскладку и листание —
 * `playground/vue/browser/scroller.spec.ts`: в jsdom у вьюпорта нет ни
 * ширины, ни прокрутки. Здесь важно, что состав, состояния и наборы доезжают
 * туда, куда должны: `data-*` на корень, роль потребителя и `tabindex` — на
 * вьюпорт, выключенность — на кнопки. Сценарии — те же, что у Vue
 * (`scroller.spec.ts`).
 */

import { describe, it, expect } from 'vitest'
import { act } from 'react'
import { renderToString } from 'react-dom/server'
import { TScroller } from '@soxa-ui/core'
import { enUS, extendLocale, ruRU } from '@soxa-ui/plugins'
import type { TLocale } from '@soxa-ui/plugins'
import { LocaleProvider, Scroller } from '@soxa-ui/react'
import { find, mount, nextFrame } from './mount'

const root = () => find(document, '.so-scroller', HTMLElement)
const viewport = () => find(document, '.so-scroller__viewport', HTMLElement)
const prev = () => find(document, '.so-scroller__prev', HTMLButtonElement)
const next = () => find(document, '.so-scroller__next', HTMLButtonElement)

/** Содержимое ленты — произвольная разметка: коллекции у неё нет. */
const content = <span className="so-test-item">Первый</span>

/** Смонтировать и дождаться кадра: корень плагины получают через `requestAnimationFrame`. */
async function render(node: Parameters<typeof mount>[0]): Promise<void> {
	mount(node)
	await nextFrame()
}

it('renders both arrows disabled with Firefox state restoration off', () => {
	const template = document.createElement('template')
	template.innerHTML = renderToString(<Scroller>{content}</Scroller>)

	for (const direction of ['prev', 'next']) {
		const arrow = template.content.querySelector(`button.so-scroller__${direction}`)
		expect(arrow?.getAttribute('autocomplete')).toBe('off')
		expect(arrow?.hasAttribute('disabled')).toBe(true)
	}
})

describe('состав', () => {
	it('корень — ряд из кнопки, вьюпорта и кнопки, в этом порядке', async () => {
		await render(<Scroller>{content}</Scroller>)

		expect([...root().children].map((node) => node.className)).toEqual([
			'so-button so-button--size-normal so-scroller__prev',
			'so-scroller__viewport',
			'so-button so-button--size-normal so-scroller__next',
		])
	})

	it('содержимое лежит прямо во вьюпорте — обёртки между ними нет', async () => {
		await render(<Scroller>{content}</Scroller>)

		expect(viewport().children[0]?.className).toBe('so-test-item')
	})

	it('значок кнопки переопределяется своим слотом', async () => {
		await render(
			<Scroller
				prev-icon={<i className="so-test-prev" />}
				next-icon={<i className="so-test-next" />}
			>
				{content}
			</Scroller>,
		)

		expect(find(document, '.so-scroller__prev .so-test-prev', HTMLElement)).toBeTruthy()
		expect(find(document, '.so-scroller__next .so-test-next', HTMLElement)).toBeTruthy()
		expect(document.querySelector('.so-scroller__prev .so-icon')).toBeNull()
	})

	it('атрибуты потребителя — корню, а не вьюпорту', async () => {
		await render(
			<Scroller className="mine" data-probe="1">
				{content}
			</Scroller>,
		)

		expect(root().classList.contains('mine')).toBe(true)
		expect(root().dataset.probe).toBe('1')
		expect(viewport().hasAttribute('data-probe')).toBe(false)
	})
})

describe('состояние на корне', () => {
	it('оба признака стоят с первой отрисовки', async () => {
		await render(<Scroller>{content}</Scroller>)

		expect(root().dataset.canPrev).toBe('false')
		expect(root().dataset.canNext).toBe('false')
	})

	/**
	 * Замер идёт из плагина, а здесь мерить нечего: в jsdom у вьюпорта нули.
	 * Поэтому факт приносит инстанс — та же вторая поверхность управления.
	 */
	it('замер доезжает до темы и до кнопок', async () => {
		const ctrl = new TScroller()

		await render(<Scroller ctrl={ctrl}>{content}</Scroller>)

		act(() => {
			ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		})

		expect(root().dataset.canPrev).toBe('false')
		expect(root().dataset.canNext).toBe('true')
		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(false)
	})

	it('выключенная лента гасит обе кнопки', async () => {
		const ctrl = new TScroller({ disabled: true })

		await render(<Scroller ctrl={ctrl}>{content}</Scroller>)

		act(() => {
			ctrl.notifyViewport({ canPrev: true, canNext: true, hasTabStops: false })
		})

		expect(prev().hasAttribute('disabled')).toBe(true)
		expect(next().hasAttribute('disabled')).toBe(true)
	})
})

describe('вьюпорт', () => {
	it('роль ряда приходит от потребителя и стоит на вьюпорте, а не на корне', async () => {
		await render(<Scroller viewportAria={{ role: 'listbox' }}>{content}</Scroller>)

		expect(viewport().getAttribute('role')).toBe('listbox')
		expect(root().hasAttribute('role')).toBe(false)
	})

	it('становится остановкой Tab, когда листать есть куда, а своих остановок нет', async () => {
		const ctrl = new TScroller()

		await render(<Scroller ctrl={ctrl}>{content}</Scroller>)

		expect(viewport().hasAttribute('tabindex')).toBe(false)

		act(() => {
			ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		})

		expect(viewport().getAttribute('tabindex')).toBe('0')
	})

	it('свои остановки внутри снимают остановку с самой ленты', async () => {
		const ctrl = new TScroller()

		await render(<Scroller ctrl={ctrl}>{content}</Scroller>)

		act(() => {
			ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: true })
		})

		expect(viewport().hasAttribute('tabindex')).toBe(false)
	})

	/** Ряд с roving tabindex сам решает, кому быть остановкой: его значение сильнее. */
	it('tabindex от потребителя сильнее нашего', async () => {
		const ctrl = new TScroller()

		await render(
			<Scroller ctrl={ctrl} viewportAria={{ tabindex: '-1' }}>
				{content}
			</Scroller>,
		)

		act(() => {
			ctrl.notifyViewport({ canPrev: false, canNext: true, hasTabStops: false })
		})

		expect(viewport().getAttribute('tabindex')).toBe('-1')
	})
})

describe('имена кнопок', () => {
	it('приходят от локали поддерева и обновляются вместе с ней', async () => {
		const view = (locale: TLocale) => (
			<LocaleProvider locale={locale}>
				<Scroller>{content}</Scroller>
			</LocaleProvider>
		)
		const { render: rerender } = mount(view(ruRU))

		await nextFrame()

		expect(prev().getAttribute('aria-label')).toBe('Прокрутить назад')
		expect(next().getAttribute('aria-label')).toBe('Прокрутить вперёд')

		rerender(view(extendLocale(enUS, { translations: { scroller: { prev: 'К началу' } } })))

		expect(prev().getAttribute('aria-label')).toBe('К началу')
	})
})
