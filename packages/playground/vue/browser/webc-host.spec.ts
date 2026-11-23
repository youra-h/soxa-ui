/**
 * Хост Web Components на странице стенда в настоящем браузере — слои со своим
 * корнем: Dialog, Drawer и Toasts.
 *
 * Превью этих трёх стоит не только из элемента: окно и выезжающую панель
 * открывает кнопка рядом (`opener` описания), у панели — в коробке превью, а
 * тосты показывают кнопки внутри менеджера, `toastsOf`. Поэтому они сверяются
 * с Vue дважды. В ячейке — то, что стоит на месте: кнопки, которые открывают
 * окно, панель и тосты, — окно и панель уехали в `body` с подложкой, регион —
 * без менеджера. И открытые: клик по кнопке стенда, и окно и выезжающая панель
 * с подложкой и частями, регион с тостом стоят от угла окна, как у Vue, когда
 * доиграли переходы темы. Тот же слой разметкой, без стенда, сверяет
 * `webc-frame.spec.ts`; превью остальных компонентов — их соседи
 * `webc-*.spec.ts`.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import { router } from '../src/router'
import { renderStand } from './stand'

import '@soxa-ui/theme-oren'
import oren from '@soxa-ui/theme-oren/setup'
import '../src/styles.css'

useIcons(material)
useTheme(oren)

const settle = () => new Promise((resolve) => setTimeout(resolve, 300))

/** Строка страницы по имени пропа. */
const propRow = (name: string): HTMLElement => {
	const found = [...document.querySelectorAll('.pg-prop')].find(
		(node) => node.querySelector('.pg-prop__name')?.textContent?.trim() === name,
	)

	if (!(found instanceof HTMLElement)) throw new Error(`строки «${name}» нет`)

	return found
}

/** Рамка узла от угла `origin`, в пикселях. */
function boxOf(node: Element, origin: { left: number; top: number }) {
	const box = node.getBoundingClientRect()

	return {
		x: Math.round(box.left - origin.left),
		y: Math.round(box.top - origin.top),
		width: Math.round(box.width),
		height: Math.round(box.height),
	}
}

/** Сцена первой колонки строки `visible` на странице компонента. */
async function stageOf(framework: string, component: string): Promise<Element> {
	await router.push(`/${framework}/${component}`)
	await settle()

	const stage = propRow('visible').querySelector('.pg-col__stage')

	if (!stage) throw new Error(`${framework}/${component}: сцены нет`)

	return stage
}

/** Рамки узлов `selector` в сцене — от её угла, в порядке документа. */
async function cellBoxesOf(framework: string, component: string, selector: string) {
	const stage = await stageOf(framework, component)
	const parts = [...stage.querySelectorAll(selector)].filter(
		(part) => part.getClientRects().length > 0,
	)

	if (parts.length === 0) throw new Error(`${framework}/${component}: в сцене нет ${selector}`)

	const origin = stage.getBoundingClientRect()

	return parts.map((part) => boxOf(part, origin))
}

/**
 * Рамки открытого слоя и его частей — от угла окна, в порядке документа:
 * открывает его клик по кнопке с текстом `opener` в сцене, а рамки снимаются,
 * когда доиграли переходы темы — проявление окна, въезд панели.
 */
async function openedBoxesOf(
	framework: string,
	component: string,
	opener: string,
	selector: string,
) {
	const stage = await stageOf(framework, component)
	const target = [...stage.querySelectorAll('.so-button')].find(
		(candidate) => candidate.textContent?.trim() === opener,
	)

	if (!(target instanceof HTMLElement)) {
		throw new Error(`${framework}/${component}: в сцене нет кнопки «${opener}»`)
	}

	target.click()
	await settle()
	await Promise.all(document.getAnimations().map((animation) => animation.finished))

	const parts = [...document.querySelectorAll(selector)].filter(
		(part) => part.getClientRects().length > 0,
	)

	if (parts.length === 0) throw new Error(`${framework}/${component}: открытого ${selector} нет`)

	return parts.map((part) => boxOf(part, { left: 0, top: 0 }))
}

beforeEach(async () => {
	document.documentElement.dataset.soTheme = 'oren'

	await router.push('/vue')

	renderStand()

	await settle()
})

describe('хост Web Components · слои', () => {
	// В ячейке — кнопки: окно и панель уехали в `body`, регион — мимо сцены
	it.each(['dialog', 'drawer', 'toasts'])(
		'%s: кнопки стоят в ячейке так же, как у Vue',
		async (component) => {
			const vue = await cellBoxesOf('vue', component, '.so-button')
			const webc = await cellBoxesOf('webc', component, '.so-button')

			expect(webc[0].width).toBeGreaterThan(0)
			expect(webc).toEqual(vue)
		},
	)

	// Что открывает слой, его части и их число: подложка, окно или панель,
	// заголовок, тело с абзацем и полем, подвал с двумя кнопками, крестик; у
	// тостов — регион с тостом (пустые регионы других колонок стоят у того же
	// края), тост, плашка, значок, текст, кнопка «Отменить» и крестик. Число
	// частей — чтобы неоткрывшийся слой не сошёлся сам с собой
	it.each([
		[
			'dialog',
			'Открыть окно',
			'.so-backdrop:has(+ .so-dialog), .so-dialog, .so-dialog__title, .so-dialog__body, .so-dialog__body > *, .so-dialog__footer, .so-dialog__footer > *, .so-dialog__close',
			10,
		],
		[
			'drawer',
			'Открыть панель',
			'.so-backdrop:has(+ .so-drawer), .so-drawer, .so-drawer__title, .so-drawer__body, .so-drawer__body > *, .so-drawer__footer, .so-drawer__footer > *, .so-drawer__close',
			10,
		],
		[
			'toasts',
			'обычное',
			'.so-toasts:has(.so-toasts-item), .so-toasts-item, .so-toasts-item__card, .so-toasts-item__icon, .so-toasts-item__text, .so-toasts-item__content > *, .so-toasts-item__close',
			7,
		],
	])('%s: открытый стоит так же, как у Vue', async (component, opener, selector, parts) => {
		const vue = await openedBoxesOf('vue', component, opener, selector)
		const webc = await openedBoxesOf('webc', component, opener, selector)

		expect(webc).toHaveLength(parts)
		expect(webc[0].width).toBeGreaterThan(0)
		expect(webc).toEqual(vue)
	})
})
