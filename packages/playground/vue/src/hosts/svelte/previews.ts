import AlertPreview from './AlertPreview.svelte'
import AvatarPreview from './AvatarPreview.svelte'
import AvatarGroupPreview from './AvatarGroupPreview.svelte'
import SeparatorPreview from './SeparatorPreview.svelte'
import SplitterPreview from './SplitterPreview.svelte'
import FileUploadPreview from './FileUploadPreview.svelte'
import CodeBlockPreview from './CodeBlockPreview.svelte'
import ToggleButtonPreview from './ToggleButtonPreview.svelte'
import ToggleGroupPreview from './ToggleGroupPreview.svelte'
import BadgePreview from './BadgePreview.svelte'
import type { Component } from 'svelte'
import AccordionPreview from './AccordionPreview.svelte'
import ButtonPreview from './ButtonPreview.svelte'
import CalendarPreview from './CalendarPreview.svelte'
import CheckBoxPreview from './CheckBoxPreview.svelte'
import DateInputPreview from './DateInputPreview.svelte'
import DatePickerPreview from './DatePickerPreview.svelte'
import AlertDialogPreview from './AlertDialogPreview.svelte'
import DialogPreview from './DialogPreview.svelte'
import DragAndDropPreview from './DragAndDropPreview.svelte'
import DrawerPreview from './DrawerPreview.svelte'
import FieldPreview from './FieldPreview.svelte'
import IconPreview from './IconPreview.svelte'
import InputPreview from './InputPreview.svelte'
import LabelPreview from './LabelPreview.svelte'
import ListBoxPreview from './ListBoxPreview.svelte'
import MenuPreview from './MenuPreview.svelte'
import NumberInputPreview from './NumberInputPreview.svelte'
import BreadcrumbsPreview from './BreadcrumbsPreview.svelte'
import PaginationPreview from './PaginationPreview.svelte'
import PopoverPreview from './PopoverPreview.svelte'
import ProgressLinearPreview from './ProgressLinearPreview.svelte'
import ProgressSpinnerPreview from './ProgressSpinnerPreview.svelte'
import RadioGroupPreview from './RadioGroupPreview.svelte'
import RatingPreview from './RatingPreview.svelte'
import ScrollerPreview from './ScrollerPreview.svelte'
import SelectPreview from './SelectPreview.svelte'
import SkeletonPreview from './SkeletonPreview.svelte'
import SliderPreview from './SliderPreview.svelte'
import SwitchPreview from './SwitchPreview.svelte'
import TablePreview from './TablePreview.svelte'
import TabsPreview from './TabsPreview.svelte'
import TagsPreview from './TagsPreview.svelte'
import TextareaPreview from './TextareaPreview.svelte'
import ToastsPreview from './ToastsPreview.svelte'
import TooltipPreview from './TooltipPreview.svelte'
import VirtualPreview from './VirtualPreview.svelte'

/** Пропсы превью: пропы строки, `ctrl` с экземпляром ядра и колбэки событий хоста. */
export type TPreviewProps = Record<string, unknown>

/**
 * Как рисовать компонент на стенде — в Svelte: компонент превью, который
 * раскладывает готовые пропсы (`bind`) на компонент адаптера.
 *
 * Та же карта, что у хостов Vue и React, и с теми же ключами —
 * идентификаторами реестра: содержимое не свойство, из метаданных его не
 * достать, а разметка у каждого фреймворка своя. Превью то же самое, что у
 * Vue, чтобы колонки фреймворков можно было сравнивать глазами. Разметка
 * Svelte живёт только в `.svelte`, поэтому превью — файлы, а карта — ссылки
 * на них. Содержимое коллекций — из общего манифеста (`COLLECTION_ITEMS`), как
 * у Vue и React. Значения пропов самого компонента — подпись кнопки,
 * плейсхолдер поля — данные, одни на все хосты (`PREVIEW_PROPS` в общем
 * пакете), и в `bind` их кладёт оболочка. Превью — обёртка и содержимое.
 *
 * Слоёв и `frame` здесь нет: во Vue это ComponentView с чужими пропами, а в
 * Svelte чужой проп ушёл бы атрибутом в корень.
 */
export type TPreview = Component<TPreviewProps>

export const PREVIEWS: Record<string, TPreview> = {
	button: ButtonPreview,
	'toggle-button': ToggleButtonPreview,
	'toggle-group': ToggleGroupPreview,
	input: InputPreview,
	'number-input': NumberInputPreview,
	textarea: TextareaPreview,
	'check-box': CheckBoxPreview,
	switch: SwitchPreview,
	alert: AlertPreview,
	badge: BadgePreview,
	avatar: AvatarPreview,
	'avatar-group': AvatarGroupPreview,
	'file-upload': FileUploadPreview,
	splitter: SplitterPreview,
	'code-block': CodeBlockPreview,
	label: LabelPreview,
	field: FieldPreview,
	slider: SliderPreview,
	rating: RatingPreview,
	'radio-group': RadioGroupPreview,
	'list-box': ListBoxPreview,
	select: SelectPreview,
	calendar: CalendarPreview,
	'date-input': DateInputPreview,
	'date-picker': DatePickerPreview,
	tags: TagsPreview,
	table: TablePreview,
	tabs: TabsPreview,
	accordion: AccordionPreview,
	icon: IconPreview,
	'progress-linear': ProgressLinearPreview,
	'progress-spinner': ProgressSpinnerPreview,
	separator: SeparatorPreview,
	skeleton: SkeletonPreview,
	'drag-and-drop': DragAndDropPreview,
	virtual: VirtualPreview,
	scroller: ScrollerPreview,
	breadcrumbs: BreadcrumbsPreview,
	pagination: PaginationPreview,
	popover: PopoverPreview,
	tooltip: TooltipPreview,
	menu: MenuPreview,
	'alert-dialog': AlertDialogPreview,
	dialog: DialogPreview,
	drawer: DrawerPreview,
	toasts: ToastsPreview,
}
