import { ALERT_SAMPLE } from '@soxa-ui/playground-shared'
import {
	BREADCRUMBS_ITEMS,
	EDITOR_ALIGNMENT_ITEMS,
	AVATAR_PEOPLE,
	editorAlignmentPath,
} from '@soxa-ui/playground-shared'
import type { TToastsItemType } from '@soxa-ui/core'
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
import { toastsOf, type TToastRender } from '@soxa-ui/webc'

/**
 * How to draw a component on the playground, in Web Components.
 *
 * The same map as the Vue host's (`hosts/vue/previews.ts`), with the same
 * keys, the registry ids. The platform has no markup: the host's code builds
 * the element (`document.createElement(tag, { is })`), so a preview is not a
 * function with markup but a description of the element: the native tag, the
 * soxa element name, the element's own attributes, children by slot and a
 * wrapper. The previews are the same as in Vue and React, so the framework
 * columns can be compared by eye.
 *
 * The description holds no prop values of the preview's component: a
 * button's label or a field's placeholder are data, the same for every host
 * (`PREVIEW_PROPS` in the shared package), and the shell gives them to the
 * component together with the row's props. The wrapper and the children have
 * description props of their own; the component only what the preview itself
 * draws, as in the other hosts: the table's rows and columns.
 *
 * A component missing from the map is not shown by this host.
 */
export type TPreview = {
	/** The element's native tag: a soxa element is a customized built-in of its tag. */
	readonly tag: string
	/**
	 * The soxa element name: the `is` value. Missing: either the element is
	 * autonomous and its name is the tag itself (`<so-virtual>`,
	 * `<so-drag-and-drop>`), or it is not a soxa element at all: the table's
	 * width wrapper, the DragAndDrop preview row and its cells.
	 */
	readonly is?: string
	/**
	 * Description props, of the wrapper and children; for the preview's component
	 * only the data the preview itself draws (the table's rows and columns): the
	 * shell gives its prop values (`PREVIEW_PROPS`). A function derives props from
	 * the component's row props: a table with a sticky head gets a long row list.
	 */
	readonly props?: TPreviewProps | ((bind: TPreviewProps) => TPreviewProps)
	/**
	 * Style of an element without a component. For a wrapper it follows the
	 * component's row props (the table's width bound, with a sticky head also a
	 * scroll window), and a row props change rewrites it. For a child in a slot
	 * (the DragAndDrop preview row and its cells) there are no row props, and the
	 * style is written once, when built.
	 */
	readonly style?: (bind: TPreviewProps) => string
	/**
	 * The element's own attributes: not core props but what the element reads
	 * itself, such as the icon role (`icon`). Named like the element property;
	 * the attribute is the same name hyphenated, as for props. They are part of
	 * what the element draws: the column code always writes them, and without a
	 * role the icon is empty.
	 */
	readonly attributes?: Readonly<Record<string, string>>
	/**
	 * Children by slot, the element's light DOM: slot name → soxa elements and
	 * markup without a component. The host's code puts them into the element
	 * before insertion, elements with a `slot` attribute except for the default
	 * slot. A function derives children from the component's row props: a list
	 * whose items came as data (`items` from the page's groups block) is drawn
	 * without markup items, which would replace the data. Children are placed
	 * before insertion, and a props change does not rebuild them.
	 */
	readonly slots?:
		| Readonly<Record<string, readonly TContent[]>>
		| ((bind: TPreviewProps) => Readonly<Record<string, readonly TContent[]>>)
	/**
	 * Row props the children depend on (`slots` as a function): changing them
	 * rebuilds the element, like a `ctrl` change, since children are placed
	 * before insertion and the base has already distributed the assembled
	 * element's light DOM. This is how Menu's context mode (`openOn`) swaps the
	 * trigger for an area, as the Vue markup does.
	 */
	readonly rebuild?: readonly string[]
	/**
	 * An element around the component, as in Vue and React: for CheckBox,
	 * Switch, Slider and Rating a Label, a soxa element with its own props and
	 * the component in its default slot; for Table, Tags, ProgressLinear and
	 * Scroller a width bound, a styled `div` (the table's follows the row props);
	 * for Drawer its container box, for Dialog a box-less `div`. The row props,
	 * `ctrl` and the listeners go to the component; the wrapper's props come from
	 * the description. The column code does not show the wrapper: it is about the
	 * component.
	 */
	readonly wrapper?: TPreview
	/**
	 * Label of the button that opens the component: on the playground a button
	 * opens Dialog and Drawer, as in Vue, since closed they are hidden and open
	 * they cover the page with a backdrop. The Button goes into the wrapper before
	 * the component, and a press writes `visible = true` to the component, as the
	 * Vue preview's button writes its `v-model:visible` state. Without a wrapper
	 * the button has no place: the preview root is a single node.
	 */
	readonly opener?: string
	/**
	 * The part this element is in the component's markup, by its name in the
	 * registry (`TComponentEntry.parts`): `Item` for `<div is="so-tabs-item">`.
	 * The host puts the part's listeners on it before insertion, as the
	 * component's own on the component (`partsOf`).
	 */
	readonly part?: string
}

