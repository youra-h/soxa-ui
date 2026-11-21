import { useEmits, useProps } from '../../../adapter'
import type { TEmits, TProps, UseProps } from '../../../types/common'
import { ListBoxSeparatorDescriptor } from '@soxa-ui/setup'
import type { TListBoxSeparator } from '@soxa-ui/core'

export const emitsListBoxSeparator: TEmits = useEmits(ListBoxSeparatorDescriptor())

export const propsListBoxSeparator: TProps = useProps(ListBoxSeparatorDescriptor()) as TProps

export type ListBoxSeparatorProps = UseProps<typeof ListBoxSeparatorDescriptor, TListBoxSeparator>

export default {
	name: 'BaseListBoxSeparator',
	emits: emitsListBoxSeparator,
	props: propsListBoxSeparator,
}
