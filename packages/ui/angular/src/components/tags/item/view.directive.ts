import { Directive } from '@angular/core'
import type { ITagsItem } from '@soxa-ui/core'
import { TTagsItemSurface } from '../../../generated/tags-item.metadata'

export const tagsItemRoot = {
	strategy: 'host',
	sets: ['aria', 'attrs', 'dataset'],
	aria: 'rootAria',
	control: true,
	order: 'order',
} as const

@Directive()
export abstract class TTagsItemView extends TTagsItemSurface<ITagsItem> {
	/** Prevent the tag's row and the Select trigger from also handling the removal click. */
	protected close(event: Event): void {
		event.stopPropagation()
		this.facade()?.context?.adapters.tags.close()
	}
}
