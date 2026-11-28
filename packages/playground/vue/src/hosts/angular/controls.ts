import { ALERT_SAMPLE } from '@soxa-ui/playground-shared'
import {
	BREADCRUMBS_ITEMS,
	EDITOR_ALIGNMENT_ITEMS,
	AVATAR_PEOPLE,
	editorAlignmentPath,
} from '@soxa-ui/playground-shared'
import { ChangeDetectionStrategy, Component, input, viewChild, viewChildren } from '@angular/core'
import {
	RoleIconDirective,
	SlotDirective,
	TAlertComponent,
	TBadgeComponent,
	TAvatarComponent,
	TAvatarGroupComponent,
	TCodeBlockComponent,
	TFileUploadComponent,
	TSidebarComponent,
	TSidebarItemComponent,
	TSplitterComponent,
	TSplitterHandleComponent,
	TSplitterPanelComponent,
	TButtonComponent,
	TToggleButtonComponent,
	TToggleGroupComponent,
	TCalendarComponent,
	TCheckBoxComponent,
	TDateInputComponent,
	TDatePickerComponent,
	TFieldComponent,
	TIconComponent,
	TInputComponent,
	TLabelComponent,
	TNumberInputComponent,
	TBreadcrumbsComponent,
	TPaginationComponent,
	TProgressLinearComponent,
	TProgressSpinnerComponent,
	TRatingComponent,
	TSeparatorComponent,
	TSkeletonComponent,
	TSliderComponent,
	TSwitchComponent,
	TTextareaComponent,
} from '@soxa-ui/angular'
import { CopyDirective } from './copy.directive'
import type { TFixture } from './fixtures'

/**
 * Previews of single controls and fields — in Angular.
 *
 * The same previews as in Vue (`hosts/vue/previews.ts`): the component, the
 * wrapper around it (CheckBox in a Label) and its content. Like every preview
 * of the host (`previews.ts`), it takes the shell's props as its inputs — one
 * for every input of the adapter component the page can write, and `ctrl` —
 * and binds them to the component in its markup. The props of a wrapper and of
 * content are the preview's, as the neighbors' markup writes
 * `<Label text="…">`.
 */

/**
 * Button: the label is the `text` prop of the preview props, not content: a
 * given slot overrides the prop, and the `text` row would change nothing
 * visible.
 */
@Component({
	selector: 'pg-button-preview',
	imports: [TButtonComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<button
				so-button
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[text]="text()"
				[view]="view()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
			></button>
		</ng-template>
	`,
})
export class ButtonPreview implements TFixture {
	readonly ctrl = input<TButtonComponent['ctrl']>()
	readonly rendered = input<TButtonComponent['rendered']>()
	readonly visible = input<TButtonComponent['visible']>()
	readonly direction = input<TButtonComponent['direction']>()
	readonly size = input<TButtonComponent['size']>()
	readonly variant = input<TButtonComponent['variant']>()
	readonly disabled = input<TButtonComponent['disabled']>()
	readonly focused = input<TButtonComponent['focused']>()
	readonly text = input<TButtonComponent['text']>()
	readonly view = input<TButtonComponent['view']>()
	readonly aria_label = input<TButtonComponent['aria_label']>()
	readonly aria_labelledBy = input<TButtonComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TButtonComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TButtonComponent)
}

/**
 * Input.
 */
@Component({
	selector: 'pg-input-preview',
	imports: [TInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-input
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
				[clearable]="clearable()"
				[placeholder]="placeholder()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[id]="id()"
			></div>
		</ng-template>
	`,
})
export class InputPreview implements TFixture {
	readonly ctrl = input<TInputComponent['ctrl']>()
	readonly rendered = input<TInputComponent['rendered']>()
	readonly visible = input<TInputComponent['visible']>()
	readonly direction = input<TInputComponent['direction']>()
	readonly size = input<TInputComponent['size']>()
	readonly variant = input<TInputComponent['variant']>()
	readonly disabled = input<TInputComponent['disabled']>()
	readonly focused = input<TInputComponent['focused']>()
	readonly value = input<TInputComponent['value']>()
	readonly name = input<TInputComponent['name']>()
	readonly readonly = input<TInputComponent['readonly']>()
	readonly required = input<TInputComponent['required']>()
	readonly clearable = input<TInputComponent['clearable']>()
	readonly placeholder = input<TInputComponent['placeholder']>()
	readonly aria_label = input<TInputComponent['aria_label']>()
	readonly aria_labelledBy = input<TInputComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TInputComponent['aria_describedBy']>()
	readonly id = input<TInputComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TInputComponent)
}

/**
 * NumberInput.
 */
