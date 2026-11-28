import type { JSX } from 'solid-js'
import {
	Elevate,
	ResolvedSlot,
	Root,
	createRootProps,
	liveScope,
	renderSlot,
	toPartClass,
} from '../../adapter'
import { Show } from '../../adapter/runtime/flow'
import { Frame } from '../frame'
import { drawItems } from './submenu/Submenu'
import { setupMenu } from './setup.component'
import type { MenuProps } from './base.component'

/**
 * Меню у кнопки или контекстное: корень — обёртка триггера и якорь панели. Роль
 * `menu` — у панели, а не у списка `so-menu__list`: фокус без подсветки держит
 * панель, и узел с ролью и фокусом должен быть один.
 */
export function Menu(props: MenuProps): JSX.Element {
	const binding = setupMenu(props)
	const state = binding.state
	const root = createRootProps(() => ({
		state,
		sets: [state.attrs, state.dataset],
		forward: binding.forwardProps(),
	}))
	const trigger = liveScope(() => {
		const { triggerAria, triggerDataset } = state

		return {
			triggerAria:
				!binding.rootElement() && triggerAria?.['aria-controls']
					? { ...triggerAria, 'aria-controls': null }
					: (triggerAria ?? {}),
			triggerDataset: triggerDataset ?? {},
		}
	})

	return (
		<Show when={state.rendered}>
			<Root tag={state.tag} attributes={root} ref={binding.ref}>
				<Elevate layer={binding.layer}>
					{renderSlot(props.trigger, trigger)}
					<Frame
						embedded="menu.frame"
						class={toPartClass(state.panelClasses)}
						tabindex="-1"
						visible={state.visible && state.open}
						strategy="fixed"
						anchor_anchor={binding.rootElement()}
						anchor_point={state.point}
						anchor_placement={state.placement}
						anchor_offset={4}
						{...state.aria}
						{...state.dismiss_ownerAttribute}
					>
						{/* Items from the panel's first opening on (`contentRendered`) */}
						<div class="so-menu__list">
							<Show when={state.contentRendered}>
								<ResolvedSlot
									content={props.children}
									fallback={drawItems(state, props)}
								/>
							</Show>
						</div>
					</Frame>
				</Elevate>
			</Root>
		</Show>
	)
}
