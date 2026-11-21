import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import type { TListBoxSeparator } from '@soxa-ui/core'
import { AngularElevatorFactory, createAngularAdapterContext, useAdapter } from '../../../adapter'
import type { TBinding } from '../../../adapter'

export function setupListBoxSeparator(
	ctrl: TListBoxSeparator | undefined,
	props: object,
): TBinding<TListBoxSeparator> {
	const adapter = createAngularAdapterContext(ListBoxSeparatorDescriptor(), {
		ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator: AngularElevatorFactory })

	return useAdapter(adapter)
}
