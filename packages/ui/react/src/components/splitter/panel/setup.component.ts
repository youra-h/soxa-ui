import { SplitterPanelDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import { useComponent } from '../../../adapter'
import type { SplitterPanelProps } from './base.component'

export function useSetupSplitterPanel(props: SplitterPanelProps) {
	return useComponent(
		(create, elevator) =>
			create(SplitterPanelDescriptor(), { ctrl: props.ctrl, props }).use(
				TSplitterPartExtension,
				{ elevator },
			),
		props,
	)
}
