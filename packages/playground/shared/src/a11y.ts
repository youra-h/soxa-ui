import type { IPreviewHost } from './host.ts'

export const A11Y_COMPONENTS = [
	'button',
	'toggle-button',
	'toggle-group',
	'alert',
	'badge',
	'avatar',
	'avatar-group',
	'code-block',
	'file-upload',
	'breadcrumbs',
	'input',
	'number-input',
	'textarea',
	'check-box',
	'switch',
	'label',
	'field',
	'slider',
	'splitter',
	'rating',
	'radio-group',
	'select',
	'calendar',
	'date-input',
	'date-picker',
	'popover',
	'menu',
	'tooltip',
	'dialog',
	'alert-dialog',
	'guide',
	'drawer',
	'toasts',
	'scroller',
	'list-box',
	'pagination',
	'table',
	'tabs',
	'tags',
	'accordion',
	'icon',
	'progress-linear',
	'progress-spinner',
	'separator',
	'skeleton',
	'drag-and-drop',
	'virtual',
	'frame',
	'component-view',
	'control',
	'stylable',
	'textable',
	'interactive',
	'value-control',
	'input-control',
] as const
export const A11Y_ADAPTERS = ['vue', 'react', 'svelte', 'solid', 'webc', 'angular'] as const

export type TAuditCase = {
	readonly id: string
	readonly component: string
	readonly consumer: string
	readonly coverage: 'direct' | 'consumer' | 'semantic-reference'
	readonly state: string
	readonly root: string
	readonly fixture?: string
	readonly props: Readonly<Record<string, unknown>>
	readonly visible: readonly string[]
	readonly exists?: readonly string[]
	readonly absent?: readonly string[]
	readonly click?: readonly string[]
	readonly count?: { selector: string; min: number; max: number }
}
function audit(
	component: string,
	state: string,
	root: string,
	props: Readonly<Record<string, unknown>> = {},
	visible: readonly string[] = [],
	extra: Partial<
		Pick<
			TAuditCase,
			'consumer' | 'fixture' | 'click' | 'absent' | 'count' | 'exists' | 'coverage'
		>
	> = {},
): TAuditCase {
	return {
		id: component + '/' + state,
		component,
		consumer: component,
		coverage: extra.consumer ? 'consumer' : 'direct',
		state,
		root,
		props,
		visible: [root, ...visible],
		...extra,
	}
}

const breadcrumbItems = [
	{ text: 'Home', href: '#home' },
	{ text: 'Catalog', href: '#catalog' },
	{ text: 'Phones', href: '#phones' },
	{ text: 'Smartphones', href: '#smartphones' },
	{ text: 'Current', _: { active: true } },
]

