import type { TOrientation, TValuePayload } from '../../../common'
import type { IControl, IControlProps, TControlEvents } from '../../base/control'
import type { TCollectionStorageDriverEvents } from '../../base/collection'
import type { TButtonView } from '../button/types'
import type { IToggleGroupCollectionProps } from './collection/types'
import type { IToggleGroupItem, IToggleGroupItemProps } from './item/types'

export type TToggleGroupOrientation = TOrientation
export type TToggleGroupView = TButtonView

export type TToggleGroupEvents = TControlEvents &
	TCollectionStorageDriverEvents<IToggleGroupItem> & {
		'change:orientation': (payload: TValuePayload<TOrientation>) => void
		'change:view': (payload: TValuePayload<TToggleGroupView | undefined>) => void
	}

export interface IToggleGroupComponentProps extends IControlProps {
	/** Selects the arrow-key axis; RTL reverses only horizontal navigation. */
	orientation?: TOrientation
	/** Reuses the Button view registry and is inherited by the group items. */
	view?: TToggleGroupView
}

export interface IToggleGroupProps
	extends
		IToggleGroupComponentProps,
		IToggleGroupCollectionProps<IToggleGroupItemProps, IToggleGroupItem> {}

export interface IToggleGroup extends IControl<IToggleGroupProps, TToggleGroupEvents> {
	orientation: TOrientation
	view: TToggleGroupView | undefined
}
