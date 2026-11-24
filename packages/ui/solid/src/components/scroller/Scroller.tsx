import type { JSX } from 'solid-js'
import {
	Root,
	createPartProps,
	createRootProps,
	renderSlot,
	resolveSlot,
	roleIcon,
} from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Button } from '../button'
import { Icon } from '../icon'
import { setupScroller } from './setup.component'
import type { ScrollerProps } from './base.component'

/** Одна стрелка на обе кнопки: роли «влево» нет, стрелку в начало строки зеркалит тема. */
const ARROW = roleIcon('arrowRight')

// Firefox can restore disabled before hydration. Pass its button attribute through as HTML.
const arrowAttributes = { autocomplete: 'off' }

/**
 * Лента в одну строку: кнопка «назад», вьюпорт, кнопка «вперёд».
 * Кнопки — снаружи вьюпорта: роль ряда (`listbox` у тегов) ложится на вьюпорт, а
 * листбокс владеет только опциями. Обёртки внутри вьюпорта нет: элементы — его
 * прямые дети (роль ряда, снап темы, края плагина). `viewportAria` после `tabindex`:
 * ряд с roving tabindex сам решает, кому быть остановкой. Корень ленты тема не гасит,
 * поэтому выключенность кнопкам отдаёт разметка (`prevDisabled`, `nextDisabled`).
 */
export function Scroller(props: ScrollerProps): JSX.Element {
	const binding = setupScroller(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset],
		forward: binding.forwardProps(),
	}))
	const viewportAria = createPartProps(() => state.viewportAria)
	const prevIcon = resolveSlot(
		() => props['prev-icon'],
		() => ({}),
	)
	const nextIcon = resolveSlot(
		() => props['next-icon'],
		() => ({}),
	)

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				<Button
					embedded="scroller.prev"
					type="button"
					{...arrowAttributes}
					class="so-scroller__prev"
					size={state.size}
					disabled={state.prevDisabled}
					{...state.prevAria}
				>
					{prevIcon() ?? (
						<Icon embedded="scroller.prev-icon" tag={ARROW} size={state.size} />
					)}
				</Button>
				<div
					class="so-scroller__viewport"
					tabindex={state.viewportTabIndex}
					{...viewportAria()}
				>
					{renderSlot(props.children)}
				</div>
				<Button
					embedded="scroller.next"
					type="button"
					{...arrowAttributes}
					class="so-scroller__next"
					size={state.size}
					disabled={state.nextDisabled}
					{...state.nextAria}
				>
					{nextIcon() ?? (
						<Icon embedded="scroller.next-icon" tag={ARROW} size={state.size} />
					)}
				</Button>
			</Root>
		</Show>
	)
}
