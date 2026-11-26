import { SplitterDescriptor, TSplitterExtension } from '@soxa-ui/setup'
import { useComponent } from '../../adapter'
import type { SplitterProps } from './base.component'

export function useSetupSplitter(props: SplitterProps) {
	return useComponent(
		(create, elevator) =>
			create(SplitterDescriptor(), { ctrl: props.ctrl, props }).use(TSplitterExtension, {
				elevator,
			}),
		props,
	)
}
