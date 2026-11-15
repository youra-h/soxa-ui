/**
 * Серверный рендер компонентов Angular и гидратация его разметки.
 *
 * Сервер — `renderApplication` из `@angular/platform-server`, как в
 * приложении, браузер — `bootstrapApplication` с `provideClientHydration` над
 * разметкой сервера (`server.ts`). Эффекты базы компонента выполняются и на
 * сервере, поэтому разметка сервера несёт классы, наборы и стиль ядра на теге,
 * который написал потребитель. Слой (Frame) есть только в браузере, как
 * оверлей CDK: эффектов после отрисовки на сервере нет, и от него в разметке
 * сервера — только пустой скрытый элемент потребителя.
 *
 * После гидратации всё, что называет ядро, база берёт своим поверх разметки
 * сервера (`root-attributes.ts`): смена входа меняет классы, наборы и стиль, а
 * не копит их рядом с напечатанными.
 *
 * Разметка сервера проверяется разобранной документом, как её получил бы
 * браузер: порядок атрибутов у сервера свой, а важно, что на каком узле стоит.
 */

import { describe, it, expect, afterEach, vi } from 'vitest'
import { Component, signal, viewChild, type ApplicationRef, type Type } from '@angular/core'
import { TButton, type TComponentSize } from '@soxa-ui/core'
import { TBasePlugin, TElementPlugin, type IPluginContext } from '@soxa-ui/plugins'
import { getIcon, usePlugins } from '@soxa-ui/setup'
import {
	AttributesDirective,
	RoleIconDirective,
	SlotDirective,
	TButtonComponent,
	TAvatarComponent,
	TAvatarGroupComponent,
	TDateInputComponent,
	TDatePickerComponent,
	TDialogComponent,
	TDrawerComponent,
	TFrameComponent,
	TIconComponent,
	TPopoverComponent,
	TProgressLinearComponent,
	TProgressSpinnerComponent,
	TRatingComponent,
	TScrollerComponent,
	TSkeletonComponent,
	TSliderComponent,
	TToastsComponent,
	TTooltipComponent,
	useToasts,
} from '@soxa-ui/angular'
import { find, nextFrame } from './mount'
import { hydrate, leavePage, loadPage, renderOnServer } from './server'

/** Пространство имён SVG: в нём документ разбирает рисунок иконки. */
const SVG = 'http://www.w3.org/2000/svg'

/** Страница сервера, разобранная документом, — как её получил бы браузер. */
async function serverPage(app: Type<unknown>): Promise<Document> {
	return new DOMParser().parseFromString(await renderOnServer(app), 'text/html')
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TButtonComponent],
	template: `<button
			so-button
			text="Сохранить"
			size="lg"
			variant="brand"
			class="app-save"
		></button>
		<button so-button disabled class="native"></button>
		<a so-button href="/next" disabled></a>
		<button so-button [visible]="false" style="color: red" class="hidden"></button>`,
})
class ButtonPage {}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TIconComponent, RoleIconDirective],
	template: `<svg so-icon so-role-icon="check" [width]="20"></svg>`,
})
class IconPage {}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TProgressSpinnerComponent],
	template: `<span so-progress-spinner [value]="40"></span>`,
})
class ProgressSpinnerPage {}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TSkeletonComponent],
	template: `<div so-skeleton><span class="content">Панель</span></div>`,
})
class SkeletonPage {}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TFrameComponent],
	template: `<section class="place">
		<div so-frame visible class="layer">Слой</div>
		<div so-frame contained visible class="inside"><span>Внутри</span></div>
	</section>`,
})
class FramePage {}

