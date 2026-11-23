/**
 * Серверный рендер компонентов Solid: JSX собран для сервера, рисует его
 * `renderToString` из `solid-js/web` — как сервер приложения.
 *
 * Состояние на сервере приходит той же подпиской на связку, что и в браузере,
 * а эффекты не выполняются вовсе. Поэтому разметка сервера — это ровно то, что
 * компонент рисует с первой отрисовки: наборы ядра, классы и раскладка, — а
 * телепорта Frame нет, как у React и Svelte: содержимое в цели появляется на
 * клиенте.
 *
 * Гидратацию проверяет отдельный прогон пакета (`hydration` в
 * `vitest.config.ts`) — пока только у коллекций разметкой.
 */

import { describe, it, expect } from 'vitest'
import type { JSX } from 'solid-js'
import { renderToString } from 'solid-js/web'
import type {
	DescriptorSlots,
	MenuDescriptor,
	PopoverDescriptor,
	TooltipDescriptor,
} from '@soxa-ui/setup'
import {
	Button,
	CheckBox,
	ComponentView,
	DateInput,
	DatePicker,
	Dialog,
	AlertDialog,
	Drawer,
	Field,
	Frame,
	Icon,
	Input,
	Label,
	Menu,
	NumberInput,
	Pagination,
	Popover,
	ProgressLinear,
	ProgressSpinner,
	Rating,
	Scroller,
	Separator,
	Skeleton,
	Slider,
	Switch,
	Textarea,
	Toasts,
	Tooltip,
	roleIcon,
} from '@soxa-ui/solid'

/**
 * Разметка сервера без меток гидратации: ключи узлов (`data-hk`) и
 * комментарии вокруг вставок пишет Solid для гидратации, а проверяется сама
 * разметка. Классы Solid печатает с пробелом в конце (`class="so-button "`) —
 * место под `classList`.
 */
const markup = (html: string) =>
	html.replace(/<!--[\s\S]*?-->/g, '').replace(/ data-hk="[^"]*"/g, '')

describe('Frame · серверный рендер', () => {
	it('без contained — пусто: телепорта на сервере нет', () => {
		expect(markup(renderToString(() => <Frame visible>Панель</Frame>))).toBe('')
	})

	it('contained — на месте, вместе с содержимым и раскладкой', () => {
		const body = markup(
			renderToString(() => (
				<Frame contained visible>
					<span>Панель</span>
				</Frame>
			)),
		)

		expect(body).toMatch(/^<div [^>]*class="so-frame ?"/)
		expect(body).toContain('data-contained="true"')
		// Внутри контейнера — `absolute` без координат: место решает тема. Номера
		// слоя на сервере нет: его открывает узел, а счётчик у сервера свой
		expect(body).toMatch(/style="position:absolute;[^"]*z-index:0"/)
		expect(body).not.toContain('data-layer')
		expect(body).not.toMatch(/style="[^"]*\b(left|top):/)
		expect(body).toContain('<span>Панель</span>')
	})
})

/**
 * Popover и Tooltip на сервере: корень с триггером и связкой в его scope — она
 * собирается при сборке, и плагин связок пишет её и на сервере. Панель — их
 * Frame, и телепорта на сервере нет, как у Frame: панель появляется на
 * клиенте. С `contained` панель остаётся в корне, за триггером, — и на
 * сервере тоже.
 */
