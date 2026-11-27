import { ALERT_SAMPLE } from '@soxa-ui/playground-shared'
import {
	BREADCRUMBS_ITEMS,
	EDITOR_ALIGNMENT_ITEMS,
	AVATAR_PEOPLE,
	editorAlignmentPath,
} from '@soxa-ui/playground-shared'
import {
	defineComponent,
	h,
	mergeProps,
	ref,
	watch,
	type Component,
	type FunctionalComponent,
} from 'vue'
import type { TToastsItemType } from '@soxa-ui/core'
import type {
	DescriptorSlots,
	MenuDescriptor,
	PopoverDescriptor,
	TooltipDescriptor,
} from '@soxa-ui/setup'
import {
	COLLECTION_ITEMS,
	COLLECTION_MANY_ITEMS,
	TABLE_COLUMNS,
	TABLE_MANY_ROWS,
	TABLE_ROWS,
	TABLE_SCROLL_ROWS,
	TOASTS_ITEM_TYPES,
	TOAST_SAVING,
	toastSample,
} from '@soxa-ui/playground-shared'
import {
	Accordion,
	Breadcrumbs,
	Button,
	ToggleButton,
	ToggleGroup,
	Calendar,
	CheckBox,
	ComponentView,
	DateInput,
	DatePicker,
	Dialog,
	AlertDialog,
	DragAndDrop,
	Drawer,
	Field,
	Icon,
	Input,
	Alert,
	Avatar,
	AvatarGroup,
	Badge,
	CodeBlock,
	FileUpload,
	Splitter,
	Stepper,
	Label,
	ListBox,
	Menu,
	NumberInput,
	Pagination,
	Popover,
	ProgressLinear,
	ProgressSpinner,
	RadioGroup,
	Rating,
	Scroller,
	Select,
	Separator,
	Skeleton,
	Slider,
	Switch,
	Table,
	Tabs,
	Tags,
	Textarea,
	Toasts,
	Tooltip,
	Virtual,
	roleIcon,
	useToasts,
	type TToastRender,
} from '@soxa-ui/vue'
import FileUploadProgress from './FileUploadProgress.vue'
import type { TParts } from './events'

/**
 * How to draw a component on the playground, in Vue.
 *
 * The component page is generic: it is built from the descriptor and knows
 * nothing about the components. But `Tabs` cannot be drawn without tabs, and
 * `Button` without text is pointless: **content is not a property, metadata
 * cannot give it**. This map is the missing piece, and it is framework
 * specific, so it lives in the framework's host, not in the shared package.
 * Keys are registry ids, the same for every host.
 *
 * The function gets ready attributes (`bind`) and draws the component with
 * them. One function serves both columns: in the first `bind` holds props, in
 * the second `ctrl` with the core instance. The host puts the event listeners
 * there too.
 *
 * The second argument is the listeners of the parts the preview places in
 * markup, by part (`TComponentEntry.parts`): the preview spreads them on its
 * parts, as the component's own lie in `bind`. When not asked for, it is
 * empty.
 *
 * Prop values of the component itself (a button's label, a field's
 * placeholder) are not here: they are data, the same for every host
 * (`PREVIEW_PROPS` in the shared package), and the shell puts them in `bind`.
 * Here are the wrapper and the content.
 */
export type TPreview = (bind: Record<string, unknown>, parts: TParts) => unknown

/** Scope of Popover's `trigger` slot, from the slot declaration in the descriptor. */
type TPopoverTriggerScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']

/** Scope of Tooltip's `trigger` slot: the trigger's reference to the panel. */
type TTooltipTriggerScope = DescriptorSlots<typeof TooltipDescriptor>['trigger']

/** Scope of Menu's `trigger` slot: the button's link to the menu and its pressed look. */
type TMenuTriggerScope = DescriptorSlots<typeof MenuDescriptor>['trigger']

/**
 * Collection content comes from the shared manifest: the items are needed not
 * only here. Row presets use it too (Select's `tagsOverflow` selects all).
 */
