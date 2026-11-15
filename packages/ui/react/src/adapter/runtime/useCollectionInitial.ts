import { useRef } from 'react'
import { createCollectionInitialSource } from '@soxa-ui/setup'
import type { TCollectionInitialSource } from '@soxa-ui/setup'

/** The source belongs to the native mount, including effect-only reassembly. */
export function useCollectionInitial(
	props: object,
	panelDefaultValue?: string | number,
): TCollectionInitialSource | undefined {
	const held = useRef<{ source: TCollectionInitialSource | undefined } | null>(null)
	if (!held.current)
		held.current = { source: createCollectionInitialSource(props, panelDefaultValue) }
	return held.current.source
}
