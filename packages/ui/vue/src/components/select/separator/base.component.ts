import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'
import { SelectSeparatorDescriptor } from '@soxa-ui/setup'
import type { TSelectSeparator } from '@soxa-ui/core'

export const emitsSelectSeparator: TEmits = useEmits(SelectSeparatorDescriptor())

export const propsSelectSeparator: TProps = useProps(SelectSeparatorDescriptor()) as TProps

export type SelectSeparatorProps = UseProps<typeof SelectSeparatorDescriptor, TSelectSeparator>

export default {
	name: 'BaseSelectSeparator',
	emits: emitsSelectSeparator,
	props: propsSelectSeparator,
}