/** The element's props, set as properties by name. */
export type TPreviewProps = Readonly<Record<string, unknown>>

/**
 * A child in a slot: a soxa element with its own description (a collection
 * part, a label's control) or markup without a component (text, a padded
 * block). Markup is built by a function, so each render has its own nodes.
 */
export type TContent = TPreview | (() => Node)

/** Text in a slot: a radio's label. */
const text = (value: string) => (): Node => document.createTextNode(value)

/** A padded content block: a tab panel or a section's content, as in the other hosts. */
const block = (padding: string, value: string) => (): Node => {
	const node = document.createElement('div')

	node.style.padding = padding
	node.textContent = value

	return node
}

/**
 * A scroller element, as in Vue: a padded inline block without text wrapping.
 * Each is a direct child of the viewport: the theme puts snap points on them,
 * and the plugin measures the edges.
 */
const strip = (value: string) => (): Node => {
	const node = document.createElement('span')

	node.style.cssText = 'padding:4px 12px; white-space:nowrap'
	node.textContent = value

	return node
}

/** A paragraph of panel content, as in Vue: with a gap to the button below it. */
const paragraph = (value: string) => (): Node => {
	const node = document.createElement('p')

	node.style.margin = '0 0 8px'
	node.textContent = value

	return node
}

/** A labelled button in a slot: the popover and tooltip trigger, a button in a panel. */
const button = (text: string): TPreview => ({ tag: 'button', is: 'so-button', props: { text } })

/**
 * An inline caption in a named slot: the title of Dialog and Drawer, or a
 * menu item's shortcut. Bare text carries no `slot` attribute and would land
 * in the default slot.
 */
const caption = (value: string) => (): Node => {
	const node = document.createElement('span')

	node.textContent = value

	return node
}

/** A field with a placeholder, in the body of Dialog and Drawer, as in Vue. */
const field = (placeholder: string): TPreview => ({
	tag: 'div',
	is: 'so-input',
	props: { placeholder },
})

/**
 * A footer button of Dialog and Drawer, as in Vue: a press closes them by
 * writing `visible = false`. The button finds its panel by position, the
 * nearest ancestor with the panel's class: a dialog moved into its target
 * still holds the button inside.
 */
const closing = (text: string) => (): Node => {
	const node = soxa('button', 'so-button', { text })

	node.addEventListener('click', () => {
		const panel = node.closest('.so-dialog, .so-drawer')

		if (panel) Reflect.set(panel, 'visible', false)
	})

	return node
}

/** Custom toast content, an Undo button: it gets the toast as a parameter and closes it. */
const undo: TToastRender = (toast) => {
	const node = soxa('button', 'so-button', { text: 'Отменить' })

	node.addEventListener('click', () => toast.close())

	return node
}

/**
 * Toasts come from code, not markup: buttons inside the manager take the API
 * from their place (`toastsOf`) and show a toast, as the Vue preview's buttons
 * use `useToasts()`. The manager wraps them as it wraps an app, and the toast
 * region moves to the window edge, outside the preview cell.
 *
 * One button per plain message and per type (`TOASTS_ITEM_TYPES`). What a
 * toast says comes from the playground samples, the same for every host
 * (`toastSample`); this host's custom content for them is the Undo button.
 * The text starts with a number, so the stack shows which toast is where. The
 * last button is a pending one: "Saving…" with a ring in place of the icon
 * does not close by itself, and a couple of seconds later the same toast
 * reports success. The row wraps, as in Vue. Each render of the row numbers
 * from its own counter.
 */
