import { withParts } from '@soxa-ui/setup'
import SelectComponent from './Select.svelte'
import { SelectItem } from './item'
import { SelectGroup } from './group'
import { SelectSeparator } from './separator'

export * from './base.component'
export { setupSelect } from './setup.component'
export * from './item'
export * from './group'

export const Select = withParts(SelectComponent, {
	Item: SelectItem,
	Group: SelectGroup,
	Separator: SelectSeparator,
})
export * from './separator'
