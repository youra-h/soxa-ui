import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import type { TSelectSeparator } from '@soxa-ui/core'
import { AngularElevatorFactory, createAngularAdapterContext, useAdapter } from '../../../adapter'
import type { TBinding } from '../../../adapter'

export function setupSelectSeparator(
	ctrl: TSelectSeparator | undefined,
	props: object,
): TBinding<TSelectSeparator> {
	const adapter = createAngularAdapterContext(SelectSeparatorDescriptor(), {
		ctrl,
		props,
	}).use(TListSeparatorExtension, { elevator: AngularElevatorFactory })

	return useAdapter(adapter)
}