const toastsTrigger = (): Node => {
	const row = document.createElement('div')
	let count = 0

	row.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px'

	const notify = (node: Element, type?: TToastsItemType) => {
		const sample = toastSample(type, undo)

		count += 1
		toastsOf(node).show({ ...sample, text: `${count}. ${sample.text}`, type })
	}

	// While the work runs the toast waits; when it ends the same toast reports the result
	const save = (node: Element) => {
		count += 1

		const toast = toastsOf(node).show({ text: `${count}. Сохраняем…`, loading: true })
		const done = `${count}. Сохранено`

		setTimeout(() => {
			if (!toast) return

			toast.loading = false
			toast.type = 'success'
			toast.text = done
		}, TOAST_SAVING)
	}

	const action = (text: string, act: (node: Element) => void): Node => {
		const node = soxa('button', 'so-button', { text })

		node.addEventListener('click', () => act(node))

		return node
	}

	row.append(
		action('обычное', (node) => notify(node)),
		...TOASTS_ITEM_TYPES.map((type) => action(type, (node) => notify(node, type))),
		action('загрузка → готово', save),
	)

	return row
}

/**
 * A width bound, as in Vue: the cell stage is a flexbox, where a bar or a
 * scroller would keep only its minimum, and a scroller as wide as its content
 * would overflow the column whole, leaving nothing to scroll.
 */
const FULL_WIDTH: TPreview = { tag: 'div', style: () => 'width:100%' }

/** Collection content from the shared manifest, as in Vue and React. */
const ITEMS = COLLECTION_ITEMS

/**
 * The context menu area, like a consumer's "file", as in Vue: the menu opens
 * over it by right click, long press and Shift+F10, and the panel sits at the
 * point of the call. The area is a native button, as in Vue: focusable for
 * Shift+F10, with its own role and name, and no link to the menu.
 */
const contextArea = (): Node => {
	const node = document.createElement('button')

	node.type = 'button'
	node.style.cssText = 'padding:24px 32px; border:1px dashed; border-radius:8px'
	node.textContent = 'Правая кнопка, долгое касание или Shift+F10'

	return node
}

/**
 * The menu's parts by element name, mapped to their registry names; groups
 * and separators are not listened to.
 */
const MENU_PARTS: Readonly<Record<string, string>> = {
	'so-menu-item': 'Item',
	'so-menu-checkbox-item': 'CheckboxItem',
	'so-menu-radio-item': 'RadioItem',
	'so-menu-submenu': 'Submenu',
	'so-menu-popover-item': 'PopoverItem',
}

/** A menu item in markup: the part's element with its props and children by slot. */
const menuPart = (
	is: string,
	props: TPreviewProps = {},
	slots: Readonly<Record<string, readonly TContent[]>> = {},
): TPreview => ({ tag: 'div', is, props, slots, part: MENU_PARTS[is] })

/**
 * Menu items in markup, as in Vue: a labelled group of checkboxes, a group of
 * radios with one checked, actions with shortcut hints in the `trailing` slot,
 * a submenu with a submenu inside, an item with a panel (a calendar mounted on
 * first open), a disabled action and a "dangerous" item with its own variant.
 */
