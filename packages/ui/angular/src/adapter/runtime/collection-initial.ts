import { createCollectionInitialSource } from '@soxa-ui/setup'

/** Setup runs once for the native component lifetime. */
export function useCollectionInitial(props: object, panelDefaultValue?: string | number) {
	return createCollectionInitialSource(props, panelDefaultValue)
}