@Component({
	selector: 'pg-number-input-preview',
	imports: [TNumberInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-number-input
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
				[clearable]="clearable()"
				[min]="min()"
				[max]="max()"
				[step]="step()"
				[largeStep]="largeStep()"
				[formatOptions]="formatOptions()"
				[placeholder]="placeholder()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[id]="id()"
			></div>
		</ng-template>
	`,
})
export class NumberInputPreview implements TFixture {
	readonly ctrl = input<TNumberInputComponent['ctrl']>()
	readonly rendered = input<TNumberInputComponent['rendered']>()
	readonly visible = input<TNumberInputComponent['visible']>()
	readonly direction = input<TNumberInputComponent['direction']>()
	readonly size = input<TNumberInputComponent['size']>()
	readonly variant = input<TNumberInputComponent['variant']>()
	readonly disabled = input<TNumberInputComponent['disabled']>()
	readonly focused = input<TNumberInputComponent['focused']>()
	readonly value = input<TNumberInputComponent['value']>()
	readonly name = input<TNumberInputComponent['name']>()
	readonly readonly = input<TNumberInputComponent['readonly']>()
	readonly required = input<TNumberInputComponent['required']>()
	readonly clearable = input<TNumberInputComponent['clearable']>()
	readonly min = input<TNumberInputComponent['min']>()
	readonly max = input<TNumberInputComponent['max']>()
	readonly step = input<TNumberInputComponent['step']>()
	readonly largeStep = input<TNumberInputComponent['largeStep']>()
	readonly formatOptions = input<TNumberInputComponent['formatOptions']>()
	readonly placeholder = input<TNumberInputComponent['placeholder']>()
	readonly aria_label = input<TNumberInputComponent['aria_label']>()
	readonly aria_labelledBy = input<TNumberInputComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TNumberInputComponent['aria_describedBy']>()
	readonly id = input<TNumberInputComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TNumberInputComponent)
}

/**
 * Textarea.
 */
@Component({
	selector: 'pg-textarea-preview',
	imports: [TTextareaComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-textarea
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
				[placeholder]="placeholder()"
				[rows]="rows()"
				[maxRows]="maxRows()"
				[maxlength]="maxlength()"
				[autoresize]="autoresize()"
				[counter]="counter()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[id]="id()"
			></div>
		</ng-template>
	`,
})
export class TextareaPreview implements TFixture {
	readonly ctrl = input<TTextareaComponent['ctrl']>()
	readonly rendered = input<TTextareaComponent['rendered']>()
	readonly visible = input<TTextareaComponent['visible']>()
	readonly direction = input<TTextareaComponent['direction']>()
	readonly size = input<TTextareaComponent['size']>()
	readonly variant = input<TTextareaComponent['variant']>()
	readonly disabled = input<TTextareaComponent['disabled']>()
	readonly focused = input<TTextareaComponent['focused']>()
	readonly value = input<TTextareaComponent['value']>()
	readonly name = input<TTextareaComponent['name']>()
	readonly readonly = input<TTextareaComponent['readonly']>()
	readonly required = input<TTextareaComponent['required']>()
	readonly placeholder = input<TTextareaComponent['placeholder']>()
	readonly rows = input<TTextareaComponent['rows']>()
	readonly maxRows = input<TTextareaComponent['maxRows']>()
	readonly maxlength = input<TTextareaComponent['maxlength']>()
	readonly autoresize = input<TTextareaComponent['autoresize']>()
	readonly counter = input<TTextareaComponent['counter']>()
	readonly aria_label = input<TTextareaComponent['aria_label']>()
	readonly aria_labelledBy = input<TTextareaComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TTextareaComponent['aria_describedBy']>()
	readonly id = input<TTextareaComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTextareaComponent)
}

/**
 * CheckBox: a bare control without text, its label is the Label around it.
 * The Label's props are the preview's, the page's rows edit the control.
 */
@Component({
	selector: 'pg-check-box-preview',
	imports: [TLabelComponent, TCheckBoxComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label so-label text="Согласен">
				<span
					so-check-box
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
					[indeterminate]="indeterminate()"
					[view]="view()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
					[id]="id()"
				></span>
			</label>
		</ng-template>
	`,
})
export class CheckBoxPreview implements TFixture {
	readonly ctrl = input<TCheckBoxComponent['ctrl']>()
	readonly rendered = input<TCheckBoxComponent['rendered']>()
	readonly visible = input<TCheckBoxComponent['visible']>()
	readonly direction = input<TCheckBoxComponent['direction']>()
	readonly size = input<TCheckBoxComponent['size']>()
	readonly variant = input<TCheckBoxComponent['variant']>()
	readonly disabled = input<TCheckBoxComponent['disabled']>()
	readonly focused = input<TCheckBoxComponent['focused']>()
	readonly value = input<TCheckBoxComponent['value']>()
	readonly name = input<TCheckBoxComponent['name']>()
	readonly readonly = input<TCheckBoxComponent['readonly']>()
	readonly required = input<TCheckBoxComponent['required']>()
	readonly indeterminate = input<TCheckBoxComponent['indeterminate']>()
	readonly view = input<TCheckBoxComponent['view']>()
	readonly aria_label = input<TCheckBoxComponent['aria_label']>()
	readonly aria_labelledBy = input<TCheckBoxComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TCheckBoxComponent['aria_describedBy']>()
	readonly id = input<TCheckBoxComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TCheckBoxComponent)
}

/**
 * Switch: a bare control in a Label, as `CheckBoxPreview`.
 */
@Component({
	selector: 'pg-switch-preview',
	imports: [TLabelComponent, TSwitchComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label so-label text="Включено">
				<span
					so-switch
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
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
					[id]="id()"
				></span>
			</label>
		</ng-template>
	`,
})
export class SwitchPreview implements TFixture {
	readonly ctrl = input<TSwitchComponent['ctrl']>()
	readonly rendered = input<TSwitchComponent['rendered']>()
	readonly visible = input<TSwitchComponent['visible']>()
	readonly direction = input<TSwitchComponent['direction']>()
	readonly size = input<TSwitchComponent['size']>()
	readonly variant = input<TSwitchComponent['variant']>()
	readonly disabled = input<TSwitchComponent['disabled']>()
	readonly focused = input<TSwitchComponent['focused']>()
	readonly value = input<TSwitchComponent['value']>()
	readonly name = input<TSwitchComponent['name']>()
	readonly readonly = input<TSwitchComponent['readonly']>()
	readonly required = input<TSwitchComponent['required']>()
	readonly aria_label = input<TSwitchComponent['aria_label']>()
	readonly aria_labelledBy = input<TSwitchComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TSwitchComponent['aria_describedBy']>()
	readonly id = input<TSwitchComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSwitchComponent)
}

/**
 * Slider: it has no name, as a checkbox, and the visible one is the Label
 * above it. A horizontal slider spans the width of the Label, a vertical one
 * has its own height.
 */
