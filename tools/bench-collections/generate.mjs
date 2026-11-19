import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
const root = import.meta.dirname
for (const fw of ['vue', 'react', 'solid', 'svelte', 'angular', 'webc'])
	writeFileSync(
		resolve(root, `${fw}.html`),
		`<!doctype html><html data-so-theme="oren"><head><meta charset="utf-8"></head><body><div id="root"></div><script type="module" src="./${fw}.${['react', 'solid'].includes(fw) ? 'tsx' : 'ts'}"></script></body></html>`,
	)
mkdirSync(resolve(root, 'angular'), { recursive: true })
for (const variant of ['before', 'after', 'main', 'head']) {
	const tabs = (
		mode,
	) => `<div so-tabs aria_label="Items" ${mode === 'initial' ? '[initial]="spec.source"' : mode === 'data' ? '[items]="spec.items"' : ''}>
${mode === 'declarative' ? '@for(item of spec.items;track item.value;let i=$index){<div so-tabs-item [value]="item.value" [text]="item.text" [active]="i===1"></div>}' : ''}
<div slot="content">@for(item of spec.items;track item.value;let i=$index){<div so-tabs-content ${mode === 'initial' ? '[initial]="i"' : '[value]="item.value"'}>Panel {{i}}</div>}</div></div>`
	const tags = (mode) =>
		`<div so-tags mode="single" aria_label="Items" ${mode === 'initial' ? '[initial]="spec.source"' : mode === 'data' ? '[items]="spec.items"' : ''}>${mode === 'declarative' ? '@for(item of spec.items;track item.value;let i=$index){<div so-tags-item [value]="item.value" [text]="item.text" [selected]="i===1"></div>}' : ''}</div>`
	const branches = (fn) =>
		`${variant !== 'before' ? `@if(spec.mode==='initial'){${fn('initial')}}@else if` : '@if'}(spec.mode==='data'){${fn('data')}}@else{${fn('declarative')}}`
	writeFileSync(
		resolve(root, `angular/${variant}.ts`),
		`import {Component,inject,InjectionToken,ChangeDetectionStrategy} from '@angular/core'
import {TTabsComponent,TTabsItemComponent,TTabsContentComponent,TTagsComponent,TTagsItemComponent} from '@soxa-ui/angular'
import type {Spec} from '../data'
export const SPEC=new InjectionToken<Spec>('benchmark spec')
@Component({selector:'bench-page',imports:[TTabsComponent,TTabsItemComponent,TTabsContentComponent,TTagsComponent,TTagsItemComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:\`@if(spec.kind==='tabs'){${branches(tabs)}}@else{${branches(tags)}}\`})
export class Fixture {readonly spec=inject(SPEC)}
`,
	)
}
