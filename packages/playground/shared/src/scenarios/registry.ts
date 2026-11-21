import { LIST_SEPARATOR_SCENARIOS } from './list-separators'
import { NEW_COMPONENT_SCENARIOS } from './new-components'
import { ALERT_SCENARIOS } from './alert/display'
import { AVATAR_SCENARIOS } from './avatar/display'
import { SEPARATOR_SCENARIOS } from './separator/semantics'
import { CODE_BLOCK_SCENARIOS } from './code-block/display'
import { BREADCRUMBS_SCENARIOS } from './breadcrumbs/window'

import { BADGE_SLOTS } from './badge/slots'
import { findComponent } from '../registry'
import { BUTTON_EVENTS } from './button/events'
import { BUTTON_SLOTS } from './button/slots'
import { LABEL_SLOTS } from './label/slots'
import { PROGRESS_LINEAR_MOTION } from './progress-linear/motion'
import { PROGRESS_SPINNER_MOTION } from './progress-spinner/motion'
import { TOASTS_MOTION } from './toasts/motion'
import { eventsPoll } from './events-poll'
import type { TScenario } from './types'

/**
 * Опрос событий по строкам свойств. Подключён пока только Button: остальным
 * компонентам его раздаст одна строка здесь, когда до них дойдёт очередь.
 */
const POLLED = ['button']

/** Опечатка в `POLLED` не должна молча убрать опрос — пусть падает громко. */
function polled(id: string) {
	const entry = findComponent(id)

	if (!entry) throw new Error(`[playground] опрос событий: компонента «${id}» нет в реестре`)

	return entry
}

/**
 * Сценарии страницы тестов — каталог всей библиотеки, общий для всех
 * фреймворков. Страница фреймворка показывает только те, что может нарисовать
 * его хост превью: компонент есть в его превью, а фикстура — в его фикстурах.
 *
 * В CI сценарии не идут: упавший сценарий — найденная проблема компонента, а
 * не сломанная сборка. Стенд стерегут только тесты целостности реестра.
 */
export const SCENARIOS: readonly TScenario[] = [
	...NEW_COMPONENT_SCENARIOS,
	...LIST_SEPARATOR_SCENARIOS,
	...BREADCRUMBS_SCENARIOS,
	...BUTTON_EVENTS,
	...POLLED.flatMap((id) => eventsPoll(polled(id))),
	...BUTTON_SLOTS,
	...LABEL_SLOTS,
	...ALERT_SCENARIOS,
	...BADGE_SLOTS,
	...AVATAR_SCENARIOS,
	...CODE_BLOCK_SCENARIOS,
	...SEPARATOR_SCENARIOS,
	...PROGRESS_LINEAR_MOTION,
	...PROGRESS_SPINNER_MOTION,
	...TOASTS_MOTION,
]
