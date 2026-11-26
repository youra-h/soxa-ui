import type { ISplitter } from '@soxa-ui/core'
import type { SplitterDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../types'

export type SplitterEventProps = EventProps<typeof SplitterDescriptor>
export type SplitterProps = UseDomProps<typeof SplitterDescriptor, ISplitter, SplitterEventProps>
