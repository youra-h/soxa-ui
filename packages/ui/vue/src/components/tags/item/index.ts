import { createVuePreparedAdapterContext } from '../../../adapter/common/collection-preparation'
import type { SetupContext, TClosedComponent } from '../../../adapter'
import TagsItemComponent from './Item.vue'
import { setupTagsItem } from './setup.component'
import type { TagsItemProps } from './base.component'

export * from './base.component'
export { default as BaseTagsItem } from './base.component'

export const TagsItem: TClosedComponent<typeof TagsItemComponent> = Object.assign(
	{},
	TagsItemComponent,
	{
		setup(props: TagsItemProps, context: SetupContext) {
			return setupTagsItem(props, context, createVuePreparedAdapterContext)
		},
	},
)
