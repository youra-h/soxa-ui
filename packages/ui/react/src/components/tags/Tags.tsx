import { createCollectionPreparation } from '../../adapter/runtime/collection-preparation'
import { TagsItem } from './item'
import { createTags } from './view'

export const Tags = createTags(TagsItem, createCollectionPreparation)
