import type { IValueControlProps, TValueControlEvents } from '../../../base/value-control'
import type { TValuePayload } from '../../../../common'
import type { TTreeKey } from '../types'

export interface ITreeItemProps extends IValueControlProps<TTreeKey> {
	text?: string
	selected?: boolean
	href?: string
}

/** Hierarchy fields used by the Tree extension to order the flat collection. */
export interface ITreeItemPlacement {
	/** Treat an unloaded node as a branch until the loader completes. */
	hasChildren?: boolean
	/** A null parent identifies a root node. */
	parentValue?: TTreeKey | null
	siblingOrder?: number
}

export type TTreeItemEvents = TValueControlEvents<TTreeKey> & {
	'change:text': (payload: TValuePayload<string>) => void
	'change:href': (payload: TValuePayload<string | undefined>) => void
}
