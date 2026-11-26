import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { ISplitterPanel } from '@soxa-ui/core'
import { TSplitterPanelSurface } from '../../../generated/splitter-panel.metadata'
import { setupSplitterPanel } from './setup.component'

@Component({
	selector: '[so-splitter-panel]',
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<ng-content />',
})
export class TSplitterPanelComponent extends TSplitterPanelSurface<ISplitterPanel> {
	constructor() {
		super(setupSplitterPanel, { strategy: 'host', style: 'panelStyle' })
	}
}
