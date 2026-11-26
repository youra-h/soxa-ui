import { SplitterPanelDescriptor } from '@soxa-ui/setup'
import type { ISplitterPanel } from '@soxa-ui/core'
import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'

export const emitsSplitterPanel: TEmits = useEmits(SplitterPanelDescriptor())
export const propsSplitterPanel: TProps = useProps(SplitterPanelDescriptor()) as TProps
export type SplitterPanelProps = UseProps<typeof SplitterPanelDescriptor, ISplitterPanel>

export default { name: 'BaseSplitterPanel', emits: emitsSplitterPanel, props: propsSplitterPanel }
