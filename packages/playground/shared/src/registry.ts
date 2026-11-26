import {
	AlertDescriptor,
	AccordionDescriptor,
	AccordionCollectionDescriptor,
	AccordionCollectionItemDescriptor,
	AccordionItemDescriptor,
	BreadcrumbsDescriptor,
	BreadcrumbsCollectionDescriptor,
	BreadcrumbsCollectionItemDescriptor,
	BreadcrumbsItemDescriptor,
	BadgeDescriptor,
	AvatarDescriptor,
	AvatarGroupDescriptor,
	CodeBlockDescriptor,
	ButtonDescriptor,
	ToggleButtonDescriptor,
	ToggleGroupDescriptor,
	ToggleGroupCollectionDescriptor,
	ToggleGroupItemDescriptor,
	ToggleGroupCollectionItemDescriptor,
	CalendarDescriptor,
	CalendarCollectionDescriptor,
	CheckBoxDescriptor,
	ComponentViewDescriptor,
	ControlDescriptor,
	DateInputDescriptor,
	DatePickerDescriptor,
	DialogDescriptor,
	AlertDialogDescriptor,
	DragAndDropDescriptor,
	DrawerDescriptor,
	FieldDescriptor,
	FileUploadDescriptor,
	FrameDescriptor,
	IconDescriptor,
	InputDescriptor,
	InputControlDescriptor,
	InteractiveDescriptor,
	LabelDescriptor,
	ListBoxDescriptor,
	ListBoxCollectionDescriptor,
	ListBoxCollectionItemDescriptor,
	ListBoxItemDescriptor,
	MenuDescriptor,
	MenuCheckboxItemDescriptor,
	MenuCollectionCheckboxItemDescriptor,
	MenuCollectionDescriptor,
	MenuCollectionItemDescriptor,
	MenuCollectionRadioItemDescriptor,
	MenuItemDescriptor,
	MenuPopoverItemDescriptor,
	MenuRadioItemDescriptor,
	MenuSubmenuCollectionDescriptor,
	MenuSubmenuDescriptor,
	NumberInputDescriptor,
	PaginationDescriptor,
	PaginationCollectionDescriptor,
	PopoverDescriptor,
	ProgressLinearDescriptor,
	ProgressSpinnerDescriptor,
	RadioGroupDescriptor,
	RadioGroupCollectionDescriptor,
	RadioGroupCollectionItemDescriptor,
	RadioGroupItemDescriptor,
	RatingDescriptor,
	ScrollerDescriptor,
	SelectDescriptor,
	SelectCollectionDescriptor,
	SeparatorDescriptor,
	SkeletonDescriptor,
	SliderDescriptor,
	StylableDescriptor,
	SwitchDescriptor,
	TableDescriptor,
	TableCollectionDescriptor,
	TabsDescriptor,
	TabsCollectionDescriptor,
	TabsCollectionContentDescriptor,
	TabsCollectionItemDescriptor,
	TabsContentDescriptor,
	TabsItemDescriptor,
	TagsDescriptor,
	TagsCollectionDescriptor,
	TextableDescriptor,
	TextareaDescriptor,
	ToastsDescriptor,
	ToastsCollectionDescriptor,
	TooltipDescriptor,
	ValueControlDescriptor,
	VirtualDescriptor,
} from '@soxa-ui/setup'
import { arEG, enUS, esES, extendLocale, frFR, ruRU, zhCN } from '@soxa-ui/plugins'
import type { TLocale, TMotionMode } from '@soxa-ui/plugins'
import type { TComponentEntry, TComponentGroup, TThemeEntry, TIconPackEntry } from './types'

/**
 * Menu groups of the props page with their labels, in menu order. The key is
 * the registry entry's group, so the record covers `TComponentGroup` whole: a
 * group without a label does not compile. Inheritance layers go last.
 */
export const COMPONENT_GROUPS: Readonly<Record<TComponentGroup, string>> = {
	forms: 'Формы',
	dates: 'Даты',
	overlays: 'Оверлеи',
	collections: 'Коллекции',
	display: 'Отображение',
	utilities: 'Утилиты',
	layers: 'Слои',
}

