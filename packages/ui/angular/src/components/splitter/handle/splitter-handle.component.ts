import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ISplitterHandle } from '@soxa-ui/core'
import { TSplitterHandleSurface } from '../../../generated/splitter-handle.metadata'
import { setupSplitterHandle } from './setup.component'

@Component({
	selector: '[so-splitter-handle]',
	imports: [NgTemplateOutlet],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: `
		@if (state()['thumbShown']) {
			<span class="so-splitter__grip" aria-hidden="true">
				<ng-container [ngTemplateOutlet]="slot('icon')" />
			</span>
		}
	`,
})
export class TSplitterHandleComponent extends TSplitterHandleSurface<ISplitterHandle> {
	constructor() {
		super(setupSplitterHandle, { strategy: 'host' })
	}
}
