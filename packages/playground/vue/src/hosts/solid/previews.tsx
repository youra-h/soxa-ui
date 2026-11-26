import { ALERT_SAMPLE } from '@soxa-ui/playground-shared'
import {
	BREADCRUMBS_ITEMS,
	EDITOR_ALIGNMENT_ITEMS,
	AVATAR_PEOPLE,
	editorAlignmentPath,
} from '@soxa-ui/playground-shared'
import {
	For,
	Show,
	createComputed,
	createMemo,
	createSignal,
	on,
	type Accessor,
	type JSX,
} from 'solid-js'
import type { TToastsItemType, TValuePayload } from '@soxa-ui/core'
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
import type {
	DescriptorSlots,
	MenuDescriptor,
	PopoverDescriptor,
	TooltipDescriptor,
} from '@soxa-ui/setup'
import {
	Accordion,
	Breadcrumbs,
	Button,
	ToggleButton,
	ToggleGroup,
	Calendar,
	CheckBox,
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
} from '@soxa-ui/solid'
import type { TParts } from './events'

/** Preview props: the row's props, `ctrl` with a core instance, the host's event callbacks. */
export type TPreviewProps = Record<string, unknown>

/**
 * How to draw a component on the stand — in Solid.
 *
 * The same map as the Vue, React and Svelte hosts', keyed by registry id:
 * content is not a prop, the metadata cannot give it, and markup is each
 * framework's own. The previews match Vue's, so the columns compare by eye.
 *
 * `bind` is a signal of props, spread through a call — `{...bind()}`: Solid
 * then hands the component the accessor itself (`mergeProps`), and the
 * component rereads the props on every change. A Solid component body runs
 * once, so a spread ready object would stay the first props forever. The props
 * are the row's in the first column, `ctrl` with a core instance in the
 * second, and the host's event callbacks in both. The component's own prop
 * values (a button's label, a field's placeholder) are data shared by all
 * hosts (`PREVIEW_PROPS`), which the shell puts in `bind`; the preview adds
 * only the wrapper and the content.
 *
 * `parts` holds the listeners of the parts the preview places in markup, by
 * part (`TComponentEntry.parts`); the preview spreads them on those parts.
 * Empty when the host listens to nothing.
 *
 * The layers and `frame` have no previews: in Vue they are ComponentView with
 * props it does not own, which Solid would put on the root as attributes.
 */
export type TPreview = (bind: Accessor<TPreviewProps>, parts: TParts) => JSX.Element

/** Scope of Popover's trigger slot — the binding to the panel and the pressed look. */
type TPopoverTriggerScope = DescriptorSlots<typeof PopoverDescriptor>['trigger']

/** Scope of Tooltip's trigger slot — the link to the panel. */
type TTooltipTriggerScope = DescriptorSlots<typeof TooltipDescriptor>['trigger']

/** Scope of Menu's trigger slot — the button's binding to the menu and its pressed look. */
type TMenuTriggerScope = DescriptorSlots<typeof MenuDescriptor>['trigger']

/** Collection content — from the shared manifest, as in Vue, React and Svelte. */
const ITEMS = COLLECTION_ITEMS

/** The Icon preview's glyph is a role's component: Icon's `tag` is its root, not a role. */
const ALERT_ICON = roleIcon('warning')
const ARROW_DOWN = roleIcon('arrowDown')

/**
 * Tabs in markup — for the Tabs and DragAndDrop previews, as are the panels
 * and the sections below. The first tab is active at once, otherwise no panel
 * would mount. These functions are called by an expression in the owner's
 * markup: Solid evaluates it where the owner unfolds the slot — inside the
 * owner's elevator layer — not in the preview body.
 */
const tabsItems = (parts: TParts = {}) => (
	<For each={ITEMS}>
		{(item, index) => <Tabs.Item active={index() === 0} {...item} {...parts.Item} />}
	</For>
)

/** Tab panels — in the `content` slot, outside the tab list. */
const tabsPanels = (parts: TParts = {}) => (
	<For each={ITEMS}>
		{(item) => (
			<Tabs.Content value={item.value} {...parts.Content}>
				<div style={{ padding: '12px' }}>Панель «{item.text}»</div>
			</Tabs.Content>
		)}
	</For>
)

