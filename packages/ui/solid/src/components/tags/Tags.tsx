import { createSolidPreparedAdapterContext } from '../../adapter/common/collection-preparation'
import { TagsItem } from './item'
import { createTags } from './view'

export const Tags = createTags(TagsItem, createSolidPreparedAdapterContext)
