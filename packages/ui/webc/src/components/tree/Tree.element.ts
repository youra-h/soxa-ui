import { TreeCollectionDescriptor, TreeDescriptor } from '@soxa-ui/setup'
import type { TTree, TTreeCollectionFacade } from '@soxa-ui/core'
import { ElementBase, defineElement } from '../../adapter'
import type { TElementClassOf, TElementType } from '../../adapter'
import { treeTemplate } from './tree.template'
import { setupTree } from './setup.component'

export const TTreeElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof TreeDescriptor,
	TTree,
	TTreeCollectionFacade
> = ElementBase(HTMLDivElement, {
	descriptor: TreeDescriptor,
	facade: TreeCollectionDescriptor,
	template: treeTemplate,
	root: { strategy: 'host', sets: ['attrs', 'aria', 'dataset'] },
	setup: setupTree,
})

defineElement('so-tree', TTreeElement, 'div')

export type TTreeElementProps = TElementType<typeof TTreeElement>