/**
 * The playground's component registry.
 *
 * Written by hand because the library has none: descriptors sit in
 * hand-written barrel files, and a descriptor has no `name` field, so at
 * runtime a component is recognized only by `ctor.name` or `ctor.baseClass`.
 * Entry order here does not matter: the menu goes by groups (`group`, ordered
 * by `COMPONENT_GROUPS`), and within a group, like the showcase, alphabetically
 * (the shell's `catalog.ts`).
 *
 * The `layers` group holds inheritance layers. They have a page (handy for
 * seeing which props come from where) but no place on the showcase: they are
 * levels of the contract, not components.
 */
export const COMPONENTS: readonly TComponentEntry[] = [
	{
		id: 'alert',
		label: 'Alert',
		descriptor: AlertDescriptor,
		group: 'display',
		span: 2,
		description:
			'Сообщение в потоке страницы с заголовком, действием и необязательным закрытием',
	},
	{
		id: 'avatar',
		label: 'Avatar',
		descriptor: AvatarDescriptor,
		parts: { Group: () => [AvatarGroupDescriptor()] },
		group: 'display',
		span: 1,
		description: 'Изображение пользователя с инициалами или своим запасным содержимым',
	},
	{
		id: 'avatar-group',
		label: 'AvatarGroup',
		descriptor: AvatarGroupDescriptor,
		group: 'display',
		span: 1,
		description: 'Перекрывающаяся группа с явным числом скрытых пользователей',
	},
	{
		id: 'file-upload',
		label: 'FileUpload',
		descriptor: FileUploadDescriptor,
		group: 'forms',
		span: 2,
		description: '????? ? ?????????????? ?????? ? ????????? ? ??????',
	},
	{
		id: 'code-block',
		label: 'CodeBlock',
		descriptor: CodeBlockDescriptor,
		group: 'display',
		span: 2,
		description: 'Подсветка синтаксиса, копирование текста, номера строк и вкладки',
	},
	{
		id: 'breadcrumbs',
		label: 'Breadcrumbs',
		descriptor: BreadcrumbsDescriptor,
		collectionDescriptor: BreadcrumbsCollectionDescriptor,
		parts: {
			Item: () => [BreadcrumbsItemDescriptor(), BreadcrumbsCollectionItemDescriptor()],
		},
		group: 'collections',
		span: 2,
		description:
			'Навигационный путь: ссылки на предков, текущая страница и меню скрытых звеньев',
	},
	{
		id: 'badge',
		label: 'Badge',
		descriptor: BadgeDescriptor,
		group: 'display',
		span: 1,
		description: 'Метка, числовой счётчик с пределом или точка поверх элемента',
	},
	{
		id: 'toggle-button',
		label: 'ToggleButton',
		descriptor: ToggleButtonDescriptor,
		group: 'forms',
		span: 1,
		description: 'Кнопка с сохраняемым нажатым состоянием',
	},
	{
		id: 'toggle-group',
		label: 'ToggleGroup',
		descriptor: ToggleGroupDescriptor,
		collectionDescriptor: ToggleGroupCollectionDescriptor,
		parts: { Item: () => [ToggleGroupItemDescriptor(), ToggleGroupCollectionItemDescriptor()] },
		group: 'collections',
		span: 2,
		description: 'Группа кнопок с одиночным или множественным выбором и навигацией стрелками',
	},
	{
		id: 'button',
		label: 'Button',
		descriptor: ButtonDescriptor,
		group: 'forms',
		span: 1,
		description: 'Кнопка: текст, иконки в слотах, четыре вида оформления',
	},
	{
		id: 'input',
		label: 'Input',
		descriptor: InputDescriptor,
		group: 'forms',
		span: 1,
		description: 'Текстовое поле со слотами под иконки и кнопки',
	},
	{
		id: 'number-input',
		label: 'NumberInput',
		descriptor: NumberInputDescriptor,
		group: 'forms',
		span: 1,
		description:
			'Поле числа в формате языка: шаг и границы, клавиши и кнопки «−» и «+» с удержанием',
	},
	{
		id: 'textarea',
		label: 'Textarea',
		descriptor: TextareaDescriptor,
		group: 'forms',
		span: 1,
		description: 'Многострочное поле: высота по тексту до предела строк и счётчик символов',
	},
	{
		id: 'check-box',
		label: 'CheckBox',
		descriptor: CheckBoxDescriptor,
		group: 'forms',
		span: 1,
		description: 'Флажок с третьим, неопределённым состоянием',
	},
	{
		id: 'switch',
		label: 'Switch',
		descriptor: SwitchDescriptor,
		group: 'forms',
		span: 1,
		description: 'Переключатель — то же значение, другая метафора',
	},
	{
		id: 'label',
		label: 'Label',
		descriptor: LabelDescriptor,
		group: 'forms',
		span: 1,
		description: 'Подпись контрола: клик по тексту переключает его, текст — его имя',
	},
	{
		id: 'field',
		label: 'Field',
		descriptor: FieldDescriptor,
		group: 'forms',
		span: 1,
		description: 'Поле формы: подпись, подсказка и ошибка, связанные с контролом сами',
	},
	{
		id: 'slider',
		label: 'Slider',
		descriptor: SliderDescriptor,
		group: 'forms',
		span: 1,
		description: 'Ползунок: число или диапазон перетаскиванием, клавишами и жестом скринридера',
	},
	{
		id: 'rating',
		label: 'Rating',
		descriptor: RatingDescriptor,
		group: 'forms',
		span: 1,
		description:
			'Оценка звёздами: нажатием, протяжкой и клавишами, с половинками и предпросмотром наведением',
	},
	{
		id: 'radio-group',
		label: 'RadioGroup',
		descriptor: RadioGroupDescriptor,
		collectionDescriptor: RadioGroupCollectionDescriptor,
		parts: { Item: () => [RadioGroupItemDescriptor(), RadioGroupCollectionItemDescriptor()] },
		group: 'forms',
		span: 1,
		description: 'Выбор одного из нескольких: нативные радио с общим name',
	},
	{
		id: 'select',
		label: 'Select',
		descriptor: SelectDescriptor,
		collectionDescriptor: SelectCollectionDescriptor,
		group: 'forms',
		span: 2,
		description: 'Поле выбора: input плюс список в оверлее, паттерн Combobox',
	},
	{
		id: 'calendar',
		label: 'Calendar',
		descriptor: CalendarDescriptor,
		collectionDescriptor: CalendarCollectionDescriptor,
		group: 'dates',
		span: 1,
		description: 'Сетки месяцев: выбор одной даты, нескольких или диапазона',
	},
	{
		id: 'date-input',
		label: 'DateInput',
		descriptor: DateInputDescriptor,
		group: 'dates',
		span: 1,
		description:
			'Поле даты и времени по частям в формате локали: значение выделяется и копируется целиком',
	},
	{
		id: 'date-picker',
		label: 'DatePicker',
		descriptor: DatePickerDescriptor,
		group: 'dates',
		span: 1,
		description: 'Поле даты и календарь в панели: одна дата или диапазон',
	},
	{
		id: 'popover',
		label: 'Popover',
		descriptor: PopoverDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Панель у триггера с произвольным содержимым: немодальный диалог',
	},
	{
		id: 'menu',
		label: 'Menu',
		descriptor: MenuDescriptor,
		collectionDescriptor: MenuCollectionDescriptor,
		parts: {
			Item: () => [MenuItemDescriptor(), MenuCollectionItemDescriptor()],
			CheckboxItem: () => [
				MenuCheckboxItemDescriptor(),
				MenuCollectionCheckboxItemDescriptor(),
			],
			RadioItem: () => [MenuRadioItemDescriptor(), MenuCollectionRadioItemDescriptor()],
			// A submenu is an item of its menu and the owner of its own collection
			Submenu: () => [
				MenuSubmenuDescriptor(),
				MenuCollectionItemDescriptor(),
				MenuSubmenuCollectionDescriptor(),
			],
			PopoverItem: () => [MenuPopoverItemDescriptor(), MenuCollectionItemDescriptor()],
		},
		group: 'overlays',
		span: 1,
		description:
			'Меню действий у кнопки: пункты, флажки, переключатели, группы, клавиши и набор по буквам',
	},
	{
		id: 'tooltip',
		label: 'Tooltip',
		descriptor: TooltipDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Подсказка у элемента: при наведении и при фокусе с клавиатуры',
	},
	{
		id: 'alert-dialog',
		label: 'AlertDialog',
		descriptor: AlertDialogDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Подтверждение действия: безопасная отмена и красная кнопка подтверждения',
	},
	{
		id: 'dialog',
		label: 'Dialog',
		descriptor: DialogDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Модальное окно: по центру или у края экрана, с разворотом на весь экран',
	},
	{
		id: 'drawer',
		label: 'Drawer',
		descriptor: DrawerDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Выезжающая панель у края экрана или контейнера: смахивается жестом',
	},
	{
		id: 'toasts',
		label: 'Toasts',
		descriptor: ToastsDescriptor,
		collectionDescriptor: ToastsCollectionDescriptor,
		group: 'overlays',
		span: 1,
		description: 'Всплывающие уведомления: вызов из кода, автозакрытие с паузой, смахивание',
	},
	{
		id: 'scroller',
		label: 'Scroller',
		descriptor: ScrollerDescriptor,
		group: 'display',
		span: 2,
		description: 'Лента произвольного содержимого в одну строку: листают две кнопки',
	},
	{
		id: 'list-box',
		label: 'ListBox',
		descriptor: ListBoxDescriptor,
		collectionDescriptor: ListBoxCollectionDescriptor,
		parts: { Item: () => [ListBoxItemDescriptor(), ListBoxCollectionItemDescriptor()] },
		group: 'collections',
		span: 1,
		description: 'Список с выбором одного или нескольких элементов',
	},
	{
		id: 'pagination',
		label: 'Pagination',
		descriptor: PaginationDescriptor,
		collectionDescriptor: PaginationCollectionDescriptor,
		group: 'collections',
		span: 2,
		description:
			'Постраничная навигация: первая и последняя страницы, окно вокруг текущей и стрелки',
	},
	{
		id: 'table',
		label: 'Table',
		descriptor: TableDescriptor,
		collectionDescriptor: TableCollectionDescriptor,
		group: 'collections',
		span: 2,
		description: 'Таблица: колонки данными, сортировка по заголовкам, выбор строк чекбоксами',
	},
	{
		id: 'tabs',
		label: 'Tabs',
		descriptor: TabsDescriptor,
		collectionDescriptor: TabsCollectionDescriptor,
		parts: {
			Item: () => [TabsItemDescriptor(), TabsCollectionItemDescriptor()],
			Content: () => [TabsContentDescriptor(), TabsCollectionContentDescriptor()],
		},
		group: 'collections',
		span: 2,
		description: 'Вкладки: список табов и панели, связанные по значению',
	},
	{
		id: 'tags',
		label: 'Tags',
		descriptor: TagsDescriptor,
		collectionDescriptor: TagsCollectionDescriptor,
		group: 'collections',
		span: 1,
		description: 'Набор тегов: закрытие по кнопке, необязательный выбор',
	},
	{
		id: 'accordion',
		label: 'Accordion',
		descriptor: AccordionDescriptor,
		collectionDescriptor: AccordionCollectionDescriptor,
		parts: { Item: () => [AccordionItemDescriptor(), AccordionCollectionItemDescriptor()] },
		group: 'collections',
		span: 2,
		description: 'Секции, раскрывающиеся по одной или сразу нескольким',
	},
	{
		id: 'icon',
		label: 'Icon',
		descriptor: IconDescriptor,
		group: 'display',
		span: 1,
		description: 'Иконка из подключённого пакета, по роли',
	},
	{
		id: 'progress-linear',
		label: 'ProgressLinear',
		descriptor: ProgressLinearDescriptor,
		group: 'display',
		span: 1,
		description: 'Индикатор выполнения линией: доля готового, а пока она неизвестна — бег',
	},
	{
		id: 'progress-spinner',
		label: 'ProgressSpinner',
		descriptor: ProgressSpinnerDescriptor,
		group: 'display',
		span: 1,
		description: 'Индикатор выполнения кольцом: доля готового, а пока она неизвестна — бег',
	},
	{
		id: 'separator',
		label: 'Separator',
		descriptor: SeparatorDescriptor,
		group: 'display',
		span: 1,
		description: 'Горизонтальная или вертикальная граница между разделами',
	},
	{
		id: 'skeleton',
		label: 'Skeleton',
		descriptor: SkeletonDescriptor,
		group: 'display',
		span: 1,
		description: 'Заглушка на время загрузки',
	},
	{
		id: 'drag-and-drop',
		label: 'DragAndDrop',
		descriptor: DragAndDropDescriptor,
		group: 'utilities',
		span: 2,
		description:
			'Перестановка перетаскиванием: Tabs, ListBox и Accordion внутри переставляют свои элементы',
	},
	{
		id: 'virtual',
		label: 'Virtual',
		descriptor: VirtualDescriptor,
		group: 'utilities',
		span: 2,
		description:
			'Окно для длинных списков: ListBox, Select и Table внутри рисуют только видимое',
	},
	{
		id: 'frame',
		label: 'Frame',
		descriptor: FrameDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой оверлея: позиционирование, якорь, закрытие по нажатию мимо',
	},
	{
		id: 'component-view',
		label: 'ComponentView',
		descriptor: ComponentViewDescriptor,
		group: 'layers',
		span: 1,
		description: 'Визуальный слой: rendered, visible, tag, classes, aria, dataset',
	},
	{
		id: 'control',
		label: 'Control',
		descriptor: ControlDescriptor,
		group: 'layers',
		span: 1,
		description: 'Интерактивный слой: disabled, фокус, активация',
	},
	{
		id: 'stylable',
		label: 'Stylable',
		descriptor: StylableDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой оформления: size и variant',
	},
	{
		id: 'textable',
		label: 'Textable',
		descriptor: TextableDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой текста',
	},
	{
		id: 'interactive',
		label: 'Interactive',
		descriptor: InteractiveDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой взаимодействия без оформления',
	},
	{
		id: 'value-control',
		label: 'ValueControl',
		descriptor: ValueControlDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой значения: value и name',
	},
	{
		id: 'input-control',
		label: 'InputControl',
		descriptor: InputControlDescriptor,
		group: 'layers',
		span: 1,
		description: 'Слой поля формы: readonly, required, id',
	},
]

