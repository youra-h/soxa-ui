import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import SelectComponent from './Select.vue'
import { SelectItem } from './item'
import { SelectGroup } from './group'
import { SelectSeparator } from './separator'

export { default as BaseSelect } from './base.component'
export * from './base.component'
export * from './item'
export * from './group'

/** Compound item, group and separator parts share their flat component exports. */

export const Select: TClosedComponent<typeof SelectComponent> & {
	Item: typeof SelectItem
	Group: typeof SelectGroup
	Separator: typeof SelectSeparator
} = withParts(SelectComponent, {
	Item: SelectItem,
	Group: SelectGroup,
	Separator: SelectSeparator,
})
export * from './separator'