describe('серверный рендер', () => {
	it('Button — классы ядра и потребителя на его теге, наборы и текст', async () => {
		const page = await serverPage(ButtonPage)
		const button = find(page, '.app-save', HTMLButtonElement)

		expect([...button.classList]).toEqual(
			expect.arrayContaining([
				'app-save',
				'so-button',
				'so-button--size-lg',
				'so-button--variant-brand',
			]),
		)
		expect(button.getAttribute('data-disabled')).toBe('false')
		expect(button.querySelector('.so-button__text')?.textContent).toBe('Сохранить')
		// Атрибут с именем входа — запись входа, а не атрибут корня, и на сервере
		expect(button.hasAttribute('text')).toBe(false)
		expect(button.hasAttribute('size')).toBe(false)
	})

	it('Button выключенная: нативный disabled на <button>, aria-disabled — на другом теге', async () => {
		const page = await serverPage(ButtonPage)
		const native = find(page, '.native', HTMLButtonElement)
		const link = find(page, 'a[so-button]', HTMLAnchorElement)

		expect(native.getAttribute('disabled')).toBe('disabled')
		expect(native.hasAttribute('aria-disabled')).toBe(false)
		expect(native.getAttribute('data-disabled')).toBe('true')
		expect(link.getAttribute('href')).toBe('/next')
		expect(link.getAttribute('aria-disabled')).toBe('true')
		expect(link.getAttribute('role')).toBe('button')
		expect(link.hasAttribute('disabled')).toBe(false)
	})

	it('Button скрытая — display: none рядом со стилем потребителя', async () => {
		const page = await serverPage(ButtonPage)
		const hidden = find(page, '.hidden', HTMLButtonElement)

		expect(hidden.style.display).toBe('none')
		expect(hidden.style.color).toBe('red')
	})

	it('Icon по роли — <svg> с рисунком роли, размером и скрытием от скринридера', async () => {
		const page = await serverPage(IconPage)
		const svg = find(page, 'svg[so-icon]', SVGSVGElement)
		const source = getIcon('check')

		expect(svg.getAttribute('class')).toBe('so-icon so-icon--size-normal')
		expect(svg.getAttribute('aria-hidden')).toBe('true')
		expect(svg.style.width).toBe('20px')
		expect(svg.getAttribute('viewBox')).toBe(source.viewBox)
		expect(svg.querySelector('path')?.namespaceURI).toBe(SVG)
	})

	it('ProgressSpinner — доля в стиле корня, роль и значения', async () => {
		const page = await serverPage(ProgressSpinnerPage)
		const spinner = find(page, '[so-progress-spinner]', HTMLSpanElement)

		expect(spinner.getAttribute('role')).toBe('progressbar')
		expect(spinner.getAttribute('aria-valuenow')).toBe('40')
		expect(spinner.style.getPropertyValue('--so-progress-spinner-fraction')).toBe('0.4')
	})

	it('Skeleton — заглушка и содержимое, корень не скрыт', async () => {
		const page = await serverPage(SkeletonPage)
		const skeleton = find(page, '[so-skeleton]', HTMLDivElement)

		expect(
			skeleton.querySelector('.so-skeleton__placeholder')?.getAttribute('aria-hidden'),
		).toBe('true')
		expect(skeleton.getAttribute('aria-busy')).toBe('true')
		expect(skeleton.querySelector('.content')?.textContent).toBe('Панель')
		expect(skeleton.style.display).toBe('')
	})

	/**
	 * Слой есть только в браузере, как оверлей CDK. Убрать элемент потребителя
	 * компонент не может, поэтому на сервере от панели остаётся сам этот
	 * элемент — на месте, скрытый и без содержимого, — а от ядра на нём нет
	 * ничего: ни классов, ни наборов, ни раскладки.
	 */
	it.each([
		['без contained', '.layer'],
		['с contained', '.inside'],
	])(
		'Frame %s на сервере не рисуется: пустой скрытый элемент потребителя',
		async (_case, selector) => {
			const page = await serverPage(FramePage)
			const frame = find(page, selector, HTMLDivElement)

			expect(frame.parentElement?.className).toBe('place')
			expect(frame.style.display).toBe('none')
			expect(frame.textContent).toBe('')
			expect(frame.children).toHaveLength(0)
			expect([...frame.classList]).toEqual([selector.slice(1)])
			expect(frame.hasAttribute('data-open')).toBe(false)
			expect(frame.hasAttribute('data-layer')).toBe(false)
			expect(frame.hasAttribute('data-contained')).toBe(false)
			expect(frame.style.position).toBe('')
			expect(frame.style.zIndex).toBe('')
		},
	)

	/**
	 * Узел плагинам — только в браузере, как у остальных адаптеров: на сервере
	 * ни рефы, ни attachment-ы не зовутся. Узел эмуляции DOM сервера плагинам
	 * ни к чему — мерить его и слушать на нём нечего, — а без
	 * `requestAnimationFrame` в Node `TElementPlugin` не объявил бы его вовсе.
	 */
	it('на сервере TElementPlugin узла не получает', async () => {
		const bind = vi.spyOn(TElementPlugin.prototype, 'element', 'set')

		try {
			await renderOnServer(ButtonPage)

			// Уничтожение приложения сервера узел снимает — `null`, но не отдаёт
			expect(bind.mock.calls.filter(([el]) => el !== null)).toEqual([])
		} finally {
			bind.mockRestore()
		}
	})
})

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TButtonComponent,
		TIconComponent,
		RoleIconDirective,
		TSkeletonComponent,
		TFrameComponent,
	],
	template: `<button so-button text="Сохранить"></button>
		<svg so-icon so-role-icon="check"></svg>
		<div so-skeleton><span>Панель</span></div>
		<section class="place">
			<div so-frame visible class="layer">
				<button so-button text="Слой" class="inner"></button>
			</div>
		</section>`,
})
class HydrationPage {}

describe('гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	/**
	 * Гидратация берёт узлы, которые напечатал сервер, а не рисует свои: тот же
	 * узел до и после — признак того, что она прошла, а не откатилась к
	 * отрисовке с нуля. О расхождении разметки Angular сообщает ошибкой или
	 * предупреждением в консоль. Содержимого панели в разметке сервера нет, и
	 * его Angular создаёт заново: узлы проекции, которых сервер не вставил,
	 * гидратация не ищет.
	 */
	it('узлы сервера переиспользуются, ошибок и предупреждений нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(HydrationPage))

		const button = find(document, '[so-button]', HTMLButtonElement)
		const svg = find(document, 'svg[so-icon]', SVGSVGElement)
		const skeleton = find(document, '[so-skeleton]', HTMLDivElement)
		const layer = find(document, '.layer', HTMLDivElement)
		const app = await hydrate(HydrationPage)

		await app.whenStable()

		expect(find(document, '[so-button]', HTMLButtonElement)).toBe(button)
		expect(find(document, 'svg[so-icon]', SVGSVGElement)).toBe(svg)
		expect(find(document, '[so-skeleton]', HTMLDivElement)).toBe(skeleton)
		expect(find(document, '.layer', HTMLDivElement)).toBe(layer)
		expect(button.querySelector('.so-button__text')?.textContent).toBe('Сохранить')
		expect(svg.getAttribute('viewBox')).toBe(getIcon('check').viewBox)
		expect(layer.querySelector('.inner .so-button__text')?.textContent).toBe('Слой')
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/** Страница, которая меняет входы после гидратации. */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TButtonComponent, TProgressSpinnerComponent, TFrameComponent],
	template: `<button so-button text="Сохранить" [size]="size()"></button>
		<div so-button class="app-div" [disabled]="disabled()"></div>
		<span so-progress-spinner [value]="value()"></span>
		<section class="place">
			<div so-frame visible class="layer" [x]="x()" [y]="20"><b>Слой</b></div>
			<div so-frame class="menu" [visible]="open()" [x]="30" [y]="40">Меню</div>
		</section>`,
})
class ChangesPage {
	readonly size = signal<TComponentSize>('normal')
	readonly disabled = signal(true)
	readonly value = signal(40)
	readonly x = signal(10)
	readonly open = signal(false)
}