const ITEMS = COLLECTION_ITEMS

/**
 * Tabs in markup and their panels, for the Tabs and DragAndDrop previews. The
 * first tab is active at once: otherwise no panel mounts (`rendered &&
 * active`), and the playground never shows any content.
 */
const tabsSlots = (parts: TParts = {}) => ({
	default: () =>
		ITEMS.map((item, index) =>
			h(Tabs.Item, { key: item.value, active: index === 0, ...item, ...parts.Item }),
		),
	content: () =>
		ITEMS.map((item) =>
			h(Tabs.Content, { key: `c-${item.value}`, value: item.value, ...parts.Content }, () =>
				h('div', { style: 'padding:12px' }, `Панель «${item.text}»`),
			),
		),
})

/** Sections in markup, with content, for the Accordion and DragAndDrop previews. */
const accordionItems = (parts: TParts = {}) =>
	ITEMS.map((item) =>
		h(Accordion.Item, { key: item.value, ...item, ...parts.Item }, () =>
			h('div', { style: 'padding:4px 0' }, `Содержимое «${item.text}»`),
		),
	)

/**
 * Menu items in markup: a labelled group of checkboxes, a group of radios
 * with one checked, actions with shortcut hints, a submenu with a submenu
 * inside, an item with a panel (a calendar mounted on first open), a disabled
 * action and a "dangerous" item with its own variant.
 */
const menuItems = (parts: TParts) => [
	h(Menu.Group, { label: 'Вид' }, () => [
		h(Menu.CheckboxItem, {
			value: 'grid',
			text: 'Сетка',
			selected: true,
			...parts.CheckboxItem,
		}),
		h(Menu.CheckboxItem, { value: 'ruler', text: 'Линейка', ...parts.CheckboxItem }),
	]),
	h(Menu.Separator),
	h(Menu.RadioGroup, { label: 'Сортировка', value: 'name' }, () => [
		h(Menu.RadioItem, { value: 'name', text: 'По имени', ...parts.RadioItem }),
		h(Menu.RadioItem, { value: 'date', text: 'По дате', ...parts.RadioItem }),
	]),
	h(Menu.Separator),
	h(Menu.Item, { value: 'edit', text: 'Изменить', ...parts.Item }, { trailing: () => 'Ctrl+E' }),
	h(
		Menu.Item,
		{ value: 'copy', text: 'Дублировать', ...parts.Item },
		{ trailing: () => 'Ctrl+D' },
	),
	h(Menu.Submenu, { value: 'share', text: 'Поделиться', ...parts.Submenu }, () => [
		h(Menu.Item, { value: 'link', text: 'Ссылка', ...parts.Item }),
		h(Menu.Item, { value: 'mail', text: 'Почта', ...parts.Item }),
		h(Menu.Submenu, { value: 'messengers', text: 'Мессенджеры', ...parts.Submenu }, () => [
			h(Menu.Item, { value: 'telegram', text: 'Telegram', ...parts.Item }),
			h(Menu.Item, { value: 'whatsapp', text: 'WhatsApp', ...parts.Item }),
		]),
	]),
	h(Menu.PopoverItem, { value: 'due', text: 'Срок', lazyMount: true, ...parts.PopoverItem }, () =>
		h(Calendar as Component),
	),
	h(Menu.Item, { value: 'archive', text: 'В архив', disabled: true, ...parts.Item }),
	h(Menu.Separator),
	h(
		Menu.Item,
		{ value: 'remove', text: 'Удалить', variant: 'negative', ...parts.Item },
		{ trailing: () => 'Del' },
	),
]

/**
 * The Icon preview's glyph.
 *
 * Icon's `tag` is the root, a tag or a component, and the glyph is drawn by
 * the `roleIcon(role)` component. A role string (`tag: 'arrowDown'`) gave an
 * empty `<arrowdown>` element and an empty Icon cell on the showcase. The
 * component is built once: a new one on every render would make Vue recreate
 * the node.
 */
