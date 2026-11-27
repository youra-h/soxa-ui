import type { HTMLAttributes } from 'react'
import type { TTree } from '@soxa-ui/core'
import type { TreeCollectionDescriptor, TreeDescriptor } from '@soxa-ui/setup'
import type { EventProps, TDomAttributes, UseDomProps } from '../../types'

export type TreeEventProps = EventProps<typeof TreeDescriptor> &
	EventProps<typeof TreeCollectionDescriptor>
export type TreeAttributes = TDomAttributes<
	typeof TreeDescriptor,
	HTMLAttributes<HTMLElement>,
	TreeEventProps
>
export type TreeProps = UseDomProps<typeof TreeDescriptor, TTree, TreeEventProps>