/** Разметка сервера в документе и гидратация над ней: приложение браузера и его страница. */
async function hydrated(): Promise<{ app: ApplicationRef; page: ChangesPage }> {
	loadPage(await renderOnServer(ChangesPage))

	const app = await hydrate(ChangesPage)

	await app.whenStable()

	const page: unknown = app.components[0]?.instance

	if (!(page instanceof ChangesPage)) throw new Error('Корень приложения — не ChangesPage')

	return { app, page }
}

/**
 * После гидратации на корне стоит всё, что напечатал сервер, а память базы
 * пуста. Всё, что называет ядро, база берёт своим поверх разметки сервера,
 * поэтому смена входа меняет классы, наборы и стиль, а не оставляет
 * напечатанное рядом с новым.
 */
describe('после гидратации', () => {
	afterEach(() => {
		leavePage()
	})

	/**
	 * Без статического `class` в разметке потребителя гидратация оставляет на
	 * узле классы, которые напечатал сервер: свою статику Angular пишет на узел
	 * заново, только когда она есть.
	 */
	it('Button: смена size меняет модификатор, а не добавляет второй', async () => {
		const { app, page } = await hydrated()
		const button = find(document, 'button[so-button]', HTMLButtonElement)

		expect(button.classList).toContain('so-button--size-normal')

		page.size.set('xl')
		await app.whenStable()

		expect([...button.classList]).toEqual(['so-button', 'so-button--size-xl'])
	})

	it('Button: включение <div so-button disabled> снимает aria-disabled и возвращает tabindex', async () => {
		const { app, page } = await hydrated()
		const div = find(document, '.app-div', HTMLDivElement)

		expect(div.getAttribute('aria-disabled')).toBe('true')
		expect(div.getAttribute('data-disabled')).toBe('true')
		expect(div.hasAttribute('tabindex')).toBe(false)

		page.disabled.set(false)
		await app.whenStable()

		expect(div.hasAttribute('aria-disabled')).toBe(false)
		expect(div.getAttribute('data-disabled')).toBe('false')
		expect(div.getAttribute('tabindex')).toBe('0')
		expect(div.getAttribute('role')).toBe('button')
		// Чего ядро не называет, база не трогает
		expect(div.classList).toContain('app-div')
	})

	it('ProgressSpinner: доля в стиле корня идёт за значением', async () => {
		const { app, page } = await hydrated()
		const spinner = find(document, '[so-progress-spinner]', HTMLSpanElement)

		expect(spinner.style.getPropertyValue('--so-progress-spinner-fraction')).toBe('0.4')

		page.value.set(60)
		await app.whenStable()

		expect(spinner.style.getPropertyValue('--so-progress-spinner-fraction')).toBe('0.6')
		expect(spinner.getAttribute('aria-valuenow')).toBe('60')
	})

	/**
	 * На сервере слоя нет, и номер слоя у браузера свой: `z-index` и
	 * `data-layer` — от слоя браузера, без следов сервера. Номер открывает узел
	 * слоя — кадром после того, как база отдала его плагинам.
	 */
	it('Frame: в цели тем же узлом, с содержимым, слоем и раскладкой браузера', async () => {
		loadPage(await renderOnServer(ChangesPage))

		const layer = find(document, '.layer', HTMLDivElement)
		const app = await hydrate(ChangesPage)

		await app.whenStable()
		await nextFrame()
		await app.whenStable()

		expect(find(document, '.layer', HTMLDivElement)).toBe(layer)
		expect(layer.parentElement).toBe(document.body)
		expect(layer.style.display).toBe('')
		expect(layer.querySelector('b')?.textContent).toBe('Слой')
		expect(layer.classList).toContain('so-frame')
		expect(layer.getAttribute('data-open')).toBe('true')
		expect(layer.getAttribute('data-layer')).not.toBeNull()
		expect(layer.style.zIndex).toBe(layer.getAttribute('data-layer'))
		expect(layer.style.position).toBe('fixed')
		expect(layer.style.left).toBe('10px')
		expect(layer.style.top).toBe('20px')
	})

	it('Frame: смена координат после гидратации доходит до узла', async () => {
		const { app, page } = await hydrated()
		const layer = find(document, '.layer', HTMLDivElement)

		page.x.set(40)
		await app.whenStable()

		expect(layer.style.left).toBe('40px')
		expect(layer.style.top).toBe('20px')
	})

	/**
	 * Показ после гидратации поднимает слой браузера в обоих местах — с кадром
	 * узла: показ пришёл раньше, чем база отдала узел плагинам.
	 */
	it('Frame: показ после гидратации — открытость, слой и раскладка на узле', async () => {
		const { app, page } = await hydrated()
		const menu = find(document, '.menu', HTMLDivElement)

		expect(menu.parentElement).toBe(document.body)
		expect(menu.style.display).toBe('none')
		expect(menu.getAttribute('data-open')).toBe('false')

		page.open.set(true)
		await app.whenStable()
		await nextFrame()
		await app.whenStable()

		const layer = menu.getAttribute('data-layer')

		expect(menu.style.display).toBe('')
		expect(menu.getAttribute('data-open')).toBe('true')
		expect(layer).not.toBeNull()
		expect(menu.style.zIndex).toBe(layer)
		expect(menu.style.left).toBe('30px')
		expect(menu.style.top).toBe('40px')
		expect(menu.textContent).toBe('Меню')
	})
})

/** Id монтирования, которые наборы кнопок выдали плагинам при сборке, по порядку. */
const mountIds: string[] = []

/** Плагин-зонд: запоминает `id` части, который строит его контекст. */
class TMountIdProbePlugin extends TBasePlugin<TButton> {
	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)

		mountIds.push(ctx.createId('probe'))
	}
}

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TButtonComponent],
	template: `<button so-button></button><button so-button></button>`,
})
class IdsPage {}