const ALERT_ICON = roleIcon('warning')
const ARROW_DOWN = roleIcon('arrowDown')

/**
 * On the playground a button opens the dialog: closed it is hidden, and open
 * it covers the page with a backdrop, so showing it at once would block the
 * rest of the page.
 *
 * Openness is `v-model:visible` on local state: the close button, Escape and
 * the backdrop close the dialog through `update:visible`, and the `visible`
 * row sets it from outside. The state is held by a component, since a render
 * function has none. With the core instance (the second column) the path is
 * the same: writing the instance's `visible` opens the dialog, and
 * `update:visible` comes back here. The page's handlers (the event journal)
 * are merged with ours by `mergeProps`, not overwritten.
 */
const DialogPreview = defineComponent({
	name: 'DialogPreview',
	inheritAttrs: false,
	props: { visible: { type: Boolean, default: false } },
	setup(props, { attrs }) {
		const shown = ref(props.visible)

		watch(
			() => props.visible,
			(value) => {
				shown.value = value
			},
		)

		const setShown = (value: boolean) => {
			shown.value = value
		}

		return () => [
			h(Button, { text: 'Открыть окно', onClick: () => setShown(true) }),
			h(
				Dialog as Component,
				mergeProps(attrs, { visible: shown.value, 'onUpdate:visible': setShown }),
				{
					title: () => 'Настройки',
					default: () => [
						h(
							'p',
							{ style: 'margin:0 0 8px' },
							'Произвольное содержимое: текст, поля, кнопки',
						),
						h(Input, { placeholder: 'Имя' }),
					],
					footer: () => [
						h(Button, { text: 'Отмена', onClick: () => setShown(false) }),
						h(Button, { text: 'Сохранить', onClick: () => setShown(false) }),
					],
				},
			),
		]
	},
})

const AlertDialogPreview = defineComponent({
	name: 'AlertDialogPreview',
	inheritAttrs: false,
	props: { visible: { type: Boolean, default: false } },
	setup(props, { attrs }) {
		const shown = ref(props.visible)

		watch(
			() => props.visible,
			(value) => {
				shown.value = value
			},
		)

		const setShown = (value: boolean) => {
			shown.value = value
		}

		return () => [
			h(Button, { text: 'Открыть окно', onClick: () => setShown(true) }),
			h(
				AlertDialog as Component,
				mergeProps(attrs, { visible: shown.value, 'onUpdate:visible': setShown }),
				{
					title: () => 'Удалить запись?',
					default: () => h('p', 'Удалённую запись нельзя будет восстановить.'),
					action: () => 'Удалить',
				},
			),
		]
	},
})

/**
 * The drawer is opened by a button too, for the same reason as the dialog and
 * on the same local state (`v-model:visible`, see `DialogPreview`).
 *
 * The button and the drawer sit in their own box with `position: relative`:
 * with `contained` the drawer is not teleported but placed in the nearest
 * positioned ancestor, so the `contained` row shows it in the preview box
 * rather than at the edge of the whole page.
 */
const DrawerPreview = defineComponent({
	name: 'DrawerPreview',
	inheritAttrs: false,
	props: { visible: { type: Boolean, default: false } },
	setup(props, { attrs }) {
		const shown = ref(props.visible)

		watch(
			() => props.visible,
			(value) => {
				shown.value = value
			},
		)

		const setShown = (value: boolean) => {
			shown.value = value
		}

		return () =>
			h(
				'div',
				{ style: 'position:relative; width:100%; min-height:240px; overflow:hidden' },
				[
					h(Button, { text: 'Открыть панель', onClick: () => setShown(true) }),
					h(
						Drawer as Component,
						mergeProps(attrs, { visible: shown.value, 'onUpdate:visible': setShown }),
						{
							title: () => 'Фильтры',
							default: () => [
								h(
									'p',
									{ style: 'margin:0 0 8px' },
									'Произвольное содержимое: текст, поля, кнопки',
								),
								h(Input, { placeholder: 'Поиск' }),
							],
							footer: () => [
								h(Button, { text: 'Сбросить', onClick: () => setShown(false) }),
								h(Button, { text: 'Применить', onClick: () => setShown(false) }),
							],
						},
					),
				],
			)
	},
})

