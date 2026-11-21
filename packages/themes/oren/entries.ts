/**
 * The stylesheets of components: an entry per component of the export,
 * `@soxa-ui/theme-oren/<component>.css`, next to the whole sheet
 * (`AGENTS.md` of the package, «Слои: лист целиком и по компонентам»).
 *
 * An entry imports the shared part (`dist/common.css`) and the parts of its
 * component (`dist/parts/<part>.css`), its own and the inner ones: Select
 * draws its field with Input, its tags with Tags, its rows with Button, its
 * panel at the field — so its entry carries `input`, `tags`, `button`,
 * `anchored`, `swipe`, `place`. A part is a file the build cuts out of the
 * whole sheet by its cascade layers: the layer of the shared layer of themes
 * (`base.so.<part>`) and the layers of the theme (`components.so.<part>`,
 * `components.so.modifiers.<part>`). The bundler of an application puts a file
 * once however many entries import it, and the order of the layers is declared
 * by the shared part before any rule — so it does not depend on the order of
 * the imports.
 *
 * The composition is knowledge of the templates of the library, so it is
 * checked against the markup: every node a component draws on the Vue
 * playground, with all of its parts, is covered by its entry
 * (`packages/playground/vue/__tests__/theme-entries.spec.ts`), and every
 * variable a part reads is declared by its entry (`__tests__/entries.spec.ts`).
 */

/**
 * The parts of the shared layer of themes that go into the shared part of
 * every entry, not into files of their own: the reset of the library's nodes,
 * the writing-direction sign, the fading of a disabled part and the scales any
 * part reads — the caption, the marker of a required field, the tap zone of a
 * small button. The shared part also carries every default of the document
 * root of the other parts — the scales of blocks (`--so-button-height-sm`):
 * the neighbours stand by them, the cell of Pagination by the height of
 * Button, — the tokens and the schemes of the theme, and what Tailwind puts out
 * for the whole sheet.
 */
export const COMMON_PARTS: readonly string[] = [
	'reset',
	'settings',
	'direction',
	'disabled',
	'caption',
	'required',
	'target',
]

/** Parts of the panel at an anchor: its place, the swipe strip, the surface of the place. */
const PANEL = ['anchored', 'swipe', 'place']

/** Popover with its parts: the close button, the panel at the trigger. */
const POPOVER = ['icon', 'button', ...PANEL, 'popover']

/** Calendar with its parts: the paging buttons, the month and year picker — Popover with ListBox. */
const CALENDAR = [...POPOVER, 'list-box', 'calendar']

/**
 * Component of the export → the parts of its entry. The name is the one of the
 * component in kebab case, as the entries of the Web Components adapter
 * (`@soxa-ui/webc/list-box`). The order of the parts does not matter: the
 * build imports them in the order of their layers.
 */
export const COMPONENTS: Readonly<Record<string, readonly string[]>> = {
	accordion: ['icon', 'button', 'accordion'],
	alert: ['icon', 'button', 'alert'],
	avatar: ['avatar'],
	'avatar-group': ['avatar', 'avatar-group'],
	badge: ['badge'],
	'code-block': ['icon', 'button', 'tabs', 'code-block'],
	button: ['button'],
	'toggle-button': ['button'],
	'toggle-group': ['button', 'toggle-group'],
	breadcrumbs: ['icon', 'button', 'group', 'anchored', 'place', 'menu', 'breadcrumbs'],
	calendar: CALENDAR,
	'check-box': ['icon', 'check-box'],
	'date-input': ['icon', 'button', 'date-input'],
	'date-picker': [...CALENDAR, 'date-input', 'date-picker'],
	dialog: ['icon', 'button', 'modal', 'place', 'dialog'],
	'alert-dialog': ['icon', 'button', 'modal', 'place', 'alert-dialog'],
	'drag-and-drop': ['drag-and-drop'],
	drawer: ['icon', 'button', 'modal', 'swipe', 'place', 'drawer'],
	field: ['icon', 'field'],
	icon: ['icon'],
	input: ['icon', 'button', 'input'],
	label: ['label'],
	'list-box': ['icon', 'button', 'group', 'list-box'],
	menu: ['icon', 'button', 'group', 'anchored', 'place', 'menu'],
	'number-input': ['icon', 'button', 'number-input'],
	pagination: ['icon', 'button', 'pagination'],
	popover: POPOVER,
	'progress-linear': ['progress-linear'],
	'progress-spinner': ['progress-spinner'],
	'radio-group': ['radio-group'],
	rating: ['icon', 'rating'],
	scroller: ['icon', 'button', 'scroller'],
	select: ['icon', 'button', 'input', 'tags', 'group', ...PANEL, 'select'],
	separator: ['separator'],
	skeleton: ['skeleton'],
	slider: ['slider'],
	switch: ['switch'],
	table: ['icon', 'button', 'check-box', 'table'],
	tabs: ['icon', 'button', 'tabs'],
	tags: ['icon', 'button', 'tags'],
	textarea: ['textarea'],
	toasts: ['icon', 'button', 'progress-spinner', 'swipe', 'place', 'toasts'],
	tooltip: ['tooltip'],
}