/**
 * Кнопка в панели Frame: на сервере панели нет, и её содержимое не попадает в
 * разметку, но собирается — проекцию создаёт шаблон страницы, а не Frame.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TButtonComponent, TFrameComponent],
	template: `<button so-button></button>
		<div so-frame visible><button so-button></button></div>
		<button so-button></button>`,
})
class FrameIdsPage {}

describe('id монтирования', () => {
	let dispose: (() => void) | undefined

	afterEach(() => {
		dispose?.()
		dispose = undefined
		mountIds.length = 0
		leavePage()
	})

	/**
	 * Id монтирования — номер сборки компонента в его приложении, с префиксом
	 * `APP_ID` (по умолчанию `ng`). Приложение у каждого запроса и у браузера
	 * своё, а гидратация собирает компоненты в том же порядке, что и сервер,
	 * поэтому номера у них сходятся. Счётчик процесса тут не годится: рендер
	 * сервера уже сдвинул бы его, и браузер получил бы другие номера.
	 */
	it('у сервера и браузера одни и те же id, у каждого монтирования свой', async () => {
		dispose = usePlugins(TButton, [TMountIdProbePlugin])

		loadPage(await renderOnServer(IdsPage))

		const server = mountIds.splice(0)

		await hydrate(IdsPage)

		expect(server).toEqual(['ng-1-probe', 'ng-2-probe'])
		expect(mountIds).toEqual(server)
	})

	/**
	 * Содержимое панели на сервере собирается, хотя в разметку не попадает, а
	 * в браузере Angular создаёт его заново: номера тех, кто после панели, у
	 * сервера и браузера всё равно одни.
	 */
	it('кнопка в панели Frame и после неё — те же id у сервера и браузера', async () => {
		dispose = usePlugins(TButton, [TMountIdProbePlugin])

		loadPage(await renderOnServer(FrameIdsPage))

		const server = mountIds.splice(0)
		const app = await hydrate(FrameIdsPage)

		await app.whenStable()

		// Номер 2 — у самой панели
		expect(server).toEqual(['ng-1-probe', 'ng-3-probe', 'ng-4-probe'])
		expect(mountIds).toEqual(server)
	})

	it('второй рендер сервера — своё приложение: номера с начала', async () => {
		dispose = usePlugins(TButton, [TMountIdProbePlugin])

		await renderOnServer(IdsPage)
		await renderOnServer(IdsPage)

		expect(mountIds).toEqual(['ng-1-probe', 'ng-2-probe', 'ng-1-probe', 'ng-2-probe'])
	})
})

/**
 * Полоса, ползунок, оценка и лента на сервере: доля, позиции, ход полей и
 * имена — в разметке сервера, а значение поля — атрибутом `value`: его пишет
 * директива текста поля в узел эмуляции. Первый кадр браузера их уже видит.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TProgressLinearComponent, TSliderComponent, TRatingComponent, TScrollerComponent],
	template: `<span so-progress-linear [value]="40"></span>
		<span so-slider [value]="sliderValue()" tooltip="always"></span>
		<span so-rating [value]="2" [max]="3"></span>
		<div so-scroller><span class="item">Пункт</span></div>`,
})
class ControlsPage {
	readonly sliderValue = signal([20, 80])
}

describe('ProgressLinear, Slider, Rating и Scroller · серверный рендер', () => {
	it('ProgressLinear — доля в стиле корня, роль, значения и заливка', async () => {
		const page = await serverPage(ControlsPage)
		const bar = find(page, '[so-progress-linear]', HTMLSpanElement)

		expect(bar.getAttribute('role')).toBe('progressbar')
		expect(bar.getAttribute('aria-valuenow')).toBe('40')
		expect(bar.style.getPropertyValue('--so-progress-linear-percent')).toBe('40%')
		expect([...bar.children].map((child) => child.className)).toEqual([
			'so-progress-linear__range',
		])
	})

	it('Slider — группа, ручка на значение: позиция, поле с ходом и значением, подсказка', async () => {
		const page = await serverPage(ControlsPage)
		const slider = find(page, '[so-slider]', HTMLSpanElement)
		const range = find(slider, '.so-slider__range', HTMLSpanElement)
		const fields = [...slider.querySelectorAll('input')]

		expect(slider.getAttribute('role')).toBe('group')
		expect(range.style.getPropertyValue('--so-slider-range-start')).toBe('20%')
		expect(range.style.getPropertyValue('--so-slider-range-end')).toBe('80%')
		expect(
			fields.map((field) =>
				['min', 'max', 'step', 'value'].map((name) => field.getAttribute(name)),
			),
		).toEqual([
			['0', '80', '1', '20'],
			['20', '100', '1', '80'],
		])
		expect(
			[...slider.querySelectorAll<HTMLElement>('.so-slider__thumb')].map((thumb) =>
				thumb.style.getPropertyValue('--so-slider-position'),
			),
		).toEqual(['20%', '80%'])
		expect(
			[...slider.querySelectorAll('.so-slider__tooltip')].map(
				(tooltip) => tooltip.textContent,
			),
		).toEqual(['20', '80'])
	})

	it('Rating — звёзды с долей заливки, значки и поле со значением и тем, как оно звучит', async () => {
		const page = await serverPage(ControlsPage)
		const rating = find(page, '[so-rating]', HTMLSpanElement)
		const field = find(rating, 'input', HTMLInputElement)

		expect(
			[...rating.querySelectorAll<HTMLElement>('.so-rating__star')].map((star) =>
				star.style.getPropertyValue('--so-rating-fraction'),
			),
		).toEqual(['1', '1', '0'])
		expect(rating.querySelectorAll('svg.so-rating__icon')).toHaveLength(6)
		expect(['min', 'max', 'step', 'value'].map((name) => field.getAttribute(name))).toEqual([
			'0',
			'3',
			'1',
			'2',
		])
		expect(field.getAttribute('aria-valuetext')).toBe('2 of 3')
	})

	/** Имена кнопок пишет плагин имён при сборке, а она идёт и на сервере. */
	it('Scroller — кнопки с именами и вьюпорт с содержимым', async () => {
		const page = await serverPage(ControlsPage)
		const scroller = find(page, '[so-scroller]', HTMLDivElement)

		expect(scroller.getAttribute('data-can-prev')).toBe('false')
		expect(scroller.getAttribute('data-can-next')).toBe('false')
		expect(
			find(scroller, '.so-scroller__prev', HTMLButtonElement).getAttribute('aria-label'),
		).toBe('Scroll back')
		expect(
			find(scroller, '.so-scroller__next', HTMLButtonElement).getAttribute('aria-label'),
		).toBe('Scroll forward')
		expect(
			[...find(scroller, '.so-scroller__viewport', HTMLDivElement).children].map(
				(child) => child.className,
			),
		).toEqual(['item'])
	})
})

