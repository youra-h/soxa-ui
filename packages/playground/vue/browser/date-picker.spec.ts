/**
 * DatePicker в настоящем браузере: фокус панели, клавиши и раскладка.
 *
 * Порядок Tab, перенос фокуса нажатием мыши и раскладку jsdom не считает.
 * Модель проверяет ядро, переходы, которые делает сам плагин фокуса, — тест
 * плагинов (`plugins/__tests__/date-picker.plugin.spec.ts`), проводку —
 * `ui/vue/__tests__/date-picker.spec.ts`. Здесь — что они складываются с
 * браузером: фокус уходит на день сетки, Tab ходит по кругу в панели,
 * закрытие возвращает фокус в поле, нажатие в соседнее поле отдаёт ему фокус
 * с первого раза, а клавиши календаря и поля — те же, что у них самих.
 * Панель открывается и одной клавиатурой: Tab с поля до кнопки календаря и
 * Enter на ней. Раскладка: коробка диапазона не
 * меняет ширину, пока даты набирают, а панель у правого края окна не
 * сжимается. Тема: ошибку поля конца коробка диапазона показывает своей
 * рамкой, панель проявляется и гаснет на месте переходом, а день, выбор
 * которого закрывает панель, встаёт на новую заливку сразу, — в открытой
 * панели заливка идёт переходом. jsdom переходов не ведёт.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from './render'
import { userEvent } from 'vitest/browser'
import { defineComponent, h, nextTick } from 'vue'
import { TDatePicker } from '@soxa-ui/core'
import type { IDatePickerProps } from '@soxa-ui/core'
import { COMPONENT_SIZES } from '@soxa-ui/playground-shared'
import { DatePicker } from '@soxa-ui/vue'

import { expectClearSquare } from './clear-button'
import { settled } from './colors'
import { expectFadesInPlace, ownTransitionRuns, transitionEvents } from './transitions'
import { expectInsideWindow } from './viewport'

import '@soxa-ui/theme-oren'

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

/**
 * Поле страницы над DatePicker — чтобы было куда нажать мимо. Над, а не
 * рядом: панель открывается под полем и шириной с календарь, и соседа в
 * строке она накрыла бы там, где шрифт шире и строка переносится. Узел
 * корня плагины получают кадром позже.
 */
const show = async (
	props: Partial<IDatePickerProps> = {},
	align: 'start' | 'end' = 'start',
): Promise<TDatePicker> => {
	const ctrl = new TDatePicker(props)
	const style = `padding: 16px; display: flex; flex-direction: column; gap: 8px; align-items: flex-${align}`

	render(
		defineComponent({
			render: () =>
				h('div', { class: 'so-host', style }, [
					h('input', { class: 'so-test-outside', 'aria-label': 'Рядом' }),
					h(DatePicker, { ctrl, aria_label: 'Дата заезда' }),
				]),
		}),
	)

	await nextTick()
	await nextFrame()
	await nextFrame()

	return ctrl
}

/** Узел по селектору; нет его — тест падает здесь, а не на чтении свойства. */
const find = (selector: string): HTMLElement => {
	const element = document.querySelector(selector)

	if (!(element instanceof HTMLElement)) throw new Error(`${selector}: HTML-узла нет`)

	return element
}

/** Ячейка дня по его имени — полной дате, как её прочтёт скринридер. */
const day = (date: string): HTMLElement => {
	const label = new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeZone: 'UTC' }).format(
		Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8))),
	)

	return find(`.so-calendar-item[aria-label="${label}"]`)
}

/** Плитка дня — то, что заливает выбор: заливку тема кладёт на неё, а не на ячейку. */
const tile = (date: string): HTMLElement => {
	const element = day(date).querySelector('.so-calendar-item__day')

	if (!(element instanceof HTMLElement)) throw new Error(`${date}: плитки дня нет`)

	return element
}

