import {
	TAlertDialogComponent,
	RoleIconDirective,
	SlotDirective,
	TBadgeComponent,
	TAvatarComponent,
	TButtonComponent,
	TCheckBoxComponent,
	TDateInputComponent,
	TDatePickerComponent,
	TFieldComponent,
	TIconComponent,
	TInputComponent,
	TLabelComponent,
	TListBoxComponent,
	TListBoxGroupComponent,
	TListBoxItemComponent,
	TListBoxSeparatorComponent,
	TSelectComponent,
	TSelectGroupComponent,
	TSelectItemComponent,
	TSelectSeparatorComponent,
	TNumberInputComponent,
	TRadioGroupComponent,
	TRadioGroupItemComponent,
	TSwitchComponent,
	TTextareaComponent,
	TToastsComponent,
} from '@soxa-ui/angular'
import {
	ChangeDetectionStrategy,
	Component,
	input,
	viewChild,
	viewChildren,
	type Signal,
	type Type,
} from '@angular/core'
import type { IButton, ILabel } from '@soxa-ui/core'

import { CopyDirective } from './copy.directive'

/**
 * Scenario markup that the previews do not have — slot content to check — in
 * Angular.
 *
 * The keys and the markup are those of the Vue and React hosts: the scenarios
 * of the shared package look for the same things in the scene, whatever
 * framework drew it. Button slots in Angular are elements with a `slot`
 * attribute, and a slot with a scope is `<ng-template slot="default" let-text>`.
 *
 * A fixture is a component with its own template: slot content cannot be laid
 * out by name in markup, and only a template gives a slot its scope. So the
 * fixture takes the scenario's props as its inputs — those its scenarios write
 * (`text` and `ctrl`) — and passes them to the scenario's component with
 * bindings. A prop the fixture has no input for the host calls an error, as for
 * a preview. The field names are not prop names: the inputs of fixtures and
 * previews are named after the page's props, and `target` is a prop of the
 * layers (dialog, drawer).
 *
 * The same shape serves the previews (`TPreview`): a component of the host
 * whose markup is one copy.
 */
export type TFixture = {
	/** The markup of one copy: the host stamps the copies from it. */
	readonly copy: Signal<CopyDirective>
	/** The scenario's component in each copy: the host listens to its outputs. */
	readonly subjects: Signal<readonly object[]>
}

@Component({
	selector: 'pg-button-slot-labels',
	imports: [TButtonComponent, SlotDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	// Метки во всех трёх слотах: сценарий ищет их по `data-probe` и сверяет
	// порядок, а в `default` печатает то, что пришло в scope
	template: `
		<ng-template pg-copy>
			<button so-button [ctrl]="ctrl()" [text]="text()">
				<span slot="leading" data-probe="leading">L</span>
				<ng-template slot="default" let-text>
					<span data-probe="default">{{ text }}</span>
				</ng-template>
				<span slot="trailing" data-probe="trailing">T</span>
			</button>
		</ng-template>
	`,
})
class ButtonSlotLabels implements TFixture {
	readonly ctrl = input<IButton>()
	readonly text = input<string>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TButtonComponent)
}

@Component({
	selector: 'pg-button-slot-icons',
	imports: [TButtonComponent, TIconComponent, RoleIconDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	// Иконки по краям — подпись длинная, из пропа `text` сценария
	template: `
		<ng-template pg-copy>
			<button so-button [ctrl]="ctrl()" [text]="text()">
				<svg slot="leading" so-icon so-role-icon="check"></svg>
				<svg slot="trailing" so-icon so-role-icon="arrowRight"></svg>
			</button>
		</ng-template>
	`,
})
class ButtonSlotIcons implements TFixture {
	readonly ctrl = input<IButton>()
	readonly text = input<string>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TButtonComponent)
}

@Component({
	selector: 'pg-label-check-box',
	imports: [TLabelComponent, TCheckBoxComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	// Подпись вокруг контрола: текст — из пропа `text` сценария, контрол — в
	// основной проекции
	template: `
		<ng-template pg-copy>
			<label so-label [ctrl]="ctrl()" [text]="text()">
				<span so-check-box></span>
			</label>
		</ng-template>
	`,
})
class LabelCheckBox implements TFixture {
	readonly ctrl = input<ILabel>()
	readonly text = input<string>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TLabelComponent)
}

