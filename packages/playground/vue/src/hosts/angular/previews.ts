import type { Type } from '@angular/core'
import type { TFixture } from './fixtures'
import {
	AccordionPreview,
	ListBoxItemsPreview,
	ListBoxPreview,
	RadioGroupPreview,
	ScrollerPreview,
	SelectItemsPreview,
	SelectPreview,
	TablePreview,
	TabsPreview,
	TagsPreview,
} from './collections'
import {
	AlertPreview,
	BadgePreview,
	AvatarPreview,
	AvatarGroupPreview,
	CodeBlockPreview,
	FileUploadPreview,
	SplitterPreview,
	ButtonPreview,
	ToggleButtonPreview,
	ToggleGroupPreview,
	CalendarPreview,
	CheckBoxPreview,
	DateInputPreview,
	DatePickerPreview,
	FieldPreview,
	IconPreview,
	InputPreview,
	LabelPreview,
	NumberInputPreview,
	BreadcrumbsPreview,
	PaginationPreview,
	ProgressLinearPreview,
	ProgressSpinnerPreview,
	RatingPreview,
	SeparatorPreview,
	SkeletonPreview,
	SliderPreview,
	SwitchPreview,
	TextareaPreview,
} from './controls'
import {
	DialogPreview,
	GuidePreview,
	AlertDialogPreview,
	DragAndDropPreview,
	DrawerPreview,
	MenuItemsPreview,
	MenuPreview,
	PopoverPreview,
	ToastsPreview,
	TooltipPreview,
	VirtualPreview,
} from './templates'

/** Props of a component — by their markup names. */
export type TProps = Readonly<Record<string, unknown>>

/**
 * How to draw a component on the stand — in Angular.
 *
 * The same map as the Vue host's (`hosts/vue/previews.ts`), with the same keys
 * — the registry's ids. A preview is a component of the host with its markup,
 * of the same shape as a fixture (`TFixture`): the shell's props go to its
 * inputs, and it binds them to the component in its markup. Angular lists the
 * bindings of a template by name, so the preview has an input for every input
 * of the component the page can write, and `ctrl`; the props of a wrapper and
 * of parts are the preview's, as the neighbors' markup writes
 * `<Label text="…">` and `<ListBox.Item {...item} />`.
 *
 * Markup, not a description the host builds with `createComponent`: the copies
 * of a preview (`count`) are views of one template (`CopyDirective`), and
 * Angular keeps the description of the template's nodes once for all of them,
 * as for the copies of a component in an application template. A component
 * built by the host as a root carried a description of its own — about 9 KB
 * per Button copy, and as much again for every part and wrapper.
 *
 * The markup of a preview may depend on the shell's props: a list whose
 * content came as data is drawn without items in markup — they would replace
 * the data. Then a function of the props picks the preview (`templateFor`)
 * when it is placed, and a change of the props does not rebuild it.
 */
export type TPreview =
	| { readonly template: Type<TFixture> }
	| { readonly templateFor: (props: TProps) => Type<TFixture> }

export const PREVIEWS: Record<string, TPreview> = {
	alert: { template: AlertPreview },
	badge: { template: BadgePreview },
	avatar: { template: AvatarPreview },
	'avatar-group': { template: AvatarGroupPreview },
	splitter: { template: SplitterPreview },
	'file-upload': { template: FileUploadPreview },
	'code-block': { template: CodeBlockPreview },
	button: { template: ButtonPreview },
	'toggle-button': { template: ToggleButtonPreview },
	'toggle-group': { template: ToggleGroupPreview },
	input: { template: InputPreview },
	'number-input': { template: NumberInputPreview },
	textarea: { template: TextareaPreview },
	'check-box': { template: CheckBoxPreview },
	switch: { template: SwitchPreview },
	slider: { template: SliderPreview },
	rating: { template: RatingPreview },
	label: { template: LabelPreview },
	field: { template: FieldPreview },
	'radio-group': { template: RadioGroupPreview },
	'list-box': { templateFor: (bind) => (bind.items ? ListBoxItemsPreview : ListBoxPreview) },
	select: { templateFor: (bind) => (bind.items ? SelectItemsPreview : SelectPreview) },
	calendar: { template: CalendarPreview },
	'date-input': { template: DateInputPreview },
	'date-picker': { template: DatePickerPreview },
	tags: { template: TagsPreview },
	table: { template: TablePreview },
	tabs: { template: TabsPreview },
	accordion: { template: AccordionPreview },
	scroller: { template: ScrollerPreview },
	breadcrumbs: { template: BreadcrumbsPreview },
	pagination: { template: PaginationPreview },
	icon: { template: IconPreview },
	'progress-linear': { template: ProgressLinearPreview },
	'progress-spinner': { template: ProgressSpinnerPreview },
	popover: { template: PopoverPreview },
	tooltip: { template: TooltipPreview },
	menu: { templateFor: (bind) => (bind.items ? MenuItemsPreview : MenuPreview) },
	'alert-dialog': { template: AlertDialogPreview },
	dialog: { template: DialogPreview },
	guide: { template: GuidePreview },
	drawer: { template: DrawerPreview },
	toasts: { template: ToastsPreview },
	separator: { template: SeparatorPreview },
	skeleton: { template: SkeletonPreview },
	'drag-and-drop': { template: DragAndDropPreview },
	virtual: { template: VirtualPreview },
}
