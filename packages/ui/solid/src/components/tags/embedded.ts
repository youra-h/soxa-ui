import { createTagsItem } from './item/view'
import { createTags } from './view'

/** Select supplies its own models to the shared tag views. */
export const EmbeddedTags = createTags(createTagsItem())
