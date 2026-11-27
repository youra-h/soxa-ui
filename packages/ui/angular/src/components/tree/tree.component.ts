import { ChangeDetectionStrategy, Component } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { TTree, TTreeRenderItem } from '@soxa-ui/core'
import { provideElevator } from '../../adapter'
import { TTreeSurface } from '../../generated/tree.metadata'
import { TTreeItemComponent } from './item'
import { setupTree } from './setup.component'

@Component({
	selector: '[so-tree]',
	imports: [NgTemplateOutlet, TTreeItemComponent],
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tree.component.html',
})
export class TTreeComponent extends TTreeSurface<TTree> {
	constructor() {
		super((ctrl, props) => setupTree(ctrl, props, this.engine), {
			strategy: 'host',
			sets: ['attrs', 'aria', 'dataset'],
		})
	}

	linkOf(entry: TTreeRenderItem): string | undefined {
		return entry.item.aria.has('aria-expanded') ? undefined : entry.item.href
	}
}
