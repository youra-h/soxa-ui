import { SplitterDescriptor } from '@soxa-ui/setup'
import type { ISplitter } from '@soxa-ui/core'
import { useEmits, useProps } from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'

export const emitsSplitter: TEmits = useEmits(SplitterDescriptor())
export const propsSplitter: TProps = useProps(SplitterDescriptor()) as TProps
export type SplitterProps = UseProps<typeof SplitterDescriptor, ISplitter>

export default { name: 'BaseSplitter', emits: emitsSplitter, props: propsSplitter }