const MENU_ITEMS: readonly TContent[] = [
	menuPart(
		'so-menu-group',
		{ label: 'Вид' },
		{
			default: [
				menuPart('so-menu-checkbox-item', { value: 'grid', text: 'Сетка', selected: true }),
				menuPart('so-menu-checkbox-item', { value: 'ruler', text: 'Линейка' }),
			],
		},
	),
	menuPart('so-menu-separator'),
	menuPart(
		'so-menu-radio-group',
		{ label: 'Сортировка', value: 'name' },
		{
			default: [
				menuPart('so-menu-radio-item', { value: 'name', text: 'По имени' }),
				menuPart('so-menu-radio-item', { value: 'date', text: 'По дате' }),
			],
		},
	),
	menuPart('so-menu-separator'),
	menuPart(
		'so-menu-item',
		{ value: 'edit', text: 'Изменить' },
		{ trailing: [caption('Ctrl+E')] },
	),
	menuPart(
		'so-menu-item',
		{ value: 'copy', text: 'Дублировать' },
		{ trailing: [caption('Ctrl+D')] },
	),
	menuPart(
		'so-menu-submenu',
		{ value: 'share', text: 'Поделиться' },
		{
			default: [
				menuPart('so-menu-item', { value: 'link', text: 'Ссылка' }),
				menuPart('so-menu-item', { value: 'mail', text: 'Почта' }),
				menuPart(
					'so-menu-submenu',
					{ value: 'messengers', text: 'Мессенджеры' },
					{
						default: [
							menuPart('so-menu-item', { value: 'telegram', text: 'Telegram' }),
							menuPart('so-menu-item', { value: 'whatsapp', text: 'WhatsApp' }),
						],
					},
				),
			],
		},
	),
	menuPart(
		'so-menu-popover-item',
		{ value: 'due', text: 'Срок', lazyMount: true },
		{ default: [{ tag: 'div', is: 'so-calendar' }] },
	),
	menuPart('so-menu-item', { value: 'archive', text: 'В архив', disabled: true }),
	menuPart('so-menu-separator'),
	menuPart(
		'so-menu-item',
		{ value: 'remove', text: 'Удалить', variant: 'negative' },
		{
			trailing: [caption('Del')],
		},
	),
]

/**
 * A soxa element inside markup without a component, built in code as a
 * consumer builds it: props as properties before insertion.
 */
function soxa(tag: string, is: string, props: TPreviewProps): HTMLElement {
	const element = document.createElement(tag, { is })

	for (const [name, value] of Object.entries(props)) Reflect.set(element, name, value)

	return element
}

/**
 * The Virtual window's content, as in Vue and React: a list with a row limit
 * that scrolls itself, a Select whose panel list scrolls, and a table in a
 * 320 px wrapper, a thousand items each, since with five the window is not
 * visible. Items are data: the window does not hide items placed in markup.
 * The row bounds the width; Select sits in a column of its own width, since
 * its field takes the full width and would take the table's room in the row.
 * The table drags a moved column whole, with the rows' cells
 * (`reorderPreview: 'column'`): inside the window that is hundreds of cells,
 * not thousands.
 */
const windowed = (): Node => {
	const row = document.createElement('div')
	const column = document.createElement('div')
	const frame = document.createElement('div')

	row.style.cssText = 'display:flex; gap:24px; align-items:flex-start; width:100%'
	column.style.cssText = 'flex:none; width:220px'
	column.appendChild(
		soxa('div', 'so-select', { items: COLLECTION_MANY_ITEMS, placeholder: 'Выберите' }),
	)
	frame.style.cssText = 'flex:1; min-width:0; height:320px; overflow:auto'
	frame.appendChild(
		soxa('div', 'so-table', {
			items: TABLE_MANY_ROWS,
			columns: TABLE_COLUMNS,
			reorderPreview: 'column',
			resizable: true,
			reorderable: true,
			aria_label: 'Сотрудники',
		}),
	)
	row.append(
		soxa('div', 'so-list-box', {
			items: COLLECTION_MANY_ITEMS,
			maxRows: 8,
			aria_label: 'Пункты',
		}),
		column,
		frame,
	)

	return row
}

/**
 * Tabs and their panels as a description, for the Tabs and DragAndDrop
 * previews. The first tab is active at once, otherwise no panel shows. The
 * panels go to the `content` slot, outside the tab list.
 */
const TABS: TPreview = {
	tag: 'div',
	is: 'so-tabs',
	slots: {
		default: ITEMS.map((item, index) => ({
			tag: 'div',
			is: 'so-tabs-item',
			props: { active: index === 0, ...item },
			part: 'Item',
		})),
		content: ITEMS.map((item) => ({
			tag: 'div',
			is: 'so-tabs-content',
			props: { value: item.value },
			part: 'Content',
			slots: { default: [block('12px', `Панель «${item.text}»`)] },
		})),
	},
}

