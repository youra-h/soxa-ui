import type { TClosedComponent } from '../../../adapter'
import ListBoxSeparatorComponent from './Separator.vue'

export * from './base.component'
export { default as BaseListBoxSeparator } from './base.component'

export const ListBoxSeparator: TClosedComponent<typeof ListBoxSeparatorComponent> =
	ListBoxSeparatorComponent
