import {
	ChangeDetectionStrategy,
	Component,
	Directive,
	input,
	viewChild,
	viewChildren,
} from '@angular/core'
import {
	TAccordionComponent,
	TAccordionItemComponent,
	TListBoxComponent,
	TTreeComponent,
	TListBoxItemComponent,
	TRadioGroupComponent,
	TRadioGroupItemComponent,
	TScrollerComponent,
	TSelectComponent,
	TSelectItemComponent,
	TTableComponent,
	TTabsComponent,
	TTabsContentComponent,
	TTabsItemComponent,
	TTagsComponent,
} from '@soxa-ui/angular'
import {
	COLLECTION_ITEMS,
	TREE_PREVIEW_PROPS,
	TABLE_COLUMNS,
	TABLE_ROWS,
	TABLE_SCROLL_ROWS,
} from '@soxa-ui/playground-shared'
import { CopyDirective } from './copy.directive'
import { PartDirective } from './part.directive'
import type { TFixture } from './fixtures'

/**
 * Previews of collections, in Angular.
 *
 * The same previews as in Vue (`hosts/vue/previews.ts`): items and panels as
 * parts in markup, data where the other hosts use data (the table's rows and
 * columns, tags). The content comes from the shared manifest
 * (`COLLECTION_ITEMS`), as in Vue and React. Like every preview of the host
 * (`previews.ts`), it takes the shell's props as its inputs and binds them to
 * the collection in its markup; the parts' props are set by the preview. The
 * parts enter the collection in markup order and see their owner's lift layer
 * through the template's injector, as in an application. A part in markup is
 * marked `pg-part`, so the host listens to it (`PartDirective`).
 */

/**
 * RadioGroup: a radio's label is content, since a radio has no text and is a
 * bare control like CheckBox. The radio's root is the label,
 * `<label so-radio-group-item>`.
 */
