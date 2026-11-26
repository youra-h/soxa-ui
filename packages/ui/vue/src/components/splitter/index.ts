import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import Component from './Splitter.vue'
import { SplitterPanel } from './panel'
import { SplitterHandle } from './handle'

export * from './base.component'
export * from './panel'
export * from './handle'

const SplitterComponent: TClosedComponent<typeof Component> = Component

export const Splitter = withParts(SplitterComponent, {
	Panel: SplitterPanel,
	Handle: SplitterHandle,
})
