import { describe, it, expect } from 'vitest'
import * as core from '@soxa-ui/core'
import { TComponentView } from '@soxa-ui/core'
import type {
	TAccordionView,
	TAlertView,
	TButtonView,
	TBadgeView,
	TBackdropView,
	TCheckBoxView,
	TComponentVariant,
	TListBoxView,
	TRadioGroupView,
	TSkeletonAnimation,
	TSkeletonShape,
	TTabsView,
	TTagsView,
} from '@soxa-ui/core'

/** `true`, только когда типы совпадают в обе стороны. */
type TExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false

/**
 * Сторож правила «значения оформления объявляет тема» (AGENTS.md,
 * «Оформление: значения объявляет тема»).
 *
 * Типовая половина проверяется не vitest, а «Типы — Core»: объяви ядро в
 * реестре хоть одно значение — тип значения перестанет совпадать с именами
 * фикстуры `theme.d.ts`, и литерал `true` не присвоится. Рантайм-половина
 * ловит то, чего типы не видят: умолчание, которое поставило модификатор.
 */
describe('реестры значений оформления', () => {
	it('ядро не объявляет значений: тип значения — ровно имена фикстуры', () => {
		const exact: Record<string, true> = {
			variant: true satisfies TExact<TComponentVariant, 'brand' | 'danger'>,
			alertView: true satisfies TExact<TAlertView, 'solid' | 'hollow'>,
			backdropView: true satisfies TExact<TBackdropView, 'clear' | 'frosted'>,
			badgeView: true satisfies TExact<TBadgeView, 'solid' | 'hollow'>,
			buttonView: true satisfies TExact<TButtonView, 'solid' | 'ghost'>,
			tabsView: true satisfies TExact<TTabsView, 'pills' | 'cards'>,
			checkBoxView: true satisfies TExact<TCheckBoxView, 'bare' | 'boxed'>,
			radioGroupView: true satisfies TExact<TRadioGroupView, 'pip' | 'halo'>,
			skeletonShape: true satisfies TExact<TSkeletonShape, 'square' | 'pill'>,
			skeletonAnimation: true satisfies TExact<TSkeletonAnimation, 'shimmer' | 'blink'>,
		}

		expect(Object.values(exact).every(Boolean)).toBe(true)
	})

	/**
	 * Вид списка — это вид его строк: строку рисует `Button`, и значение уходит
	 * в неё как есть. Свой реестр у ListBox или Accordion сделал бы этот
	 * проброс нетипизируемым. У Tags проброса в строку нет, но пилюля тега —
	 * тоже вид кнопки.
	 */
	it('виды ListBox, Accordion и Tags — реестр Button', () => {
		const aliases: Record<string, true> = {
			listBox: true satisfies TExact<TListBoxView, TButtonView>,
			accordion: true satisfies TExact<TAccordionView, TButtonView>,
			tags: true satisfies TExact<TTagsView, TButtonView>,
		}

		expect(Object.values(aliases).every(Boolean)).toBe(true)
	})

	/**
	 * Умолчание темы — блок без модификатора. Значения по умолчанию у ядра нет,
	 * значит у свежего инстанса нет ни одного класса `--variant-*`, `--view-*`,
	 * `--shape-*` или `--animation-*`. Обходятся все визуальные классы экспорта:
	 * новый компонент попадает под проверку сам.
	 */
	it('у свежих инстансов нет модификаторов темы', () => {
		const THEME_MODIFIER = /--(?:variant|view|shape|animation)-/

		const views = Object.entries(core).filter(
			(entry): entry is [string, typeof TComponentView] => isViewClass(entry[1]),
		)

		expect(views.length, 'визуальных классов в экспорте не нашлось').toBeGreaterThan(20)

		const found = views.flatMap(([name, Ctor]) =>
			new Ctor().classes
				.toArray()
				.filter((cls) => THEME_MODIFIER.test(cls))
				.map((cls) => `${name}: ${cls}`),
		)

		expect(found).toEqual([])
	})
})

function isViewClass(value: unknown): value is typeof TComponentView {
	return (
		typeof value === 'function' &&
		(value === TComponentView || value.prototype instanceof TComponentView)
	)
}
