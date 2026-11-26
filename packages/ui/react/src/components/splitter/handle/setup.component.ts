import { SplitterHandleDescriptor, TSplitterPartExtension } from '@soxa-ui/setup'
import { useComponent } from '../../../adapter'
import type { SplitterHandleProps } from './base.component'

export function useSetupSplitterHandle(props: SplitterHandleProps) {
	return useComponent(
		(create, elevator) =>
			create(SplitterHandleDescriptor(), { ctrl: props.ctrl, props }).use(
				TSplitterPartExtension,
				{ elevator },
			),
		props,
	)
}