/** Sections with content as a description, for the Accordion and DragAndDrop previews. */
const ACCORDION: TPreview = {
	tag: 'div',
	is: 'so-accordion',
	slots: {
		default: ITEMS.map((item) => ({
			tag: 'div',
			is: 'so-accordion-item',
			props: { ...item },
			part: 'Item',
			slots: { default: [block('4px 0', `Содержимое «${item.text}»`)] },
		})),
	},
}

/**
 * The DragAndDrop preview row, as in Vue and React: Tabs and Accordion with
 * the same descriptions as on their pages, ListBox by data. The row and its
 * cells are styled markup without a component: the row bounds the width, as
 * for Virtual; the tabs take the row's full width, the list and the sections
 * sit below, side by side.
 */
const REORDERABLE: TPreview = {
	tag: 'div',
	style: () => 'display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; width:100%',
	slots: {
		default: [
			{ tag: 'div', style: () => 'flex:1 1 100%; min-width:0', slots: { default: [TABS] } },
			{ tag: 'div', is: 'so-list-box', props: { items: ITEMS, aria_label: 'Пункты' } },
			{ tag: 'div', style: () => 'flex:1; min-width:200px', slots: { default: [ACCORDION] } },
		],
	},
}

export const PREVIEWS: Record<string, TPreview> = {
	// The label is the `text` prop from the preview props, not content: a given
	// slot overrides the prop, and the `text` row would change nothing visible
	button: { tag: 'button', is: 'so-button' },
	'toggle-button': { tag: 'button', is: 'so-toggle-button' },
	'toggle-group': {
		tag: 'div',
		is: 'so-toggle-group',
		rebuild: ['items'],
		slots: (bind): Readonly<Record<string, readonly TContent[]>> =>
			bind.items
				? {}
				: {
						default: EDITOR_ALIGNMENT_ITEMS.map((item) => ({
							tag: 'button',
							is: 'so-toggle-group-item',
							props: { ...item },
							part: 'Item',
							slots: {
								leading: [
									() => {
										const svg = document.createElementNS(
											'http://www.w3.org/2000/svg',
											'svg',
										)
										for (const [name, value] of Object.entries({
											width: '16',
											height: '16',
											viewBox: '0 0 24 24',
											fill: 'none',
											stroke: 'currentColor',
											'stroke-width': '1.5',
											'stroke-linecap': 'round',
											'aria-hidden': 'true',
										}))
											svg.setAttribute(name, value)
										const path = document.createElementNS(
											'http://www.w3.org/2000/svg',
											'path',
										)
										path.setAttribute('d', editorAlignmentPath(item.text))
										svg.append(path)
										return svg
									},
								],
							},
						})),
					},
	},

	input: { tag: 'div', is: 'so-input' },
	'number-input': { tag: 'div', is: 'so-number-input' },

	textarea: { tag: 'div', is: 'so-textarea' },

	// A checkbox and a switch have no text, both are bare controls: the Label
	// wrapper gives the label. The preview sets its props; the page rows edit the
	// control
	'check-box': {
		tag: 'span',
		is: 'so-check-box',
		wrapper: { tag: 'label', is: 'so-label', props: { text: 'Согласен' } },
	},

	switch: {
		tag: 'span',
		is: 'so-switch',
		wrapper: { tag: 'label', is: 'so-label', props: { text: 'Включено' } },
	},

	// A slider has no name, like a checkbox: the visible one comes from a Label
	// above it. A horizontal slider stretches to the label's width, a vertical one
	// keeps its own height
	slider: {
		tag: 'span',
		is: 'so-slider',
		wrapper: { tag: 'label', is: 'so-label', props: { text: 'Громкость', position: 'top' } },
	},

	// A rating has no name, like a slider: the visible one comes from a Label above the stars
	rating: {
		tag: 'span',
		is: 'so-rating',
		wrapper: { tag: 'label', is: 'so-label', props: { text: 'Оценка', position: 'top' } },
	},

	// The text is the `text` prop from the preview props, the control a slot. The
	// page rows edit the label itself: side, text size, variant
	alert: {
		tag: 'div',
		is: 'so-alert',
		slots: {
			title: [caption(ALERT_SAMPLE.title)],
			default: [text(ALERT_SAMPLE.message)],
			icon: [{ tag: 'span', is: 'so-icon', attributes: { icon: 'warning' } }],
			action: [
				{
					tag: 'button',
					is: 'so-button',
					props: { text: ALERT_SAMPLE.action },
					attributes: { type: 'button' },
				},
			],
		},
	},
	badge: { tag: 'span', is: 'so-badge' },
	avatar: { tag: 'span', is: 'so-avatar' },
	'avatar-group': {
		tag: 'span',
		is: 'so-avatar-group',
		slots: {
			default: AVATAR_PEOPLE.map((person) => ({
				tag: 'span',
				is: 'so-avatar',
				props: person,
			})),
		},
	},
	splitter: {
		tag: 'div',
		is: 'so-splitter',
		attributes: { class: 'pg-splitter-preview' },
		slots: {
			default: [
				{
					tag: 'div',
					is: 'so-splitter-panel',
					props: { panel: 'files' },
					slots: {
						default: [
							{
								tag: 'div',
								attributes: { class: 'pg-splitter-preview__pane' },
								slots: {
									default: [
										{
											tag: 'strong',
											slots: {
												default: [() => document.createTextNode('Файлы')],
											},
										},
										{
											tag: 'code',
											slots: {
												default: [() => document.createTextNode('App.vue')],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					tag: 'div',
					is: 'so-splitter-handle',
					props: { panel: 'files', size: 'sm', aria_label: 'Файлы' },
				},
				{
					tag: 'div',
					is: 'so-splitter-panel',
					props: { panel: 'editor' },
					slots: {
						default: [
							{
								tag: 'div',
								attributes: { class: 'pg-splitter-preview__pane' },
								slots: {
									default: [
										{
											tag: 'strong',
											slots: {
												default: [
													() => document.createTextNode('Редактор'),
												],
											},
										},
										{
											tag: 'code',
											slots: {
												default: [
													() => document.createTextNode('<Splitter />'),
												],
											},
										},
									],
								},
							},
						],
					},
				},
				{
					tag: 'div',
					is: 'so-splitter-handle',
					props: { panel: 'editor', size: 'lg', aria_label: 'Редактор' },
				},
				{
					tag: 'div',
					is: 'so-splitter-panel',
					props: { panel: 'preview' },
					slots: {
						default: [
							{
								tag: 'div',
								attributes: { class: 'pg-splitter-preview__pane' },
								slots: {
									default: [
										{
											tag: 'strong',
											slots: {
												default: [() => document.createTextNode('Вывод')],
											},
										},
										{
											tag: 'code',
											slots: {
												default: [
													() => document.createTextNode('Сборка готова'),
												],
											},
										},
									],
								},
							},
						],
					},
				},
			],
		},
	},
	'file-upload': { tag: 'div', is: 'so-file-upload' },
	'code-block': { tag: 'div', is: 'so-code-block' },
	label: {
		tag: 'label',
		is: 'so-label',
		slots: { default: [{ tag: 'span', is: 'so-check-box' }] },
	},

	// A form field around Input: the parts' texts are preview props, the control
	// a slot. The page rows edit the field itself: label side, texts, error
	field: {
		tag: 'div',
		is: 'so-field',
		slots: {
			default: [{ tag: 'div', is: 'so-input', props: { placeholder: 'name@example.com' } }],
		},
	},

	// The label is content: a radio has no text, it is a bare control like
	// CheckBox. The radio's root is a label, `<label is="so-radio-group-item">`
	'radio-group': {
		tag: 'div',
		is: 'so-radio-group',
		slots: {
			default: ITEMS.map((item) => ({
				tag: 'label',
				is: 'so-radio-group-item',
				props: { value: item.value },
				part: 'Item',
				slots: { default: [text(item.text)] },
			})),
		},
	},

	tabs: TABS,

	accordion: ACCORDION,

	// The scroller's content is plain markup, one element per item: it has no
	// collection. The scroller sits in a width bound, as in Vue
	scroller: {
		tag: 'div',
		is: 'so-scroller',
		slots: { default: ITEMS.map((item) => strip(`${item.text} пункт ленты`)) },
		wrapper: FULL_WIDTH,
	},

	// Pagination has no content: it puts the window's pages into the collection
	// itself, and its template draws them. The language of numbers and arrow
	// names comes from the header
	breadcrumbs: { tag: 'nav', is: 'so-breadcrumbs', props: { items: BREADCRUMBS_ITEMS } },
	pagination: { tag: 'nav', is: 'so-pagination' },

	// The trigger is a Button in the `trigger` slot: it gets the link to the panel
	// and the pressed look by itself, as slots have no scope. The content has a
	// button for focus to move to on open
	popover: {
		tag: 'span',
		is: 'so-popover',
		slots: {
			trigger: [button('Открыть')],
			default: [
				paragraph('Произвольное содержимое: текст, поля, кнопки'),
				button('Действие'),
			],
		},
	},

	// The trigger is a Button in the `trigger` slot: it gets the link to the menu
	// and the pressed look by itself, as slots have no scope. A context menu
	// (`openOn: 'contextmenu'`) gets an area in the slot, as in Vue. The area
	// reads the mode from the column's props: the instance column has none, and
	// there the menu opens over the button. Children are placed before
	// insertion, so a mode change rebuilds the element (`rebuild`). Items are
	// markup, as in Vue, unless they came as data (`items` from the page's groups
	// block): markup would replace the data, and the menu draws groups from data
	menu: {
		tag: 'span',
		is: 'so-menu',
		rebuild: ['openOn'],
		slots: (bind) => ({
			trigger: [bind.openOn === 'contextmenu' ? contextArea : button('Действия')],
			default: bind.items ? [] : MENU_ITEMS,
		}),
	},

	// The trigger is a Button in the `trigger` slot: it gets the panel reference
	// (`aria-describedby`) by itself. The tooltip text goes to the default slot:
	// there is no text prop
	tooltip: {
		tag: 'span',
		is: 'so-tooltip',
		slots: {
			trigger: [button('Наведи')],
			default: [text('Короткое пояснение к кнопке')],
		},
	},

	// A button opens the dialog, as in Vue: closed it is hidden, open it covers
	// the page with a backdrop. The button and the dialog sit right in the cell:
	// the wrapper has no box. The dialog moves to `body`, leaving its anchor in
	// the cell; the footer buttons close it
	'alert-dialog': {
		tag: 'div',
		is: 'so-alert-dialog',
		opener: 'Открыть окно',
		slots: {
			title: [caption('Удалить запись?')],
			default: [paragraph('Удалённую запись нельзя будет восстановить.')],
			action: [caption('Удалить')],
		},
		wrapper: { tag: 'div', style: () => 'display:contents' },
	},
	dialog: {
		tag: 'div',
		is: 'so-dialog',
		opener: 'Открыть окно',
		slots: {
			title: [caption('Настройки')],
			default: [paragraph('Произвольное содержимое: текст, поля, кнопки'), field('Имя')],
			footer: [closing('Отмена'), closing('Сохранить')],
		},
		wrapper: { tag: 'div', style: () => 'display:contents' },
	},

	// A button opens the drawer too. The button and the drawer sit in their own
	// box with `position: relative`, as in Vue: with `contained` the drawer does
	// not move out but sits in it, so the `contained` row shows it in the preview
	// box
	drawer: {
		tag: 'div',
		is: 'so-drawer',
		opener: 'Открыть панель',
		slots: {
			title: [caption('Фильтры')],
			default: [paragraph('Произвольное содержимое: текст, поля, кнопки'), field('Поиск')],
			footer: [closing('Сбросить'), closing('Применить')],
		},
		wrapper: {
			tag: 'div',
			style: () => 'position:relative; width:100%; min-height:240px; overflow:hidden',
		},
	},

	// The manager is an autonomous box-less element with its own tag, around the
	// row of buttons that show toasts from code. The toast region sits at the
	// window edge
	toasts: { tag: 'so-toasts', slots: { default: [toastsTrigger] } },

	// Items in markup, as in Vue and React. An item's row is a button on a `div`
	// (`<div is="so-item-row-div">`), built by the item's template. Unless they
	// came as data (`items` from the page's groups block): markup would replace
	// the data, and the list draws groups from data
	'list-box': {
		tag: 'div',
		is: 'so-list-box',
		slots: (bind) => ({
			default: bind.items
				? []
				: ITEMS.map((item) => ({
						tag: 'div',
						is: 'so-list-box-item',
						props: { ...item },
						part: 'Item',
					})),
		}),
	},

	// Tags are data, as in Vue: `items` from the shared manifest is what the
	// preview itself draws. The wrapper bounds the width: the row must match the
	// cell exactly or `overflow` does not apply at all, and in the flexbox cell
	// stage the row would keep its content's width
	tags: { tag: 'div', is: 'so-tags', props: { items: ITEMS }, wrapper: FULL_WIDTH },

	// Options in markup, as in Vue. An option's row is a button on a `span`
	// (`<span is="so-item-row-span">`), built by the option's template. Unless
	// they came as data (`items` from the page's groups block): markup would
	// replace the data, and Select draws groups from data
	select: {
		tag: 'div',
		is: 'so-select',
		slots: (bind) => ({
			default: bind.items
				? []
				: ITEMS.map((item) => ({
						tag: 'div',
						is: 'so-select-item',
						props: { ...item },
					})),
		}),
	},

	// A calendar has no content: its month grid view puts the days into the
	// collection, and its template draws them. The preview has no language of its
	// own: it is the locale of the provider around the host root, picked in the
	// header (the host's `setLocale`)
	calendar: { tag: 'div', is: 'so-calendar' },

	// The language comes from the playground header, as for the calendar
	'date-input': { tag: 'div', is: 'so-date-input' },

	// The field and the calendar are DatePicker's own instances; it has no
	// content. The language comes from the header, as for the field and calendar
	'date-picker': { tag: 'div', is: 'so-date-picker' },

	// Rows and columns are data, as in Vue and React: the table has no parts in
	// markup. The element is the table's outer node around its `table` root, and
	// the wrapper around it bounds the width; with a sticky head it is also a
	// 320 px scroll window over forty rows. The `Virtual` window is on its own
	// page
	table: {
		tag: 'div',
		is: 'so-table',
		props: (bind) => ({
			items: bind.stickyHead ? TABLE_SCROLL_ROWS : TABLE_ROWS,
			columns: TABLE_COLUMNS,
		}),
		wrapper: {
			tag: 'div',
			style: (bind) =>
				bind.stickyHead ? 'width:100%; height:320px; overflow:auto' : 'width:100%',
		},
	},

	// The glyph is a role, the element's own attribute: Icon's template builds the `<svg>`
	icon: { tag: 'span', is: 'so-icon', attributes: { icon: 'arrowDown' } },

	// A horizontal bar gets its length from the container, having none of its
	// own: the wrapper bounds the width, as in Vue. A vertical bar is an inline
	// block of its own height, and the wrapper does not get in its way. By
	// default the bar is empty: the fraction is zero, and running is the
	// `indeterminate` flag
	'progress-linear': { tag: 'span', is: 'so-progress-linear', wrapper: FULL_WIDTH },

	// The ring is inline and of its own size. By default it is empty: the
	// fraction is zero, and running is the `indeterminate` flag
	'progress-spinner': { tag: 'span', is: 'so-progress-spinner' },

	separator: {
		tag: 'div',
		is: 'so-separator',
		wrapper: {
			tag: 'div',
			style: () => 'width:100%;height:120px;display:flex;align-items:center',
		},
	},
	skeleton: { tag: 'div', is: 'so-skeleton' },

	// DragAndDrop is an autonomous box-less element with its own tag, like
	// Virtual: in Vue and React the wrapper has no node. The collections sit in
	// its light DOM, in a row
	'drag-and-drop': { tag: 'so-drag-and-drop', slots: { default: [REORDERABLE] } },

	// Virtual is an autonomous box-less element with its own tag: in Vue and
	// React the wrapper has no node. The `enabled` row turns the window on and
	// off for all three lists
	virtual: { tag: 'so-virtual', slots: { default: [windowed] } },
}
