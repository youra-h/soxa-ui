import type { IGuide } from '@soxa-ui/core'
import type { GuideDescriptor } from '@soxa-ui/setup'
import type { EventProps, UseDomProps } from '../../types'

export type GuideEventProps = EventProps<typeof GuideDescriptor>
export type GuideProps = UseDomProps<typeof GuideDescriptor, IGuide, GuideEventProps>