export function findComponent(id: string): TComponentEntry | undefined {
	return COMPONENTS.find((entry) => entry.id === id)
}

/**
 * Themes. The dark scheme is not a separate theme but the `${value}-dark`
 * attribute, so it is not listed: a switch turns it on.
 */
export const THEMES: readonly TThemeEntry[] = [{ id: 'oren', label: 'Oren', value: 'oren' }]

/** Icon packs. They implement the `ICON_ROLES` contract. */
export const ICON_PACKS: readonly TIconPackEntry[] = [
	{ id: 'material', label: 'Material' },
	{ id: 'lucide', label: 'Lucide' },
]

/**
 * The library's motion modes (`useMotion`) with labels, in the order of the
 * header list. The key is the mode, so the record covers `TMotionMode` whole: a
 * new library mode fails the playground's compilation until it is added here.
 */
export const MOTION_MODES: Readonly<Record<TMotionMode, string>> = {
	system: 'Как в системе',
	full: 'Всегда',
	reduce: 'Без движения',
}

/** A language in the header list: its label and the library locale. */
export type TLocaleEntry = {
	readonly label: string
	readonly locale: TLocale
}

/**
 * The library's languages on the playground, by BCP 47 tag, in the order of the
 * header list: the locale goes to the provider (`LocaleProvider` around the
 * playground). A component has no language of its own, so this is the only
 * place to see strings, date labels, the week and field formats in another
 * language.
 *
 * First come the library's ready locales (UN languages). Then languages
 * without ready strings, built over English (`extendLocale`): English strings,
 * their own Intl. Picked by what the language changes: right to left
 * (`he-IL`; `ar-EG` also has Arabic digits), the Buddhist year (`th-TH`),
 * numbers joined to their label (`ja-JP`).
 */
export const LOCALES: Readonly<Record<string, TLocaleEntry>> = {
	'en-US': { label: 'English', locale: enUS },
	'ru-RU': { label: 'Русский', locale: ruRU },
	'zh-CN': { label: '中文', locale: zhCN },
	'fr-FR': { label: 'Français', locale: frFR },
	'es-ES': { label: 'Español', locale: esES },
	'ar-EG': { label: 'العربية', locale: arEG },
	'de-DE': { label: 'Deutsch', locale: extendLocale(enUS, { tag: 'de-DE' }) },
	'he-IL': { label: 'עברית', locale: extendLocale(enUS, { tag: 'he-IL' }) },
	'th-TH': { label: 'ไทย', locale: extendLocale(enUS, { tag: 'th-TH' }) },
	'ja-JP': { label: '日本語', locale: extendLocale(enUS, { tag: 'ja-JP' }) },
}