describe('Popover и Tooltip · серверный рендер', () => {
	type TPopoverScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']
	type TTooltipScope = DescriptorSlots<typeof TooltipDescriptor>['trigger']

	const popover = (contained: boolean) =>
		markup(
			renderToString(() => (
				<Popover
					contained={contained}
					trigger={(scope: TPopoverScope) => (
						<Button text="Открыть" {...scope.triggerAria} {...scope.triggerDataset} />
					)}
				>
					<span>Содержимое</span>
				</Popover>
			)),
		)

	it('Popover без contained — корень с триггером и связкой, панели нет', () => {
		const body = popover(false)

		expect(body).toMatch(/^<span [^>]*class="so-popover ?"/)
		expect(body).toMatch(/<button [^>]*aria-haspopup="dialog"/)
		expect(body).toContain('aria-expanded="false"')
		expect(body).toMatch(/aria-controls="[^"]+"/)
		expect(body).toContain('data-selected="false"')
		expect(body).not.toContain('so-popover__panel')
		expect(body).not.toContain('Содержимое')
	})

	it('Popover с contained — панель в корне, за триггером', () => {
		const body = popover(true)

		expect(body).toMatch(
			/^<span [^>]*class="so-popover ?"[^>]*><button [^>]*>[\s\S]*<\/button><div [^>]*class="so-frame so-popover__panel ?"/,
		)
		expect(body).toMatch(/<div [^>]*role="dialog"/)
		expect(body).toContain('data-contained="true"')
		expect(body).toContain('<div class="so-popover__content"><span>Содержимое</span></div>')
		// Ссылка триггера ведёт на панель рядом с ним
		const [, controls] = /aria-controls="([^"]+)"/.exec(body) ?? []

		expect(controls).toBeTruthy()
		expect(body).toContain(`id="${controls}"`)
	})

	it('Tooltip — корень с триггером и ссылкой на панель, панели нет', () => {
		const body = markup(
			renderToString(() => (
				<Tooltip
					trigger={(scope: TTooltipScope) => (
						<Button text="Сохранить" {...scope.triggerAria} />
					)}
				>
					Сохранить черновик
				</Tooltip>
			)),
		)

		expect(body).toMatch(/^<span [^>]*class="so-tooltip ?"/)
		expect(body).toMatch(/<button [^>]*aria-describedby="[^"]+"/)
		expect(body).not.toContain('so-tooltip__panel')
		expect(body).not.toContain('Сохранить черновик')
	})
})

/**
 * Dialog, Drawer и регион Toasts на сервере — как Frame: телепорта нет, и в
 * разметке их нет, а появляются они на клиенте. С `contained` выезжающая
 * панель остаётся на месте вместе с подложкой — и на сервере тоже. Приложение
 * менеджер тостов рисует всегда: оно вне телепорта.
 */
describe('Dialog, Drawer и Toasts · серверный рендер', () => {
	it('AlertDialog omits the server portal', () => {
		expect(markup(renderToString(() => <AlertDialog visible title="Delete?" />))).toBe('')
	})

	it('Dialog — пусто: телепорта на сервере нет', () => {
		const body = markup(
			renderToString(() => (
				<Dialog visible title="Настройки">
					<span>Панель</span>
				</Dialog>
			)),
		)

		expect(body).toBe('')
	})

	it('Drawer — пусто, а с contained — подложка и панель на месте', () => {
		const teleported = markup(
			renderToString(() => (
				<Drawer>
					<span>Панель</span>
				</Drawer>
			)),
		)
		const contained = markup(
			renderToString(() => (
				<Drawer contained>
					<span>Панель</span>
				</Drawer>
			)),
		)

		expect(teleported).toBe('')
		expect(contained).toMatch(
			/^<div [^>]*class="so-backdrop so-drawer__backdrop ?"[^>]*style="[^"]*display:none"[^>]*><\/div><div [^>]*role="dialog"/,
		)
		expect(contained).toMatch(/class="so-drawer so-drawer--placement-end ?"/)
		expect(contained).toContain('tabindex="-1"')
		expect(contained).toContain('data-contained="true"')
		expect(contained).toContain('<div class="so-drawer__body"><span>Панель</span></div>')
	})

	/**
	 * Номер слоя выдаёт счётчик процесса, и у сервера он свой: попади он в
	 * разметку, гидратация с клиентом не сошлась бы. Открывает номер узел, а на
	 * сервере узла нет — у открытой панели и её подложки номера нет, `z-index` — 0.
	 */
	it('Drawer с contained, открытый, — без номера слоя у панели и подложки', () => {
		const body = markup(
			renderToString(() => (
				<Drawer contained visible>
					<span>Панель</span>
				</Drawer>
			)),
		)

		expect(body.match(/data-open="true"/g)).toHaveLength(2)
		expect(body).not.toContain('data-layer')
		expect(body.match(/z-index:0\b/g)).toHaveLength(2)
	})

	it('Toasts — приложение без региона', () => {
		const body = markup(
			renderToString(() => (
				<Toasts>
					<span>Приложение</span>
				</Toasts>
			)),
		)

		expect(body).toBe('<span>Приложение</span>')
	})
})

/**
 * Menu на сервере — как Popover: корень с триггером и связкой в его scope, а
 * панель — Frame, и телепорта на сервере нет. Пункты стоят в панели, поэтому
 * их на сервере тоже нет: они собираются, когда портал впервые рисует
 * содержимое, — на клиенте. У контекстного меню связки «кнопка ↔ меню» нет.
 */