/** Sections in markup, with content. */
const accordionItems = (parts: TParts = {}) => (
	<For each={ITEMS}>
		{(item) => (
			<Accordion.Item {...item} {...parts.Item}>
				<div style={{ padding: '4px 0' }}>Содержимое «{item.text}»</div>
			</Accordion.Item>
		)}
	</For>
)

/**
 * Menu items in markup, as in Vue: a labelled checkbox group, a radio group
 * with one item checked, actions with shortcut hints, a submenu with a submenu
 * inside, an item with a panel — a calendar mounted on the first open — a
 * disabled action and a "dangerous" item of its own variant.
 */
const menuItems = (parts: TParts) => (
	<>
		<Menu.Group label="Вид">
			<Menu.CheckboxItem value="grid" text="Сетка" selected {...parts.CheckboxItem} />
			<Menu.CheckboxItem value="ruler" text="Линейка" {...parts.CheckboxItem} />
		</Menu.Group>
		<Menu.Separator />
		<Menu.RadioGroup label="Сортировка" value="name">
			<Menu.RadioItem value="name" text="По имени" {...parts.RadioItem} />
			<Menu.RadioItem value="date" text="По дате" {...parts.RadioItem} />
		</Menu.RadioGroup>
		<Menu.Separator />
		<Menu.Item value="edit" text="Изменить" trailing="Ctrl+E" {...parts.Item} />
		<Menu.Item value="copy" text="Дублировать" trailing="Ctrl+D" {...parts.Item} />
		<Menu.Submenu value="share" text="Поделиться" {...parts.Submenu}>
			<Menu.Item value="link" text="Ссылка" {...parts.Item} />
			<Menu.Item value="mail" text="Почта" {...parts.Item} />
			<Menu.Submenu value="messengers" text="Мессенджеры" {...parts.Submenu}>
				<Menu.Item value="telegram" text="Telegram" {...parts.Item} />
				<Menu.Item value="whatsapp" text="WhatsApp" {...parts.Item} />
			</Menu.Submenu>
		</Menu.Submenu>
		<Menu.PopoverItem value="due" text="Срок" lazyMount {...parts.PopoverItem}>
			<Calendar />
		</Menu.PopoverItem>
		<Menu.Item value="archive" text="В архив" disabled {...parts.Item} />
		<Menu.Separator />
		<Menu.Item
			value="remove"
			text="Удалить"
			variant="negative"
			trailing="Del"
			{...parts.Item}
		/>
	</>
)

/**
 * The open state of the dialog and the drawer — the preview's own, like
 * `v-model:visible` in Vue and `useShown` in React (stand code, not a library
 * component). The button opens; the close button, Escape and the backdrop
 * close through `onChangeVisible`, which also carries a write to the
 * instance's `visible` in the second column. The `visible` row sets the state
 * from outside only when the row itself changes (its memo compares the value),
 * not on every change of the preview props. The page journal's
 * `onChangeVisible` from the props is called after ours, not replaced.
 */
function useShown(bind: Accessor<TPreviewProps>) {
	const row = createMemo(() => bind().visible === true)
	const [shown, setShown] = createSignal(row())

	createComputed(on(row, (value) => setShown(value), { defer: true }))

	return {
		shown,
		setShown: (value: boolean) => setShown(value),
		onChangeVisible: (payload: TValuePayload<boolean>) => {
			const value = payload.newValue
			setShown(value)

			const journal = bind().onChangeVisible

			if (typeof journal === 'function') journal(payload)
		},
	}
}

/**
 * The dialog on the stand is opened by a button: closed, it is hidden, and
 * open, it covers the page with a backdrop, so showing it at once would block
 * the rest of the page. The opening button comes first in the cell and the
 * cancel button sits in the footer: by them the stand's smoke check opens and
 * closes the column's dialog.
 */
