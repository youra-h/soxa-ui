import AlertDialogPage from './AlertDialogPage.test.svelte'
import AlertPage from './AlertPage.test.svelte'
import AvatarPage from './AvatarPage.test.svelte'
import SeparatorPage from './SeparatorPage.test.svelte'
import CodeBlockPage from './CodeBlockPage.test.svelte'
/**
 * Разметка сервера для гидратации — её рисует сервер той же версии Svelte,
 * что гидратирует браузер.
 *
 * Гидратации нужны обе сборки страницы сразу, а в одном прогоне компоненты
 * собраны под одно окружение. Поэтому этот модуль собирается для сервера
 * отдельно от прогона и рисует страницы `render` из `svelte/server`, как
 * сервер приложения, — с метками гидратации блоков и id монтирования в
 * комментариях. Грузит его и отдаёт разметку спекам `globalSetup` проекта
 * `hydration` (`global-setup.ts`), а в документ её кладёт прогон гидратации
 * (`serve.ts`) и гидратирует той же страницей, собранной для браузера.
 * Разметка не хранится в репозитории: снимок сервера из lock на нижней
 * границе peer гидратировала бы другая версия Svelte (docs/agents/build.md,
 * «Версии пакетов»).
 *
 * «Сегодня» у страниц дат — момент гидратации (`today.ts`). Часы сервер
 * ставит только на время их рисования — `@sinonjs/fake-timers`, на котором
 * стоит и `vi`: `vi` вне воркера прогона нет. Рисование синхронно, и другой
 * код процесса подменённых часов не застаёт.
 *
 * Окружение тестов (`setup.ts`) — первым импортом: прогоны получают его через
 * `setupFiles`, а этот модуль грузит не прогон. Без пакета иконок сервер
 * нарисовал бы на месте иконок заглушки, и гидратация разошлась бы с ним.
 */

import '../setup'
import { install } from '@sinonjs/fake-timers'
import { render } from 'svelte/server'
import BadgePage from './BadgePage.test.svelte'
import ButtonStyle from './ButtonStyle.test.svelte'
import PopupControls from './PopupControls.test.svelte'
import CalendarValue from './CalendarValue.test.svelte'
import DateInputValue from './DateInputValue.test.svelte'
import DatePickerValue from './DatePickerValue.test.svelte'
import FieldText from './FieldText.test.svelte'
import FrameContained from './FrameContained.test.svelte'
import PopoverContained from './PopoverContained.test.svelte'
import TabsActiveFirst from './TabsActiveFirst.test.svelte'
import TabsActiveSecond from './TabsActiveSecond.test.svelte'
import TabsContentOwnId from './TabsContentOwnId.test.svelte'
import TagsSelectedSecond from './TagsSelectedSecond.test.svelte'
import { TODAY } from './today'

/** Разметка страницы, нарисованной «сегодня» гидратации; после неё часы снова настоящие. */
function onToday(draw: () => string): string {
	const clock = install({ now: TODAY, toFake: ['Date'] })

	try {
		return draw()
	} finally {
		clock.uninstall()
	}
}

/**
 * Разметка сервера всех страниц гидратации — по имени страницы. Пропсы
 * страницы — только то, что у сервера и браузера расходится намеренно.
 */
export function renderServerMarkup() {
	return {
		'popup-controls-closed': onToday(() => render(PopupControls).body),
		'popup-controls-open': onToday(
			() => render(PopupControls, { props: { initialOpen: true } }).body,
		),
		alert: render(AlertPage).body,
		'alert-dialog': render(AlertDialogPage).body,
		separator: render(SeparatorPage).body,
		badge: render(BadgePage).body,
		avatar: render(AvatarPage).body,
		'code-block': render(CodeBlockPage).body,
		'date-input-value': onToday(() => render(DateInputValue).body),
		'date-picker-value': onToday(() => render(DatePickerValue).body),
		'calendar-value': onToday(() => render(CalendarValue).body),
		'frame-contained': render(FrameContained, { props: { contained: true } }).body,
		'popover-contained': render(PopoverContained).body,
		'button-style-hidden': render(ButtonStyle, { props: { visible: false } }).body,
		'field-text': render(FieldText).body,
		'tabs-active-second': render(TabsActiveSecond).body,
		'tabs-active-first': render(TabsActiveFirst).body,
		'tabs-content-own-id': render(TabsContentOwnId).body,
		'tags-selected-second': render(TagsSelectedSecond).body,
	}
}

/** Разметка сервера по имени страницы. */
export type TServerMarkup = ReturnType<typeof renderServerMarkup>

/** Имя страницы, разметку которой рисует сервер. */
export type TServerPage = keyof TServerMarkup
