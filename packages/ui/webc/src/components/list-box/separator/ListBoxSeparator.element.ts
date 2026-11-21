import { ListBoxSeparatorDescriptor } from '@soxa-ui/setup'
import type { TListBoxSeparator } from '@soxa-ui/core'
import { ElementBase } from '../../../adapter'
import type { TElementClassOf, TElementType } from '../../../adapter'
import { listBoxSeparatorTemplate } from './list-box-separator.template'
import { setupListBoxSeparator } from './setup.component'

export const TListBoxSeparatorElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof ListBoxSeparatorDescriptor,
	TListBoxSeparator
> = ElementBase(HTMLDivElement, {
	descriptor: ListBoxSeparatorDescriptor,
	template: listBoxSeparatorTemplate,
	setup: setupListBoxSeparator,
})

export type TListBoxSeparatorElementProps = TElementType<typeof TListBoxSeparatorElement>