/** Custom toast content, an Undo button: the toast comes to it as a prop and is closed by it. */
const ToastUndo: TToastRender = ({ toast }) =>
	h(Button, { text: 'Отменить', onClick: () => toast.close() })

/**
 * Toasts come from code, not markup: buttons inside the manager take the API
 * (`useToasts()`) and show a toast. The manager wraps them as it wraps an app,
 * and the toast region is teleported to the window edge, outside the preview
 * cell.
 *
 * One button per plain message and per type (`TOASTS_ITEM_TYPES`): a toast
 * shows its type's icon. What a toast says comes from the playground samples,
 * the same for every host (`toastSample`); this host's custom content for them
 * is the Undo button. The prop rows edit the manager, which has no type and
 * must not: each toast has its own, set by `show`. The text starts with a
 * number, so the stack shows which toast is where.
 *
 * The last button is a pending one: "Saving…" with a ring in place of the
 * icon (`loading`) does not close by itself; a couple of seconds later the
 * same toast reports success, and the lifted wait starts the countdown. The
 * row of buttons wraps: six buttons do not fit on one line of a showcase cell.
 */
const ToastsTrigger = defineComponent({
	name: 'ToastsTrigger',
	setup() {
		const { show } = useToasts()
		let count = 0

		const notify = (type?: TToastsItemType) => {
			const sample = toastSample(type, ToastUndo)

			count += 1
			show({ ...sample, text: `${count}. ${sample.text}`, type })
		}

		// While the work runs the toast waits; when it ends the same toast reports the result
		const save = () => {
			count += 1

			const toast = show({ text: `${count}. Сохраняем…`, loading: true })
			const done = `${count}. Сохранено`

			setTimeout(() => {
				if (!toast) return

				toast.loading = false
				toast.type = 'success'
				toast.text = done
			}, TOAST_SAVING)
		}

		return () =>
			h('div', { style: 'display:flex; flex-wrap:wrap; gap:8px' }, [
				h(Button, { key: 'normal', text: 'обычное', onClick: () => notify() }),
				...TOASTS_ITEM_TYPES.map((type) =>
					h(Button, { key: type, text: type, onClick: () => notify(type) }),
				),
				h(Button, { key: 'loading', text: 'загрузка → готово', onClick: save }),
			])
	},
})

/** Inheritance layers have no markup of their own: show an empty box. */
const layer =
	(label: string): TPreview =>
	(bind) =>
		h(ComponentView, bind, { default: () => label })

