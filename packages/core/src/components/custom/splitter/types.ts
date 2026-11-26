import type { TOrientation, TValuePayload } from '../../../common'
import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../base/component-view'
import type { ISlidable } from '../slide'
import type { ISplitterPanelConfig } from './panel/types'

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
