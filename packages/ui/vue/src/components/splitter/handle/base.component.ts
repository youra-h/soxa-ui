import { SplitterHandleDescriptor } from '@soxa-ui/setup'
import type { ISplitterHandle } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'

export const emitsSplitterHandle: TEmits = useEmits(SplitterHandleDescriptor())
export const propsSplitterHandle: TProps = useProps(SplitterHandleDescriptor()) as TProps
export type SplitterHandleProps = UseProps<typeof SplitterHandleDescriptor, ISplitterHandle>

export default {
	name: 'BaseSplitterHandle',
	emits: emitsSplitterHandle,
	props: propsSplitterHandle,
}
