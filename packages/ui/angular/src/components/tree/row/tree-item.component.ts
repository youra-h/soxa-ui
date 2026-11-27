import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import type { TemplateRef } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { TTreeItem, TTreeRenderEntry } from '@soxa-ui/core'
import { AttributesDirective } from '../../../adapter'
import { TItemRowComponent } from '../../item-row'
import { TTreeRowSurface } from '../../../generated/tree-row.metadata'
import { setupTreeItem } from '../setup.component'

@Component({
	selector: '[so-tree-item]',
	imports: [NgTemplateOutlet, AttributesDirective, TItemRowComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tree-item.component.html',
})
export class TTreeItemComponent extends TTreeRowSurface<TTreeItem> {
	@Input() row = true
	@Input() iconSlot: TemplateRef<unknown> | null = null
	@Input() indicatorSlot: TemplateRef<unknown> | null = null
	@Input() contentSlot: TemplateRef<unknown> | null = null
	@Input() group: TemplateRef<unknown> | null = null
	@Input() descendants: readonly TTreeRenderEntry[] = []

	constructor() {
		super(setupTreeItem, { strategy: 'host', sets: ['attrs', 'aria', 'dataset'] })
	}
}
