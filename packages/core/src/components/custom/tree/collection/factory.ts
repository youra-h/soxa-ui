import type { TSelectionCollectionExtensions } from '../../../base/collection/create/types'
import { completeEngine, selectionExtensions } from '../../../base/collection/create/internal'
import {
	TDrawExtension,
	TFactoryExtension,
	TMemoryExtension,
	TValueSelectionExtension,
} from '../../../base/collection'
import type { TCollectionEngine } from '../../../base/collection'
import { TTreeItem } from '../item/item.class'
import type { ITreeNode } from '../types'
import type { TTree } from '../tree.class'
import { TTreeExtension } from './extensions/tree/tree.extension'

export type TTreeCollectionExtensions = TSelectionCollectionExtensions<TTreeItem> & {
	factory: TFactoryExtension<TTreeItem>
	tree: TTreeExtension
	draw: TDrawExtension<TTreeItem>
	memory: TMemoryExtension<TTreeItem>
	value: TValueSelectionExtension<TTree, TTreeItem>
}

export type TTreeCollection = TCollectionEngine<
	TTreeItem,
	TTreeCollectionExtensions,
	{ owner: TTree }
>

export type TTreeCollectionFacadeEngine = TCollectionEngine<any, any>

/** Complete a supplied engine using the same composition as an owned tree. */
export function completeTreeEngine(engine?: TTreeCollectionFacadeEngine): TTreeCollection {
	return completeEngine<TTreeItem, { owner: TTree }>(engine, {
		...selectionExtensions<TTreeItem>(TTreeItem),
		tree: () => new TTreeExtension(),
		value: () => new TValueSelectionExtension<TTree, TTreeItem>(),
		memory: () => new TMemoryExtension<TTreeItem>(),
		draw: () => new TDrawExtension<TTreeItem>(),
	})
}

/** Create and populate a Tree engine before attaching it to a component. */
export function createEngineTree(nodes: readonly ITreeNode[] = []): TTreeCollection {
	const engine = completeTreeEngine()

	engine.extensions.tree.setNodes(nodes)

	return engine
}
