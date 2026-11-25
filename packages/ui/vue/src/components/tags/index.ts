import { createVuePreparedAdapterContext } from '../../adapter/common/collection-preparation'
import { withParts } from '@soxa-ui/setup'
import type { SetupContext, TClosedComponent } from '../../adapter'
import TagsComponent from './Tags.vue'
import { setupTags } from './setup.component'
import type { TagsProps } from './base.component'
import { TagsItem } from './item'

export { default as BaseTags, emitsTags, propsTags } from './base.component'
export * from './item'

/** Экземпляр владельца закрыт так же, как у частей (`TClosedComponent`). */
const TagsOwner: TClosedComponent<typeof TagsComponent> = Object.assign({}, TagsComponent, {
	components: { TagsItem },
	setup(props: TagsProps, context: SetupContext) {
		return setupTags(props, context, createVuePreparedAdapterContext)
	},
})

/** Основная форма — `<Tags.Item>`; плоский `TagsItem` работает так же. */
export const Tags = withParts(TagsOwner, { Item: TagsItem })
