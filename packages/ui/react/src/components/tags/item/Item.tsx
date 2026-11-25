import { createCollectionPreparation } from '../../../adapter/runtime/collection-preparation'
import { createTagsItem } from './view'

export const TagsItem = createTagsItem(createCollectionPreparation)