/** Explicit consumer inventory; inheritance layers never mount decorative layer previews. */
export const A11Y_CASES: readonly TAuditCase[] = [
	audit(
		'alert-dialog',
		'custom-footer',
		'.so-alert-dialog',
		{ visible: true },
		['[data-audit-footer]'],
		{ fixture: 'alert-dialog-footer' },
	),
	audit(
		'toggle-button',
		'activated',
		'.so-toggle-button',
		{ text: 'Bold' },
		['.so-toggle-button[aria-pressed="true"]'],
		{ click: ['.so-toggle-button'] },
	),
	audit(
		'toggle-group',
		'activated',
		'.so-toggle-group',
		{
			aria_label: 'Formatting',
			items: [{ text: 'Bold' }, { text: 'Italic' }],
		},
		['.so-toggle-group-item[aria-pressed="true"]'],
		{ click: ['.so-toggle-group-item'] },
	),
	audit(
		'code-block',
		'second-active',
		'.so-code-block',
		{
			snippets: [
				{ value: 'one', label: 'One', code: 'const one = 1;' },
				{ value: 'two', label: 'Two', code: 'const two = 2;' },
			],
		},
		['.so-code-block [role="tab"][aria-selected="true"]'],
		{ click: ['tab:Two'] },
	),
	audit(
		'avatar',
		'loaded',
		'.so-avatar',
		{
			src:
				'data:image/svg+xml,' +
				encodeURIComponent(
					'<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="teal"/></svg>',
				),
			initials: 'AL',
			aria_label: 'Ada',
		},
		['.so-avatar[data-status="loaded"] img'],
	),
	audit(
		'avatar',
		'error',
		'.so-avatar',
		{ src: 'data:image/png;base64,broken', initials: 'AL', aria_label: 'Ada' },
		['.so-avatar[data-status="error"] .so-avatar__fallback'],
	),
	audit(
		'avatar',
		'custom-fallback',
		'.so-avatar',
		{ initials: 'AL', aria_label: 'Ada' },
		['.so-avatar__fallback .so-icon'],
		{ fixture: 'avatar-fallback' },
	),
	audit('splitter', 'initial', '.so-splitter', {}, ['.so-splitter__thumb']),
	audit('file-upload', 'choose', '.so-file-upload', { required: true }, [
		'.so-file-upload__choose',
		'.so-file-upload__input',
	]),
	audit('code-block', 'basic', '.so-code-block', { code: 'const x = 1;\n' }, [
		'.so-code-block__pre',
		'.so-code-block__copy',
	]),
	audit(
		'code-block',
		'lines',
		'.so-code-block',
		{
			code: '<script>\n  text\n</script>\n',
			title: 'main.ts',
			lineNumbers: true,
			highlightLines: [2],
			wrap: true,
			maxHeight: 90,
		},
		['.so-code-block__pre', '.so-code-block__gutter'],
	),
	audit(
		'code-block',
		'tabs',
		'.so-code-block',
		{
			code: '',
			snippets: [
				{
					value: 'vue',
					label: 'Vue',
					code: '<script setup>\nconst title = "Soxa UI"\n</script>\n',
					language: 'vue',
					filename: 'App.vue',
				},
				{
					value: 'react',
					label: 'React',
					code: 'export const title = "Soxa UI";\n',
					language: 'tsx',
					filename: 'App.tsx',
				},
				{
					value: 'svelte',
					label: 'Svelte',
					code: '<h1>Soxa UI</h1>\n',
					language: 'svelte',
					filename: 'App.svelte',
				},
			],
		},
		[
			'.so-code-block__tabs [role=tab]',
			'.so-code-block__tabs [role=tabpanel]',
			'.so-code-block__copy',
		],
	),
	audit('breadcrumbs', 'full', '.so-breadcrumbs', { items: breadcrumbItems, maxItems: 0 }, [
		'.so-breadcrumbs__list',
		'.so-breadcrumbs__link[href="#home"]',
		'.so-breadcrumbs__link[aria-current="page"]',
	]),
	audit('breadcrumbs', 'collapsed', '.so-breadcrumbs', { items: breadcrumbItems, maxItems: 3 }, [
		'.so-breadcrumbs__trigger[aria-expanded="false"]',
		'.so-breadcrumbs__link[aria-current="page"]',
	]),
	audit(
		'breadcrumbs',
		'overflow',
		'.so-breadcrumbs',
		{ items: breadcrumbItems, maxItems: 3 },
		[
			'.so-breadcrumbs__trigger[aria-expanded="true"]',
			'[role="menu"]',
			'[role="menuitem"][href="#catalog"]',
		],
		{ click: ['.so-breadcrumbs__trigger'] },
	),
	audit(
		'breadcrumbs',
		'disabled-item',
		'.so-breadcrumbs',
		{
			items: [
				{ text: 'Home', href: '#home', disabled: true },
				{ text: 'Current', _: { active: true } },
			],
			maxItems: 0,
		},
		[
			'.so-breadcrumbs__link[aria-disabled="true"]:not([href])',
			'.so-breadcrumbs__link[aria-current="page"]',
		],
	),
	audit('alert', 'closable', '.so-alert', { closable: true }, [
		'.so-alert[role="alert"]',
		'.so-alert__close[aria-label]',
	]),
	audit('avatar', 'named', '.so-avatar', { initials: 'AL', aria_label: 'Ada Lovelace' }, [
		'.so-avatar[role="img"][aria-label="Ada Lovelace"]',
	]),
	audit('avatar-group', 'group', '.so-avatar-group', { overflow: 3 }, [
		'.so-avatar-group[role="group"]',
		'.so-avatar-group__count',
	]),
	audit('badge', 'text', '.so-badge', { value: 'New' }, [
		'.so-badge__indicator:not([aria-hidden])',
	]),
	audit('badge', 'named-count', '.so-badge', { value: 5, aria_label: '5 unread messages' }, [
		'.so-badge__indicator[role="img"][aria-label="5 unread messages"]',
	]),
	audit('badge', 'zero', '.so-badge', { value: 0 }, ['.so-badge__indicator:not([aria-hidden])']),
	audit(
		'badge',
		'capped',
		'.so-badge',
		{ value: 120, max: 99, aria_label: '120 unread messages' },
		['.so-badge__indicator[role="img"][aria-label="120 unread messages"]'],
	),
	audit(
		'badge',
		'named-dot',
		'.so-badge',
		{ value: 5, dot: true, aria_label: '5 unread messages' },
		['.so-badge[data-dot="true"]', '.so-badge__indicator[role="img"]'],
	),
	audit('badge', 'decorative-dot', '.so-badge', { value: 5, dot: true }, [
		'.so-badge[data-dot="true"]',
		'.so-badge__indicator[aria-hidden="true"]',
	]),
	audit(
		'badge',
		'anchor',
		'.so-badge',
		{ value: 5, aria_label: '5 unread messages' },
		['.so-badge__anchor button', '.so-badge__indicator[role="img"]'],
		{ fixture: 'badge-anchor' },
	),

	audit(
		'input',
		'invalid',
		'.so-input',
		{ aria_label: 'Account' },
		['.so-field__error', '[aria-invalid="true"][aria-describedby]'],
		{ fixture: 'a11y-invalid-input' },
	),
	audit(
		'number-input',
		'invalid',
		'.so-number-input',
		{ aria_label: 'Account' },
		['.so-field__error', '[aria-invalid="true"][aria-describedby]'],
		{ fixture: 'a11y-invalid-number-input' },
	),
	audit(
		'textarea',
		'invalid',
		'.so-textarea',
		{ aria_label: 'Account' },
		['.so-field__error', '[aria-invalid="true"][aria-describedby]'],
		{ fixture: 'a11y-invalid-textarea' },
	),
	audit(
		'date-input',
		'invalid',
		'.so-date-input',
		{ aria_label: 'Account' },
		['.so-field__error', '[aria-invalid="true"][aria-describedby]'],
		{ fixture: 'a11y-invalid-date-input' },
	),
	audit(
		'date-picker',
		'invalid',
		'.so-date-picker',
		{ aria_label: 'Account' },
		['.so-field__error', '[aria-invalid="true"][aria-describedby]'],
		{ fixture: 'a11y-invalid-date-picker' },
	),

	...['off', 'on', 'disabled'].map((state) =>
		audit(
			'toggle-button',
			state,
			'.so-toggle-button',
			{ text: 'Bold', pressed: state === 'on', disabled: state === 'disabled' },
			['button[aria-pressed]'],
		),
	),
	...['single', 'multiple', 'disabled'].map((state) =>
		audit(
			'toggle-group',
			state,
			'.so-toggle-group',
			{
				aria_label: 'Formatting',
				mode: state === 'multiple' ? 'multiple' : 'single',
				disabled: state === 'disabled',
				items: [{ text: 'Bold', _: { selected: true } }, { text: 'Italic' }],
			},
			['button.so-toggle-group-item[aria-pressed]'],
		),
	),
	audit('button', 'named', '.so-button', { text: 'Save changes' }, ['button.so-button']),
	audit('button', 'disabled', '.so-button', { text: 'Save changes', disabled: true }, [
		'button:disabled',
	]),
	audit('input', 'named', '.so-input', { aria_label: 'Name' }, ['input[aria-label="Name"]']),
	audit('number-input', 'named', '.so-number-input', { aria_label: 'Quantity', value: 12 }, [
		'input[role="spinbutton"]',
	]),
	audit('textarea', 'named', '.so-textarea', { aria_label: 'Comment' }, [
		'textarea[aria-label="Comment"]',
	]),
	...['check-box', 'switch'].flatMap((id) => [
		audit(id, 'unchecked', '.so-' + id, { value: false }, ['input:not(:checked)']),
		audit(id, 'checked', '.so-' + id, { value: true }, ['input:checked']),
		audit(id, 'disabled', '.so-' + id, { disabled: true }, ['input:disabled']),
	]),
	audit('label', 'native-control', '.so-label', { text: 'Accept terms' }, ['label input']),
	audit('field', 'helper', '.so-field', { label: 'Email', helper: 'Use your work address' }, [
		'input[aria-describedby]',
	]),
	audit(
		'field',
		'invalid',
		'.so-field',
		{ label: 'Email', invalid: true, error: 'Enter a valid email' },
		['input[aria-invalid="true"][aria-describedby]', '.so-field__error'],
	),
	audit('slider', 'single', '.so-slider', { value: 25 }, ['input[type="range"]'], {
		count: { selector: 'input[type="range"]', min: 1, max: 1 },
	}),
	audit(
		'slider',
		'multiple',
		'.so-slider',
		{ value: [25, 75], thumbLabels: ['Minimum', 'Maximum'] },
		['input[aria-label="Minimum"]', 'input[aria-label="Maximum"]'],
		{ count: { selector: 'input[type="range"]', min: 2, max: 2 } },
	),
	audit('rating', 'unselected', '.so-rating', { value: 0 }, ['input']),
	audit('rating', 'selected', '.so-rating', { value: 3 }, ['input']),
	audit('radio-group', 'unselected', '.so-radio-group', { aria_label: 'Delivery' }, [
		'input[type="radio"]:not(:checked)',
	]),
	audit('radio-group', 'selected', '.so-radio-group', { aria_label: 'Delivery', value: 'a' }, [
		'input[type="radio"]:checked',
	]),
	audit(
		'radio-group',
		'disabled',
		'.so-radio-group',
		{ aria_label: 'Delivery', disabled: true },
		['input[type="radio"]:disabled'],
	),
	audit(
		'select',
		'closed',
		'.so-select',
		{ aria_label: 'City', open: false },
		['[role="combobox"][aria-expanded="false"]'],
		{ absent: ['.so-select__panel'] },
	),
	audit('select', 'open', '.so-select', { aria_label: 'City', open: true }, [
		'[role="combobox"][aria-expanded="true"]',
		'.so-select__panel [role="option"]',
	]),
	audit(
		'select',
		'single-selected',
		'.so-select',
		{ aria_label: 'City', open: true, value: 'a' },
		['.so-select__panel [aria-selected="true"]'],
	),
	audit(
		'select',
		'multiple-selected',
		'.so-select',
		{ aria_label: 'Cities', open: true, mode: 'multiple', value: ['a', 'b'] },
		[
			'.so-select__panel [aria-multiselectable="true"]',
			'.so-select__panel [aria-selected="true"]',
		],
	),
	audit('select', 'disabled', '.so-select', { aria_label: 'City', disabled: true }, [
		'.so-select input:disabled',
	]),
	audit('calendar', 'grid', '.so-calendar', {}, ['[role="grid"]', 'td.so-calendar-item']),
	audit('calendar', 'months', '.so-calendar', {}, ['.so-calendar__picker [role="listbox"]'], {
		click: ['.so-calendar__title'],
	}),
	audit('calendar', 'years', '.so-calendar', {}, ['.so-calendar__picker [role="listbox"]'], {
		click: ['.so-calendar__title', '.so-calendar__picker-heading'],
	}),
	audit('date-input', 'segments', '.so-date-input', { aria_label: 'Date' }, [
		'[role="spinbutton"]',
	]),
	audit(
		'date-picker',
		'closed',
		'.so-date-picker',
		{ aria_label: 'Date', open: false },
		['[role="spinbutton"]'],
		{ absent: ['.so-date-picker__panel'] },
	),
	audit('date-picker', 'open', '.so-date-picker', { aria_label: 'Date', open: true }, [
		'.so-date-picker__panel[role="dialog"]',
		'.so-date-picker__panel [role="grid"]',
	]),
	...['popover', 'menu', 'tooltip'].flatMap((id) => [
		audit(
			id,
			'closed',
			'.so-' + id,
			{ ...(id === 'popover' ? { aria_label: 'Details' } : {}), open: false },
			['.so-' + id + ' button'],
			{ absent: ['.so-' + id + '__panel'] },
		),
		audit(
			id,
			'open',
			'.so-' + id,
			{ ...(id === 'popover' ? { aria_label: 'Details' } : {}), open: true },
			['.so-' + id + '__panel'],
		),
	]),
	audit('menu', 'submenu', '.so-menu', { open: true }, ['.so-menu__panel [role="menuitem"]'], {
		click: ['[role="menuitem"][aria-haspopup="menu"]'],
	}),
	audit('menu', 'item-panel', '.so-menu', { open: true }, ['.so-menu-item__panel .so-calendar'], {
		click: ['[role="menuitem"][aria-haspopup="dialog"]'],
	}),
	audit('alert-dialog', 'open', '.so-alert-dialog', { visible: true }, [
		'.so-alert-dialog[role="alertdialog"]',
		'.so-alert-dialog__cancel',
		'.so-alert-dialog__action',
	]),
	audit(
		'guide',
		'open',
		'.so-guide',
		{ visible: true, steps: [{ id: 'welcome', title: 'Welcome', mode: 'modal' }] },
		['.so-guide[role="dialog"]', '.so-guide__close'],
	),
	...['dialog', 'drawer'].flatMap((id) => [
		audit(id, 'closed', 'main button', { visible: false }, ['main button'], {
			absent: ['.so-' + id],
			exists: ['.so-' + id],
		}),
		audit(id, 'open', '.so-' + id, { visible: true }, [
			'.so-' + id + '[role="dialog"]',
			'.so-' + id + ' input',
		]),
	]),
	audit('toasts', 'empty', 'main button', {}, ['main button'], {
		absent: ['.so-toasts-item'],
		exists: [
			'.so-toasts[role="region"]',
			'.so-toasts__list',
			'[data-so-toasts-announcer="polite"]',
			'[data-so-toasts-announcer="assertive"]',
		],
	}),
	...[
		['ordinary', 'обычное'],
		['error', 'error'],
	].map(([state, text]) =>
		audit(
			'toasts',
			state,
			'.so-toasts',
			{ duration: 0 },
			[
				'.so-toasts-item',
				...(state === 'loading'
					? ['.so-toasts-item .so-progress-spinner']
					: state === 'error'
						? ['.so-toasts-item--type-error']
						: []),
			],
			{
				click: ['text:' + text],
				exists: [
					'[data-so-toasts-announcer="polite"]',
					'[data-so-toasts-announcer="assertive"]',
				],
			},
		),
	),
	audit(
		'toasts',
		'loading',
		'.so-toasts',
		{ duration: 0 },
		['.so-toasts-item .so-progress-spinner'],
		{
			fixture: 'a11y-persistent-toasts',
			exists: [
				'[data-so-toasts-announcer="polite"]',
				'[data-so-toasts-announcer="assertive"]',
			],
		},
	),
	audit('scroller', 'content', '.so-scroller', {}, ['.so-scroller__viewport']),
	...['list-box', 'tags'].flatMap((id) => [
		audit(id, 'unselected', '.so-' + id, { aria_label: 'Items', mode: 'single' }, [
			'[role="option"][aria-selected="false"]',
		]),
		audit(
			id,
			'single-selected',
			'.so-' + id,
			{ aria_label: 'Items', mode: 'single', value: 'a' },
			['[role="option"][aria-selected="true"]'],
		),
		audit(
			id,
			'multiple-selected',
			'.so-' + id,
			{ aria_label: 'Items', mode: 'multiple', value: ['a', 'b'] },
			['[aria-multiselectable="true"]', '[role="option"][aria-selected="true"]'],
		),
		audit(
			id,
			'disabled',
			'.so-' + id,
			{ aria_label: 'Items', disabled: true, mode: 'single' },
			['[data-disabled="true"]'],
		),
	]),
	audit('pagination', 'current-page', '.so-pagination', {}, ['[aria-current="page"]']),
	audit('table', 'rows', '.so-table', {}, ['table', 'tbody tr', 'th']),
	audit('tabs', 'active-and-inactive', '.so-tabs', {}, [
		'[role="tab"][aria-selected="true"]',
		'[role="tab"][aria-selected="false"]',
		'[role="tabpanel"]',
	]),
	audit('accordion', 'closed', '.so-accordion', {}, ['[aria-expanded="false"]']),
	audit('accordion', 'open', '.so-accordion', {}, ['[aria-expanded="true"]', '[role="region"]'], {
		click: ['.so-accordion-item button'],
	}),
	audit('icon', 'decorative', '.so-icon', {}, ['.so-icon[aria-hidden="true"]']),
	...['horizontal', 'vertical'].flatMap((orientation) => [
		audit('separator', orientation, '.so-separator[role="separator"]', { orientation }, [
			'.so-separator[aria-orientation="' + orientation + '"]',
		]),
		audit(
			'separator',
			orientation + '-decorative',
			'.so-separator[role="none"]',
			{ orientation, decorative: true },
			[],
			{ absent: ['.so-separator[aria-orientation]'] },
		),
	]),
	...['progress-linear', 'progress-spinner'].flatMap((id) => [
		audit(id, 'determinate', '.so-' + id, { value: 40, aria_label: 'Upload' }, [
			'[role="progressbar"][aria-valuenow]',
		]),
		audit(id, 'indeterminate', '.so-' + id, { indeterminate: true, aria_label: 'Upload' }, [
			'[role="progressbar"]:not([aria-valuenow])',
			'[data-indeterminate="true"]',
		]),
	]),
	audit('skeleton', 'decorative', '.so-skeleton', { width: 160, height: 16 }, [
		'[aria-hidden="true"]',
	]),
	audit('drag-and-drop', 'collections', '.so-tabs', {}, [
		'[role="tablist"]',
		'[role="listbox"]',
		'.so-accordion',
	]),
	audit(
		'virtual',
		'window',
		'.so-list-box',
		{ enabled: true },
		['.so-list-box [role="option"]', '.so-select', '.so-table'],
		{ count: { selector: '.so-list-box [role="option"]', min: 1, max: 100 } },
	),

	...['input', 'number-input', 'textarea'].map((id) =>
		audit(id, 'disabled', '.so-' + id, { disabled: true, aria_label: 'Disabled control' }, [
			'.so-' + id + ' input:disabled, .so-' + id + ' textarea:disabled',
		]),
	),
	...['date-input', 'date-picker'].map((id) =>
		audit(id, 'disabled', '.so-' + id, { disabled: true, aria_label: 'Disabled date' }, [
			'.so-' + id + '[data-disabled="true"]',
		]),
	),
	audit('slider', 'disabled', '.so-slider', { value: 25, disabled: true }, [
		'input[type="range"]:disabled',
	]),
	audit('rating', 'disabled', '.so-rating', { value: 3, disabled: true }, ['input:disabled']),
	audit('calendar', 'selected', '.so-calendar', { months: ['2026-11-01'], value: '2026-11-10' }, [
		'td.so-calendar-item[aria-selected="true"]',
	]),
	audit('calendar', 'disabled', '.so-calendar', { disabled: true }, [
		'.so-calendar[data-disabled="true"]',
	]),
	audit('tabs', 'disabled', '.so-tabs', { disabled: true }, ['[role="tab"]:disabled']),
	audit(
		'tabs',
		'second-active',
		'.so-tabs',
		{},
		['[role="tab"][aria-selected="true"]', '[role="tabpanel"]'],
		{ click: ['.so-tabs-item:nth-child(2) [role="tab"]'] },
	),
	audit('accordion', 'disabled', '.so-accordion', { disabled: true }, [
		'.so-accordion-item button:disabled',
	]),
	audit(
		'accordion',
		'multiple',
		'.so-accordion',
		{ mode: 'multiple' },
		['[aria-expanded="true"]'],
		{
			click: [
				'.so-accordion-item:nth-child(1) button',
				'.so-accordion-item:nth-child(2) button',
			],
			count: { selector: '.so-accordion [aria-expanded="true"]', min: 2, max: 2 },
		},
	),
	audit('table', 'disabled', '.so-table', { disabled: true }, [
		'.so-table[data-disabled="true"]',
	]),
	audit(
		'table',
		'selected',
		'.so-table',
		{ mode: 'multiple' },
		['.so-table tbody input:checked'],
		{ click: ['.so-table tbody input[type="checkbox"]'] },
	),
	...['select', 'list-box', 'tags'].map((id) =>
		audit(
			id,
			'disabled-option',
			'.so-' + id,
			{
				aria_label: 'Choices',
				mode: 'single',
				...(id === 'select' ? { open: true } : {}),
				items: [
					{ value: 'a', text: 'Available' },
					{ value: 'b', text: 'Unavailable', disabled: true },
				],
			},
			['[role="option"][aria-disabled="true"]'],
		),
	),
	audit(
		'virtual',
		'select-window-open',
		'.so-select',
		{ enabled: true },
		['.so-select__panel [role="option"]'],
		{
			click: ['.so-select input'],
			count: { selector: '.so-select__panel [role="option"]', min: 1, max: 100 },
		},
	),
	audit('virtual', 'table-window', '.so-table', { enabled: true }, ['.so-table tbody tr'], {
		count: { selector: '.so-table tbody tr', min: 1, max: 100 },
	}),
	...['component-view', 'stylable', 'textable', 'control'].map((id) =>
		audit(id, 'button-consumer', '.so-button', { text: 'Save changes' }, ['button.so-button'], {
			consumer: 'button',
		}),
	),
	audit(
		'interactive',
		'semantic-reference',
		'.so-button',
		{ text: 'Save changes' },
		['button.so-button'],
		{
			consumer: 'button',
			coverage: 'semantic-reference',
		},
	),
	...['value-control', 'input-control'].map((id) =>
		audit(
			id,
			'input-consumer',
			'.so-input',
			{ aria_label: 'Name', value: 'Ada' },
			['input[aria-label="Name"]'],
			{ consumer: 'input' },
		),
	),
	audit(
		'frame',
		'select-panel-consumer',
		'.so-select',
		{ aria_label: 'City', open: true },
		['.so-select__panel.so-frame [role="option"]'],
		{ consumer: 'select' },
	),
]

export function auditInventoryErrors(host: IPreviewHost, registryIds: readonly string[]): string[] {
	const ids = [...registryIds].sort()
	const covered = [...new Set(A11Y_CASES.map((entry) => entry.component))].sort()
	const errors: string[] = []
	if (JSON.stringify(ids) !== JSON.stringify([...A11Y_COMPONENTS].sort()))
		errors.push('Registry differs from explicit audit inventory')
	if (JSON.stringify(ids) !== JSON.stringify(covered))
		errors.push('Audit cases do not cover every registry entry')
	if (new Set(A11Y_CASES.map((entry) => entry.id)).size !== A11Y_CASES.length)
		errors.push('Duplicate audit case id')
	for (const entry of A11Y_CASES) {
		if (!host.previews.includes(entry.consumer))
			errors.push(entry.id + ': missing consumer ' + entry.consumer)
		if (entry.fixture && !host.fixtures.includes(entry.fixture))
			errors.push(entry.id + ': missing fixture ' + entry.fixture)
	}
	return errors
}