@Component({
	selector: 'pg-radio-group-preview',
	imports: [TRadioGroupComponent, TRadioGroupItemComponent, CopyDirective, PartDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-radio-group
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[value]="value()"
				[name]="name()"
				[view]="view()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[engine]="engine()"
				[items]="items()"
			>
				@for (item of entries; track item.value) {
					<label so-radio-group-item pg-part [value]="item.value">{{ item.text }}</label>
				}
			</div>
		</ng-template>
	`,
})
export class RadioGroupPreview implements TFixture {
	readonly ctrl = input<TRadioGroupComponent['ctrl']>()
	readonly rendered = input<TRadioGroupComponent['rendered']>()
	readonly visible = input<TRadioGroupComponent['visible']>()
	readonly direction = input<TRadioGroupComponent['direction']>()
	readonly size = input<TRadioGroupComponent['size']>()
	readonly variant = input<TRadioGroupComponent['variant']>()
	readonly disabled = input<TRadioGroupComponent['disabled']>()
	readonly focused = input<TRadioGroupComponent['focused']>()
	readonly value = input<TRadioGroupComponent['value']>()
	readonly name = input<TRadioGroupComponent['name']>()
	readonly view = input<TRadioGroupComponent['view']>()
	readonly aria_label = input<TRadioGroupComponent['aria_label']>()
	readonly aria_labelledBy = input<TRadioGroupComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TRadioGroupComponent['aria_describedBy']>()
	readonly engine = input<TRadioGroupComponent['engine']>()
	readonly items = input<TRadioGroupComponent['items']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TRadioGroupComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * The inputs of a ListBox preview (one for every prop the page writes, and
 * `ctrl`) and the list in each copy, shared by the list with items in markup
 * and the list from data (`ListBoxPreview`, `ListBoxItemsPreview`).
 */
@Directive()
abstract class TListBoxPreviewInputs implements TFixture {
	readonly ctrl = input<TListBoxComponent['ctrl']>()
	readonly rendered = input<TListBoxComponent['rendered']>()
	readonly visible = input<TListBoxComponent['visible']>()
	readonly direction = input<TListBoxComponent['direction']>()
	readonly size = input<TListBoxComponent['size']>()
	readonly variant = input<TListBoxComponent['variant']>()
	readonly disabled = input<TListBoxComponent['disabled']>()
	readonly focused = input<TListBoxComponent['focused']>()
	readonly value = input<TListBoxComponent['value']>()
	readonly name = input<TListBoxComponent['name']>()
	readonly view = input<TListBoxComponent['view']>()
	readonly maxRows = input<TListBoxComponent['maxRows']>()
	readonly contentFit = input<TListBoxComponent['contentFit']>()
	readonly scrollBehavior = input<TListBoxComponent['scrollBehavior']>()
	readonly indicator = input<TListBoxComponent['indicator']>()
	readonly groupSeparators = input<TListBoxComponent['groupSeparators']>()
	readonly aria_label = input<TListBoxComponent['aria_label']>()
	readonly aria_labelledBy = input<TListBoxComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TListBoxComponent['aria_describedBy']>()
	readonly engine = input<TListBoxComponent['engine']>()
	readonly items = input<TListBoxComponent['items']>()
	readonly mode = input<TListBoxComponent['mode']>()
	readonly groupBy = input<TListBoxComponent['groupBy']>()
	readonly groups = input<TListBoxComponent['groups']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TListBoxComponent)
}

/** Bindings of the list to the preview's inputs, except the content (`items`). */
const LIST_BOX_BINDINGS = `
	[ctrl]="ctrl()"
	[rendered]="rendered()"
	[visible]="visible()"
	[direction]="direction()"
	[size]="size()"
	[variant]="variant()"
	[disabled]="disabled()"
	[focused]="focused()"
	[value]="value()"
	[name]="name()"
	[view]="view()"
	[maxRows]="maxRows()"
	[contentFit]="contentFit()"
	[scrollBehavior]="scrollBehavior()"
	[indicator]="indicator()"
	[groupSeparators]="groupSeparators()"
	[aria_label]="aria_label()"
	[aria_labelledBy]="aria_labelledBy()"
	[aria_describedBy]="aria_describedBy()"
	[engine]="engine()"
	[mode]="mode()"
	[groupBy]="groupBy()"
	[groups]="groups()"
`

/**
 * ListBox: items in markup. When they came as data (`items` from the page's
 * groups block) the preview is `ListBoxItemsPreview`: markup would replace the
 * data, and the list draws groups from data. The host picks it when it places
 * the preview (`templateFor`), for the reason given at `MenuPreview`
 * (`templates.ts`).
 */
@Component({
	selector: 'pg-list-box-preview',
	imports: [TListBoxComponent, TListBoxItemComponent, CopyDirective, PartDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div so-list-box ${LIST_BOX_BINDINGS}>
				@for (item of entries; track item.value) {
					<div so-list-box-item pg-part [value]="item.value" [text]="item.text"></div>
				}
			</div>
		</ng-template>
	`,
})
export class ListBoxPreview extends TListBoxPreviewInputs {
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * ListBox from data: the content is `items` from the page's groups block, and
 * there are no items in markup.
 */
@Component({
	selector: 'pg-list-box-items-preview',
	imports: [TListBoxComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div so-list-box [items]="items()" ${LIST_BOX_BINDINGS}></div>
		</ng-template>
	`,
})
export class ListBoxItemsPreview extends TListBoxPreviewInputs {}

/**
 * The inputs of a Select preview (one for every prop the page writes, and
 * `ctrl`) and the select in each copy, shared by the select with options in
 * markup and the select from data (`SelectPreview`, `SelectItemsPreview`).
 */
@Directive()
abstract class TSelectPreviewInputs implements TFixture {
	readonly ctrl = input<TSelectComponent['ctrl']>()
	readonly rendered = input<TSelectComponent['rendered']>()
	readonly visible = input<TSelectComponent['visible']>()
	readonly direction = input<TSelectComponent['direction']>()
	readonly size = input<TSelectComponent['size']>()
	readonly variant = input<TSelectComponent['variant']>()
	readonly disabled = input<TSelectComponent['disabled']>()
	readonly focused = input<TSelectComponent['focused']>()
	readonly value = input<TSelectComponent['value']>()
	readonly name = input<TSelectComponent['name']>()
	readonly readonly = input<TSelectComponent['readonly']>()
	readonly required = input<TSelectComponent['required']>()
	readonly open = input<TSelectComponent['open']>()
	readonly placeholder = input<TSelectComponent['placeholder']>()
	readonly closeOnSelect = input<TSelectComponent['closeOnSelect']>()
	readonly clearable = input<TSelectComponent['clearable']>()
	readonly editable = input<TSelectComponent['editable']>()
	readonly editableMode = input<TSelectComponent['editableMode']>()
	readonly removeOnBackspace = input<TSelectComponent['removeOnBackspace']>()
	readonly placement = input<TSelectComponent['placement']>()
	readonly swipe = input<TSelectComponent['swipe']>()
	readonly maxRows = input<TSelectComponent['maxRows']>()
	readonly contentFit = input<TSelectComponent['contentFit']>()
	readonly scrollBehavior = input<TSelectComponent['scrollBehavior']>()
	readonly indicator = input<TSelectComponent['indicator']>()
	readonly groupSeparators = input<TSelectComponent['groupSeparators']>()
	readonly aria_label = input<TSelectComponent['aria_label']>()
	readonly aria_labelledBy = input<TSelectComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TSelectComponent['aria_describedBy']>()
	readonly id = input<TSelectComponent['id']>()
	readonly dismiss_enabled = input<TSelectComponent['dismiss_enabled']>()
	readonly engine = input<TSelectComponent['engine']>()
	readonly items = input<TSelectComponent['items']>()
	readonly mode = input<TSelectComponent['mode']>()
	readonly groupBy = input<TSelectComponent['groupBy']>()
	readonly groups = input<TSelectComponent['groups']>()
	readonly tagsOverflow = input<TSelectComponent['tagsOverflow']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSelectComponent)
}

/** Bindings of the select to the preview's inputs, except the content (`items`). */
const SELECT_BINDINGS = `
	[ctrl]="ctrl()"
	[rendered]="rendered()"
	[visible]="visible()"
	[direction]="direction()"
	[size]="size()"
	[variant]="variant()"
	[disabled]="disabled()"
	[focused]="focused()"
	[value]="value()"
	[name]="name()"
	[readonly]="readonly()"
	[required]="required()"
	[open]="open()"
	[placeholder]="placeholder()"
	[closeOnSelect]="closeOnSelect()"
	[clearable]="clearable()"
	[editable]="editable()"
	[editableMode]="editableMode()"
	[removeOnBackspace]="removeOnBackspace()"
	[placement]="placement()"
	[swipe]="swipe()"
	[maxRows]="maxRows()"
	[contentFit]="contentFit()"
	[scrollBehavior]="scrollBehavior()"
	[indicator]="indicator()"
	[groupSeparators]="groupSeparators()"
	[aria_label]="aria_label()"
	[aria_labelledBy]="aria_labelledBy()"
	[aria_describedBy]="aria_describedBy()"
	[id]="id()"
	[dismiss_enabled]="dismiss_enabled()"
	[engine]="engine()"
	[mode]="mode()"
	[groupBy]="groupBy()"
	[groups]="groups()"
	[tagsOverflow]="tagsOverflow()"
`

/**
 * Select: options in markup, like `ListBoxPreview`. The options sit in the
 * list of its panel, moved to `body`, and see Select's lift layer through the
 * template's injector, as in an application.
 */
@Component({
	selector: 'pg-select-preview',
	imports: [TSelectComponent, TSelectItemComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div so-select ${SELECT_BINDINGS}>
				@for (item of entries; track item.value) {
					<div so-select-item [value]="item.value" [text]="item.text"></div>
				}
			</div>
		</ng-template>
	`,
})
export class SelectPreview extends TSelectPreviewInputs {
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * Select from data: the options are `items` from the page's groups block, and
 * there are none in markup.
 */
@Component({
	selector: 'pg-select-items-preview',
	imports: [TSelectComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div so-select [items]="items()" ${SELECT_BINDINGS}></div>
		</ng-template>
	`,
})
export class SelectItemsPreview extends TSelectPreviewInputs {}

/**
 * Tags: as data, as in Vue. The row spans the cell's width, otherwise overflow
 * has nothing to compare with: in the flexbox cell stage the row would keep
 * the width of its tags. The page's `items` override the preview's.
 */
@Component({
	selector: 'pg-tags-preview',
	imports: [TTagsComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div style="width: 100%">
				<div
					so-tags
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="visible()"
					[direction]="direction()"
					[size]="size()"
					[variant]="variant()"
					[disabled]="disabled()"
					[focused]="focused()"
					[value]="value()"
					[name]="name()"
					[closable]="closable()"
					[view]="view()"
					[overflow]="overflow()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
					[engine]="engine()"
					[items]="items() ?? entries"
					[mode]="mode()"
				></div>
			</div>
		</ng-template>
	`,
})
export class TagsPreview implements TFixture {
	readonly ctrl = input<TTagsComponent['ctrl']>()
	readonly rendered = input<TTagsComponent['rendered']>()
	readonly visible = input<TTagsComponent['visible']>()
	readonly direction = input<TTagsComponent['direction']>()
	readonly size = input<TTagsComponent['size']>()
	readonly variant = input<TTagsComponent['variant']>()
	readonly disabled = input<TTagsComponent['disabled']>()
	readonly focused = input<TTagsComponent['focused']>()
	readonly value = input<TTagsComponent['value']>()
	readonly name = input<TTagsComponent['name']>()
	readonly closable = input<TTagsComponent['closable']>()
	readonly view = input<TTagsComponent['view']>()
	readonly overflow = input<TTagsComponent['overflow']>()
	readonly aria_label = input<TTagsComponent['aria_label']>()
	readonly aria_labelledBy = input<TTagsComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TTagsComponent['aria_describedBy']>()
	readonly engine = input<TTagsComponent['engine']>()
	readonly items = input<TTagsComponent['items']>()
	readonly mode = input<TTagsComponent['mode']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTagsComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * Table: rows and columns as data, as in Vue and React: the table has no
 * parts in markup. The frame bounds the width, and with a sticky head it is
 * also a 320 px scroll window over forty rows. The page's `items` and
 * `columns` override the preview's. The table's window is on the Virtual
 * page.
 */
@Component({
	selector: 'pg-table-preview',
	imports: [TTableComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				[style]="
					stickyHead() ? 'width: 100%; height: 320px; overflow: auto' : 'width: 100%'
				"
			>
				<div
					so-table
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="visible()"
					[direction]="direction()"
					[size]="size()"
					[variant]="variant()"
					[disabled]="disabled()"
					[focused]="focused()"
					[stickyHead]="stickyHead()"
					[columnFit]="columnFit()"
					[reorderPreview]="reorderPreview()"
					[resizePreview]="resizePreview()"
					[resizable]="resizable()"
					[reorderable]="reorderable()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
					[engine]="engine()"
					[items]="items() ?? (stickyHead() ? data.scrollRows : data.rows)"
					[mode]="mode()"
					[columns]="columns() ?? data.columns"
					[sort]="sort()"
					[sortMode]="sortMode()"
					[presorted]="presorted()"
					[grid]="grid()"
				></div>
			</div>
		</ng-template>
	`,
})
export class TablePreview implements TFixture {
	readonly ctrl = input<TTableComponent['ctrl']>()
	readonly rendered = input<TTableComponent['rendered']>()
	readonly visible = input<TTableComponent['visible']>()
	readonly direction = input<TTableComponent['direction']>()
	readonly size = input<TTableComponent['size']>()
	readonly variant = input<TTableComponent['variant']>()
	readonly disabled = input<TTableComponent['disabled']>()
	readonly focused = input<TTableComponent['focused']>()
	readonly stickyHead = input<TTableComponent['stickyHead']>()
	readonly columnFit = input<TTableComponent['columnFit']>()
	readonly reorderPreview = input<TTableComponent['reorderPreview']>()
	readonly resizePreview = input<TTableComponent['resizePreview']>()
	readonly resizable = input<TTableComponent['resizable']>()
	readonly reorderable = input<TTableComponent['reorderable']>()
	readonly aria_label = input<TTableComponent['aria_label']>()
	readonly aria_labelledBy = input<TTableComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TTableComponent['aria_describedBy']>()
	readonly engine = input<TTableComponent['engine']>()
	readonly items = input<TTableComponent['items']>()
	readonly mode = input<TTableComponent['mode']>()
	readonly columns = input<TTableComponent['columns']>()
	readonly sort = input<TTableComponent['sort']>()
	readonly sortMode = input<TTableComponent['sortMode']>()
	readonly presorted = input<TTableComponent['presorted']>()
	readonly grid = input<TTableComponent['grid']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTableComponent)
	/** The preview's rows and columns, like `items` and `columns` of the Vue and React previews. */
	protected readonly data = {
		rows: TABLE_ROWS,
		scrollRows: TABLE_SCROLL_ROWS,
		columns: TABLE_COLUMNS,
	}
}

/**
 * Tabs: the tabs and their panels as parts. The first tab is active at once,
 * otherwise no panel would mount. The panels go to the `content` slot,
 * outside the tab list.
 */
@Component({
	selector: 'pg-tabs-preview',
	imports: [
		TTabsComponent,
		TTabsItemComponent,
		TTabsContentComponent,
		CopyDirective,
		PartDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-tabs
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[orientation]="orientation()"
				[alignment]="alignment()"
				[position]="position()"
				[view]="view()"
				[closable]="closable()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[engine]="engine()"
				[items]="items()"
			>
				@for (item of entries; track item.value; let first = $first) {
					<div
						so-tabs-item
						pg-part
						[active]="first"
						[value]="item.value"
						[text]="item.text"
					></div>
				}
				@for (item of entries; track item.value) {
					<div so-tabs-content pg-part slot="content" [value]="item.value">
						<div style="padding: 12px">Панель «{{ item.text }}»</div>
					</div>
				}
			</div>
		</ng-template>
	`,
})
export class TabsPreview implements TFixture {
	readonly ctrl = input<TTabsComponent['ctrl']>()
	readonly rendered = input<TTabsComponent['rendered']>()
	readonly visible = input<TTabsComponent['visible']>()
	readonly direction = input<TTabsComponent['direction']>()
	readonly size = input<TTabsComponent['size']>()
	readonly variant = input<TTabsComponent['variant']>()
	readonly disabled = input<TTabsComponent['disabled']>()
	readonly focused = input<TTabsComponent['focused']>()
	readonly orientation = input<TTabsComponent['orientation']>()
	readonly alignment = input<TTabsComponent['alignment']>()
	readonly position = input<TTabsComponent['position']>()
	readonly view = input<TTabsComponent['view']>()
	readonly closable = input<TTabsComponent['closable']>()
	readonly aria_label = input<TTabsComponent['aria_label']>()
	readonly aria_labelledBy = input<TTabsComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TTabsComponent['aria_describedBy']>()
	readonly engine = input<TTabsComponent['engine']>()
	readonly items = input<TTabsComponent['items']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTabsComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * Accordion: the sections as parts, with content.
 */
@Component({
	selector: 'pg-accordion-preview',
	imports: [TAccordionComponent, TAccordionItemComponent, CopyDirective, PartDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-accordion
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[view]="view()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[engine]="engine()"
				[items]="items()"
				[mode]="mode()"
			>
				@for (item of entries; track item.value) {
					<div so-accordion-item pg-part [value]="item.value" [text]="item.text">
						<div style="padding: 4px 0">Содержимое «{{ item.text }}»</div>
					</div>
				}
			</div>
		</ng-template>
	`,
})
export class AccordionPreview implements TFixture {
	readonly ctrl = input<TAccordionComponent['ctrl']>()
	readonly rendered = input<TAccordionComponent['rendered']>()
	readonly visible = input<TAccordionComponent['visible']>()
	readonly direction = input<TAccordionComponent['direction']>()
	readonly size = input<TAccordionComponent['size']>()
	readonly variant = input<TAccordionComponent['variant']>()
	readonly disabled = input<TAccordionComponent['disabled']>()
	readonly focused = input<TAccordionComponent['focused']>()
	readonly view = input<TAccordionComponent['view']>()
	readonly aria_label = input<TAccordionComponent['aria_label']>()
	readonly aria_labelledBy = input<TAccordionComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TAccordionComponent['aria_describedBy']>()
	readonly engine = input<TAccordionComponent['engine']>()
	readonly items = input<TAccordionComponent['items']>()
	readonly mode = input<TAccordionComponent['mode']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAccordionComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

/**
 * Scroller: the strip spans the cell's width; as wide as its content it would
 * overflow the whole column, leaving nothing to scroll. The content is
 * unwrapped lines in markup, as in Vue.
 */
@Component({
	selector: 'pg-scroller-preview',
	imports: [TScrollerComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div style="width: 100%">
				<div
					so-scroller
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="visible()"
					[direction]="direction()"
					[size]="size()"
					[variant]="variant()"
					[disabled]="disabled()"
					[focused]="focused()"
					[viewportAria]="viewportAria()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
				>
					@for (item of entries; track item.value) {
						<span style="padding: 4px 12px; white-space: nowrap"
							>{{ item.text }} пункт ленты</span
						>
					}
				</div>
			</div>
		</ng-template>
	`,
})
export class ScrollerPreview implements TFixture {
	readonly ctrl = input<TScrollerComponent['ctrl']>()
	readonly rendered = input<TScrollerComponent['rendered']>()
	readonly visible = input<TScrollerComponent['visible']>()
	readonly direction = input<TScrollerComponent['direction']>()
	readonly size = input<TScrollerComponent['size']>()
	readonly variant = input<TScrollerComponent['variant']>()
	readonly disabled = input<TScrollerComponent['disabled']>()
	readonly focused = input<TScrollerComponent['focused']>()
	readonly viewportAria = input<TScrollerComponent['viewportAria']>()
	readonly aria_label = input<TScrollerComponent['aria_label']>()
	readonly aria_labelledBy = input<TScrollerComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TScrollerComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TScrollerComponent)
	/** Collection content from the shared manifest, as in Vue and React. */
	protected readonly entries = COLLECTION_ITEMS
}

@Component({
	selector: 'pg-tree-preview',
	imports: [TTreeComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-tree
				[ctrl]="ctrl()"
				[items]="items() ?? defaults.items"
				[expanded]="expanded()"
				[guides]="guides() ?? defaults.guides"
				[indicator]="indicator()"
				[mode]="mode()"
				[value]="value()"
				[disabled]="disabled()"
				[focused]="focused()"
				[visible]="visible()"
				[rendered]="rendered()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[aria_label]="aria_label() ?? defaults.aria_label"
				[engine]="engine()"
				[name]="name()"
				[loadChildren]="loadChildren()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[embedded]="embedded()"
				[pluginProps]="pluginProps()"
			></div>
		</ng-template>
	`,
})
export class TreePreview implements TFixture {
	readonly ctrl = input<TTreeComponent['ctrl']>()
	readonly items = input<TTreeComponent['items']>()
	readonly expanded = input<TTreeComponent['expanded']>()
	readonly guides = input<TTreeComponent['guides']>()
	readonly indicator = input<TTreeComponent['indicator']>()
	readonly mode = input<TTreeComponent['mode']>()
	readonly value = input<TTreeComponent['value']>()
	readonly disabled = input<TTreeComponent['disabled']>()
	readonly focused = input<TTreeComponent['focused']>()
	readonly visible = input<TTreeComponent['visible']>()
	readonly rendered = input<TTreeComponent['rendered']>()
	readonly direction = input<TTreeComponent['direction']>()
	readonly size = input<TTreeComponent['size']>()
	readonly variant = input<TTreeComponent['variant']>()
	readonly aria_label = input<TTreeComponent['aria_label']>()
	readonly engine = input<TTreeComponent['engine']>()
	readonly name = input<TTreeComponent['name']>()
	readonly loadChildren = input<TTreeComponent['loadChildren']>()
	readonly aria_labelledBy = input<TTreeComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TTreeComponent['aria_describedBy']>()
	readonly embedded = input<TTreeComponent['embedded']>()
	readonly pluginProps = input<TTreeComponent['pluginProps']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTreeComponent)
	protected readonly defaults = TREE_PREVIEW_PROPS
}
