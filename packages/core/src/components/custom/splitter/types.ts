import type { TOrientation, TValuePayload } from '../../../common'
import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../base/component-view'
import type { ISlidable } from '../slide'

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

export interface ISplitterProps extends IComponentViewProps {
	/** Panel configuration in the same order as the rendered panels. Sizes are percentages. */
	panels?: readonly ISplitterPanelConfig[]
	/** Direction in which the panels are laid out. */
	orientation?: TOrientation
	/** Distance from the divider's center to each neighboring panel, in pixels. */
	offset?: number
	/** Width of the divider and its hit area in pixels. Defaults to the theme's size scale. */
	width?: number
	/** Shows the grip in the middle of each handle. */
	thumb?: boolean
	disabled?: boolean
}

export type TSplitterEvents = TComponentViewEvents & {
	'change:panels': (payload: TValuePayload<readonly ISplitterPanelConfig[]>) => void
	'change:orientation': (payload: TValuePayload<TOrientation>) => void
	'change:offset': (payload: TValuePayload<number>) => void
	'change:width': (payload: TValuePayload<number | undefined>) => void
	'change:thumb': (payload: TValuePayload<boolean>) => void
	'change:disabled': (payload: TValuePayload<boolean>) => void
	'change:sizes': (payload: TValuePayload<readonly number[]>) => void
	'change:activeThumb': (payload: TValuePayload<number | undefined>) => void
	commit: (sizes: readonly number[]) => void
	'change:snap': (payload: TValuePayload<ISlidable['snap']>) => void
}

export interface ISplitter
	extends IComponentView<ISplitterProps, TSplitterEvents>, Omit<ISlidable, 'events'> {
	panels: readonly ISplitterPanelConfig[]
	orientation: TOrientation
	offset: number
	width: number | undefined
	thumb: boolean
	readonly splitterStyle: Record<string, string>
	disabled: boolean
	readonly sizes: readonly number[]
	indexOf(panel: string): number
	activate(index: number): void
	togglePanel(panel: string): void
	rangeOf(index: number): readonly [min: number, max: number]
}

export interface ISplitterPartProps extends IComponentViewProps {
	/** Panel identifier. On a handle, identifies the panel directly before the boundary. */
	panel?: string
}

export type TSplitterPartEvents = TComponentViewEvents & {
	'change:panel': (payload: TValuePayload<string>) => void
}

export type TSplitterPanelEvents = TSplitterPartEvents & {
	'change:panelStyle': (payload: TValuePayload<Record<string, number>>) => void
}

export interface ISplitterPanel extends IComponentView<ISplitterPartProps, TSplitterPanelEvents> {
	readonly panelStyle: Record<string, number>
	panel: string
	sync(owner: ISplitter | null): void
}

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