const root = () => find('.so-date-picker')
const trigger = () => find('.so-date-picker__trigger')
const panel = () => find('.so-date-picker__panel')
const isOpen = () => getComputedStyle(panel()).display !== 'none'
const active = () => document.activeElement
const segment = (type: string, scope = '.so-date-picker') =>
	find(`${scope} .so-date-input__segment[data-type="${type}"]`)

const tab = () => userEvent.keyboard('{Tab}')
const shiftTab = () => userEvent.keyboard('{Shift>}{Tab}{/Shift}')

beforeEach(() => {
	document.documentElement.dataset.soTheme = 'oren'
})

afterEach(() => {
	cleanup()
})

describe('lazy picker labels', () => {
	it('keeps all label targets after keyboard selection, reopening and Escape', async () => {
		const ctrl = await show({ value: '2026-11-14', timeZone: 'UTC' })
		const expectLabels = () => {
			for (const element of document.querySelectorAll('[aria-labelledby]')) {
				for (const id of element.getAttribute('aria-labelledby')?.split(/\s+/) ?? []) {
					expect(document.getElementById(id), id).not.toBeNull()
				}
			}
		}

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-11-14'))
		expectLabels()
		await userEvent.keyboard('{ArrowRight}{Enter}')
		await expect.poll(() => ctrl.value).toBe('2026-11-15')
		await expect.poll(isOpen).toBe(false)
		expectLabels()

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-11-15'))
		expectLabels()
		await userEvent.keyboard('{Escape}')
		await expect.poll(isOpen).toBe(false)
		expectLabels()
	})
})

describe('открытие', () => {
	it('кнопка открывает панель под полем, фокус — на выбранном дне', async () => {
		await show({ value: '2026-05-12' })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		const anchor = root().getBoundingClientRect()
		const box = panel().getBoundingClientRect()

		expect(isOpen()).toBe(true)
		expect(Math.round(box.top - anchor.bottom)).toBe(4)
		expect(Math.round(box.left)).toBe(Math.round(anchor.left))
	})

	it('Alt+↓ на поле открывает панель с фокусом на дне', async () => {
		await show({ value: '2026-05-12' })

		await userEvent.click(segment('month'))
		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')

		await expect.poll(active).toBe(day('2026-05-12'))
	})

	it('ввод в поле панель не открывает', async () => {
		await show()

		await userEvent.click(segment('month'))
		await userEvent.keyboard('05')

		expect(isOpen()).toBe(false)
	})

	/**
	 * Одной клавиатурой, как без мыши: Tab с поля страницы по частям поля до
	 * кнопки календаря, Enter на ней открывает панель, и фокус уходит на день
	 * — по дням его ведут стрелки. Enter выбирает день, закрывает панель и
	 * возвращает фокус в поле — на первую часть, а не на кнопку.
	 */
	it('Tab до кнопки и Enter — фокус на дне, стрелки ведут его, Enter выбирает и возвращает фокус в поле', async () => {
		const ctrl = await show({ value: '2026-05-12' })

		await userEvent.click(find('.so-test-outside'))

		// en-US: месяц, день, год, за ними — кнопка календаря
		for (const stop of [segment('month'), segment('day'), segment('year'), trigger()]) {
			await tab()
			expect(active()).toBe(stop)
		}

		await userEvent.keyboard('{Enter}')
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{ArrowRight}')
		await expect.poll(active).toBe(day('2026-05-13'))

		await userEvent.keyboard('{ArrowLeft}{ArrowLeft}')
		await expect.poll(active).toBe(day('2026-05-11'))

		await userEvent.keyboard('{Enter}')

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toBe('2026-05-11')
		await expect.poll(active).toBe(segment('month'))
	})
})

