/**
 * Сторож узла фокуса: каждый компонент с `TActionPlugin` решил, куда запись
 * `focused = true` ставит фокус.
 *
 * Плагин действия ставит фокус на узел, который называет правило дескриптора
 * (`ActionPluginDescriptor.with({ focusTarget })`), а без правила — на
 * корень. У компонента, чей корень фокус не держит (поле, ListBox, Tabs),
 * запись без правила меняла только свойство: фокус оставался, где был, а
 * `focused` показывал неправду. Поэтому решение обязано быть записано: правило
 * в дескрипторе или имя в одном из списков ниже. Новый контрол без решения
 * роняет тест, а имя, которое решение уже получило, — тоже: список не копит
 * устаревшего.
 */

import { describe, it, expect } from 'vitest'
import { TActionPlugin } from '@soxa-ui/plugins'
import type { IComponentDescriptor } from '../protected/define'
import { exportedDescriptors } from './helpers'

/** Фокус держит сам корень: правило не нужно. */
const ROOT_HOLDS_FOCUS = new Set([
	'ButtonDescriptor',
	'ToggleButtonDescriptor',
	'ToggleGroupItemDescriptor',
	// Строка элемента коллекции — корень кнопки, фокус ставят на неё элементы
	'ItemRowDescriptor',
	'TreeItemDescriptor',
	// Остановка сетки — сама таблица: фокус по ячейкам водит её плагин сетки
	'TableDescriptor',
])

/** Базы без разметки: рисует наследник, и правило — его. */
const BASES = new Set([
	'ControlDescriptor',
	'ValueControlDescriptor',
	'InputControlDescriptor',
	'ClearableDescriptor',
	'TextableDescriptor',
])

/**
 * DOM-фокус не переносится: он живёт не в компоненте. Опция Select — часть
 * комбобокса, а у него фокус всегда на поле, и подсвеченную опцию объявляет
 * `aria-activedescendant` (patterns.md, «Select»). Без правила плагин ставит
 * фокус на корень опции, а остановки у него нет — фокус остаётся на месте.
 */
const FOCUS_STAYS_ELSEWHERE = new Set(['SelectItemDescriptor'])

/** Списки решений: имя в одном из них — решение без правила. */
const LISTED = [ROOT_HOLDS_FOCUS, BASES, FOCUS_STAYS_ELSEWHERE]

/** Правило узла фокуса в опциях плагина действия; плагина нет — `undefined`. */
function focusTargetOf(descriptor: IComponentDescriptor): unknown {
	const options = descriptor.plugins.find((plugin) => plugin.ctor === TActionPlugin)?.options

	return options && 'focusTarget' in options ? options.focusTarget : undefined
}

const withAction = exportedDescriptors().filter(([, descriptor]) =>
	descriptor.plugins.some((plugin) => plugin.ctor === TActionPlugin),
)

describe('узел фокуса у дескрипторов с TActionPlugin', () => {
	it('разбор не вхолостую: плагин действия есть у полей, списков и кнопки', () => {
		const names = withAction.map(([name]) => name)

		expect(names).toEqual(
			expect.arrayContaining(['ButtonDescriptor', 'InputDescriptor', 'ListBoxDescriptor']),
		)
	})

	it('у каждого — правило в дескрипторе или имя в списке решений', () => {
		const undecided = withAction
			.filter(([name, descriptor]) => {
				if (typeof focusTargetOf(descriptor) === 'function') return false

				return !LISTED.some((list) => list.has(name))
			})
			.map(([name]) => name)

		expect(
			undecided,
			'Корень не держит фокус — ActionPluginDescriptor.with({ focusTarget }) в дескрипторе ' +
				'(docs/agents/a11y.md, «Прочее»), держит — имя в ROOT_HOLDS_FOCUS',
		).toEqual([])
	})

	it('в списках — только дескрипторы с плагином действия и без правила', () => {
		const known = new Map(withAction)
		const stale = LISTED.flatMap((list) => [...list]).filter((name) => {
			const descriptor = known.get(name)

			return !descriptor || typeof focusTargetOf(descriptor) === 'function'
		})

		expect(stale, 'Решение уже записано правилом — имя из списка убрать').toEqual([])
	})

	it('правило — у полей, списков, групп, коллекций и их элементов', () => {
		const ruled = withAction
			.filter(([, descriptor]) => typeof focusTargetOf(descriptor) === 'function')
			.map(([name]) => name)
			.sort()

		expect(ruled).toEqual(
			[
				'AccordionDescriptor',
				'AccordionItemDescriptor',
				'BreadcrumbsItemDescriptor',
				'CalendarDescriptor',
				'CheckBoxDescriptor',
				'DateInputDescriptor',
				'DatePickerDescriptor',
				'FileUploadDescriptor',
				'InputDescriptor',
				'ListBoxDescriptor',
				'ListBoxItemDescriptor',
				'MenuCheckboxItemDescriptor',
				'MenuItemDescriptor',
				'MenuPopoverItemDescriptor',
				'MenuRadioItemDescriptor',
				'MenuSubmenuDescriptor',
				'NumberInputDescriptor',
				'PaginationDescriptor',
				'RadioGroupDescriptor',
				'RadioGroupItemDescriptor',
				'RatingDescriptor',
				'ScrollerDescriptor',
				'SelectDescriptor',
				'SliderDescriptor',
				'StepperDescriptor',
				'StepperItemDescriptor',
				'SwitchDescriptor',
				'TabsDescriptor',
				'ToggleGroupDescriptor',
				'TabsItemDescriptor',
				'TagsDescriptor',
				'TagsItemDescriptor',
				'TextareaDescriptor',
				'TreeDescriptor',
			].sort(),
		)
	})
})