describe('Menu · серверный рендер', () => {
	type TMenuScope = DescriptorSlots<typeof MenuDescriptor>['trigger']

	const trigger = (scope: TMenuScope) => (
		<Button text="Действия" {...scope.triggerAria} {...scope.triggerDataset} />
	)

	it('у кнопки — корень с триггером и связкой, панели и пунктов нет', () => {
		const body = markup(
			renderToString(() => (
				<Menu trigger={trigger}>
					<Menu.Item value="edit" text="Изменить" />
				</Menu>
			)),
		)

		expect(body).toMatch(/^<span [^>]*class="so-menu[^"]*"/)
		expect(body).toMatch(/<button [^>]*aria-haspopup="menu"/)
		expect(body).toContain('aria-expanded="false"')
		expect(body).toMatch(/<button [^>]*aria-controls="[^"]+"/)
		expect(body).toMatch(/<button [^>]*\sid="[^"]+"/)
		expect(body).toContain('data-selected="false"')
		expect(body).not.toContain('so-menu__panel')
		expect(body).not.toContain('Изменить')
	})

	it('у пунктов из данных — так же: панели и пунктов нет', () => {
		const body = markup(
			renderToString(() => (
				<Menu items={[{ value: 'edit', text: 'Изменить' }]} trigger={trigger} />
			)),
		)

		expect(body).toMatch(/<button [^>]*aria-haspopup="menu"/)
		expect(body).not.toContain('so-menu__panel')
		expect(body).not.toContain('Изменить')
	})

	it('у контекстного меню — область без связки', () => {
		const body = markup(
			renderToString(() => (
				<Menu
					openOn="contextmenu"
					trigger={(scope: TMenuScope) => (
						<div class="so-test-area" {...scope.triggerAria}>
							Отчёт.pdf
						</div>
					)}
				/>
			)),
		)

		expect(body).toMatch(
			/^<span [^>]*class="so-menu[^"]*"[^>]*><div [^>]*class="so-test-area ?"/,
		)
		expect(body).not.toContain('aria-haspopup')
		expect(body).not.toContain('aria-expanded')
		expect(body).not.toContain('aria-controls')
		expect(body).not.toContain('so-menu__panel')
	})
})

/**
 * Поле даты и DatePicker на сервере. Части — разметка поля с наборами ядра, а
 * `id` частям пишет плагин связок от id монтирования, и на сервере тоже. Сервер
 * рисует части нередактируемыми: редактируемыми их делает касание. Текст части
 * — свойство `textContent` узла, и сервер Solid печатает его содержимым узла.
 * Панель DatePicker — телепортированный Frame, и на сервере её нет, как у
 * Select: появится она на клиенте, а связка кнопки календаря с ней — уже в
 * разметке сервера.
 */
describe('DateInput и DatePicker · серверный рендер', () => {
	/** Части поля по порядку — с открывающим тегом и текстом. */
	const segmentsOf = (body: string) =>
		body.match(/<span class="so-date-input__segment ?"[^>]*>[^<]*<\/span>/g) ?? []

	/** Тип части — по её `data-type`. */
	const typeOf = (segment: string) => /data-type="([^"]+)"/.exec(segment)?.[1]

	it('DateInput — группа, части с id и текстом, нередактируемые; значение — в скрытом поле', () => {
		const body = markup(renderToString(() => <DateInput value="2026-05-12" name="birthday" />))
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
		expect(body).toMatch(
			/<span class="so-date-input__literal ?" aria-hidden="true" ?>\/<\/span>/,
		)
		expect(body).toContain('<input type="hidden" name="birthday" value="2026-05-12">')
	})

	it('DatePicker — поле и кнопка календаря со связкой, панели и календаря нет', () => {
		const body = markup(renderToString(() => <DatePicker value="2026-09-10" />))
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
		const body = markup(renderToString(() => <DatePicker mode="range" aria_label="Поездка" />))

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
			renderToString(() => (
				<Button text="Сохранить" size="lg" variant="brand" class="app-save" />
			)),
		)

		expect(body).toMatch(/^<button /)
		expect(body).toMatch(
			/class="so-button so-button--size-lg so-button--variant-brand app-save ?"/,
		)
		expect(body).toContain('data-disabled="false"')
		expect(body).toContain('<span class="so-button__text">Сохранить</span>')
	})

	it('выключенная: нативный disabled на <button>, aria-disabled — на другом теге', () => {
		const native = markup(renderToString(() => <Button disabled />))
		const link = markup(renderToString(() => <Button tag="a" disabled />))

		expect(native).toMatch(/^<button [^>]*\bdisabled\b/)
		expect(native).toContain('data-disabled="true"')
		expect(link).toMatch(/^<a [^>]*aria-disabled="true"/)
		expect(link).not.toMatch(/^<a [^>]* disabled/)
	})

	it('скрытая — display: none в стиле корня', () => {
		const body = markup(renderToString(() => <Button visible={false} />))

		expect(body).toMatch(/^<button [^>]*style="display:none"/)
	})
})

