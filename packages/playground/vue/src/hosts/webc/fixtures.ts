import type { TPreview } from './previews'

/**
 * Разметка сценариев, которой нет у превью: содержимое слотов под проверку —
 * в Web Components.
 *
 * Ключи и разметка — те же, что у хоста Vue (`hosts/vue/fixtures.ts`):
 * сценарии в общем пакете ищут в сцене одно и то же, на каком бы фреймворке её
 * ни нарисовали. Фикстура — описание элемента, как у превью, а содержимое
 * слотов — его дети по слотам: свет элемента, который код хоста ставит до
 * вставки.
 *
 * Меток слотов Button (`button-slot-labels`) здесь нет: метка слота по
 * умолчанию печатает `text` из scope, а у слотов элемента scope нет
 * (`slotScope: false`).
 */
export const FIXTURES: Record<string, TPreview> = {
	'list-box-separators': {
		tag: 'div',
		is: 'so-list-box',
		slots: {
			default: [
				{
					tag: 'div',
					is: 'so-list-box-group',
					props: { label: 'First' },
					slots: {
						default: [
							{
								tag: 'div',
								is: 'so-list-box-item',
								props: { value: 'a', text: 'Apple' },
							},
						],
					},
				},
				{ tag: 'div', is: 'so-list-box-separator' },
				{
					tag: 'div',
					is: 'so-list-box-group',
					props: { label: 'Second' },
					slots: {
						default: [
							{
								tag: 'div',
								is: 'so-list-box-item',
								props: { value: 'b', text: 'Banana' },
							},
						],
					},
				},
			],
		},
	},
	'select-separators': {
		tag: 'div',
		is: 'so-select',
		props: { open: true },
		slots: {
			default: [
				{
					tag: 'div',
					is: 'so-select-group',
					props: { label: 'First' },
					slots: {
						default: [
							{
								tag: 'div',
								is: 'so-select-item',
								props: { value: 'a', text: 'Apple' },
							},
						],
					},
				},
				{ tag: 'div', is: 'so-select-separator' },
				{
					tag: 'div',
					is: 'so-select-group',
					props: { label: 'Second' },
					slots: {
						default: [
							{
								tag: 'div',
								is: 'so-select-item',
								props: { value: 'b', text: 'Banana' },
							},
						],
					},
				},
			],
		},
	},
	'alert-dialog-footer': {
		tag: 'div',
		is: 'so-alert-dialog',
		slots: {
			title: [
				() => {
					const node = document.createElement('span')
					node.textContent = 'Custom question'
					return node
				},
			],
			default: [
				() => {
					const node = document.createElement('p')
					node.textContent = 'Custom description'
					return node
				},
			],
			footer: [
				() => {
					const node = document.createElement('button')
					node.type = 'button'
					node.dataset.auditFooter = ''
					node.textContent = 'Custom footer'
					return node
				},
			],
		},
	},
	'avatar-fallback': {
		tag: 'span',
		is: 'so-avatar',
		slots: { fallback: [{ tag: 'span', is: 'so-icon', attributes: { icon: 'check' } }] },
	},
	'badge-anchor': {
		tag: 'span',
		is: 'so-badge',
		slots: { anchor: [{ tag: 'button', is: 'so-button', props: { text: 'Inbox' } }] },
	},
	'a11y-persistent-toasts': { tag: 'so-toasts' },
	'a11y-invalid-input': {
		tag: 'div',
		is: 'so-input',
		wrapper: {
			tag: 'div',
			is: 'so-field',
			props: { label: 'Account', invalid: true, error: 'Enter a valid email' },
		},
	},
	'a11y-invalid-number-input': {
		tag: 'div',
		is: 'so-number-input',
		wrapper: {
			tag: 'div',
			is: 'so-field',
			props: { label: 'Account', invalid: true, error: 'Enter a valid email' },
		},
	},
	'a11y-invalid-textarea': {
		tag: 'div',
		is: 'so-textarea',
		wrapper: {
			tag: 'div',
			is: 'so-field',
			props: { label: 'Account', invalid: true, error: 'Enter a valid email' },
		},
	},
	'a11y-invalid-date-input': {
		tag: 'div',
		is: 'so-date-input',
		wrapper: {
			tag: 'div',
			is: 'so-field',
			props: { label: 'Account', invalid: true, error: 'Enter a valid email' },
		},
	},
	'a11y-invalid-date-picker': {
		tag: 'div',
		is: 'so-date-picker',
		wrapper: {
			tag: 'div',
			is: 'so-field',
			props: { label: 'Account', invalid: true, error: 'Enter a valid email' },
		},
	},
	// Иконки по краям — подпись длинная, из пропа `text` сценария
	'button-slot-icons': {
		tag: 'button',
		is: 'so-button',
		slots: {
			leading: [{ tag: 'span', is: 'so-icon', attributes: { icon: 'check' } }],
			trailing: [{ tag: 'span', is: 'so-icon', attributes: { icon: 'arrowRight' } }],
		},
	},

	// Подпись вокруг контрола: текст — из пропа `text` сценария, контрол — в
	// слоте по умолчанию
	'label-check-box': {
		tag: 'label',
		is: 'so-label',
		slots: { default: [{ tag: 'span', is: 'so-check-box' }] },
	},

	'label-switch': {
		tag: 'label',
		is: 'so-label',
		slots: { default: [{ tag: 'span', is: 'so-switch' }] },
	},
}