function DialogPreview(props: { bind: Accessor<TPreviewProps> }): JSX.Element {
	const { shown, setShown, onChangeVisible } = useShown(props.bind)

	return (
		<>
			<Button text="Открыть окно" onClick={() => setShown(true)} />
			<Dialog
				{...props.bind()}
				visible={shown()}
				onChangeVisible={onChangeVisible}
				title="Настройки"
				footer={
					<>
						<Button text="Отмена" onClick={() => setShown(false)} />
						<Button text="Сохранить" onClick={() => setShown(false)} />
					</>
				}
			>
				<p style={{ margin: '0 0 8px' }}>Произвольное содержимое: текст, поля, кнопки</p>
				<Input placeholder="Имя" />
			</Dialog>
		</>
	)
}

function AlertDialogPreview(props: { bind: Accessor<TPreviewProps> }): JSX.Element {
	const { shown, setShown, onChangeVisible } = useShown(props.bind)

	return (
		<>
			<Button text="Открыть окно" onClick={() => setShown(true)} />
			<AlertDialog
				{...props.bind()}
				visible={shown()}
				onChangeVisible={onChangeVisible}
				title="Удалить запись?"
				action="Удалить"
			>
				<p>Удалённую запись нельзя будет восстановить.</p>
			</AlertDialog>
		</>
	)
}

/**
 * The drawer is opened by a button too — for the same reason as the dialog,
 * and on the same own state (`useShown`).
 *
 * The button and the drawer sit in a box with `position: relative`: with
 * `contained` the drawer is not teleported but placed in the nearest
 * positioned ancestor, so the `contained` row shows it in the preview's box,
 * not at the edge of the whole page.
 */
function DrawerPreview(props: { bind: Accessor<TPreviewProps> }): JSX.Element {
	const { shown, setShown, onChangeVisible } = useShown(props.bind)

	return (
		<div
			style={{
				position: 'relative',
				width: '100%',
				'min-height': '240px',
				overflow: 'hidden',
			}}
		>
			<Button text="Открыть панель" onClick={() => setShown(true)} />
			<Drawer
				{...props.bind()}
				visible={shown()}
				onChangeVisible={onChangeVisible}
				title="Фильтры"
				footer={
					<>
						<Button text="Сбросить" onClick={() => setShown(false)} />
						<Button text="Применить" onClick={() => setShown(false)} />
					</>
				}
			>
				<p style={{ margin: '0 0 8px' }}>Произвольное содержимое: текст, поля, кнопки</p>
				<Input placeholder="Поиск" />
			</Drawer>
		</div>
	)
}

/** The toast's own content — an undo button: it gets the toast as a prop and closes it. */
const ToastUndo: TToastRender = (props) => (
	<Button text="Отменить" onClick={() => props.toast.close()} />
)

/**
 * Toasts come from code, not markup: buttons inside the manager show them
 * through `useToasts()`. The messages are the stand's samples shared by all
 * hosts (`toastSample`), with this host's undo button as their own content.
 * Each text starts with a number, so the stack shows which toast is which.
 *
 * One button for a plain message and one per type (`TOASTS_ITEM_TYPES`), each
 * toast with its type's icon. The last is a pending toast: "Saving…" with a
 * spinner stays open and a couple of seconds later turns into a success. The
 * row wraps: six buttons do not fit one line of a showcase cell.
 */
function ToastsTrigger(): JSX.Element {
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

	return (
		<div style={{ display: 'flex', 'flex-wrap': 'wrap', gap: '8px' }}>
			<Button text="обычное" onClick={() => notify()} />
			<For each={TOASTS_ITEM_TYPES}>
				{(type) => <Button text={type} onClick={() => notify(type)} />}
			</For>
			<Button text="загрузка → готово" onClick={save} />
		</div>
	)
}