describe('стиль и наборы на сервере', () => {
	it('Icon по роли — <svg> иконки с размером и скрытием от скринридера', () => {
		const body = markup(renderToString(() => <Icon tag={roleIcon('check')} width={20} />))

		expect(body).toMatch(/^<svg [^>]*class="so-icon so-icon--size-normal ?"/)
		expect(body).toContain('aria-hidden="true"')
		// Пустое значение (`height: ''` без размера) свойства не задаёт
		expect(body).toContain('style="width:20px"')
		expect(body).toContain('<path')
	})

	it('ProgressSpinner — доля в стиле корня, роль и значения', () => {
		const body = markup(renderToString(() => <ProgressSpinner value={40} />))

		expect(body).toMatch(/^<span [^>]*role="progressbar"/)
		expect(body).toContain('aria-valuenow="40"')
		expect(body).toContain('style="--so-progress-spinner-fraction:0.4"')
	})

	it('ProgressLinear — доля в стиле корня, роль, значения и заливка', () => {
		const body = markup(renderToString(() => <ProgressLinear value={40} />))

		expect(body).toMatch(/^<span [^>]*role="progressbar"/)
		expect(body).toContain('aria-valuenow="40"')
		expect(body).toContain('style="--so-progress-linear-percent:40%"')
		expect(body).toContain('<span class="so-progress-linear__range"></span>')
	})

	it('Skeleton — заглушка и содержимое, корень не скрыт', () => {
		const body = markup(
			renderToString(() => (
				<Skeleton>
					<span>Панель</span>
				</Skeleton>
			)),
		)

		expect(body).toContain('<div class="so-skeleton__placeholder" aria-hidden="true"></div>')
		expect(body).toContain('aria-busy="true"')
		expect(body).toContain('<span>Панель</span>')
		expect(body).not.toContain('display:none')
	})
})

/**
 * Ползунок и оценка на сервере: поле со значением — атрибутом `value`, его
 * отдаёт `fieldText` вместо `ref`. Ход, позиции и доли — в той же разметке,
 * так что первый кадр клиента их уже видит.
 */
describe('Slider и Rating · серверный рендер', () => {
	it('Slider — ручка на значение: позиция, поле с ходом и значением, подсказка', () => {
		const body = markup(renderToString(() => <Slider value={[20, 80]} tooltip="always" />))

		expect(body).toMatch(/^<span [^>]*role="group"/)
		expect(body).toContain('style="--so-slider-range-start:20%;--so-slider-range-end:80%"')
		expect(body.match(/<input [^>]*>/g)).toEqual([
			expect.stringMatching(/min="0" max="80" step="1"[^>]* value="20"/),
			expect.stringMatching(/min="20" max="100" step="1"[^>]* value="80"/),
		])
		expect(body.match(/style="--so-slider-position:\d+%"/g)).toEqual([
			'style="--so-slider-position:20%"',
			'style="--so-slider-position:80%"',
		])
		expect(body).toContain('<span class="so-slider__tooltip" aria-hidden="true">20</span>')
	})

	it('Rating — звёзды с долей заливки и поле со значением и тем, как оно звучит', () => {
		const body = markup(renderToString(() => <Rating value={2} max={3} />))

		expect(body.match(/--so-rating-fraction:[\d.]+/g)).toEqual([
			'--so-rating-fraction:1',
			'--so-rating-fraction:1',
			'--so-rating-fraction:0',
		])
		expect(body.match(/<svg [^>]*class="so-rating__icon ?"/g)).toHaveLength(6)
		expect(body).toMatch(/<input [^>]*min="0" max="3" step="1"[^>]*value="2"/)
		expect(body).toContain('aria-valuetext="2 of 3"')
	})
})

describe('Scroller · серверный рендер', () => {
	/** Имена кнопок пишет плагин имён при сборке, а она идёт и на сервере. */
	it('кнопки с именами и вьюпорт с содержимым', () => {
		const body = markup(
			renderToString(() => (
				<Scroller>
					<span>Пункт</span>
				</Scroller>
			)),
		)

		expect(body).toMatch(/^<div [^>]*data-can-prev="false"[^>]*data-can-next="false"/)
		expect(body).toContain('aria-label="Scroll back"')
		expect(body).toContain('aria-label="Scroll forward"')
		expect(body).toMatch(/<div class="so-scroller__viewport ?" ><span>Пункт<\/span><\/div>/)
	})
})