describe('закрытие', () => {
	/** Открыли с части дня, не первой: возврат — на неё, а не на первую часть. */
	it('Enter выбирает день и закрывает панель, фокус — туда, откуда открыли', async () => {
		const ctrl = await show({ value: '2026-05-12' })

		await userEvent.click(segment('day'))
		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{ArrowRight}{Enter}')

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toBe('2026-05-13')
		expect(segment('day').textContent).toBe('13')
		await expect.poll(active).toBe(segment('day'))
	})

	it('Escape закрывает и возвращает фокус в поле — на первую часть, а не на кнопку', async () => {
		await show({ value: '2026-05-12' })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{Escape}')

		await expect.poll(isOpen).toBe(false)
		// en-US: первая часть — месяц
		await expect.poll(active).toBe(segment('month'))
	})

	it('нажатие в соседнее поле закрывает панель и фокусирует поле с первого раза', async () => {
		await show({ value: '2026-05-12' })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.click(find('.so-test-outside'))

		await expect.poll(isOpen).toBe(false)
		expect(active()).toBe(find('.so-test-outside'))
	})
})

/**
 * Появление и исчезание — переход темы по `data-open` панели, его пишет слой
 * панели (Frame). Панель проявляется и гаснет на месте, как поповер у
 * триггера без жеста: переходит одна прозрачность. Хуков под анимацию у кода
 * нет — видно это по переходу на самой панели.
 *
 * Выбор, который закрывает панель, — второй день диапазона или одна дата, —
 * меняет заливку дней в том же кадре, в котором панель начинает гаснуть.
 * Переходом цвета концы темнели бы, пока панель гаснет, — их видимая темнота
 * сначала росла бы, потом падала, и концы мигали. Поэтому в закрытом слое
 * плитка дня встаёт на новое значение сразу и гаснет вместе с панелью
 * (`themes/oren/src/components/calendar/_calendar.scss`), а в открытой
 * панели заливка идёт переходом, как у Calendar на странице. Выбирают
 * клавиатурой: `:active` дня под мышью завёл бы переход ещё в открытой
 * панели, и сторож поймал бы его, а не закрытие. Слушатели переходов плиток
 * встают на покое — когда переходы предпросмотра и фокуса доиграли: закрытию
 * они не принадлежат.
 */
describe('появление и исчезание', () => {
	it('открытие — панель проявляется, закрытие — гаснет на месте и до конца нажатий не ловит', async () => {
		await show({ value: '2026-05-12' })

		const runs = ownTransitionRuns(panel())

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		// `transitionrun` браузер шлёт кадром позже пересчёта стиля
		await expect.poll(() => runs).toContain('opacity')

		await settled(panel())

		await expectFadesInPlace(panel(), () => userEvent.keyboard('{Escape}'))
	})

	/** Переходы, которые плитки дней заведут дальше: слушатели — на покое. */
	const runsAtRest = async (...dates: string[]): Promise<string[][]> => {
		await transitionEvents()
		await Promise.all(dates.map((date) => settled(tile(date))))

		return dates.map((date) => ownTransitionRuns(tile(date)))
	}

	/**
	 * Диапазон начат на 12-м и стрелками доведён до 14-го: предпросмотр стоит,
	 * Enter выберет второй день. Отдаёт переходы плиток концов.
	 */
	const previewRange = async (): Promise<string[][]> => {
		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{Enter}{ArrowRight}{ArrowRight}')

		return runsAtRest('2026-05-12', '2026-05-14')
	}

	it('второй день диапазона закрывает панель — концы встают сразу, без перехода заливки', async () => {
		const ctrl = await show({ mode: 'range', value: ['2026-05-12', '2026-05-12'] })
		const [start, end] = await previewRange()

		await userEvent.keyboard('{Enter}')
		await transitionEvents()

		expect(ctrl.value).toEqual(['2026-05-12', '2026-05-14'])
		expect(panel().dataset.open, 'панель закрыта').toBe('false')
		expect(start, 'начало').not.toContain('background-color')
		expect(end, 'конец').not.toContain('background-color')
	})

	it('одна дата закрывает панель — выбранный и прежний дни встают сразу, без перехода заливки', async () => {
		const ctrl = await show({ value: '2026-05-12' })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{ArrowRight}')

		const [chosen, previous] = await runsAtRest('2026-05-13', '2026-05-12')

		await userEvent.keyboard('{Enter}')
		await transitionEvents()

		expect(ctrl.value).toBe('2026-05-13')
		expect(panel().dataset.open, 'панель закрыта').toBe('false')
		expect(chosen, 'выбранный').not.toContain('background-color')
		expect(previous, 'прежний').not.toContain('background-color')
	})

	it('панель остаётся открытой (`closeOnSelect: false`) — концы заливаются переходом, как у Calendar', async () => {
		const ctrl = await show({
			mode: 'range',
			value: ['2026-05-12', '2026-05-12'],
			closeOnSelect: false,
		})
		const [start, end] = await previewRange()

		await userEvent.keyboard('{Enter}')
		await transitionEvents()

		expect(ctrl.value).toEqual(['2026-05-12', '2026-05-14'])
		expect(panel().dataset.open, 'панель открыта').toBe('true')
		expect(start, 'начало').toContain('background-color')
		expect(end, 'конец').toContain('background-color')
	})
})