@Component({
	selector: 'pg-label-switch',
	imports: [TLabelComponent, TSwitchComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `
		<ng-template pg-copy>
			<label so-label [ctrl]="ctrl()" [text]="text()">
				<span so-switch></span>
			</label>
		</ng-template>
	`,
})
class LabelSwitch implements TFixture {
	readonly ctrl = input<ILabel>()
	readonly text = input<string>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TLabelComponent)
}

@Component({
	selector: 'pg-label-radio',
	imports: [TLabelComponent, TRadioGroupComponent, TRadioGroupItemComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	// Корень радио — `label`, а `label` в `label` HTML запрещает: внутри
	// подписи радио пишут на строчном теге. Группа вокруг — ради общего `name`
	template: `
		<ng-template pg-copy>
			<div so-radio-group>
				<label so-label [ctrl]="ctrl()" [text]="text()">
					<span so-radio-group-item value="a"></span>
				</label>
			</div>
		</ng-template>
	`,
})
class LabelRadio implements TFixture {
	readonly ctrl = input<ILabel>()
	readonly text = input<string>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TLabelComponent)
}

@Component({
	selector: 'pg-a11y-invalid-input',
	imports: [TFieldComponent, TInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-field label="Account" [invalid]="true" error="Enter a valid email">
			<div so-input [aria_label]="aria_label()" [placeholder]="placeholder()"></div></div
	></ng-template>`,
})
class A11yInvalidInput implements TFixture {
	readonly aria_label = input<TInputComponent['aria_label']>()
	readonly placeholder = input<TInputComponent['placeholder']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TInputComponent)
}

@Component({
	selector: 'pg-a11y-invalid-number-input',
	imports: [TFieldComponent, TNumberInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-field label="Account" [invalid]="true" error="Enter a valid email">
			<div so-number-input [aria_label]="aria_label()" [value]="value()"></div></div
	></ng-template>`,
})
class A11yInvalidNumberInput implements TFixture {
	readonly aria_label = input<TNumberInputComponent['aria_label']>()
	readonly value = input<TNumberInputComponent['value']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TNumberInputComponent)
}

@Component({
	selector: 'pg-a11y-invalid-textarea',
	imports: [TFieldComponent, TTextareaComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-field label="Account" [invalid]="true" error="Enter a valid email">
			<div so-textarea [aria_label]="aria_label()" [placeholder]="placeholder()"></div></div
	></ng-template>`,
})
class A11yInvalidTextarea implements TFixture {
	readonly aria_label = input<TTextareaComponent['aria_label']>()
	readonly placeholder = input<TTextareaComponent['placeholder']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TTextareaComponent)
}

@Component({
	selector: 'pg-a11y-invalid-date-input',
	imports: [TFieldComponent, TDateInputComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-field label="Account" [invalid]="true" error="Enter a valid email">
			<div so-date-input [aria_label]="aria_label()"></div></div
	></ng-template>`,
})
class A11yInvalidDateInput implements TFixture {
	readonly aria_label = input<TDateInputComponent['aria_label']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDateInputComponent)
}

