import type { ISplitterHandle } from '@soxa-ui/core'
import type { SplitterHandleDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type SplitterHandleEventProps = EventProps<typeof SplitterHandleDescriptor>
export type SplitterHandleProps = UseDomProps<
	typeof SplitterHandleDescriptor,
	ISplitterHandle,
	SplitterHandleEventProps
>
