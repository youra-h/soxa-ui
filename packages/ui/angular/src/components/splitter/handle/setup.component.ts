import type { ISplitterHandle } from '@soxa-ui/core'
import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	useAdapter,
	type TBinding,
} from '../../../adapter'

export function setupSplitterHandle(
	ctrl: ISplitterHandle | undefined,
	props: object,
): TBinding<ISplitterHandle> {
	const adapter = createAngularAdapterContext(SplitterHandleDescriptor(), { ctrl, props }).use(
		TSplitterPartExtension,
		{ elevator: AngularElevatorFactory },
	)

	return useAdapter(adapter)
}
