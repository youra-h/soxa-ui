import { TSelectionCollectionFacade, TSelectionItemFacade } from '../../../base/collection'
import type {
	TCollectionFacadeOptions,
	TDrawEvents,
	TSelectionCollectionFacadeEvents,
} from '../../../base/collection'
import type { TTreeItem } from '../item.class'
import type { ITreeProps, TTree } from '../tree.class'
import type { ITreeNode, TTreeKey } from '../types'
import { completeTreeEngine } from './factory'
import type { TTreeCollectionExtensions, TTreeCollectionFacadeEngine } from './factory'
import type { TTreeExtensionEvents } from './extensions/tree/tree.extension'
import { treeLayout } from './layout'

type TTreeCollectionFacadeEvents = TSelectionCollectionFacadeEvents<TTreeItem> &
	TTreeExtensionEvents &
	TDrawEvents<TTreeItem>

export class TTreeCollectionFacade extends TSelectionCollectionFacade<
	TTreeItem,
	TTreeCollectionExtensions,
	TTreeCollectionFacadeEvents
> {
	static override defaultValues = {
		...TSelectionCollectionFacade.defaultValues,
		expanded: undefined,
	}

	constructor(
		props: Pick<ITreeProps, 'items' | 'expanded' | 'mode'> = {},
		options: TCollectionFacadeOptions<TTreeCollectionFacadeEngine, TTree> = {},
	) {
		super({}, { engine: completeTreeEngine(options.engine), owner: options.owner })

		this.events.relayAll(this.extensions.tree.events)
		this.events.relayAll(this.extensions.draw.events)

		if (!options.engine) this.bindOwner()

		if (props.mode !== undefined) this.mode = props.mode
		if (props.expanded !== undefined) this.expanded = props.expanded
		if (props.items !== undefined) this.items = props.items
	}

	override get items(): readonly TTreeItem[] {
		return super.items
	}

	override set items(value: readonly ITreeNode[]) {
		const stored = this.items

		if (value.length === stored.length && value.every((item, index) => item === stored[index]))
			return

		this.extensions.tree.setNodes(value)
	}

	get expanded(): readonly TTreeKey[] {
		return this.extensions.tree.expanded
	}

	set expanded(value: readonly TTreeKey[] | undefined) {
		this.extensions.tree.expanded = value ?? []
	}

	get layout() {
		return treeLayout(this.extensions.draw.drawn, this.extensions.tree)
	}
}

export class TTreeItemCollectionFacade extends TSelectionItemFacade<
	TTreeItem,
	TTreeCollectionExtensions
> {}