@Component({
	selector: 'pg-slider-preview',
	imports: [TLabelComponent, TSliderComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label so-label text="Громкость" position="top">
				<span
					so-slider
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
					[min]="min()"
					[max]="max()"
					[step]="step()"
					[largeStep]="largeStep()"
					[orientation]="orientation()"
					[inverted]="inverted()"
					[origin]="origin()"
					[marks]="marks()"
					[minStepsBetweenThumbs]="minStepsBetweenThumbs()"
					[thumbLabels]="thumbLabels()"
					[snap]="snap()"
					[snapRadius]="snapRadius()"
					[tooltip]="tooltip()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
				></span>
			</label>
		</ng-template>
	`,
})
export class SliderPreview implements TFixture {
	readonly ctrl = input<TSliderComponent['ctrl']>()
	readonly rendered = input<TSliderComponent['rendered']>()
	readonly visible = input<TSliderComponent['visible']>()
	readonly direction = input<TSliderComponent['direction']>()
	readonly size = input<TSliderComponent['size']>()
	readonly variant = input<TSliderComponent['variant']>()
	readonly disabled = input<TSliderComponent['disabled']>()
	readonly focused = input<TSliderComponent['focused']>()
	readonly value = input<TSliderComponent['value']>()
	readonly name = input<TSliderComponent['name']>()
	readonly min = input<TSliderComponent['min']>()
	readonly max = input<TSliderComponent['max']>()
	readonly step = input<TSliderComponent['step']>()
	readonly largeStep = input<TSliderComponent['largeStep']>()
	readonly orientation = input<TSliderComponent['orientation']>()
	readonly inverted = input<TSliderComponent['inverted']>()
	readonly origin = input<TSliderComponent['origin']>()
	readonly marks = input<TSliderComponent['marks']>()
	readonly minStepsBetweenThumbs = input<TSliderComponent['minStepsBetweenThumbs']>()
	readonly thumbLabels = input<TSliderComponent['thumbLabels']>()
	readonly snap = input<TSliderComponent['snap']>()
	readonly snapRadius = input<TSliderComponent['snapRadius']>()
	readonly tooltip = input<TSliderComponent['tooltip']>()
	readonly aria_label = input<TSliderComponent['aria_label']>()
	readonly aria_labelledBy = input<TSliderComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TSliderComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSliderComponent)
}

/**
 * Rating: it has no name, as a slider, and the visible one is the Label above
 * the stars.
 */
@Component({
	selector: 'pg-rating-preview',
	imports: [TLabelComponent, TRatingComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label so-label text="Оценка" position="top">
				<span
					so-rating
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
					[max]="max()"
					[step]="step()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
					[id]="id()"
				></span>
			</label>
		</ng-template>
	`,
})
export class RatingPreview implements TFixture {
	readonly ctrl = input<TRatingComponent['ctrl']>()
	readonly rendered = input<TRatingComponent['rendered']>()
	readonly visible = input<TRatingComponent['visible']>()
	readonly direction = input<TRatingComponent['direction']>()
	readonly size = input<TRatingComponent['size']>()
	readonly variant = input<TRatingComponent['variant']>()
	readonly disabled = input<TRatingComponent['disabled']>()
	readonly focused = input<TRatingComponent['focused']>()
	readonly value = input<TRatingComponent['value']>()
	readonly name = input<TRatingComponent['name']>()
	readonly readonly = input<TRatingComponent['readonly']>()
	readonly required = input<TRatingComponent['required']>()
	readonly max = input<TRatingComponent['max']>()
	readonly step = input<TRatingComponent['step']>()
	readonly aria_label = input<TRatingComponent['aria_label']>()
	readonly aria_labelledBy = input<TRatingComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TRatingComponent['aria_describedBy']>()
	readonly id = input<TRatingComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TRatingComponent)
}

/**
 * Label: the text is the `text` prop of the preview props, the control is
 * content. The page's rows edit the label itself: its side, text size and
 * variant.
 */
@Component({
	selector: 'pg-label-preview',
	imports: [TLabelComponent, TCheckBoxComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label
				so-label
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[text]="text()"
				[position]="position()"
			>
				<span so-check-box></span>
			</label>
		</ng-template>
	`,
})
export class LabelPreview implements TFixture {
	readonly ctrl = input<TLabelComponent['ctrl']>()
	readonly rendered = input<TLabelComponent['rendered']>()
	readonly visible = input<TLabelComponent['visible']>()
	readonly direction = input<TLabelComponent['direction']>()
	readonly size = input<TLabelComponent['size']>()
	readonly variant = input<TLabelComponent['variant']>()
	readonly text = input<TLabelComponent['text']>()
	readonly position = input<TLabelComponent['position']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TLabelComponent)
}

/**
 * Field around an Input: the texts of the parts are preview props, the
 * control is content. The page's rows edit the field itself: the label's
 * side, the texts, the error.
 */
@Component({
	selector: 'pg-field-preview',
	imports: [TFieldComponent, TInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-field
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[label]="label()"
				[helper]="helper()"
				[error]="error()"
				[invalid]="invalid()"
				[position]="position()"
			>
				<div so-input placeholder="name@example.com"></div>
			</div>
		</ng-template>
	`,
})
export class FieldPreview implements TFixture {
	readonly ctrl = input<TFieldComponent['ctrl']>()
	readonly rendered = input<TFieldComponent['rendered']>()
	readonly visible = input<TFieldComponent['visible']>()
	readonly direction = input<TFieldComponent['direction']>()
	readonly size = input<TFieldComponent['size']>()
	readonly variant = input<TFieldComponent['variant']>()
	readonly label = input<TFieldComponent['label']>()
	readonly helper = input<TFieldComponent['helper']>()
	readonly error = input<TFieldComponent['error']>()
	readonly invalid = input<TFieldComponent['invalid']>()
	readonly position = input<TFieldComponent['position']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TFieldComponent)
}

/**
 * Calendar: no content, the days are put into the collection by the view of
 * the month grids. The language is the root's locale provider — the language
 * picked in the shell's header (`setLocale` of the host).
 */
