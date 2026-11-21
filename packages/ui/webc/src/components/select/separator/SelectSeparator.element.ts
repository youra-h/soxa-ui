import { SelectSeparatorDescriptor } from '@soxa-ui/setup'
import type { TSelectSeparator } from '@soxa-ui/core'
import { ElementBase } from '../../../adapter'
import type { TElementClassOf, TElementType } from '../../../adapter'
import { selectSeparatorTemplate } from './select-separator.template'
import { setupSelectSeparator } from './setup.component'

export const TSelectSeparatorElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof SelectSeparatorDescriptor,
	TSelectSeparator
> = ElementBase(HTMLDivElement, {
	descriptor: SelectSeparatorDescriptor,
	template: selectSeparatorTemplate,
	setup: setupSelectSeparator,
})

export type TSelectSeparatorElementProps = TElementType<typeof TSelectSeparatorElement>
