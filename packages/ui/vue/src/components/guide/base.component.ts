import { GuideDescriptor } from '@soxa-ui/setup'
import type { IGuide } from '@soxa-ui/core'
import { useEmits, useProps } from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'

export const emitsGuide: TEmits = useEmits(GuideDescriptor())
export const propsGuide: TProps = useProps(GuideDescriptor()) as TProps
export type GuideProps = UseProps<typeof GuideDescriptor, IGuide>

export default { name: 'BaseGuide', emits: emitsGuide, props: propsGuide }