export const PREVIEWS: Record<string, TPreview> = {
	// The label is the `text` prop from the preview props, not a slot: a given
	// slot overrides the prop, and the `text` row would change nothing visible
	button: (bind) => <Button {...bind()} />,
	'toggle-button': (bind) => <ToggleButton {...bind()} />,
	'toggle-group': (bind) => (
		<ToggleGroup
			items={EDITOR_ALIGNMENT_ITEMS}
			{...bind()}
			item-leading={({ item }) => (
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width={1.5}
					stroke-linecap="round"
					aria-hidden="true"
				>
					<path d={editorAlignmentPath(item.text)} />
				</svg>
			)}
		/>
	),

	input: (bind) => <Input {...bind()} />,
	'number-input': (bind) => <NumberInput {...bind()} />,

	textarea: (bind) => <Textarea {...bind()} />,

	// A checkbox and a switch have no text, both are bare controls: the label
	// comes from the Label wrapper. The preview sets its props, the page rows
	// edit the control
	'check-box': (bind) => (
		<Label text="Согласен">
			<CheckBox {...bind()} />
		</Label>
	),

	switch: (bind) => (
		<Label text="Включено">
			<Switch {...bind()} />
		</Label>
	),

	// The label is the `text` prop from the preview props, the control is the
	// slot. The page rows edit the label itself: its side, text size, variant
	alert: (bind) => (
		<Alert
			{...bind()}
			icon={<Icon tag={ALERT_ICON} />}
			title={ALERT_SAMPLE.title}
			action={<Button type="button">{ALERT_SAMPLE.action}</Button>}
		>
			{ALERT_SAMPLE.message}
		</Alert>
	),
	'file-upload': (bind) => <FileUpload {...bind()} />,
	'code-block': (bind) => <CodeBlock {...bind()} />,
	badge: (bind) => <Badge {...bind()} />,
	avatar: (bind) => <Avatar {...bind()} />,
	'avatar-group': (bind) => (
		<AvatarGroup {...bind()}>
			{AVATAR_PEOPLE.map((person) => (
				<Avatar {...person} />
			))}
		</AvatarGroup>
	),
	label: (bind) => (
		<Label {...bind()}>
			<CheckBox />
		</Label>
	),

	// A form field around Input: the parts' texts are preview props, the
	// control is the content. The page rows edit the field itself: the label's
	// side, the texts, the error
	field: (bind) => (
		<Field {...bind()}>
			<Input placeholder="name@example.com" />
		</Field>
	),

	// A slider has no name, like a checkbox: the visible one is a Label above
	// it. A horizontal slider stretches to the label's width, a vertical one
	// keeps its own height
	slider: (bind) => (
		<Label text="Громкость" position="top">
			<Slider {...bind()} />
		</Label>
	),

	// A rating has no name, like a slider: the visible one is a Label above the stars
	rating: (bind) => (
		<Label text="Оценка" position="top">
			<Rating {...bind()} />
		</Label>
	),

	// The label is the content: a radio has no text, it is a bare control, like CheckBox
	'radio-group': (bind, parts) => (
		<RadioGroup {...bind()}>
			<For each={ITEMS}>
				{(item) => (
					<RadioGroup.Item value={item.value} {...parts.Item}>
						{item.text}
					</RadioGroup.Item>
				)}
			</For>
		</RadioGroup>
	),

	// Items in markup, unless they come as data (`items` from the page's groups
	// block): markup would replace the data, and the list draws groups from data
	'list-box': (bind, parts) => (
		<ListBox {...bind()}>
			{bind().items ? undefined : (
				<For each={ITEMS}>{(item) => <ListBox.Item {...item} {...parts.Item} />}</For>
			)}
		</ListBox>
	),

	// Options in markup, unless they come as data (`items` from the page's groups
	// block), as for the list. The options sit in the teleported panel and are
	// built when the portal reads its content
	select: (bind) => (
		<Select {...bind()}>
			{bind().items ? undefined : (
				<For each={ITEMS}>{(item) => <Select.Item {...item} />}</For>
			)}
		</Select>
	),

	// A calendar has no content: its month-grid view puts the days into the
	// collection. The preview sets no language: it is the locale of the
	// provider around the host's root — the header's language picker (the
	// host's `setLocale`)
	calendar: (bind) => <Calendar {...bind()} />,

	// The language comes from the stand's header, as for the calendar
	'date-input': (bind) => <DateInput {...bind()} />,

	// The field and the calendar are DatePicker's own instances, it has no
	// content. The language comes from the header, as for the field and the
	// calendar
	'date-picker': (bind) => <DatePicker {...bind()} />,

	// The wrapper bounds the width, as in Vue: the cell's stage is a flexbox, and
	// a row as wide as its tags would run past the column's edge, so `overflow`
	// would never apply — `scroll` would have nothing to scroll. The tags are
	// data (`items`), with the row's props on top
	tags: (bind) => (
		<div style={{ width: '100%' }}>
			<Tags items={ITEMS} {...bind()} />
		</div>
	),

	// Pagination has no content: it puts the window's pages into its collection
	// itself. The language of the numbers and the arrows' names comes from the
	// header
	breadcrumbs: (bind) => <Breadcrumbs items={BREADCRUMBS_ITEMS} {...bind()} />,
	pagination: (bind) => <Pagination {...bind()} />,

	// The trigger is a Button: it takes the binding to the panel and the pressed
	// look from the slot scope and reads it in markup — the binding changes on
	// open, while the trigger stays the same node, with the focus on it. The
	// content has a button, which takes the focus on open
	popover: (bind) => (
		<Popover
			{...bind()}
			trigger={(scope: TPopoverTriggerScope) => (
				<Button text="Открыть" {...scope.triggerAria} {...scope.triggerDataset} />
			)}
		>
			<p style={{ margin: '0 0 8px' }}>Произвольное содержимое: текст, поля, кнопки</p>
			<Button text="Действие" />
		</Popover>
	),

	// The trigger is a Button: it takes the link to the panel
	// (`aria-describedby`) from the slot scope, also in markup. The tooltip's
	// text is the slot: it has no text prop
	tooltip: (bind) => (
		<Tooltip
			{...bind()}
			trigger={(scope: TTooltipTriggerScope) => (
				<Button text="Наведи" {...scope.triggerAria} />
			)}
		>
			Короткое пояснение к кнопке
		</Tooltip>
	),

	// A button opens the dialog, which runs on its own state (see `DialogPreview`)
	'alert-dialog': (bind) => <AlertDialogPreview bind={bind} />,
	dialog: (bind) => <DialogPreview bind={bind} />,

	// A button opens the drawer, which runs on its own state (see `DrawerPreview`)
	drawer: (bind) => <DrawerPreview bind={bind} />,

	// The manager wraps the buttons that show toasts (see `ToastsTrigger`). The
	// toast region is teleported to the window's edge, outside the preview cell
	toasts: (bind) => (
		<Toasts {...bind()}>
			<ToastsTrigger />
		</Toasts>
	),

	// The trigger is a Button that reads the menu binding and the pressed look
	// from the slot scope in markup, as for Popover. With
	// `openOn: 'contextmenu'` the slot holds an area instead, like a "file" in
	// an app: right click, long press or Shift+F10 over it opens the menu at
	// that point. The area is a native button, as in Vue: focusable for
	// Shift+F10, with its own role and name, unbound from the menu. The mode
	// comes from the column's props: the instance column has none and opens the
	// menu over the button. `Show` in the slot's markup picks the branch, not a
	// condition in the slot function: the function body would read the props
	// once, at the call, and any row change would draw the trigger anew. Items
	// in markup, unless they come as data (`items` from the groups block), as
	// for the list
	menu: (bind, parts) => (
		<Menu
			{...bind()}
			trigger={(scope: TMenuTriggerScope) => (
				<Show
					when={bind().openOn === 'contextmenu'}
					fallback={
						<Button text="Действия" {...scope.triggerAria} {...scope.triggerDataset} />
					}
				>
					<button
						type="button"
						style={{
							padding: '24px 32px',
							border: '1px dashed',
							'border-radius': '8px',
						}}
					>
						Правая кнопка, долгое касание или Shift+F10
					</button>
				</Show>
			)}
		>
			{bind().items ? undefined : menuItems(parts)}
		</Menu>
	),

	// The scroller's content is plain markup: each item is a direct child of the
	// viewport, the theme puts snap points on them, and the plugin measures the
	// edges. The wrapper bounds the width: the cell's stage is a flexbox, and a
	// scroller as wide as its content would overflow the column, with nothing
	// left to scroll
	scroller: (bind) => (
		<div style={{ width: '100%' }}>
			<Scroller {...bind()}>
				<For each={ITEMS}>
					{(item) => (
						<span style={{ padding: '4px 12px', 'white-space': 'nowrap' }}>
							{item.text} пункт ленты
						</span>
					)}
				</For>
			</Scroller>
		</div>
	),

	// Rows and columns are data, as in Vue and React: a table has no parts in
	// markup. The wrapper bounds the width, and with a sticky head it is also a
	// 320 px high scroll box over forty rows. The table's virtual window is on
	// the Virtual page. The style is an object with CSS property names, as Solid
	// sets it
	table: (bind) => (
		<div
			style={
				bind().stickyHead
					? { width: '100%', height: '320px', overflow: 'auto' }
					: { width: '100%' }
			}
		>
			<Table
				items={bind().stickyHead ? TABLE_SCROLL_ROWS : TABLE_ROWS}
				columns={TABLE_COLUMNS}
				{...bind()}
			/>
		</div>
	),

	tabs: (bind, parts) => (
		<Tabs {...bind()} content={tabsPanels(parts)}>
			{tabsItems(parts)}
		</Tabs>
	),

	accordion: (bind, parts) => <Accordion {...bind()}>{accordionItems(parts)}</Accordion>,

	icon: (bind) => <Icon tag={ARROW_DOWN} {...bind()} />,

	// A horizontal bar gets its length from the container, it has none of its
	// own. The wrapper bounds the width, as for the scroller; a vertical bar is
	// an inline block of its own height, and the wrapper does not get in its way.
	// By default the bar is empty: the fraction is zero, and the running look is
	// the `indeterminate` flag
	'progress-linear': (bind) => (
		<div style={{ width: '100%' }}>
			<ProgressLinear {...bind()} />
		</div>
	),

	// The ring is inline and of its own size. By default it is empty: the
	// fraction is zero, and the running look is the `indeterminate` flag
	'progress-spinner': (bind) => <ProgressSpinner {...bind()} />,

	separator: (bind) => (
		<div style={{ width: '100%', height: '120px', display: 'flex', 'align-items': 'center' }}>
			<Separator {...bind()} />
		</div>
	),
	skeleton: (bind) => <Skeleton {...bind()} />,

	// Reordering in three collections at once, on one set of items: Tabs and
	// Accordion in the same markup as on their pages, ListBox as data, as in Vue
	// and React. An item moves within its own collection: the wrapper does not
	// move items between collections. The row bounds the width, as on the
	// Virtual page: the tabs take the full row, the list and the sections sit
	// below, side by side
	'drag-and-drop': (bind) => (
		<DragAndDrop {...bind()}>
			<div
				style={{
					display: 'flex',
					'flex-wrap': 'wrap',
					gap: '24px',
					'align-items': 'flex-start',
					width: '100%',
				}}
			>
				<div style={{ flex: '1 1 100%', 'min-width': '0' }}>
					<Tabs content={tabsPanels()}>{tabsItems()}</Tabs>
				</div>
				<ListBox items={ITEMS} aria_label="Пункты" />
				<div style={{ flex: '1', 'min-width': '200px' }}>
					<Accordion>{accordionItems()}</Accordion>
				</div>
			</div>
		</DragAndDrop>
	),

	// The window over three lists of a thousand items (five would not show it):
	// ListBox with a row limit scrolls itself, Select scrolls its panel's list,
	// the table scrolls in a 320 px wrapper; the `enabled` row toggles the window
	// for all. Items are data (`items`): the window does not hide items in
	// markup. The row bounds the width, as in Vue and Svelte; Select gets a
	// fixed-width column, or its full-width field would take the table's place.
	// A moved column is dragged whole, with its cells
	// (`reorderPreview: 'column'`): in the window that is hundreds of cells, not
	// thousands
	virtual: (bind) => (
		<Virtual {...bind()}>
			<div
				style={{ display: 'flex', gap: '24px', 'align-items': 'flex-start', width: '100%' }}
			>
				<ListBox items={COLLECTION_MANY_ITEMS} maxRows={8} aria_label="Пункты" />
				<div style={{ flex: 'none', width: '220px' }}>
					<Select items={COLLECTION_MANY_ITEMS} placeholder="Выберите" />
				</div>
				<div style={{ flex: '1', 'min-width': '0', height: '320px', overflow: 'auto' }}>
					<Table
						items={TABLE_MANY_ROWS}
						columns={TABLE_COLUMNS}
						reorderPreview="column"
						resizable
						reorderable
						aria_label="Сотрудники"
					/>
				</div>
			</div>
		</Virtual>
	),
}
