import type { TClosedComponent } from '../../../adapter'
import SelectSeparatorComponent from './Separator.vue'

export * from './base.component'
export { default as BaseSelectSeparator } from './base.component'

export const SelectSeparator: TClosedComponent<typeof SelectSeparatorComponent> =
	SelectSeparatorComponent
