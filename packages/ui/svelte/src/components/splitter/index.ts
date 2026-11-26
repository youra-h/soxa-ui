import { withParts } from '@soxa-ui/setup'
import SplitterComponent from './Splitter.svelte'
import { SplitterPanel } from './panel'
import { SplitterHandle } from './handle'

export * from './base.component'
export * from './panel'
export * from './handle'

export const Splitter = withParts(SplitterComponent, {
	Panel: SplitterPanel,
	Handle: SplitterHandle,
})
