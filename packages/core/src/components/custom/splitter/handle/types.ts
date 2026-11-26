import type { TValuePayload } from '../../../../common'
import type { IComponentView } from '../../../base/component-view'
import type { ISplitterPartProps, TSplitterPartEvents } from '../part/types'
import type { ISplitter } from '../types'

export interface ISplitterHandleProps extends ISplitterPartProps {
	/** Theme thickness token. Oren provides sm, normal and lg. */
	size?: string
}

export type TSplitterHandleEvents = TSplitterPartEvents & {
	'change:size': (payload: TValuePayload<string>) => void
	'change:thumbShown': (payload: TValuePayload<boolean>) => void
}

export interface ISplitterHandle extends IComponentView<
	ISplitterHandleProps,
	TSplitterHandleEvents
> {
	panel: string
	size: string
	readonly thumbShown: boolean
	sync(owner: ISplitter | null): void
}
