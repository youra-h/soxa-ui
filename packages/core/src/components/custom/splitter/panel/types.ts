import type { TValuePayload } from '../../../../common'
import type { IComponentView } from '../../../base/component-view'
import type { ISplitterPartProps, TSplitterPartEvents } from '../part/types'
import type { ISplitter } from '../types'

export interface ISplitterPanelConfig {
	/** Identifies a panel within this splitter. */
	id: string
	/** Initial percentage of the space available to panels. Unspecified sizes share the remainder. */
	defaultSize?: number
	minSize?: number
	maxSize?: number
	/** Allows this panel to shrink to zero and restore its previous size. */
	collapsible?: boolean
}

export type TSplitterPanelEvents = TSplitterPartEvents & {
	'change:panelStyle': (payload: TValuePayload<Record<string, number>>) => void
}

export interface ISplitterPanel extends IComponentView<ISplitterPartProps, TSplitterPanelEvents> {
	readonly panelStyle: Record<string, number>
	panel: string
	sync(owner: ISplitter | null): void
}