@Component({
	selector: 'pg-calendar-preview',
	imports: [TCalendarComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-calendar
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
				[min]="min()"
				[max]="max()"
				[unavailable]="unavailable()"
				[weekStart]="weekStart()"
				[timeZone]="timeZone()"
				[months]="months()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[engine]="engine()"
				[mode]="mode()"
			></div>
		</ng-template>
	`,
})
export class CalendarPreview implements TFixture {
	readonly ctrl = input<TCalendarComponent['ctrl']>()
	readonly rendered = input<TCalendarComponent['rendered']>()
	readonly visible = input<TCalendarComponent['visible']>()
	readonly direction = input<TCalendarComponent['direction']>()
	readonly size = input<TCalendarComponent['size']>()
	readonly variant = input<TCalendarComponent['variant']>()
	readonly disabled = input<TCalendarComponent['disabled']>()
	readonly focused = input<TCalendarComponent['focused']>()
	readonly value = input<TCalendarComponent['value']>()
	readonly name = input<TCalendarComponent['name']>()
	readonly min = input<TCalendarComponent['min']>()
	readonly max = input<TCalendarComponent['max']>()
	readonly unavailable = input<TCalendarComponent['unavailable']>()
	readonly weekStart = input<TCalendarComponent['weekStart']>()
	readonly timeZone = input<TCalendarComponent['timeZone']>()
	readonly months = input<TCalendarComponent['months']>()
	readonly aria_label = input<TCalendarComponent['aria_label']>()
	readonly aria_labelledBy = input<TCalendarComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TCalendarComponent['aria_describedBy']>()
	readonly engine = input<TCalendarComponent['engine']>()
	readonly mode = input<TCalendarComponent['mode']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TCalendarComponent)
}

/**
 * DateInput: the language comes from the shell's header, as for the calendar.
 */
@Component({
	selector: 'pg-date-input-preview',
	imports: [TDateInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-date-input
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
				[clearable]="clearable()"
				[min]="min()"
				[max]="max()"
				[unavailable]="unavailable()"
				[kind]="kind()"
				[timePrecision]="timePrecision()"
				[validate]="validate()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[id]="id()"
			></div>
		</ng-template>
	`,
})
export class DateInputPreview implements TFixture {
	readonly ctrl = input<TDateInputComponent['ctrl']>()
	readonly rendered = input<TDateInputComponent['rendered']>()
	readonly visible = input<TDateInputComponent['visible']>()
	readonly direction = input<TDateInputComponent['direction']>()
	readonly size = input<TDateInputComponent['size']>()
	readonly variant = input<TDateInputComponent['variant']>()
	readonly disabled = input<TDateInputComponent['disabled']>()
	readonly focused = input<TDateInputComponent['focused']>()
	readonly value = input<TDateInputComponent['value']>()
	readonly name = input<TDateInputComponent['name']>()
	readonly readonly = input<TDateInputComponent['readonly']>()
	readonly required = input<TDateInputComponent['required']>()
	readonly clearable = input<TDateInputComponent['clearable']>()
	readonly min = input<TDateInputComponent['min']>()
	readonly max = input<TDateInputComponent['max']>()
	readonly unavailable = input<TDateInputComponent['unavailable']>()
	readonly kind = input<TDateInputComponent['kind']>()
	readonly timePrecision = input<TDateInputComponent['timePrecision']>()
	readonly validate = input<TDateInputComponent['validate']>()
	readonly aria_label = input<TDateInputComponent['aria_label']>()
	readonly aria_labelledBy = input<TDateInputComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TDateInputComponent['aria_describedBy']>()
	readonly id = input<TDateInputComponent['id']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDateInputComponent)
}

/**
 * DatePicker: the field and the calendar are instances of the picker, it has
 * no content. The language comes from the shell's header.
 */
@Component({
	selector: 'pg-date-picker-preview',
	imports: [TDatePickerComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-date-picker
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
				[clearable]="clearable()"
				[mode]="mode()"
				[open]="open()"
				[closeOnSelect]="closeOnSelect()"
				[confirmable]="confirmable()"
				[min]="min()"
				[max]="max()"
				[unavailable]="unavailable()"
				[validate]="validate()"
				[weekStart]="weekStart()"
				[timeZone]="timeZone()"
				[startName]="startName()"
				[endName]="endName()"
				[swipe]="swipe()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[id]="id()"
				[dismiss_enabled]="dismiss_enabled()"
				[hideOutside_enabled]="hideOutside_enabled()"
			></div>
		</ng-template>
	`,
})
export class DatePickerPreview implements TFixture {
	readonly ctrl = input<TDatePickerComponent['ctrl']>()
	readonly rendered = input<TDatePickerComponent['rendered']>()
	readonly visible = input<TDatePickerComponent['visible']>()
	readonly direction = input<TDatePickerComponent['direction']>()
	readonly size = input<TDatePickerComponent['size']>()
	readonly variant = input<TDatePickerComponent['variant']>()
	readonly disabled = input<TDatePickerComponent['disabled']>()
	readonly focused = input<TDatePickerComponent['focused']>()
	readonly value = input<TDatePickerComponent['value']>()
	readonly name = input<TDatePickerComponent['name']>()
	readonly readonly = input<TDatePickerComponent['readonly']>()
	readonly required = input<TDatePickerComponent['required']>()
	readonly clearable = input<TDatePickerComponent['clearable']>()
	readonly mode = input<TDatePickerComponent['mode']>()
	readonly open = input<TDatePickerComponent['open']>()
	readonly closeOnSelect = input<TDatePickerComponent['closeOnSelect']>()
	readonly confirmable = input<TDatePickerComponent['confirmable']>()
	readonly min = input<TDatePickerComponent['min']>()
	readonly max = input<TDatePickerComponent['max']>()
	readonly unavailable = input<TDatePickerComponent['unavailable']>()
	readonly validate = input<TDatePickerComponent['validate']>()
	readonly weekStart = input<TDatePickerComponent['weekStart']>()
	readonly timeZone = input<TDatePickerComponent['timeZone']>()
	readonly startName = input<TDatePickerComponent['startName']>()
	readonly endName = input<TDatePickerComponent['endName']>()
	readonly swipe = input<TDatePickerComponent['swipe']>()
	readonly aria_label = input<TDatePickerComponent['aria_label']>()
	readonly aria_labelledBy = input<TDatePickerComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TDatePickerComponent['aria_describedBy']>()
	readonly id = input<TDatePickerComponent['id']>()
	readonly dismiss_enabled = input<TDatePickerComponent['dismiss_enabled']>()
	readonly hideOutside_enabled = input<TDatePickerComponent['hideOutside_enabled']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDatePickerComponent)
}

/**
 * Pagination: no content, it puts the pages of its window into its collection
 * itself, and its template draws them. The language of the numbers and arrow
 * names comes from the shell's header.
 */
@Component({
	selector: 'pg-pagination-preview',
	imports: [TPaginationComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<nav
				so-pagination
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
				[total]="total()"
				[pageSize]="pageSize()"
				[pages]="pages()"
				[middleCount]="middleCount()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
				[engine]="engine()"
			></nav>
		</ng-template>
	`,
})
export class PaginationPreview implements TFixture {
	readonly ctrl = input<TPaginationComponent['ctrl']>()
	readonly rendered = input<TPaginationComponent['rendered']>()
	readonly visible = input<TPaginationComponent['visible']>()
	readonly direction = input<TPaginationComponent['direction']>()
	readonly size = input<TPaginationComponent['size']>()
	readonly variant = input<TPaginationComponent['variant']>()
	readonly disabled = input<TPaginationComponent['disabled']>()
	readonly focused = input<TPaginationComponent['focused']>()
	readonly value = input<TPaginationComponent['value']>()
	readonly name = input<TPaginationComponent['name']>()
	readonly total = input<TPaginationComponent['total']>()
	readonly pageSize = input<TPaginationComponent['pageSize']>()
	readonly pages = input<TPaginationComponent['pages']>()
	readonly middleCount = input<TPaginationComponent['middleCount']>()
	readonly aria_label = input<TPaginationComponent['aria_label']>()
	readonly aria_labelledBy = input<TPaginationComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TPaginationComponent['aria_describedBy']>()
	readonly engine = input<TPaginationComponent['engine']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TPaginationComponent)
}

