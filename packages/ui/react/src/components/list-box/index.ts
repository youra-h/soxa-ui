import { withParts } from '@soxa-ui/setup'
import { ListBox as ListBoxComponent } from './ListBox'
import { ListBoxItem } from './item'
import { ListBoxGroup } from './group'
import { ListBoxSeparator } from './separator'

export * from './base.component'
export * from './item'
export * from './group'

export const ListBox = withParts(ListBoxComponent, {
	Item: ListBoxItem,
	Group: ListBoxGroup,
	Separator: ListBoxSeparator,
})
export * from './separator'
