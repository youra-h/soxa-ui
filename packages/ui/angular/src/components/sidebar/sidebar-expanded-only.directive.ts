import { Directive } from '@angular/core'

@Directive({
	selector: '[so-sidebar-expanded-only]',
	host: { 'data-so-sidebar-expanded-only': '' },
})
export class TSidebarExpandedOnlyDirective {}