/**
 * Icon: `<svg so-icon so-role-icon="arrowDown">` — the glyph of the role goes
 * onto `<svg>` with the directive of the adapter.
 */
@Component({
	selector: 'pg-icon-preview',
	imports: [TIconComponent, RoleIconDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<svg
				so-icon
				so-role-icon="arrowDown"
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[width]="width()"
				[height]="height()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
			></svg>
		</ng-template>
	`,
})
export class IconPreview implements TFixture {
	readonly ctrl = input<TIconComponent['ctrl']>()
	readonly rendered = input<TIconComponent['rendered']>()
	readonly visible = input<TIconComponent['visible']>()
	readonly direction = input<TIconComponent['direction']>()
	readonly size = input<TIconComponent['size']>()
	readonly width = input<TIconComponent['width']>()
	readonly height = input<TIconComponent['height']>()
	readonly aria_label = input<TIconComponent['aria_label']>()
	readonly aria_labelledBy = input<TIconComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TIconComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TIconComponent)
}

/**
 * ProgressLinear: the bar spans the width of the cell, as in Vue — an inline
 * root has no width of its own. By default it is empty — share zero — and
 * running is the `indeterminate` flag.
 */
@Component({
	selector: 'pg-progress-linear-preview',
	imports: [TProgressLinearComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div style="width: 100%">
				<span
					so-progress-linear
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="visible()"
					[direction]="direction()"
					[size]="size()"
					[variant]="variant()"
					[value]="value()"
					[min]="min()"
					[max]="max()"
					[indeterminate]="indeterminate()"
					[orientation]="orientation()"
					[aria_label]="aria_label()"
					[aria_labelledBy]="aria_labelledBy()"
					[aria_describedBy]="aria_describedBy()"
				></span>
			</div>
		</ng-template>
	`,
})
export class ProgressLinearPreview implements TFixture {
	readonly ctrl = input<TProgressLinearComponent['ctrl']>()
	readonly rendered = input<TProgressLinearComponent['rendered']>()
	readonly visible = input<TProgressLinearComponent['visible']>()
	readonly direction = input<TProgressLinearComponent['direction']>()
	readonly size = input<TProgressLinearComponent['size']>()
	readonly variant = input<TProgressLinearComponent['variant']>()
	readonly value = input<TProgressLinearComponent['value']>()
	readonly min = input<TProgressLinearComponent['min']>()
	readonly max = input<TProgressLinearComponent['max']>()
	readonly indeterminate = input<TProgressLinearComponent['indeterminate']>()
	readonly orientation = input<TProgressLinearComponent['orientation']>()
	readonly aria_label = input<TProgressLinearComponent['aria_label']>()
	readonly aria_labelledBy = input<TProgressLinearComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TProgressLinearComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TProgressLinearComponent)
}

/**
 * ProgressSpinner: an inline ring of its own size, empty by default — share
 * zero; running is the `indeterminate` flag.
 */
@Component({
	selector: 'pg-progress-spinner-preview',
	imports: [TProgressSpinnerComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<span
				so-progress-spinner
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[value]="value()"
				[min]="min()"
				[max]="max()"
				[indeterminate]="indeterminate()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
			></span>
		</ng-template>
	`,
})
export class ProgressSpinnerPreview implements TFixture {
	readonly ctrl = input<TProgressSpinnerComponent['ctrl']>()
	readonly rendered = input<TProgressSpinnerComponent['rendered']>()
	readonly visible = input<TProgressSpinnerComponent['visible']>()
	readonly direction = input<TProgressSpinnerComponent['direction']>()
	readonly size = input<TProgressSpinnerComponent['size']>()
	readonly variant = input<TProgressSpinnerComponent['variant']>()
	readonly value = input<TProgressSpinnerComponent['value']>()
	readonly min = input<TProgressSpinnerComponent['min']>()
	readonly max = input<TProgressSpinnerComponent['max']>()
	readonly indeterminate = input<TProgressSpinnerComponent['indeterminate']>()
	readonly aria_label = input<TProgressSpinnerComponent['aria_label']>()
	readonly aria_labelledBy = input<TProgressSpinnerComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TProgressSpinnerComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TProgressSpinnerComponent)
}

/**
 * Skeleton.
 */
@Component({
	selector: 'pg-skeleton-preview',
	imports: [TSkeletonComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-skeleton
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[variant]="variant()"
				[shape]="shape()"
				[animation]="animation()"
				[width]="width()"
				[height]="height()"
			></div>
		</ng-template>
	`,
})
export class SkeletonPreview implements TFixture {
	readonly ctrl = input<TSkeletonComponent['ctrl']>()
	readonly rendered = input<TSkeletonComponent['rendered']>()
	readonly visible = input<TSkeletonComponent['visible']>()
	readonly direction = input<TSkeletonComponent['direction']>()
	readonly variant = input<TSkeletonComponent['variant']>()
	readonly shape = input<TSkeletonComponent['shape']>()
	readonly animation = input<TSkeletonComponent['animation']>()
	readonly width = input<TSkeletonComponent['width']>()
	readonly height = input<TSkeletonComponent['height']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSkeletonComponent)
}