@Component({
	selector: 'pg-a11y-invalid-date-picker',
	imports: [TFieldComponent, TDatePickerComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-field label="Account" [invalid]="true" error="Enter a valid email">
			<div so-date-picker [aria_label]="aria_label()"></div></div
	></ng-template>`,
})
class A11yInvalidDatePicker implements TFixture {
	readonly aria_label = input<TDatePickerComponent['aria_label']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TDatePickerComponent)
}

@Component({
	selector: 'pg-a11y-persistent-toasts',
	imports: [TToastsComponent, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display:contents' },
	template: `<ng-template pg-copy
		><div so-toasts [engine]="engine()" [duration]="duration()"></div
	></ng-template>`,
})
class A11yPersistentToasts implements TFixture {
	readonly engine = input<TToastsComponent['engine']>()
	readonly duration = input<TToastsComponent['duration']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TToastsComponent)
}

@Component({
	selector: 'pg-badge-anchor',
	imports: [TBadgeComponent, TButtonComponent, CopyDirective],
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
			><button so-button slot="anchor">Inbox</button></span
		></ng-template
	>`,
})
class BadgeAnchor implements TFixture {
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

@Component({
	selector: 'pg-avatar-fallback',
	imports: [TAvatarComponent, TIconComponent, RoleIconDirective, SlotDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><span
			so-avatar
			[ctrl]="ctrl()"
			[initials]="initials()"
			[aria_label]="aria_label()"
			[variant]="variant()"
			><ng-template slot="fallback"
				><svg so-icon so-role-icon="check"></svg></ng-template></span
	></ng-template>`,
})
class AvatarFallback implements TFixture {
	readonly ctrl = input<TAvatarComponent['ctrl']>()
	readonly variant = input<TAvatarComponent['variant']>()
	readonly initials = input<TAvatarComponent['initials']>()
	readonly aria_label = input<TAvatarComponent['aria_label']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAvatarComponent)
}
@Component({
	selector: 'pg-alert-dialog-footer',
	imports: [TAlertDialogComponent, SlotDirective, CopyDirective],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><div so-alert-dialog [ctrl]="ctrl()" [visible]="visible()">
			<span slot="title">Custom question</span>
			Custom description
			<ng-template slot="footer"
				><button type="button" data-audit-footer>Custom footer</button></ng-template
			>
		</div></ng-template
	>`,
})
class AlertDialogFooter implements TFixture {
	readonly ctrl = input<TAlertDialogComponent['ctrl']>()
	readonly visible = input<TAlertDialogComponent['visible']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TAlertDialogComponent)
}

@Component({
	selector: 'pg-select-separators',
	imports: [
		TSelectComponent,
		TSelectGroupComponent,
		TSelectItemComponent,
		TSelectSeparatorComponent,
		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><div so-select [ctrl]="ctrl()" [open]="true">
			<div so-select-group label="First">
				<div so-select-item value="a" text="Apple"></div>
			</div>
			<div so-select-separator></div>
			<div so-select-group label="Second">
				<div so-select-item value="b" text="Banana"></div>
			</div></div
	></ng-template>`,
})
class SelectSeparators implements TFixture {
	readonly ctrl = input<TSelectComponent['ctrl']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TSelectComponent)
}

@Component({
	selector: 'pg-list-box-separators',
	imports: [
		TListBoxComponent,
		TListBoxGroupComponent,
		TListBoxItemComponent,
		TListBoxSeparatorComponent,
		CopyDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: { style: 'display: contents' },
	template: `<ng-template pg-copy
		><div so-list-box [ctrl]="ctrl()">
			<div so-list-box-group label="First">
				<div so-list-box-item value="a" text="Apple"></div>
			</div>
			<div so-list-box-separator></div>
			<div so-list-box-group label="Second">
				<div so-list-box-item value="b" text="Banana"></div>
			</div></div
	></ng-template>`,
})
class ListBoxSeparators implements TFixture {
	readonly ctrl = input<TListBoxComponent['ctrl']>()
	readonly copy = viewChild.required(CopyDirective)
	readonly subjects = viewChildren(TListBoxComponent)
}

export const FIXTURES: Record<string, Type<TFixture>> = {
	'select-separators': SelectSeparators,
	'list-box-separators': ListBoxSeparators,
	'alert-dialog-footer': AlertDialogFooter,
	'avatar-fallback': AvatarFallback,
	'badge-anchor': BadgeAnchor,
	'a11y-persistent-toasts': A11yPersistentToasts,
	'a11y-invalid-input': A11yInvalidInput,
	'a11y-invalid-number-input': A11yInvalidNumberInput,
	'a11y-invalid-textarea': A11yInvalidTextarea,
	'a11y-invalid-date-input': A11yInvalidDateInput,
	'a11y-invalid-date-picker': A11yInvalidDatePicker,
	'button-slot-labels': ButtonSlotLabels,
	'button-slot-icons': ButtonSlotIcons,
	'label-check-box': LabelCheckBox,
	'label-switch': LabelSwitch,
	'label-radio': LabelRadio,
}
