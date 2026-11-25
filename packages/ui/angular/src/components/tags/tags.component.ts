import { Component, ChangeDetectionStrategy } from '@angular/core'
import { NgTemplateOutlet } from '@angular/common'
import type { ITags } from '@soxa-ui/core'
import { SlotDirective, provideElevator } from '../../adapter'
import { TTagsItemComponent } from './item'
import { TTagsSurface } from '../../generated/tags.metadata'
import { setupTags } from './setup.component'
import { createAngularPreparedAdapterContext } from '../../adapter/common/collection-preparation'

/**
 * Набор тегов: корень — сам ряд с ролью. AGENTS.md (Angular),
 * «Tags — ряд тегов, своя раскладка — шаблон `default`».
 */
@Component({
	selector: 'div[so-tags], [so-tags]',
	imports: [NgTemplateOutlet, SlotDirective, TTagsItemComponent],
	providers: [provideElevator()],
	changeDetection: ChangeDetectionStrategy.OnPush,
	templateUrl: './tags.component.html',
})
export class TTagsComponent extends TTagsSurface<ITags> {
	constructor() {
		super(
			(ctrl, inputs) =>
				setupTags(ctrl, inputs, this.engine, createAngularPreparedAdapterContext),
			{ strategy: 'host' },
		)
	}
}
