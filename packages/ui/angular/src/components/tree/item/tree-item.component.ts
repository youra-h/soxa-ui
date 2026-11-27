import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import type { TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import { LIST_INDICATOR_ATTRIBUTE } from '@soxa-ui/core'
import type { TTreeItem, TTreeRenderEntry } from '@soxa-ui/core'
import { AttributesDirective, RoleIconDirective } from '../../../adapter'
import { TItemRowComponent } from '../../item-row'
import { TIconComponent } from '../../icon'
import { TTreeItemSurface } from '../../../generated/tree-item.metadata'
import { setupTreeItem } from './setup.component'

@Component({
	selector: '[so-tree-item]',
	imports: [
		NgTemplateOutlet,
		AttributesDirective,
		RoleIconDirective,
		TItemRowComponent,
		TIconComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tree-item.component.html',
})
export class TTreeItemComponent extends TTreeItemSurface<TTreeItem> {
	@Input() row = true
	@Input() iconSlot: TemplateRef<unknown> | null = null
	@Input() indicatorSlot: TemplateRef<unknown> | null = null
	@Input() contentSlot: TemplateRef<unknown> | null = null
	@Input() group: TemplateRef<unknown> | null = null
	@Input() descendants: readonly TTreeRenderEntry[] = []

	protected readonly selectionIndicatorAttribute = `data-${LIST_INDICATOR_ATTRIBUTE}`

	constructor() {
		super(setupTreeItem, { strategy: 'host', sets: ['attrs', 'aria', 'dataset'] })
	}
}
