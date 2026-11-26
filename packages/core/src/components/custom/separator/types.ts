import type { TOrientation, TValuePayload } from '../../../common'
import type {
	IComponentView,
	IComponentViewProps,
	TComponentViewEvents,
} from '../../base/component-view'

export type TSeparatorOrientation = TOrientation

export interface ISeparatorProps extends IComponentViewProps {
	orientation?: TOrientation
	/** Decorative boundaries are omitted from the accessibility tree. */
	decorative?: boolean
}

export type TSeparatorEvents = TComponentViewEvents & {
	'change:orientation': (payload: TValuePayload<TOrientation>) => void
	'change:decorative': (payload: TValuePayload<boolean>) => void
}

export interface ISeparator extends IComponentView<ISeparatorProps, TSeparatorEvents> {
	orientation: TOrientation
	decorative: boolean
}