export const PREVIEWS: Record<string, TPreview> = {
	stepper: (bind) =>
		h(Stepper, {
			items: [
				{ value: 'cart', text: 'Review', completed: true },
				{ value: 'shipping', text: 'Shipping' },
				{ value: 'payment', text: 'Payment' },
			],
			value: 'shipping',
			...bind,
		}),
	// The label is the `text` prop from the preview props, not a slot: a given
	// `default` slot overrides the prop, and the `text` row would change nothing
	// visible
	button: (bind) => h(Button, bind),
	'toggle-button': (bind) => h(ToggleButton, bind),
	'toggle-group': (bind) =>
		h(
			ToggleGroup,
			{ items: EDITOR_ALIGNMENT_ITEMS, ...bind },
			{
				'item-leading': ({ item }: { item: { text: string } }) =>
					h(
						'svg',
						{
							width: 16,
							height: 16,
							viewBox: '0 0 24 24',
							fill: 'none',
							stroke: 'currentColor',
							'stroke-width': 1.5,
							'stroke-linecap': 'round',
							'aria-hidden': 'true',
						},
						[h('path', { d: editorAlignmentPath(item.text) })],
					),
			},
		),

	input: (bind) => h(Input, bind),
	'number-input': (bind) => h(NumberInput, bind),

	textarea: (bind) => h(Textarea, bind),

	// A checkbox and a switch have no text, both are bare controls: the Label
	// wrapper gives the label. The preview sets its props; the page rows edit the
	// control
	'check-box': (bind) => h(Label, { text: 'Согласен' }, () => h(CheckBox, bind)),

	switch: (bind) => h(Label, { text: 'Включено' }, () => h(Switch, bind)),

	// The text is the `text` prop from the preview props, the control a slot. The
	// page rows edit the label itself: side, text size, variant
	alert: (bind) =>
		h(Alert, bind, {
			icon: () => h(Icon, { tag: ALERT_ICON }),
			title: () => ALERT_SAMPLE.title,
			default: () => ALERT_SAMPLE.message,
			action: () => h(Button, { type: 'button' }, () => ALERT_SAMPLE.action),
		}),
	splitter: (bind) =>
		h(Splitter, { ...bind, class: 'pg-splitter-preview' }, () => [
			h(Splitter.Panel, { panel: 'files' }, () =>
				h('div', { class: 'pg-splitter-preview__pane' }, [
					h('strong', 'Файлы'),
					h('code', 'App.vue'),
				]),
			),
			h(Splitter.Handle, { panel: 'files', size: 'sm', aria_label: 'Файлы' }),
			h(Splitter.Panel, { panel: 'editor' }, () =>
				h('div', { class: 'pg-splitter-preview__pane' }, [
					h('strong', 'Редактор'),
					h('code', '<Splitter />'),
				]),
			),
			h(Splitter.Handle, { panel: 'editor', size: 'lg', aria_label: 'Редактор' }),
			h(Splitter.Panel, { panel: 'preview' }, () =>
				h('div', { class: 'pg-splitter-preview__pane' }, [
					h('strong', 'Вывод'),
					h('code', 'Сборка готова'),
				]),
			),
		]),
	'file-upload': (bind) =>
		h(FileUpload, bind, {
			'item-progress': ({ file, id }: { file: File; id: number }) =>
				h(FileUploadProgress, { key: id, file }),
		}),
	'code-block': (bind) => h(CodeBlock, bind),
	badge: (bind) => h(Badge, bind),
	avatar: (bind) => h(Avatar, bind),
	'avatar-group': (bind) =>
		h(AvatarGroup, bind, () => AVATAR_PEOPLE.map((person) => h(Avatar, person))),
	label: (bind) => h(Label, bind, () => h(CheckBox)),

	// A form field around Input: the parts' texts are preview props, the control
	// a slot. The page rows edit the field itself: label side, texts, error
	field: (bind) => h(Field, bind, () => h(Input, { placeholder: 'name@example.com' })),

	// A slider has no name, like a checkbox: the visible one comes from a Label
	// above it. A horizontal slider stretches to the label's width, a vertical one
	// keeps its own height
	slider: (bind) => h(Label, { text: 'Громкость', position: 'top' }, () => h(Slider, bind)),

	// A rating has no name, like a slider: the visible one comes from a Label above the stars
	rating: (bind) => h(Label, { text: 'Оценка', position: 'top' }, () => h(Rating, bind)),

	// The label is a slot: a radio has no text, it is a bare control like CheckBox
	'radio-group': (bind, parts) =>
		h(RadioGroup as Component, bind, () =>
			ITEMS.map((item) =>
				h(
					RadioGroup.Item,
					{ key: item.value, value: item.value, ...parts.Item },
					() => item.text,
				),
			),
		),

	// Options in markup, unless they came as data (`items` from the page's groups
	// block): markup would replace the data, and Select draws groups from data
	select: (bind) =>
		h(
			Select as Component,
			bind,
			bind.items
				? undefined
				: () => ITEMS.map((item) => h(Select.Item, { key: item.value, ...item })),
		),

	// A calendar has no content: its month grid view puts the days into the
	// collection. The preview has no language of its own: it is the locale of the
	// provider around the host root, picked in the header (the host's `setLocale`)
	calendar: (bind) => h(Calendar as Component, bind),

	// The language comes from the playground header, as for the calendar
	'date-input': (bind) => h(DateInput, bind),

	// The field and the calendar are DatePicker's own instances; it has no
	// content. The language comes from the header, as for the field and calendar
	'date-picker': (bind) => h(DatePicker, bind),

	// The trigger is a Button; it takes the link to the panel and the pressed look
	// from the slot scope. The content has a button for focus to move to on open
	popover: (bind) =>
		h(Popover as Component, bind, {
			trigger: ({ triggerAria, triggerDataset }: TPopoverTriggerScope) =>
				h(Button, { text: 'Открыть', ...triggerAria, ...triggerDataset }),
			default: () => [
				h('p', { style: 'margin:0 0 8px' }, 'Произвольное содержимое: текст, поля, кнопки'),
				h(Button, { text: 'Действие' }),
			],
		}),

	// The trigger is a Button; it takes the link to the menu and the pressed look
	// from the slot scope. A context menu (`openOn: 'contextmenu'`) gets an area
	// in the slot, like a consumer's "file": the menu opens over it by right
	// click, long press and Shift+F10, and the panel sits at the point of the
	// call. The area is a native button, the same in every host: Shift+F10 goes to
	// the focused element, a button has its own role and name without
	// `tabindex`, and it is allowed in the menu's inline root (`span`) where a
	// `div` is not. It has no link to the menu (Enter does not open it), so its
	// attribute set is empty. The area reads the mode from the column's props:
	// the instance column has none, and there the menu opens over the button.
	// Items are markup (`menuItems`), unless they came as data (`items` from the
	// page's groups block): markup would replace the data, and the menu draws
	// groups from data
	menu: (bind, parts) =>
		h(Menu as Component, bind, {
			trigger: ({ triggerAria, triggerDataset }: TMenuTriggerScope) =>
				bind.openOn === 'contextmenu'
					? h(
							'button',
							{
								type: 'button',
								style: 'padding:24px 32px;border:1px dashed;border-radius:8px',
							},
							'Правая кнопка, долгое касание или Shift+F10',
						)
					: h(Button, { text: 'Действия', ...triggerAria, ...triggerDataset }),
			...(bind.items ? {} : { default: () => menuItems(parts) }),
		}),

	// The trigger is a Button; it takes the panel reference (`aria-describedby`)
	// from the slot scope. The tooltip text is a slot: there is no text prop
	tooltip: (bind) =>
		h(Tooltip as Component, bind, {
			trigger: ({ triggerAria }: TTooltipTriggerScope) =>
				h(Button, { text: 'Наведи', ...triggerAria }),
			default: () => 'Короткое пояснение к кнопке',
		}),

	// A button opens the dialog, which runs on local state (see `DialogPreview`)
	'alert-dialog': (bind) => h(AlertDialogPreview, bind),
	dialog: (bind) => h(DialogPreview, bind),

	// A button opens the drawer, which runs on local state (see `DrawerPreview`)
	drawer: (bind) => h(DrawerPreview, bind),

	// The manager wraps the buttons that show toasts: one per message type plus
	// the pending one (see `ToastsTrigger`)
	toasts: (bind) => h(Toasts as Component, bind, { default: () => h(ToastsTrigger) }),

	/**
	 * The scroller's content is plain markup: it has no collection and nothing
	 * to share. Each element is a direct child of the viewport: the theme puts
	 * snap points on them, and the plugin measures the edges.
	 *
	 * The wrapper bounds the width, the same trap as in the Tags preview: the
	 * cell stage is a flexbox, a flex item's automatic minimum is its content,
	 * and a scroller as wide as its content would overflow the column whole,
	 * leaving nothing to scroll.
	 */
	scroller: (bind) =>
		h('div', { style: 'width:100%' }, [
			h(Scroller as Component, bind, () =>
				ITEMS.map((item) =>
					h(
						'span',
						{ key: item.value, style: 'padding:4px 12px; white-space:nowrap' },
						`${item.text} пункт ленты`,
					),
				),
			),
		]),

	// Items in markup, unless they came as data (`items` from the page's groups
	// block): markup would replace the data, and the list draws groups from data
	'list-box': (bind, parts) =>
		h(
			ListBox as Component,
			bind,
			bind.items
				? undefined
				: () =>
						ITEMS.map((item) =>
							h(ListBox.Item, { key: item.value, ...item, ...parts.Item }),
						),
		),

	/**
	 * Pagination has no content: it puts the window's pages into the collection
	 * itself. The language of numbers and arrow names comes from the header.
	 */
	breadcrumbs: (bind) => h(Breadcrumbs as Component, { items: BREADCRUMBS_ITEMS, ...bind }),
	pagination: (bind) => h(Pagination as Component, bind),

	/**
	 * Rows and columns are data (`items`, `columns`): the table has no parts in
	 * markup, it draws the headers and rows itself.
	 *
	 * The wrapper bounds the width, as for the scroller: the table takes the full
	 * width of its place, but the cell stage is a flexbox, where the table would
	 * keep only its minimum. With a sticky head (`stickyHead`) the wrapper is also
	 * a 320 px scroll window with forty rows (`TABLE_SCROLL_ROWS`): with five rows
	 * there is no head for rows to pass under. The rows are preview data, not a
	 * row preset: the prop editor has no `items`. The table's window is on the
	 * Virtual page.
	 */
	table: (bind) =>
		h(
			'div',
			{ style: bind.stickyHead ? 'width:100%;height:320px;overflow:auto' : 'width:100%' },
			[
				h(Table as Component, {
					items: bind.stickyHead ? TABLE_SCROLL_ROWS : TABLE_ROWS,
					columns: TABLE_COLUMNS,
					...bind,
				}),
			],
		),

	tabs: (bind, parts) => h(Tabs as Component, bind, tabsSlots(parts)),

	/**
	 * The wrapper bounds the width: the row must match the cell exactly, or
	 * `overflow` does not apply at all.
	 *
	 * The width is explicit, `100%`. The cell stage (`.pg-col__stage`) is a
	 * flexbox, and a flex item's automatic minimum is its content: sized by its
	 * content, the row kept its 516px in a 214px column, the tags ran past the
	 * edge, and `scroll` showed no scrolling because there was nothing to scroll.
	 *
	 * Clipping is not the wrapper's job: the row scrolls in `scroll` and wraps in
	 * `wrap` (the theme base's `components/tags.css`).
	 *
	 * Guarded by `browser/tags-preview.spec.ts`, on the playground page itself.
	 */
	tags: (bind) =>
		h('div', { style: 'width:100%' }, [h(Tags as Component, { items: ITEMS, ...bind })]),

	accordion: (bind, parts) => h(Accordion as Component, bind, () => accordionItems(parts)),

	icon: (bind) => h(Icon, { tag: ARROW_DOWN, ...bind }),

	/**
	 * A horizontal bar gets its length from the container, having none of its
	 * own. The wrapper bounds the width, as for the scroller: the cell stage is a
	 * flexbox, where the bar would keep only its minimum. A vertical bar is an
	 * inline block of its own height, and the wrapper does not get in its way.
	 *
	 * By default the bar is empty: the fraction is zero, and running is the
	 * `indeterminate` flag.
	 */
	'progress-linear': (bind) => h('div', { style: 'width:100%' }, [h(ProgressLinear, bind)]),

	/**
	 * The ring is inline and of its own size: it needs no width wrapper. By
	 * default it is empty: the fraction is zero, and running is the
	 * `indeterminate` flag.
	 */
	'progress-spinner': (bind) => h(ProgressSpinner, bind),

	separator: (bind) =>
		h('div', { style: 'width:100%;height:120px;display:flex;align-items:center' }, [
			h(Separator, bind),
		]),
	skeleton: (bind) => h(Skeleton, bind),

	/**
	 * Reordering in three collections at once, over the same items: Tabs and
	 * Accordion with the same markup as on their pages, ListBox by data. An item
	 * moves within its own collection: the wrapper does not move items between
	 * collections.
	 *
	 * The row bounds the width, as for Virtual: the cell stage is a flexbox, and
	 * without the row the collections would keep only their minimum there. The
	 * tabs take the row's full width, the list and the sections sit below, side
	 * by side.
	 */
	'drag-and-drop': (bind) =>
		h(DragAndDrop as Component, bind, () =>
			h(
				'div',
				{
					style: 'display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; width:100%',
				},
				[
					h('div', { style: 'flex:1 1 100%; min-width:0' }, [
						h(Tabs as Component, null, tabsSlots()),
					]),
					h(ListBox as Component, { items: ITEMS, aria_label: 'Пункты' }),
					h('div', { style: 'flex:1; min-width:200px' }, [
						h(Accordion as Component, null, () => accordionItems()),
					]),
				],
			),
		),

	/**
	 * The window over three lists of a thousand items each: with five it is not
	 * visible. ListBox with a row limit scrolls itself, Select scrolls the list of
	 * its panel, Table sits in a 320 px wrapper. The `enabled` row turns the
	 * window on and off for all of them at once. Items are data (`items`): the
	 * window does not hide items placed in markup.
	 *
	 * The row bounds the width, as for the scroller: the cell stage is a flexbox,
	 * and without the row the table would keep only its minimum there. Select
	 * sits in a column of its own width: the field takes the full width of its
	 * place and would take the table's room in the row.
	 *
	 * Here the table drags a moved column whole, with the rows' cells
	 * (`reorderPreview: 'column'`): inside the window that is hundreds of cells,
	 * not thousands.
	 */
	virtual: (bind) =>
		h(Virtual as Component, bind, () =>
			h('div', { style: 'display:flex; gap:24px; align-items:flex-start; width:100%' }, [
				h(ListBox as Component, {
					items: COLLECTION_MANY_ITEMS,
					maxRows: 8,
					aria_label: 'Пункты',
				}),
				h('div', { style: 'flex:none; width:220px' }, [
					h(Select as Component, {
						items: COLLECTION_MANY_ITEMS,
						placeholder: 'Выберите',
					}),
				]),
				h('div', { style: 'flex:1; min-width:0; height:320px; overflow:auto' }, [
					h(Table as Component, {
						items: TABLE_MANY_ROWS,
						columns: TABLE_COLUMNS,
						reorderPreview: 'column',
						resizable: true,
						reorderable: true,
						aria_label: 'Сотрудники',
					}),
				]),
			]),
		),

	frame: (bind) =>
		h(ComponentView, bind, { default: () => 'Frame показывается на своей странице' }),

	'component-view': layer('ComponentView'),
	control: layer('Control'),
	stylable: layer('Stylable'),
	textable: layer('Textable'),
	interactive: layer('Interactive'),
	'value-control': layer('ValueControl'),
	'input-control': layer('InputControl'),
}

/**
 * A render function as a component, drawn by the host's root.
 *
 * Built once per mount, not on every render: a new function on every access
 * is a new component type, and Vue would recreate the subtree instead of
 * updating it, losing state and breaking animations. The parts' listeners
 * (`TPreview`) are the mount's, so the component closes over them.
 *
 * Props are not declared on purpose: everything passed lands in `attrs`, and
 * the preview gets the whole set, from `size` to `ctrl`.
 *
 * Without `inheritAttrs: false` Vue also hands a functional component's
 * listeners and class to its root: the wrapper (`Label` around CheckBox) got
 * the component's listeners, and the page journal showed the wrapper's events
 * and the native `input` bubbling to it as the component's.
 */
export function toComponent(render: TPreview, parts: TParts): Component {
	const component: FunctionalComponent = (_props, { attrs }) => render(attrs, parts)

	component.inheritAttrs = false

	return component
}
