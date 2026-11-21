import { SelectSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import { useComponent } from '../../../adapter'
import type { SelectSeparatorProps } from './base.component'

export function useSetupSelectSeparator(props: SelectSeparatorProps) {
	return useComponent(
		(create, elevator) =>
			create(SelectSeparatorDescriptor(), { ctrl: props.ctrl, props }).use(
				TListSeparatorExtension,
				{
					elevator,
				},
			),
		props,
	)
}