describe('Tab в панели', () => {
	/**
	 * Остановки панели — по порядку DOM: заголовок месяца, «назад», «вперёд»,
	 * день. С дня, последней остановки, Tab уходит по кругу на заголовок.
	 */
	it('ходит по кругу: с дня — на заголовок месяца, с заголовка обратно — на день', async () => {
		await show({ value: '2026-05-12' })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await tab()
		expect(active()).toBe(find('.so-calendar__title'))

		await tab()
		expect(active()).toBe(find('.so-calendar__prev'))

		await tab()
		expect(active()).toBe(find('.so-calendar__next'))

		await shiftTab()
		await shiftTab()
		await shiftTab()
		expect(active()).toBe(day('2026-05-12'))
		expect(isOpen()).toBe(true)
	})
})

/**
 * Выбор с подтверждением: модель проверяет ядро, проводку — тест Vue. Здесь —
 * что подвал складывается с фокусом панели: Tab доходит до «Отмена» и «OK» —
 * «OK» последней остановкой, — Enter на дне выбирает черновик, не закрывая
 * панель, а «OK» и «Отмена» закрывают её и возвращают фокус туда, откуда
 * открыли.
 */
describe('выбор с подтверждением', () => {
	const cancel = () => find('.so-date-picker__cancel')
	const confirm = () => find('.so-date-picker__confirm')

	/** Открыть панель Alt+↓ с поля: фокус вернётся на часть месяца. */
	const openFromField = async () => {
		await userEvent.click(segment('month'))
		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
		await expect.poll(active).toBe(day('2026-05-12'))
	}

	it('Enter на дне — черновик; Tab доходит до «Отмена» и «OK», «OK» — значение и фокус назад', async () => {
		const ctrl = await show({ value: '2026-05-12', confirmable: true })

		await openFromField()
		await userEvent.keyboard('{ArrowRight}{Enter}')

		// Черновик: панель открыта, значение и поле прежние
		expect(isOpen()).toBe(true)
		expect(ctrl.value).toBe('2026-05-12')
		expect(segment('day').textContent).toBe('12')

		await tab()
		expect(active()).toBe(cancel())

		await tab()
		expect(active()).toBe(confirm())

		// «OK» — последняя остановка: дальше Tab по кругу, на заголовок
		await tab()
		expect(active()).toBe(find('.so-calendar__title'))

		await shiftTab()
		expect(active()).toBe(confirm())

		await userEvent.keyboard('{Enter}')

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toBe('2026-05-13')
		expect(segment('day').textContent).toBe('13')
		await expect.poll(active).toBe(segment('month'))
	})

	it('«Отмена» — значение прежнее, фокус туда, откуда открыли; снова открытая панель — на прежнем дне', async () => {
		const ctrl = await show({ value: '2026-05-12', confirmable: true })

		await openFromField()
		await userEvent.keyboard('{ArrowRight}{Enter}')
		await userEvent.click(cancel())

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toBe('2026-05-12')
		await expect.poll(active).toBe(segment('month'))

		await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')

		await expect.poll(active).toBe(day('2026-05-12'))
		expect(day('2026-05-12').dataset.selected).toBe('true')
		expect(day('2026-05-13').dataset.selected).toBe('false')
	})

	it('Escape — тоже отмена: черновик сброшен', async () => {
		const ctrl = await show({ value: '2026-05-12', confirmable: true })

		await openFromField()
		await userEvent.keyboard('{ArrowRight}{Enter}')
		await userEvent.keyboard('{Escape}')

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toBe('2026-05-12')
		expect(ctrl.calendar.value).toBe('2026-05-12')
	})
})