describe('ProgressLinear, Slider, Rating и Scroller · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('узлы сервера переиспользуются, ошибок нет; значение после неё доходит до полей', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(ControlsPage))

		const thumbs = [...document.querySelectorAll('.so-slider__input')]
		const stars = [...document.querySelectorAll('.so-rating__star')]
		const viewport = find(document, '.so-scroller__viewport', HTMLDivElement)
		const app = await hydrate(ControlsPage)

		await app.whenStable()

		expect([...document.querySelectorAll('.so-slider__input')]).toEqual(thumbs)
		expect([...document.querySelectorAll('.so-rating__star')]).toEqual(stars)
		expect(find(document, '.so-scroller__viewport', HTMLDivElement)).toBe(viewport)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()

		const page: unknown = app.components[0]?.instance

		if (!(page instanceof ControlsPage)) throw new Error('Корень приложения — не ControlsPage')

		page.sliderValue.set([30, 70])
		await app.whenStable()

		expect(
			[...document.querySelectorAll('.so-slider__input')]
				.filter((field): field is HTMLInputElement => field instanceof HTMLInputElement)
				.map((field) => field.value),
		).toEqual(['30', '70'])
		expect([...document.querySelectorAll('.so-slider__input')]).toEqual(thumbs)
	})
})

/**
 * Поповер, открытый поповер и подсказка — триггер в шаблоне слота, связку с
 * панелью он кладёт на себя директивой набора.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		TPopoverComponent,
		TTooltipComponent,
		TButtonComponent,
		SlotDirective,
		AttributesDirective,
	],
	template: `<section class="place">
		<span so-popover class="closed" aria_label="Фильтры">
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Фильтры"
					class="closed-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<button class="inside">Внутри</button>
		</span>
		<span so-popover class="opened" open>
			<ng-template
				slot="trigger"
				let-triggerAria="triggerAria"
				let-triggerDataset="triggerDataset"
			>
				<button
					so-button
					text="Открыт"
					class="opened-trigger"
					[so-attributes]="{ ...triggerAria, ...triggerDataset }"
				></button>
			</ng-template>
			<p>Открыт со старта</p>
		</span>
		<span so-tooltip class="tooltip">
			<ng-template slot="trigger" let-triggerAria="triggerAria">
				<button
					so-button
					text="Сохранить"
					class="tooltip-trigger"
					[so-attributes]="triggerAria"
				></button>
			</ng-template>
			Сохранить черновик
		</span>
	</section>`,
})
class OverlaysPage {}

/** Триггер, атрибут его ссылки на панель и что в панели — по каждому оверлею страницы. */
const OVERLAYS = [
	['.closed-trigger', 'aria-controls', '.inside'],
	['.opened-trigger', 'aria-controls', 'p'],
	['.tooltip-trigger', 'aria-describedby', '.so-tooltip__content'],
] as const

/** Панель, на которую ведёт ссылка триггера (`aria-controls`, `aria-describedby`). */
function linkedPanel(scope: Document, trigger: Element, attribute: string): HTMLElement {
	const panel = scope.getElementById(trigger.getAttribute(attribute) ?? '')

	if (!(panel instanceof HTMLElement)) throw new Error(`${attribute} не ведёт на панель`)

	return panel
}

/**
 * Слой есть только в браузере, как у Frame: на сервере от панели поповера и
 * подсказки остаётся элемент Frame в корне — пустой и скрытый, без классов и
 * раскладки слоя. Связка у него от владельца — роль, `id`, имя, — и ссылка
 * триггера ведёт на него уже в разметке сервера. Триггер — с набором связки и
 * видом «нажат».
 */
describe('Popover и Tooltip · серверный рендер', () => {
	it.each([
		['закрытый поповер', '.closed', '.closed-trigger', 'false'],
		['открытый поповер', '.opened', '.opened-trigger', 'true'],
	])(
		'%s — корень с триггером и связкой, панель в корне пустая и скрытая',
		async (_case, rootSelector, triggerSelector, expanded) => {
			const page = await serverPage(OverlaysPage)
			const root = find(page, rootSelector, HTMLSpanElement)
			const trigger = find(root, triggerSelector, HTMLButtonElement)
			const panel = linkedPanel(page, trigger, 'aria-controls')

			expect(root.classList).toContain('so-popover')
			expect(root.getAttribute('data-open')).toBe(expanded)
			expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
			expect(trigger.getAttribute('aria-expanded')).toBe(expanded)
			expect(trigger.getAttribute('data-selected')).toBe(expanded)
			expect(panel.parentElement).toBe(root)
			expect(panel.getAttribute('role')).toBe('dialog')
			expect(panel.style.display).toBe('none')
			expect(panel.children).toHaveLength(0)
			expect(panel.textContent).toBe('')
			expect(panel.classList.contains('so-frame')).toBe(false)
			expect(panel.hasAttribute('data-layer')).toBe(false)
		},
	)

	it('имя диалога — уже на скрытой панели сервера', async () => {
		const page = await serverPage(OverlaysPage)
		const trigger = find(page, '.closed-trigger', HTMLButtonElement)

		expect(linkedPanel(page, trigger, 'aria-controls').getAttribute('aria-label')).toBe(
			'Фильтры',
		)
	})

	it('подсказка — корень с триггером и ссылкой, панель в корне пустая и скрытая', async () => {
		const page = await serverPage(OverlaysPage)
		const root = find(page, '.tooltip', HTMLSpanElement)
		const trigger = find(root, '.tooltip-trigger', HTMLButtonElement)
		const panel = linkedPanel(page, trigger, 'aria-describedby')

		expect(root.classList).toContain('so-tooltip')
		expect(panel.parentElement).toBe(root)
		expect(panel.getAttribute('role')).toBe('tooltip')
		expect(panel.style.display).toBe('none')
		expect(panel.children).toHaveLength(0)
		expect(panel.textContent).toBe('')
	})
})

