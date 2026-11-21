import type { TSelectSeparator } from '@soxa-ui/core'
import type { SelectSeparatorDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type SelectSeparatorEventProps = EventProps<typeof SelectSeparatorDescriptor>

export type SelectSeparatorProps = UseDomProps<
	typeof SelectSeparatorDescriptor,
	TSelectSeparator,
	SelectSeparatorEventProps
>
