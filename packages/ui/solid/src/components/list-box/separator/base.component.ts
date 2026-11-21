import type { TListBoxSeparator } from '@soxa-ui/core'
import type { ListBoxSeparatorDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type ListBoxSeparatorEventProps = EventProps<typeof ListBoxSeparatorDescriptor>

export type ListBoxSeparatorProps = UseDomProps<
	typeof ListBoxSeparatorDescriptor,
	TListBoxSeparator,
	ListBoxSeparatorEventProps
>
