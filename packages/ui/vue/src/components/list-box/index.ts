import { withParts } from '@soxa-ui/setup'
import type { TClosedComponent } from '../../adapter'
import ListBoxComponent from './ListBox.vue'
import { ListBoxItem } from './item'
import { ListBoxGroup } from './group'
import { ListBoxSeparator } from './separator'

export { default as BaseListBox } from './base.component'
export * from './base.component'
export * from './item'
export * from './group'

/** Keep the owner's instance closed, as on its compound parts. */
const ListBoxOwner: TClosedComponent<typeof ListBoxComponent> = ListBoxComponent

export const ListBox = withParts(ListBoxOwner, {
	Item: ListBoxItem,
	Group: ListBoxGroup,
	Separator: ListBoxSeparator,
})
export * from './separator'
