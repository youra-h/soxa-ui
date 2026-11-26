import type { TValuePayload } from '../../../../common'
import type { IComponentViewProps, TComponentViewEvents } from '../../../base/component-view'

export interface ISplitterPartProps extends IComponentViewProps {
	/** Panel identifier. On a handle, identifies the panel directly before the boundary. */
	panel?: string
}

export type TSplitterPartEvents = TComponentViewEvents & {
	'change:panel': (payload: TValuePayload<string>) => void
}
