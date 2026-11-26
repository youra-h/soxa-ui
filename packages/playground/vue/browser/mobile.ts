import { defineComponent, h } from 'vue'
import { expect } from 'vitest'
import { PREVIEW_PROPS } from '@soxa-ui/playground-shared'
import { Virtual, ListBox } from '@soxa-ui/vue'
import { PREVIEWS, toComponent } from '../src/hosts/vue/previews'
import { render } from './render'
import '@soxa-ui/theme-oren'

/** Explicit audit inventory: registry additions must receive a mobile scenario. */
export const MOBILE_COMPONENTS = [
	'alert',
	'avatar',
	'avatar-group',
	'badge',
	'code-block',
	'file-upload',
	'button',
	'toggle-button',
	'toggle-group',
	'input',
	'number-input',
	'textarea',
	'check-box',
	'switch',
	'label',
	'field',
	'slider',
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
	'drawer',
	'toasts',
	'scroller',
	'list-box',
	'breadcrumbs',
	'pagination',
	'table',
	'tabs',
	'tags',
	'accordion',
	'icon',
	'progress-linear',
	'progress-spinner',
	'separator',
	'splitter',
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

export const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

export function find(selector: string): HTMLElement {
	const node = document.querySelector(selector)
	if (!(node instanceof HTMLElement)) throw new Error(selector + ': missing HTML node')
	return node
}

/** Consumer viewport, without overrides on library nodes. */
export async function mountMobile(id: string, props: Record<string, unknown> = {}) {
	document.documentElement.dataset.soTheme ||= 'oren'
	const preview = toComponent(PREVIEWS[id], {})
	const root = render(
		defineComponent({
			render: () =>
				h(
					'main',
					{
						id: 'mobile-scene',
						style: 'padding:16px;box-sizing:border-box;width:100%',
					},
					[
						id === 'virtual'
							? h(Virtual, null, () =>
									h(ListBox, {
										items: Array.from({ length: 1000 }, (_, i) => ({
											value: i,
											text: 'Mobile item ' + i,
										})),
										maxRows: 6,
										aria_label: 'Virtual items',
									}),
								)
							: h(preview, { ...PREVIEW_PROPS[id], ...props }),
					],
				),
		}),
	)
	await frame()
	await frame()
	expect(root.querySelector('[class*="so-"]'), id + ': library content').not.toBeNull()
	return root
}