/**
 * После гидратации триггер — узел сервера, а панель — элемент Frame, который
 * напечатал сервер: он уезжает в `body` и получает содержимое, слой и якорь.
 * Якорь — корень (`rootElement()` базы): у открытой панели сторону пишет плагин
 * якоря (`data-placement`). Номера сборки у сервера и браузера одни, поэтому
 * и `id` панели — тот же.
 */
describe('Popover и Tooltip · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('тот же триггер и та же панель — в body, с содержимым; id сходятся, ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(OverlaysPage))

		const triggers = OVERLAYS.map(([selector]) => find(document, selector, HTMLButtonElement))
		const links = OVERLAYS.map(([, link], index) => triggers[index].getAttribute(link))
		const panels = OVERLAYS.map(([, link], index) =>
			linkedPanel(document, triggers[index], link),
		)
		const app = await hydrate(OverlaysPage)

		await app.whenStable()
		await nextFrame()

		expect(OVERLAYS.map(([selector]) => find(document, selector, HTMLButtonElement))).toEqual(
			triggers,
		)
		expect(OVERLAYS.map(([, link], index) => triggers[index].getAttribute(link))).toEqual(links)
		expect(
			OVERLAYS.map(([, link], index) => linkedPanel(document, triggers[index], link)),
		).toEqual(panels)
		expect(panels.map((panel) => panel.parentElement)).toEqual([
			document.body,
			document.body,
			document.body,
		])
		expect(
			OVERLAYS.map(([, , content], index) =>
				panels[index].querySelector(content)?.textContent?.trim(),
			),
		).toEqual(['Внутри', 'Открыт со старта', 'Сохранить черновик'])
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})

	it('открытый поповер — панель на виду, со слоем и стороной от якоря', async () => {
		loadPage(await renderOnServer(OverlaysPage))

		const app = await hydrate(OverlaysPage)

		await app.whenStable()
		await nextFrame()
		// Номер слоя открыл кадр узла — до разметки его доводит проверка изменений
		await app.whenStable()

		const opened = linkedPanel(
			document,
			find(document, '.opened-trigger', HTMLButtonElement),
			'aria-controls',
		)
		const closed = linkedPanel(
			document,
			find(document, '.closed-trigger', HTMLButtonElement),
			'aria-controls',
		)

		expect(opened.style.display).toBe('')
		expect(opened.classList).toContain('so-frame')
		expect(opened.getAttribute('data-open')).toBe('true')
		expect(opened.getAttribute('data-layer')).not.toBeNull()
		expect(opened.getAttribute('data-placement')).toBe('bottom-start')
		expect(closed.style.display).toBe('none')
		expect(closed.getAttribute('data-open')).toBe('false')
	})
})

/**
 * Окно и выезжающая панель, открытые со старта; панель — внутри контейнера.
 * Заголовок — слот по атрибуту, содержимое — основная проекция.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TDialogComponent, TDrawerComponent],
	template: `<section class="place">
		<div so-dialog visible class="dialog">
			<span slot="title">Настройки</span>
			<p class="content">Содержимое окна</p>
		</div>
		<div so-drawer contained visible class="drawer">
			<span slot="title">Фильтры</span>
			<p class="content">Содержимое панели</p>
		</div>
	</section>`,
})
class ModalPage {}

/**
 * Слой есть только в браузере, как у Frame: на сервере от окна и выезжающей
 * панели — и с `contained` тоже — остаётся сам элемент потребителя, на месте,
 * пустой и скрытый, без классов, наборов, раскладки и пометки владельцем. А
 * подложки нет вовсе: шаблон рисует её, только пока слой на своём месте.
 */
describe('Dialog и Drawer · серверный рендер', () => {
	it.each([
		['окно', '.dialog'],
		['выезжающая панель с contained', '.drawer'],
	])(
		'%s на сервере не рисуется: пустой скрытый элемент потребителя без подложки',
		async (_case, selector) => {
			const page = await serverPage(ModalPage)
			const root = find(page, selector, HTMLDivElement)

			expect(root.parentElement?.className).toBe('place')
			expect(root.style.display).toBe('none')
			expect(root.textContent).toBe('')
			expect(root.children).toHaveLength(0)
			expect([...root.classList]).toEqual([selector.slice(1)])
			expect(root.hasAttribute('role')).toBe(false)
			expect(root.hasAttribute('data-open')).toBe(false)
			expect(root.hasAttribute('data-layer')).toBe(false)
			expect(root.hasAttribute('data-owner')).toBe(false)
			expect(root.style.zIndex).toBe('')
		},
	)

	it('подложек в разметке сервера нет', async () => {
		const page = await serverPage(ModalPage)

		expect(page.querySelector('.so-dialog__backdrop, .so-drawer__backdrop')).toBeNull()
	})
})