describe('диапазон', () => {
	it('панель открыта до второго дня; первый Escape снимает якорь, второй закрывает', async () => {
		const ctrl = await show({ mode: 'range', value: ['2026-05-12', '2026-05-12'] })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{Enter}')

		expect(ctrl.engine.extensions.selection.anchor).toBe('2026-05-12')
		expect(isOpen()).toBe(true)

		await userEvent.keyboard('{Escape}')

		expect(ctrl.engine.extensions.selection.anchor).toBeUndefined()
		expect(isOpen()).toBe(true)

		await userEvent.keyboard('{Escape}')

		await expect.poll(isOpen).toBe(false)
	})

	it('второй день пишет пару в поля и закрывает панель, фокус — на первой части поля начала', async () => {
		const ctrl = await show({ mode: 'range', value: ['2026-05-12', '2026-05-12'] })

		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		await userEvent.keyboard('{Enter}{ArrowRight}{ArrowRight}{Enter}')

		await expect.poll(isOpen).toBe(false)
		expect(ctrl.value).toEqual(['2026-05-12', '2026-05-14'])
		expect(segment('day', '.so-date-picker__end').textContent).toBe('14')
		// Открыли кнопкой: возврат — в поле, у диапазона — на начало
		await expect.poll(active).toBe(segment('month', '.so-date-picker__start'))
	})

	/**
	 * Ширина коробки диапазона. Раскладка субпиксельная, поэтому сверка — с
	 * допуском в долю пикселя; рост, который сторожится, крупнее — без минимума
	 * ряда поля начала коробка прыгала на 5–32 px между подсказкой и датой.
	 */
	it('коробка не меняет ширину, пока даты набирают', async () => {
		await show({ mode: 'range' })

		const width = () => root().getBoundingClientRect().width
		const empty = width()

		await userEvent.click(segment('month', '.so-date-picker__start'))

		for (const key of '05122026') {
			await userEvent.keyboard(key)
			await nextTick()
			expect(width(), `начало, после «${key}»`).toBeCloseTo(empty, 0)
		}

		await userEvent.click(segment('month', '.so-date-picker__end'))

		for (const key of '05202026') {
			await userEvent.keyboard(key)
			await nextTick()
			expect(width(), `конец, после «${key}»`).toBeCloseTo(empty, 0)
		}
	})
})

/**
 * Кнопка очистки — DatePicker'а, одна на значение: у одной даты — первой в
 * слоте у конца поля, у диапазона — одна на период, своей колонкой коробки
 * перед кнопкой календаря. Форма — та же, что у очистки полей: квадрат со
 * стороной в строку слота на любом размере (`clear-button.ts`); у диапазона
 * строку слота коробки держит кнопка календаря. Нажатие очищает период
 * целиком, а фокус остаётся на кнопке: она вне частей, и их плагин указателя
 * её нажатия не трогает.
 */
