import type { ISplitterPanel } from '@soxa-ui/core'
import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import {
	AngularElevatorFactory,
	createAngularAdapterContext,
	useAdapter,
	type TBinding,
} from '../../../adapter'

export function setupSplitterPanel(
	ctrl: ISplitterPanel | undefined,
	props: object,
): TBinding<ISplitterPanel> {
	const adapter = createAngularAdapterContext(SplitterPanelDescriptor(), { ctrl, props }).use(
		TSplitterPartExtension,
		{ elevator: AngularElevatorFactory },
	)

	return useAdapter(adapter)
}
