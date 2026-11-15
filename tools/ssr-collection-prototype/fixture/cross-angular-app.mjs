import '@angular/compiler'
import { Component, provideZonelessChangeDetection } from '@angular/core'
import { provideClientHydration } from '@angular/platform-browser'
import {
	TTabsComponent,
	TTabsItemComponent,
	TTabsContentComponent,
	provideAttrs,
} from '@soxa-ui/angular'

export function providers() {
	return [provideZonelessChangeDetection(), provideClientHydration(), provideAttrs()]
}

export function createApp(scenario) {
	const nested =
		scenario === 'nested'
			? `<div so-tabs><div so-tabs-item value="nested-0" text="Tab nested-0"></div><div so-tabs-item value="nested-1" text="Tab nested-1" active></div><div so-tabs-content slot="content" value="nested-0">Panel nested-0</div><div so-tabs-content slot="content" value="nested-1">Panel nested-1</div></div>`
			: ''
	class App {}
	Component({
		selector: 'cross-' + scenario,
		standalone: true,
		imports: [TTabsComponent, TTabsItemComponent, TTabsContentComponent],
		template: `<div so-tabs><div so-tabs-item value="0" text="Tab 0"></div>@if (${scenario !== 'conditional'}) {<div so-tabs-item value="1" text="Tab 1" active></div>}@else {<div so-tabs-item value="last" text="Tab last" active></div>}<div so-tabs-content slot="content" value="0">Panel 0</div><div so-tabs-content slot="content" value="1">Panel 1${nested}</div><div so-tabs-content slot="content" value="last">Panel last</div></div>`,
	})(App)
	return App
}
