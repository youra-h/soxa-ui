import { ListBoxSeparatorDescriptor, TListSeparatorExtension } from '@soxa-ui/setup'
import { useComponent } from '../../../adapter'
import type { ListBoxSeparatorProps } from './base.component'

export function useSetupListBoxSeparator(props: ListBoxSeparatorProps) {
	return useComponent(
		(create, elevator) =>
			create(ListBoxSeparatorDescriptor(), { ctrl: props.ctrl, props }).use(
				TListSeparatorExtension,
				{
					elevator,
				},
			),
		props,
	)
}