/** Ordered navigation trail from the shared registry fixture. */
@Component({
	selector: 'pg-breadcrumbs-preview',
	imports: [TBreadcrumbsComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><nav
			so-breadcrumbs
			[ctrl]="ctrl()"
			[rendered]="rendered()"
			[visible]="visible()"
			[direction]="direction()"
			[size]="size()"
			[variant]="variant()"
			[items]="items() ?? entries"
			[engine]="engine()"
			[maxItems]="maxItems()"
		></nav
	></ng-template>`,
})
export class BreadcrumbsPreview implements TFixture {
	readonly ctrl = input<TBreadcrumbsComponent['ctrl']>()
	readonly rendered = input<TBreadcrumbsComponent['rendered']>()
	readonly visible = input<TBreadcrumbsComponent['visible']>()
	readonly direction = input<TBreadcrumbsComponent['direction']>()
	readonly size = input<TBreadcrumbsComponent['size']>()
	readonly variant = input<TBreadcrumbsComponent['variant']>()
	readonly items = input<TBreadcrumbsComponent['items']>()
	readonly engine = input<TBreadcrumbsComponent['engine']>()
	readonly maxItems = input<TBreadcrumbsComponent['maxItems']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TBreadcrumbsComponent)

	// The host writes undefined for absent props; choose fixture data when reading the input.
	protected readonly entries = BREADCRUMBS_ITEMS
}

@Component({
	selector: 'pg-badge-preview',
	imports: [TBadgeComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><span
			so-badge
			[ctrl]="ctrl()"
			[rendered]="rendered()"
			[visible]="visible()"
			[direction]="direction()"
			[size]="size()"
			[variant]="variant()"
			[value]="value()"
			[max]="max()"
			[dot]="dot()"
			[view]="view()"
			[aria_label]="aria_label()"
			[aria_labelledBy]="aria_labelledBy()"
			[aria_describedBy]="aria_describedBy()"
		></span
	></ng-template>`,
})
export class BadgePreview implements TFixture {
	readonly ctrl = input<TBadgeComponent['ctrl']>()
	readonly rendered = input<TBadgeComponent['rendered']>()
	readonly visible = input<TBadgeComponent['visible']>()
	readonly direction = input<TBadgeComponent['direction']>()
	readonly size = input<TBadgeComponent['size']>()
	readonly variant = input<TBadgeComponent['variant']>()
	readonly value = input<TBadgeComponent['value']>()
	readonly max = input<TBadgeComponent['max']>()
	readonly dot = input<TBadgeComponent['dot']>()
	readonly view = input<TBadgeComponent['view']>()
	readonly aria_label = input<TBadgeComponent['aria_label']>()
	readonly aria_labelledBy = input<TBadgeComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TBadgeComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TBadgeComponent)
}

/** Standalone toggle preview with persistent pressed state. */
@Component({
	selector: 'pg-toggle-button-preview',
	imports: [TToggleButtonComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<button
				so-toggle-button
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[text]="text()"
				[pressed]="pressed()"
				[view]="view()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
			></button>
		</ng-template>
	`,
})
export class ToggleButtonPreview implements TFixture {
	readonly ctrl = input<TToggleButtonComponent['ctrl']>()
	readonly rendered = input<TToggleButtonComponent['rendered']>()
	readonly visible = input<TToggleButtonComponent['visible']>()
	readonly direction = input<TToggleButtonComponent['direction']>()
	readonly size = input<TToggleButtonComponent['size']>()
	readonly variant = input<TToggleButtonComponent['variant']>()
	readonly disabled = input<TToggleButtonComponent['disabled']>()
	readonly focused = input<TToggleButtonComponent['focused']>()
	readonly text = input<TToggleButtonComponent['text']>()
	readonly pressed = input<TToggleButtonComponent['pressed']>()
	readonly view = input<TToggleButtonComponent['view']>()
	readonly aria_label = input<TToggleButtonComponent['aria_label']>()
	readonly aria_labelledBy = input<TToggleButtonComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TToggleButtonComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TToggleButtonComponent)
}

/** Collection selection and orientation are forwarded to the group. */
@Component({
	selector: 'pg-toggle-group-preview',
	imports: [TToggleGroupComponent, SlotDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-toggle-group
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[size]="size()"
				[variant]="variant()"
				[disabled]="disabled()"
				[focused]="focused()"
				[engine]="engine()"
				[items]="items() ?? sampleItems"
				[mode]="mode()"
				[orientation]="orientation()"
				[view]="view()"
				[aria_label]="aria_label()"
				[aria_labelledBy]="aria_labelledBy()"
				[aria_describedBy]="aria_describedBy()"
			>
				<ng-template slot="item-leading" let-item="item">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.5"
						stroke-linecap="round"
						aria-hidden="true"
					>
						<path [attr.d]="alignmentPath(item.text)" />
					</svg>
				</ng-template>
			</div>
		</ng-template>
	`,
})
export class ToggleGroupPreview implements TFixture {
	readonly ctrl = input<TToggleGroupComponent['ctrl']>()
	readonly rendered = input<TToggleGroupComponent['rendered']>()
	readonly visible = input<TToggleGroupComponent['visible']>()
	readonly direction = input<TToggleGroupComponent['direction']>()
	readonly size = input<TToggleGroupComponent['size']>()
	readonly variant = input<TToggleGroupComponent['variant']>()
	readonly disabled = input<TToggleGroupComponent['disabled']>()
	readonly focused = input<TToggleGroupComponent['focused']>()
	readonly engine = input<TToggleGroupComponent['engine']>()
	readonly sampleItems = EDITOR_ALIGNMENT_ITEMS
	readonly alignmentPath = editorAlignmentPath
	readonly items = input<TToggleGroupComponent['items']>()
	readonly mode = input<TToggleGroupComponent['mode']>()
	readonly orientation = input<TToggleGroupComponent['orientation']>()
	readonly view = input<TToggleGroupComponent['view']>()
	readonly aria_label = input<TToggleGroupComponent['aria_label']>()
	readonly aria_labelledBy = input<TToggleGroupComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TToggleGroupComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TToggleGroupComponent)
}