/**
 * После гидратации окно — элемент потребителя, который напечатал сервер: он
 * уезжает в `body`, а выезжающая панель с `contained` остаётся на месте, и
 * перед каждым встаёт подложка. Содержимое строит браузер, и связка с
 * заголовком ведёт на заголовок браузера.
 */
describe('Dialog и Drawer · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('тот же узел — окно в body, панель на месте, подложка перед каждым; ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(ModalPage))

		const dialog = find(document, '.dialog', HTMLDivElement)
		const drawer = find(document, '.drawer', HTMLDivElement)
		const app = await hydrate(ModalPage)

		await app.whenStable()
		await nextFrame()

		expect(find(document, '.dialog', HTMLDivElement)).toBe(dialog)
		expect(find(document, '.drawer', HTMLDivElement)).toBe(drawer)
		expect(dialog.parentElement).toBe(document.body)
		expect(drawer.parentElement?.className).toBe('place')

		for (const [root, block, text] of [
			[dialog, 'so-dialog', 'Содержимое окна'],
			[drawer, 'so-drawer', 'Содержимое панели'],
		] as const) {
			const title = document.getElementById(root.getAttribute('aria-labelledby') ?? '')

			expect(root.previousElementSibling?.className).toBe(`${block}__backdrop`)
			expect(root.style.display).toBe('')
			expect(root.classList).toContain(block)
			expect(root.getAttribute('data-open')).toBe('true')
			expect(root.querySelector('.content')?.textContent).toBe(text)
			expect(title?.classList.contains(`${block}__title`)).toBe(true)
			expect(root.contains(title)).toBe(true)
		}

		expect(
			document.querySelectorAll('.so-dialog__backdrop, .so-drawer__backdrop'),
		).toHaveLength(2)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/**
 * Поле даты и DatePicker со значениями. Части поля — разметка с наборами ядра,
 * панель DatePicker'а — Frame в его шаблоне.
 */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TDateInputComponent, TDatePickerComponent],
	template: `<section class="place">
		<div so-date-input class="date" name="birthday" value="2026-05-12"></div>
		<div so-date-picker class="picker" id="when" value="2026-09-10"></div>
	</section>`,
})
class DatesPage {}

/** Дата `2026-05-12` в формате поля `en-US`: месяц, день и год с разделителями. */
const DATE_TEXT = new Intl.DateTimeFormat(['en-US'], {
	day: '2-digit',
	month: '2-digit',
	year: 'numeric',
	calendar: 'gregory',
	timeZone: 'UTC',
}).format(Date.UTC(2026, 4, 12))

/** Части поля даты внутри `scope`. */
const segmentsOf = (scope: ParentNode): HTMLElement[] =>
	[...scope.querySelectorAll('.so-date-input__segment')].filter(
		(part): part is HTMLElement => part instanceof HTMLElement,
	)

/** Панель DatePicker'а, на которую ведёт кнопка календаря (`aria-controls`). */
function pickerPanelOf(scope: Document, trigger: Element): HTMLElement {
	const panel = scope.getElementById(trigger.getAttribute('aria-controls') ?? '')

	if (!(panel instanceof HTMLElement)) throw new Error('aria-controls не ведёт на панель')

	return panel
}

/**
 * Поле даты на сервере — группа с частями: у каждой `id` от номера сборки и
 * текст ядра, без пробелов по краям, и нередактируемая, а ряд — ровно дата с
 * разделителями. DatePicker — корень со своим `id`, полем и кнопкой календаря,
 * а панель — слой, и на сервере от неё в корне — пустой скрытый элемент Frame,
 * на который ссылается кнопка.
 */
describe('DateInput и DatePicker · серверный рендер', () => {
	it('DateInput — группа, части с id и текстом, ряд — дата с разделителями', async () => {
		const page = await serverPage(DatesPage)
		const root = find(page, '.date', HTMLDivElement)
		const parts = segmentsOf(root)

		expect(root.getAttribute('role')).toBe('group')
		expect(parts.map((part) => part.dataset['type'])).toEqual(['month', 'day', 'year'])
		expect(parts.map((part) => part.textContent)).toEqual(['05', '12', '2026'])
		expect(parts.every((part) => part.id.endsWith(`-${part.dataset['type']}`))).toBe(true)
		expect(parts.some((part) => part.hasAttribute('contenteditable'))).toBe(false)
		expect(find(root, '.so-date-input__segments', HTMLElement).textContent).toBe(DATE_TEXT)
	})

	it('DatePicker — корень с id, поле с кнопкой календаря, панель в корне пустая и скрытая', async () => {
		const page = await serverPage(DatesPage)
		const root = find(page, '.picker', HTMLDivElement)
		const field = find(root, '.so-date-picker__field', HTMLDivElement)
		const trigger = find(field, '.so-date-picker__trigger', HTMLButtonElement)
		const panel = find(page, '.so-date-picker__panel', HTMLElement)
		expect(trigger.hasAttribute('aria-controls')).toBe(false)

		expect(root.id).toBe('when')
		expect(segmentsOf(field).map((part) => part.textContent)).toEqual(['09', '10', '2026'])
		expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
		expect(trigger.getAttribute('aria-expanded')).toBe('false')
		expect(panel.parentElement).toBe(root)
		expect(panel.getAttribute('role')).toBe('dialog')
		expect(panel.style.display).toBe('none')
		expect(panel.children).toHaveLength(0)
		expect(page.querySelector('.so-calendar')).toBeNull()
	})
})

/**
 * После гидратации части поля и кнопка — узлы, которые напечатал сервер, с
 * теми же `id`, а панель DatePicker'а — элемент Frame сервера: он уезжает в
 * `body`, получает календарь и открывается кнопкой.
 */
