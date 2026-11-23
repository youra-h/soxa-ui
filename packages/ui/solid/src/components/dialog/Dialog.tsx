import type { JSX } from 'solid-js'
import {
	Root,
	Teleport,
	clickAction,
	createPartProps,
	createRootProps,
	renderSlot,
	resolveSlot,
	roleIcon,
} from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Backdrop } from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import { setupDialog } from './setup.component'
import type { DialogProps } from './base.component'

/** Иконки кнопок шапки по умолчанию. */
const CLOSE = roleIcon('close')
const MAXIMIZE = roleIcon('arrowsOutward')
const RESTORE = roleIcon('arrowsInward')

/**
 * Модальное окно: подложка и панель — соседи в телепорте, подложка раньше; корень — панель.
 * Кнопки шапки — после подвала: в строку заголовка их переносит тема.
 */
export function Dialog(props: DialogProps): JSX.Element {
	const binding = setupDialog(props)
	const state = binding.state
	const ctrl = binding.ctrl
	const toggleMaximized = clickAction(() => ctrl.toggleMaximized())
	const close = clickAction(() => ctrl.requestClose('button'))
	const panel = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset, state.dismiss_ownerAttribute],
		forward: binding.forwardProps(),
	}))
	const titleAria = createPartProps(() => state.titleAria)
	const bodyAria = createPartProps(() => state.bodyAria)
	const maximizeIcon = resolveSlot(
		() => props['maximize-icon'],
		() => ({}),
	)
	const restoreIcon = resolveSlot(
		() => props['restore-icon'],
		() => ({}),
	)
	const closeIcon = resolveSlot(
		() => props['close-icon'],
		() => ({}),
	)

	return (
		<Show when={state.rendered}>
			<Teleport to={state.target}>
				<Show when={state.modal}>
					<Backdrop state={state} />
				</Show>
				<Root
					tag={state.tag}
					attributes={() => ({ tabindex: '-1', ...panel() })}
					ref={binding.ref}
				>
					<h2 class="so-dialog__title" {...titleAria()}>
						{renderSlot(props.title)}
					</h2>
					<div class="so-dialog__body" {...bodyAria()}>
						{renderSlot(props.children)}
					</div>
					<div class="so-dialog__footer">{renderSlot(props.footer)}</div>
					<Show when={state.maximizable}>
						<Button
							embedded="dialog.maximize"
							type="button"
							class="so-dialog__maximize"
							ref={toggleMaximized}
							{...state.maximizeAria}
						>
							<Show
								when={state.maximized}
								fallback={
									maximizeIcon() ?? (
										<Icon embedded="dialog.maximize-icon" tag={MAXIMIZE} />
									)
								}
							>
								{restoreIcon() ?? (
									<Icon embedded="dialog.restore-icon" tag={RESTORE} />
								)}
							</Show>
						</Button>
					</Show>
					<Show when={state.closable}>
						<Button
							embedded="dialog.close"
							type="button"
							class="so-dialog__close"
							ref={close}
							{...state.closeAria}
						>
							{closeIcon() ?? <Icon embedded="dialog.close-icon" tag={CLOSE} />}
						</Button>
					</Show>
				</Root>
			</Teleport>
		</Show>
	)
}