@Component({
	selector: 'pg-code-block-preview',
	imports: [TCodeBlockComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template:
		'<ng-template pg-copy><div so-code-block [ctrl]="ctrl()" [rendered]="rendered()" [visible]="visible()" [direction]="direction()" [size]="size()" [variant]="variant()" [code]="code()" [language]="language()" [title]="title()" [snippets]="snippets()" [value]="value()" [copyable]="copyable()" [lineNumbers]="lineNumbers()" [wrap]="wrap()" [maxHeight]="maxHeight()" [highlightLines]="highlightLines()"></div></ng-template>',
})
export class CodeBlockPreview implements TFixture {
	readonly ctrl = input<TCodeBlockComponent['ctrl']>()
	readonly rendered = input<TCodeBlockComponent['rendered']>()
	readonly visible = input<TCodeBlockComponent['visible']>()
	readonly direction = input<TCodeBlockComponent['direction']>()
	readonly size = input<TCodeBlockComponent['size']>()
	readonly variant = input<TCodeBlockComponent['variant']>()
	readonly code = input<TCodeBlockComponent['code']>()
	readonly language = input<TCodeBlockComponent['language']>()
	readonly title = input<TCodeBlockComponent['title']>()
	readonly snippets = input<TCodeBlockComponent['snippets']>()
	readonly value = input<TCodeBlockComponent['value']>()
	readonly copyable = input<TCodeBlockComponent['copyable']>()
	readonly lineNumbers = input<TCodeBlockComponent['lineNumbers']>()
	readonly wrap = input<TCodeBlockComponent['wrap']>()
	readonly maxHeight = input<TCodeBlockComponent['maxHeight']>()
	readonly highlightLines = input<TCodeBlockComponent['highlightLines']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TCodeBlockComponent)
}

@Component({
	selector: 'pg-alert-preview',
	imports: [TAlertComponent, TButtonComponent, TIconComponent, RoleIconDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template:
		'<ng-template pg-copy><div so-alert [ctrl]="ctrl()" [rendered]="rendered()" [visible]="visible()" [direction]="direction()" [size]="size()" [variant]="variant()" [view]="view()" [closable]="closable()" [aria_label]="aria_label()" [aria_labelledBy]="aria_labelledBy()" [aria_describedBy]="aria_describedBy()"><svg so-icon slot="icon" so-role-icon="warning"></svg><span slot="title">{{ sample.title }}</span>{{ sample.message }}<button so-button slot="action" type="button">{{ sample.action }}</button></div></ng-template>',
})
export class AlertPreview implements TFixture {
	readonly sample = ALERT_SAMPLE
	readonly ctrl = input<TAlertComponent['ctrl']>()
	readonly rendered = input<TAlertComponent['rendered']>()
	readonly visible = input<TAlertComponent['visible']>()
	readonly direction = input<TAlertComponent['direction']>()
	readonly size = input<TAlertComponent['size']>()
	readonly variant = input<TAlertComponent['variant']>()
	readonly view = input<TAlertComponent['view']>()
	readonly closable = input<TAlertComponent['closable']>()
	readonly aria_label = input<TAlertComponent['aria_label']>()
	readonly aria_labelledBy = input<TAlertComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TAlertComponent['aria_describedBy']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAlertComponent)
}

@Component({
	selector: 'pg-avatar-preview',
	imports: [TAvatarComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><span
			so-avatar
			[ctrl]="ctrl()"
			[rendered]="rendered()"
			[visible]="visible()"
			[direction]="direction()"
			[aria_label]="aria_label()"
			[aria_labelledBy]="aria_labelledBy()"
			[aria_describedBy]="aria_describedBy()"
			[src]="src()"
			[initials]="initials()"
			[shape]="shape()"
			[size]="size()"
			[variant]="variant()"
		></span
	></ng-template>`,
})
export class AvatarPreview implements TFixture {
	readonly ctrl = input<TAvatarComponent['ctrl']>()
	readonly rendered = input<TAvatarComponent['rendered']>()
	readonly visible = input<TAvatarComponent['visible']>()
	readonly direction = input<TAvatarComponent['direction']>()
	readonly aria_label = input<TAvatarComponent['aria_label']>()
	readonly aria_labelledBy = input<TAvatarComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TAvatarComponent['aria_describedBy']>()
	readonly src = input<TAvatarComponent['src']>()
	readonly initials = input<TAvatarComponent['initials']>()
	readonly shape = input<TAvatarComponent['shape']>()
	readonly size = input<TAvatarComponent['size']>()
	readonly variant = input<TAvatarComponent['variant']>()

	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAvatarComponent)
}

@Component({
	selector: 'pg-avatar-group-preview',
	imports: [TAvatarGroupComponent, CopyDirective, TAvatarComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><span
			so-avatar-group
			[ctrl]="ctrl()"
			[rendered]="rendered()"
			[visible]="visible()"
			[direction]="direction()"
			[aria_label]="aria_label()"
			[aria_labelledBy]="aria_labelledBy()"
			[aria_describedBy]="aria_describedBy()"
			[overflow]="overflow()"
		>
			@for (person of people; track person.initials) {
				<span
					so-avatar
					[initials]="person.initials"
					[aria_label]="person.aria_label"
				></span>
			}</span
	></ng-template>`,
})
export class AvatarGroupPreview implements TFixture {
	readonly ctrl = input<TAvatarGroupComponent['ctrl']>()
	readonly rendered = input<TAvatarGroupComponent['rendered']>()
	readonly visible = input<TAvatarGroupComponent['visible']>()
	readonly direction = input<TAvatarGroupComponent['direction']>()
	readonly aria_label = input<TAvatarGroupComponent['aria_label']>()
	readonly aria_labelledBy = input<TAvatarGroupComponent['aria_labelledBy']>()
	readonly aria_describedBy = input<TAvatarGroupComponent['aria_describedBy']>()
	readonly overflow = input<TAvatarGroupComponent['overflow']>()
	readonly people = AVATAR_PEOPLE
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAvatarGroupComponent)
}

