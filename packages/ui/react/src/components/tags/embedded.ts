import { createTagsItem } from './item/view'
import { createTags } from './view'

/** Select supplies its own items and renders the same tag views. */
export const EmbeddedTags = createTags(createTagsItem())
