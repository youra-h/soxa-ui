import { FILE_UPLOAD_NAMES, freezeLocale } from '../locale'

/**
 * Английский (США) — локаль по умолчанию: её получает набор без провайдера.
 *
 * `en-US`, а не язык среды: сервер и браузер без заданной локали рисуют одно
 * и то же.
 */
export const enUS = freezeLocale({
	tag: 'en-US',
	translations: {
		guide: { previous: 'Back', next: 'Next', done: 'Done', progress: '{step} of {count}' },
		fileUpload: FILE_UPLOAD_NAMES,
		alertDialog: { confirm: 'Confirm', cancel: 'Cancel' },
		alert: { close: 'Close' },
		codeBlock: {
			region: 'Code',
			copy: 'Copy',
			copied: 'Copied',
			error: 'Unable to copy code',
		},
		breadcrumbs: { navigation: 'Breadcrumbs', overflow: 'Show hidden breadcrumbs' },
		modal: { close: 'Close' },
		dialog: { maximize: 'Maximize' },
		popover: { close: 'Close' },
		tabs: { close: 'Close {name}' },
		tags: { close: 'Close {name}' },
		toasts: { region: 'Notifications (F8)', close: 'Close {name}' },
		scroller: { prev: 'Scroll back', next: 'Scroll forward' },
		pagination: { prev: 'Previous page', next: 'Next page' },
		field: { clear: 'Clear {name}' },
		numberInput: { increment: 'Increase {name}', decrement: 'Decrease {name}' },
		table: { selectAll: 'Select all', sort: 'Sort by {name}' },
		calendar: {
			prevMonth: 'Previous month',
			nextMonth: 'Next month',
			prevYear: 'Previous year',
			nextYear: 'Next year',
			prevYears: 'Previous 12 years',
			nextYears: 'Next 12 years',
		},
		datePicker: {
			trigger: 'Choose date',
			start: 'Start date',
			end: 'End date',
			confirm: 'OK',
			cancel: 'Cancel',
		},
		rating: {
			value: '{value} of {max}',
			required: 'Please select a rating',
		},
		textarea: { counter: '{count} / {max}' },
	},
})
