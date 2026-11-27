/**
 * Контракт пакета иконок.
 *
 * Пакет — не мешок SVG, а реализация списка ролей, которые нужны компонентам:
 * ровно как тема реализует классы, выпускаемые в разметку. Поэтому здесь два
 * рода проверок — механика реестра и conformance каждого пакета иконок.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MISSING_ICON, getIcon, hasIcon, resetIcons, useIcons } from '../protected/registry/icons'
import { ICON_ROLES, missingIconRoles } from '../content/icons/roles'
import type { TIconSource } from '../protected/registry'
import * as material from '@soxa-ui/icons-material'
import * as lucide from '@soxa-ui/icons-lucide'

const anIcon = { viewBox: '0 0 24 24', body: '<path d="M0 0h24v24H0z"/>' }

beforeEach(() => resetIcons())

afterEach(() => {
	resetIcons()
	vi.restoreAllMocks()
})

describe('реестр ролей', () => {
	it('отдаёт зарегистрированную иконку', () => {
		useIcons({ close: anIcon })

		expect(getIcon('close')).toBe(anIcon)
	})

	it('повторный вызов перекрывает роль, а не сбрасывает набор', () => {
		// Точечная подмена одной иконки не должна требовать пересборки набора
		const other = { viewBox: '0 0 16 16', body: '<circle r="8"/>' }

		useIcons({ close: anIcon, check: anIcon })
		useIcons({ close: other })

		expect(getIcon('close')).toBe(other)
		expect(getIcon('check')).toBe(anIcon)
	})

	it('незарегистрированная роль даёт заглушку, а не исключение', () => {
		// Из-за одной иконки не должно падать всё приложение
		vi.spyOn(console, 'warn').mockImplementation(() => {})

		expect(getIcon('nope')).toBe(MISSING_ICON)
	})

	it('предупреждает один раз, а не на каждую отрисовку', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

		getIcon('nope')
		getIcon('nope')
		getIcon('nope')

		expect(warn).toHaveBeenCalledTimes(1)
	})

	it('предупреждение возвращается, если роль потом зарегистрировали и сняли', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

		getIcon('nope')
		useIcons({ nope: anIcon })
		resetIcons()
		getIcon('nope')

		expect(warn).toHaveBeenCalledTimes(2)
	})

	it('hasIcon отличает зарегистрированную роль от заглушки', () => {
		useIcons({ close: anIcon })

		expect(hasIcon('close')).toBe(true)
		expect(hasIcon('nope')).toBe(false)
	})

	it('undefined в наборе не затирает уже зарегистрированное', () => {
		useIcons({ close: anIcon })
		useIcons({ close: undefined })

		expect(getIcon('close')).toBe(anIcon)
	})
})

/**
 * Пакеты и цвет, с которым загружены их иконки, — то, что стоит в SVG пакета:
 * слабейшая ступень лестницы цвета (`docs/agents/theming.md`, «Пакеты
 * иконок»). Material рисует заливкой цвета `#1f1f1f`, Lucide — линией цвета
 * текста.
 */
const PACKS: { name: string; pack: Partial<Record<string, TIconSource>>; loaded: string }[] = [
	{ name: 'material', pack: material, loaded: '#1f1f1f' },
	{ name: 'lucide', pack: lucide, loaded: 'currentColor' },
]

const PACK_ROLES = [...ICON_ROLES, 'step'] as const

/** Покраска в рисунке: атрибут `fill` или `stroke` и его значение. */
const PAINT = /\s(fill|stroke)="([^"]*)"/g

/** Ссылка на цвет иконки темы; в группе — запасное значение. */
const ICON_COLOR = /^var\(--so-icon-color, ([^()]+)\)$/

describe.each(PACKS)('conformance пакета $name', ({ pack, loaded }) => {
	it('закрывает все обязательные роли', () => {
		// Список ролей и есть контракт: добавили иконку в компонент — добавьте
		// роль, и этот тест сразу покажет, какие пакеты её не закрыли
		expect(missingIconRoles(pack)).toEqual([])
	})

	it('provides the optional Stepper role in the built-in pack', () => {
		expect(pack.step).toBeDefined()
		expect(missingIconRoles({ ...pack, step: undefined })).toEqual([])
	})

	it('каждая иконка — данные, а не разметка с корневым <svg>', () => {
		// Корень строит адаптер: только так он может задать размер,
		// `aria-hidden` и классы
		for (const role of PACK_ROLES) {
			expect(pack[role]?.viewBox).toMatch(/^-?\d/)
			expect(pack[role]?.body).not.toContain('<svg')
		}
	})

	it('вся покраска рисунка — ссылкой на цвет иконки темы, с цветом пакета запасным', () => {
		// Лестница цвета: правило темы для места сильнее её цвета по умолчанию,
		// а тот — цвета, с которым иконка загружена. Тема пишет переменную
		// `--so-icon-color`, а не `fill` и не `stroke`, и не знает, рисует пакет
		// заливкой или линией. Цвет, записанный значением, прошёл бы мимо неё, а
		// рисунок без покраски взял бы умолчание SVG — чёрный, а не цвет пакета.
		// `none` — способ рисования, а не цвет: линия Lucide без заливки
		for (const role of PACK_ROLES) {
			const colors = [...(pack[role]?.body ?? '').matchAll(PAINT)]
				.map(([, , value]) => value)
				.filter((value) => value !== 'none')

			expect(colors, role).not.toEqual([])
			expect(
				colors.map((color) => ICON_COLOR.exec(color)?.[1]),
				role,
			).toEqual(colors.map(() => loaded))
		}
	})

	it('покраска — атрибутом представления, а не стилем', () => {
		// Атрибут слабее любого правила CSS: тема, которой нужно сменить способ
		// рисования (контур звезды Rating в режиме принудительных цветов), пишет
		// правило фигурам. `style` в разметке перебил бы такое правило, а
		// политика безопасности без 'unsafe-inline' для стилей снимает его, и
		// иконка осталась бы без цвета
		for (const role of PACK_ROLES) {
			expect(pack[role]?.body, role).not.toMatch(/\sstyle=|<style/)
		}
	})

	it('роли не зависят от имён файлов: check_indeterminate → checkIndeterminate', () => {
		expect(pack.checkIndeterminate).toBeDefined()
	})
})
