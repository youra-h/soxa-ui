import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { TSelectSeparator } from '@soxa-ui/core'
import { TSelectSeparatorSurface } from '../../../generated/select-separator.metadata'
import { setupSelectSeparator } from './setup.component'

@Component({
	selector: 'div[so-select-separator], [so-select-separator]',
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '',
})
export class TSelectSeparatorComponent extends TSelectSeparatorSurface<TSelectSeparator> {
	constructor() {
		super(setupSelectSeparator, { strategy: 'host' })
	}
}
