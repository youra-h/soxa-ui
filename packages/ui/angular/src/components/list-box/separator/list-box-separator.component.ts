import { Component, ChangeDetectionStrategy } from '@angular/core'
import type { TListBoxSeparator } from '@soxa-ui/core'
import { TListBoxSeparatorSurface } from '../../../generated/list-box-separator.metadata'
import { setupListBoxSeparator } from './setup.component'

@Component({
	selector: 'div[so-list-box-separator], [so-list-box-separator]',
	changeDetection: ChangeDetectionStrategy.OnPush,
	template: '',
})
export class TListBoxSeparatorComponent extends TListBoxSeparatorSurface<TListBoxSeparator> {
	constructor() {
		super(setupListBoxSeparator, { strategy: 'host' })
	}
}