/** A fixed parent height gives the vertical boundary its available length. */
@Component({
	selector: 'pg-separator-preview',
	imports: [TSeparatorComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><div style="width:100%;height:120px;display:flex;align-items:center">
			<div
				so-separator
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[orientation]="orientation()"
				[decorative]="decorative()"
			></div></div
	></ng-template>`,
})
export class SeparatorPreview implements TFixture {
	readonly ctrl = input<TSeparatorComponent['ctrl']>()
	readonly rendered = input<TSeparatorComponent['rendered']>()
	readonly visible = input<TSeparatorComponent['visible']>()
	readonly direction = input<TSeparatorComponent['direction']>()
	readonly orientation = input<TSeparatorComponent['orientation']>()
	readonly decorative = input<TSeparatorComponent['decorative']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSeparatorComponent)
}

@Component({
	selector: 'pg-file-upload-preview',
	imports: [TFileUploadComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template:
		'<ng-template pg-copy><div so-file-upload [ctrl]="ctrl()" [rendered]="rendered()" [visible]="visible()" [direction]="direction()" [size]="size()" [variant]="variant()" [disabled]="disabled()" [focused]="focused()" [accept]="accept()" [name]="name()" [form]="form()" [multiple]="multiple()" [required]="required()" [maxFileSize]="maxFileSize()" [maxFiles]="maxFiles()"></div></ng-template>',
})
export class FileUploadPreview implements TFixture {
	readonly ctrl = input<TFileUploadComponent['ctrl']>()
	readonly rendered = input<TFileUploadComponent['rendered']>()
	readonly visible = input<TFileUploadComponent['visible']>()
	readonly direction = input<TFileUploadComponent['direction']>()
	readonly size = input<TFileUploadComponent['size']>()
	readonly variant = input<TFileUploadComponent['variant']>()
	readonly disabled = input<TFileUploadComponent['disabled']>()
	readonly focused = input<TFileUploadComponent['focused']>()
	readonly accept = input<TFileUploadComponent['accept']>()
	readonly name = input<TFileUploadComponent['name']>()
	readonly form = input<TFileUploadComponent['form']>()
	readonly multiple = input<TFileUploadComponent['multiple']>()
	readonly required = input<TFileUploadComponent['required']>()
	readonly maxFileSize = input<TFileUploadComponent['maxFileSize']>()
	readonly maxFiles = input<TFileUploadComponent['maxFiles']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TFileUploadComponent)
}

@Component({
	selector: 'pg-sidebar-preview',
	imports: [TSidebarComponent, TSidebarItemComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div class="pg-sidebar-preview">
				<div class="pg-sidebar-preview__main">Рабочая область</div>
				<aside
					so-sidebar
					aria_label="Рабочая область"
					[ctrl]="ctrl()"
					[rendered]="rendered()"
					[visible]="visible()"
					[direction]="direction()"
					[side]="side()"
					[collapse]="collapse()"
					[collapsed]="collapsed()"
				>
					<strong class="pg-sidebar-preview__label">Проекты</strong>
					<button so-sidebar-item text="Обзор"><span slot="leading">◈</span></button>
					<button so-sidebar-item text="Настройки"><span slot="leading">⚙</span></button>
				</aside>
			</div>
		</ng-template>
	`,
})
export class SidebarPreview implements TFixture {
	readonly ctrl = input<TSidebarComponent['ctrl']>()
	readonly rendered = input<TSidebarComponent['rendered']>()
	readonly visible = input<TSidebarComponent['visible']>()
	readonly direction = input<TSidebarComponent['direction']>()
	readonly side = input<TSidebarComponent['side']>()
	readonly collapse = input<TSidebarComponent['collapse']>()
	readonly collapsed = input<TSidebarComponent['collapsed']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSidebarComponent)
}

@Component({
	selector: 'pg-splitter-preview',
	imports: [TSplitterComponent, TSplitterHandleComponent, TSplitterPanelComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<div
				so-splitter
				class="pg-splitter-preview"
				[ctrl]="ctrl()"
				[rendered]="rendered()"
				[visible]="visible()"
				[direction]="direction()"
				[orientation]="orientation()"
				[offset]="offset()"
				[width]="width()"
				[thumb]="thumb()"
				[disabled]="disabled()"
				[panels]="panels()"
			>
				<div so-splitter-panel panel="files">
					<div class="pg-splitter-preview__pane">
						<strong>Файлы</strong>
						<code>App.vue</code>
					</div>
				</div>
				<div so-splitter-handle panel="files" size="sm" aria_label="Файлы"></div>
				<div so-splitter-panel panel="editor">
					<div class="pg-splitter-preview__pane">
						<strong>Редактор</strong>
						<code>&lt;Splitter /&gt;</code>
					</div>
				</div>
				<div so-splitter-handle panel="editor" size="lg" aria_label="Редактор"></div>
				<div so-splitter-panel panel="preview">
					<div class="pg-splitter-preview__pane">
						<strong>Вывод</strong>
						<code>Сборка готова</code>
					</div>
				</div>
			</div>
		</ng-template>
	`,
})
export class SplitterPreview implements TFixture {
	readonly ctrl = input<TSplitterComponent['ctrl']>()
	readonly rendered = input<TSplitterComponent['rendered']>()
	readonly visible = input<TSplitterComponent['visible']>()
	readonly direction = input<TSplitterComponent['direction']>()
	readonly orientation = input<TSplitterComponent['orientation']>()
	readonly offset = input<TSplitterComponent['offset']>()
	readonly width = input<TSplitterComponent['width']>()
	readonly thumb = input<TSplitterComponent['thumb']>()
	readonly disabled = input<TSplitterComponent['disabled']>()
	readonly panels = input<TSplitterComponent['panels']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSplitterComponent)
}