describe('DateInput и DatePicker · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('те же части с теми же id, панель — в body и открывается; ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(DatesPage))

		const parts = segmentsOf(document)
		const ids = parts.map((part) => part.id)
		const root = find(document, '.picker', HTMLDivElement)
		const trigger = find(document, '.so-date-picker__trigger', HTMLButtonElement)
		const panel = find(document, '.so-date-picker__panel', HTMLElement)
		expect(trigger.hasAttribute('aria-controls')).toBe(false)
		const app = await hydrate(DatesPage)

		await app.whenStable()
		await nextFrame()

		expect(segmentsOf(document)).toEqual(parts)
		expect(segmentsOf(document).map((part) => part.id)).toEqual(ids)
		expect(
			segmentsOf(find(document, '.date', HTMLDivElement)).map((part) => part.textContent),
		).toEqual(['05', '12', '2026'])
		expect(find(document, '.picker', HTMLDivElement)).toBe(root)
		expect(root.id).toBe('when')
		expect(find(document, '.so-date-picker__trigger', HTMLButtonElement)).toBe(trigger)
		expect(pickerPanelOf(document, trigger)).toBe(panel)
		expect(panel.parentElement).toBe(document.body)
		expect(panel.style.display).toBe('none')

		trigger.click()
		await app.whenStable()
		await nextFrame()
		await app.whenStable()

		expect(trigger.getAttribute('aria-expanded')).toBe('true')
		expect(panel.style.display).toBe('')
		expect(panel.querySelector('.so-calendar-item[aria-selected="true"]')?.textContent).toBe(
			'10',
		)
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

/** Приложение под менеджером тостов: API тостов берёт его компонент полем. */
@Component({
	selector: 'app-saver',
	standalone: true,
	template: `<main class="app-content">Приложение</main>`,
})
class SaverComponent {
	readonly toasts = useToasts()
}

/** Менеджер тостов вокруг приложения, с классом и данными потребителя. */
@Component({
	selector: 'app-root',
	standalone: true,
	imports: [TToastsComponent, SaverComponent],
	template: `<section class="place">
		<div so-toasts class="app-toasts" data-test="toasts"><app-saver /></div>
	</section>`,
})
class ToastsPage {
	readonly saver = viewChild.required(SaverComponent)
}

/**
 * Регион — слой, а слой есть только в браузере: на сервере от менеджера
 * остаётся обёртка без коробки с приложением, а региона нет. Написанное
 * потребителем на обёртке — региону, и на сервере ему лечь некуда.
 */
describe('Toasts · серверный рендер', () => {
	it('приложение — в обёртке без коробки, региона в разметке сервера нет', async () => {
		const page = await serverPage(ToastsPage)
		const manager = find(page, '[so-toasts]', HTMLDivElement)

		expect(manager.parentElement?.className).toBe('place')
		expect(manager.style.display).toBe('contents')
		expect(manager.querySelector('.app-content')?.textContent).toBe('Приложение')
		expect(manager.classList).not.toContain('app-toasts')
		expect(page.querySelector('.so-toasts, .so-toasts-item')).toBeNull()
	})
})

/**
 * После гидратации приложение — те же узлы, что напечатал сервер: ветка
 * региона в шаблоне менеджера стоит вне проекции, и гидратация у менеджера
 * есть. Регион браузер рисует сам и уводит в `body`, с тем, что потребитель
 * написал на обёртке, а API тостов у приложения работает.
 */
describe('Toasts · гидратация', () => {
	afterEach(() => {
		vi.restoreAllMocks()
		leavePage()
	})

	it('узлы приложения те же, регион — в body, show рисует тост; ошибок нет', async () => {
		const error = vi.spyOn(console, 'error')
		const warn = vi.spyOn(console, 'warn')

		loadPage(await renderOnServer(ToastsPage))

		const manager = find(document, '[so-toasts]', HTMLDivElement)
		const content = find(document, '.app-content', HTMLElement)
		const app = await hydrate(ToastsPage)

		await app.whenStable()

		const region = find(document, '.so-toasts', HTMLElement)

		expect(find(document, '[so-toasts]', HTMLDivElement)).toBe(manager)
		expect(find(document, '.app-content', HTMLElement)).toBe(content)
		expect(manager.contains(content)).toBe(true)
		expect(manager.style.display).toBe('contents')
		expect(region.parentElement).toBe(document.body)
		expect(region.classList).toContain('app-toasts')
		expect(region.dataset.test).toBe('toasts')
		expect(region.getAttribute('role')).toBe('region')

		const page: unknown = app.components[0]?.instance

		if (!(page instanceof ToastsPage)) throw new Error('Корень приложения — не ToastsPage')

		page.saver().toasts.show('Сохранено')
		await app.whenStable()

		expect(region.querySelector('.so-toasts-item__text')?.textContent).toBe('Сохранено')
		expect(error).not.toHaveBeenCalled()
		expect(warn).not.toHaveBeenCalled()
	})
})

@Component({
	selector: 'app-root',
	imports: [TAvatarComponent, TAvatarGroupComponent],
	template:
		'<span so-avatar-group [overflow]="3"><span so-avatar src="/avatar.png" initials="AL" aria_label="Ada"></span></span>',
})
class AvatarPage {}
describe('Avatar server hydration', () => {
	afterEach(leavePage)
	it('hydrates server fallback and count in place', async () => {
		loadPage(await renderOnServer(AvatarPage))
		const nodes = [
			...document.querySelectorAll(
				'.so-avatar-group,.so-avatar,.so-avatar__fallback,.so-avatar-group__count',
			),
		]
		expect(document.querySelector('.so-avatar-group')?.textContent).toBe('AL+3')
		const app = await hydrate(AvatarPage)
		await app.whenStable()
		expect([
			...document.querySelectorAll(
				'.so-avatar-group,.so-avatar,.so-avatar__fallback,.so-avatar-group__count',
			),
		]).toEqual(nodes)
		expect(document.querySelector('.so-avatar img')).toBeNull()
	})
})
