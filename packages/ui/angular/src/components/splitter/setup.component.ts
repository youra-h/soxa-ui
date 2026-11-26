import type { ISplitter } from '@soxa-ui/core'
import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	useAdapter,
	type TBinding,
} from '../../adapter'

export function setupSplitter(ctrl: ISplitter | undefined, props: object): TBinding<ISplitter> {
	const adapter = createAngularAdapterContext(SplitterDescriptor(), { ctrl, props }).use(
		TSplitterExtension,
		{ elevator: AngularElevatorFactory },
	)

	return useAdapter(adapter)
}