describe('кнопка очистки', () => {
	const clear = () => find('.so-date-picker__clear')
	const placeholders = () =>
		[...document.querySelectorAll<HTMLElement>('.so-date-input__segment')].map(
			(part) => part.dataset.placeholder,
		)

	it.each(COMPONENT_SIZES)('%s, одна дата: квадрат в строку слота поля', async (size) => {
		await show({ size, clearable: true })

		expectClearSquare(clear(), find('.so-date-picker__field .so-date-input__trailing'), size)
	})

	it.each(COMPONENT_SIZES)(
		'%s, диапазон: квадрат кнопки календаря, перед ней, внутри коробки',
		async (size) => {
			await show({ size, mode: 'range', clearable: true })

			const own = clear().getBoundingClientRect()
			const next = trigger().getBoundingClientRect()
			const box = root().getBoundingClientRect()

			expectClearSquare(clear(), trigger(), size)
			expect(own.right, 'перед кнопкой календаря').toBeLessThanOrEqual(next.left)
			expect(own.top, 'в строку с кнопкой календаря').toBeCloseTo(next.top, 0)
			expect(own.left, 'после дат').toBeGreaterThan(
				find('.so-date-picker__end .so-date-input__segments').getBoundingClientRect().left,
			)
			expect(own.top, 'внутри коробки сверху').toBeGreaterThanOrEqual(box.top)
			expect(own.bottom, 'внутри коробки снизу').toBeLessThanOrEqual(box.bottom)
		},
	)

	it('диапазон: нажатие очищает оба конца, и набранный не до конца; фокус на кнопке', async () => {
		const ctrl = await show({ mode: 'range', clearable: true })

		// en-US: месяц, день, год — начало целиком, у конца только месяц
		await userEvent.click(segment('month', '.so-date-picker__start'))
		await userEvent.keyboard('05122026')
		await userEvent.click(segment('month', '.so-date-picker__end'))
		await userEvent.keyboard('05')

		expect(ctrl.start.value).toBe('2026-05-12')
		expect(ctrl.value).toBeUndefined()

		await userEvent.click(clear())

		expect(ctrl.start.value).toBeUndefined()
		expect(placeholders().every((placeholder) => placeholder === 'true')).toBe(true)
		expect(active()).toBe(clear())
	})
})

/**
 * Ошибку считает поле, а рамку рисует коробка диапазона: у полей внутри своей
 * рамки нет. Цвета темы спек не знает (`themes/oren/AGENTS.md`) и сверяет
 * отношение: рамка ошибки отличается от обычной и равна рамке варианта
 * `negative` — ошибка в теме выглядит одинаково, задал её потребитель или
 * посчитало ядро. Указатель перед чтением уводится с коробки: наведение красит
 * рамку на ступень темнее.
 */
describe('ошибка', () => {
	const border = async (): Promise<string> => {
		await userEvent.hover(find('.so-test-outside'))
		await nextFrame()
		await settled(root())

		return getComputedStyle(root()).borderColor
	}

	it('конец раньше начала — коробка диапазона в рамке ошибки', async () => {
		const ctrl = await show({ mode: 'range', value: ['2026-05-12', '2026-05-20'] })
		const valid = await border()

		// en-US: месяц, день, год — день конца 05 вместо 20
		await userEvent.click(segment('day', '.so-date-picker__end'))
		await userEvent.keyboard('05')

		// Набранное не прижимается: значение — как набрано, ошибка — у конца
		expect(ctrl.value).toEqual(['2026-05-12', '2026-05-05'])
		expect(find('.so-date-picker__end').dataset.invalid).toBe('true')
		expect(find('.so-date-picker__start').dataset.invalid).toBeUndefined()

		const invalid = await border()

		expect(invalid).not.toBe(valid)

		// Конец снова после начала — рамка обычная; вариант negative — та же,
		// что у ошибки
		ctrl.value = ['2026-05-12', '2026-05-20']
		expect(await border()).toBe(valid)

		ctrl.variant = 'negative'
		expect(await border()).toBe(invalid)
	})
})

describe('панель у края окна', () => {
	it('у правого края панель в окне и не сжата', async () => {
		await show({ value: '2026-05-12' })
		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		const natural = panel().getBoundingClientRect().width

		cleanup()

		await show({ value: '2026-05-12' }, 'end')
		await userEvent.click(trigger())
		await expect.poll(active).toBe(day('2026-05-12'))

		expectInsideWindow(panel(), 'панель')
		expect(panel().getBoundingClientRect().width).toBeCloseTo(natural, 0)
	})
})