describe('Label · серверный рендер', () => {
	/**
	 * Подпись — корень `label`, контрол внутри, потом текст: связка с полем —
	 * вложение, и она есть с первой отрисовки, без `for` и `id`.
	 */
	it('корень label, контрол, потом текст', () => {
		const body = markup(
			renderToString(() => (
				<Label text="Согласен">
					<CheckBox value />
				</Label>
			)),
		)

		expect(body).toMatch(
			/^<label [^>]*class="so-label so-label--size-normal so-label--position-end ?"/,
		)
		expect(body).toMatch(
			/<span class="so-label__control"><span [^>]*class="so-check-box[^"]*"[^>]*><input [^>]*type="checkbox"[^>]*checked/,
		)
		expect(body).toContain('<span class="so-label__text">Согласен</span>')
		expect(body).not.toMatch(/\sfor=/)
	})

	it('без текста обёртка текста пуста', () => {
		const body = markup(renderToString(() => <Label />))

		expect(body).toContain('<span class="so-label__text"></span>')
	})
})

/**
 * `ref` потребителя — корень компонента, и отдаёт его `ref` адаптера, когда
 * узел создан. На сервере узлов нет, и `ref` Solid не зовёт: ни вызова, ни
 * атрибута в разметке.
 */
describe('ref потребителя · серверный рендер', () => {
	/** Компонент и пропсы, без которых его корня нет: у Icon тега по умолчанию нет. */
	const ROOTS: ReadonlyArray<readonly [string, (ref?: (node: Element) => void) => JSX.Element]> =
		[
			['Button', (ref) => <Button ref={ref} />],
			['ComponentView', (ref) => <ComponentView ref={ref} />],
			['Field', (ref) => <Field ref={ref} />],
			['Frame', (ref) => <Frame contained visible ref={ref} />],
			['Popover', (ref) => <Popover ref={ref} />],
			['Tooltip', (ref) => <Tooltip ref={ref} />],
			['Dialog', (ref) => <Dialog ref={ref} />],
			['Drawer', (ref) => <Drawer contained ref={ref} />],
			['Toasts', (ref) => <Toasts ref={ref} />],
			['Menu', (ref) => <Menu ref={ref} />],
			['Icon', (ref) => <Icon tag="i" ref={ref} />],
			['Label', (ref) => <Label ref={ref} />],
			['ProgressLinear', (ref) => <ProgressLinear ref={ref} />],
			['ProgressSpinner', (ref) => <ProgressSpinner ref={ref} />],
			['Skeleton', (ref) => <Skeleton ref={ref} />],
			['Input', (ref) => <Input ref={ref} />],
			['NumberInput', (ref) => <NumberInput value={5} clearable ref={ref} />],
			['DateInput', (ref) => <DateInput value="2026-05-12" clearable ref={ref} />],
			['DatePicker', (ref) => <DatePicker value="2026-05-12" ref={ref} />],
			['Textarea', (ref) => <Textarea value="текст" counter ref={ref} />],
			['CheckBox', (ref) => <CheckBox ref={ref} />],
			['Switch', (ref) => <Switch ref={ref} />],
			['Slider', (ref) => <Slider ref={ref} />],
			['Rating', (ref) => <Rating ref={ref} />],
			['Scroller', (ref) => <Scroller ref={ref} />],
			['Pagination', (ref) => <Pagination total={30} ref={ref} />],
		]

	/**
	 * Разметка без номера слоя: слой (`data-layer`, `z-index`) панель берёт из
	 * общего счётчика показанных панелей, и у второй отрисовки он следующий.
	 */
	const layout = (html: string) =>
		markup(html)
			.replace(/data-layer="\d+"/g, 'data-layer')
			.replace(/z-index:\d+/g, 'z-index')

	it.each(ROOTS)('%s: ref не зовётся, разметка — та же', (_name, draw) => {
		const nodes: Element[] = []
		const body = layout(renderToString(() => draw((node) => nodes.push(node))))

		expect(nodes).toHaveLength(0)
		expect(body).toBe(layout(renderToString(() => draw())))
	})
})

it('renders separator semantics on the server in both modes', () => {
	const semantic = markup(renderToString(() => <Separator orientation="vertical" />))
	const decorative = markup(renderToString(() => <Separator decorative />))

	expect(semantic).toContain('role="separator"')
	expect(semantic).toContain('aria-orientation="vertical"')
	expect(decorative).toContain('role="none"')
	expect(decorative).not.toContain('aria-orientation')
})
