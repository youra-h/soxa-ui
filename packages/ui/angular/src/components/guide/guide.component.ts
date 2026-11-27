import { ChangeDetectionStrategy, Component } from '@angular/core'
import type { IGuide } from '@soxa-ui/core'
import { TGuideSurface } from '../../generated/guide.metadata'
import { TButtonComponent } from '../button'
import { setupGuide } from './setup.component'

@Component({
	selector: 'div[so-guide], [so-guide]',
	imports: [TButtonComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { tabindex: '-1', ngSkipHydration: 'true' },
	templateUrl: './guide.component.html',
})
export class TGuideComponent extends TGuideSurface<IGuide> {
	constructor() {
		super(setupGuide, { strategy: 'host', teleport: { target: 'target', companion: true } })
	}
}
