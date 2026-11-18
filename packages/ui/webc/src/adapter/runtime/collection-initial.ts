import { createCollectionInitialSource } from '@soxa-ui/setup'
import type { TCollectionInitialSource } from '@soxa-ui/setup'

const sources = new WeakMap<HTMLElement, { source: TCollectionInitialSource | undefined }>()

/** Native element lifetime survives disconnect/reconnect and consumer moves. */
export function useCollectionInitial(
	host: HTMLElement,
	props: object,
	panelDefaultValue?: string | number,
) {
	let held = sources.get(host)
	if (!held) {
		held = { source: createCollectionInitialSource(props, panelDefaultValue) }
		sources.set(host, held)
	}
	return held.source
}
