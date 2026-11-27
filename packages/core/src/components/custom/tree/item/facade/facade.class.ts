import { TSelectionItemFacade } from '../../../../base/collection'
import type { TTreeCollectionExtensions } from '../../collection/factory'
import type { TTreeItem } from '../item.class'

/** Connects a mounted item to the selection state of its Tree collection. */
export class TTreeItemCollectionFacade extends TSelectionItemFacade<
	TTreeItem,
	TTreeCollectionExtensions
> {}
