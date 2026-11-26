import type { ISplitterPanel } from '@soxa-ui/core'
import type { SplitterPanelDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../../types'

export type SplitterPanelEventProps = EventProps<typeof SplitterPanelDescriptor>
export type SplitterPanelProps = UseDomProps<
	typeof SplitterPanelDescriptor,
	ISplitterPanel,
	SplitterPanelEventProps
>
