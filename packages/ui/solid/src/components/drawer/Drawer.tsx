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
import { setupDrawer } from './setup.component'
import type { DrawerProps } from './base.component'

/** Иконка кнопки закрытия по умолчанию. */
const CLOSE = roleIcon('close')

/** Выезжающая панель: подложка и панель — соседи в телепорте, подложка раньше; корень — панель. */
export function Drawer(props: DrawerProps): JSX.Element {
	const binding = setupDrawer(props)
	const state = binding.state
	const ctrl = binding.ctrl
	const close = clickAction(() => ctrl.requestClose('button'))
	const panel = createRootProps(() => ({
		state,
		sets: [state.attrs, state.aria, state.dataset, state.dismiss_ownerAttribute],
		forward: binding.forwardProps(),
	}))
	const titleAria = createPartProps(() => state.titleAria)
	const closeIcon = resolveSlot(
		() => props['close-icon'],
		() => ({}),
	)

	return (
		<Show when={state.rendered}>
			<Teleport to={state.target} disabled={state.contained}>
				<Backdrop state={state} />
				<Root
					tag={state.tag}
					attributes={() => ({ tabindex: '-1', ...panel() })}
					ref={binding.ref}
				>
					<Show when={state.handleRendered}>
						<div class="so-drawer__handle" aria-hidden="true" />
					</Show>
					<h2 class="so-drawer__title" {...titleAria()}>
						{renderSlot(props.title)}
					</h2>
					<div class="so-drawer__body">{renderSlot(props.children)}</div>
					<div class="so-drawer__footer">{renderSlot(props.footer)}</div>
					<Show when={state.closable}>
						<Button
							embedded="drawer.close"
							type="button"
							class="so-drawer__close"
							ref={close}
							{...state.closeAria}
						>
							{closeIcon() ?? <Icon embedded="drawer.close-icon" tag={CLOSE} />}
						</Button>
					</Show>
				</Root>
			</Teleport>
		</Show>
	)
}
