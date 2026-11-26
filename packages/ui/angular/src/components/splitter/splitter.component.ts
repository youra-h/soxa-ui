import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { ISplitter } from '@soxa-ui/core'
import { provideElevator } from '../../adapter'
import { TSplitterSurface } from '../../generated/splitter.metadata'
import { setupSplitter } from './setup.component'

@Component({
	selector: '[so-splitter]',
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '<ng-content />',
})
export class TSplitterComponent extends TSplitterSurface<ISplitter> {
	constructor() {
		super(setupSplitter, { strategy: 'host', style: 'splitterStyle' })
	}
}
