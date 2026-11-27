import { afterEach, describe, expect, it } from 'vitest'
import { commands, userEvent } from 'vitest/browser'
import { TSplitter, type TOrientation } from '@soxa-ui/core'
import type { IPreviewHandle } from '@soxa-ui/playground-shared'
import { h } from 'vue'
import { Splitter } from '@soxa-ui/vue'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import { render } from './render'
import { pixel } from './colors'
import '@soxa-ui/theme-oren'
import '../src/styles.css'

const mounts: { root: HTMLElement; preview: IPreviewHandle }[] = []
const panels = [
	{ id: 'files', defaultSize: 25, minSize: 15, maxSize: 45, collapsible: true },
	{ id: 'editor', defaultSize: 50, minSize: 20, maxSize: 75 },
	{ id: 'preview', minSize: 10, maxSize: 60 },
]

afterEach(() => {
	for (const { root, preview } of mounts.splice(0)) {
		preview.unmount()
		root.remove()
	}
})

function part(root: HTMLElement, selector: string, index = 0): HTMLElement {
	const element = root.querySelectorAll<HTMLElement>(selector)[index]
	if (!element) throw new Error(`Missing Splitter part: ${selector} at ${index}`)
	return element
}

describe.each(FRAMEWORKS)('Splitter · $id', ({ id }) => {
	it('resizes adjacent panels and keeps independent layout, axis and ARIA', async () => {
		const host = await loadHost(id)
		const ready = new Set<TOrientation>()
		const mount = (orientation: TOrientation): HTMLElement => {
			const root = document.createElement('div')
			root.style.width = '400px'
			root.dataset.soTheme = 'oren'
			document.body.append(root)
			const preview = host.mount(root, {
				component: 'splitter',
				props: { orientation, panels },
				onEvent: (event, [value]) => {
					if (event === 'ready' && value === true) ready.add(orientation)
				},
			})
			mounts.push({ root, preview })
			return root
		}

		const horizontal = mount('horizontal')
		const vertical = mount('vertical')
		await expect.poll(() => ready.size).toBe(2)
		await expect
			.poll(() =>
				horizontal.querySelector('[role="separator"]')?.getAttribute('aria-valuenow'),
			)
			.toBe('25')
		await expect
			.poll(() => vertical.querySelector('[role="separator"]')?.getAttribute('aria-valuenow'))
			.toBe('25')

		const handle = part(horizontal, '[role="separator"]')
		const secondHandle = part(horizontal, '[role="separator"]', 1)
		const panel = part(horizontal, '.so-splitter__panel')
		const untouched = part(horizontal, '.so-splitter__panel', 2)
		const verticalHandle = part(vertical, '[role="separator"]')
		const horizontalGrip = part(horizontal, '.so-splitter__grip').getBoundingClientRect()
		const verticalGrip = part(vertical, '.so-splitter__grip').getBoundingClientRect()

		expect(handle.getAttribute('aria-controls')).toBe(panel.id)
		expect(panel.id).not.toBe(part(vertical, '.so-splitter__panel').id)
		expect(handle.getAttribute('aria-orientation')).toBe('vertical')
		expect(verticalHandle.getAttribute('aria-orientation')).toBe('horizontal')
		expect([horizontalGrip.width, horizontalGrip.height]).toEqual([8, 24])
		expect([verticalGrip.width, verticalGrip.height]).toEqual([24, 8])
		expect(handle.getBoundingClientRect().width).toBe(4)
		expect(secondHandle.getBoundingClientRect().width).toBe(16)
		expect(secondHandle.querySelector('.so-splitter__grip')?.textContent?.trim()).toBe('')
		const layout = part(horizontal, '.so-splitter')
		const available = layout.clientWidth
		const quarter = available / 4

		expect(panel.getBoundingClientRect().width).toBeCloseTo(quarter)
		expect(untouched.getBoundingClientRect().width).toBeCloseTo(quarter)

		// Resizing uses pointer capture. Check the grab and the move before releasing.
		await userEvent.hover(handle)
		await commands.mouseDown()
		try {
			await expect.poll(() => handle.hasAttribute('data-dragging')).toBe(true)
			await userEvent.hover(secondHandle, { force: true })
			await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('45')
		} finally {
			await commands.mouseUp()
		}
		await expect.poll(() => handle.hasAttribute('data-dragging')).toBe(false)
		expect(handle.getAttribute('aria-valuenow')).toBe('45')
		expect(untouched.getBoundingClientRect().width).toBeCloseTo(quarter)
		expect(verticalHandle.getAttribute('aria-valuenow')).toBe('25')

		handle.focus()
		await userEvent.keyboard('{Enter}')
		await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('0')
		expect(panel.getBoundingClientRect().width).toBe(0)
		await userEvent.keyboard('{Enter}')
		await expect.poll(() => handle.getAttribute('aria-valuenow')).toBe('45')

		secondHandle.focus()
		await userEvent.keyboard('{ArrowRight}')
		await expect.poll(() => secondHandle.getAttribute('aria-valuenow')).toBe('31')
		expect(handle.getAttribute('aria-valuenow')).toBe('45')

		verticalHandle.focus()
		await userEvent.keyboard('{ArrowDown}{ArrowRight}')
		await expect.poll(() => verticalHandle.getAttribute('aria-valuenow')).toBe('26')
		expect(handle.getAttribute('aria-valuenow')).toBe('45')
	})
})

describe.each(FRAMEWORKS)('Splitter geometry · $id', ({ id }) => {
	it('applies exact thickness and spacing on both axes and can hide the grip', async () => {
		const host = await loadHost(id)
		const root = document.createElement('div')
		root.style.width = '400px'
		root.dataset.soTheme = 'oren'
		document.body.append(root)

		const props = { panels, width: 6, offset: 12 }
		let ready = false
		const preview = host.mount(root, {
			component: 'splitter',
			props,
			onEvent: (event, [value]) => {
				if (event === 'ready') ready = value === true
			},
		})
		mounts.push({ root, preview })

		await expect.poll(() => root.querySelectorAll('.so-splitter__grip').length).toBe(2)
		const inspect = (axis: TOrientation) => {
			const first = part(root, '.so-splitter__panel').getBoundingClientRect()
			const handle = part(root, '[role="separator"]').getBoundingClientRect()
			const second = part(root, '.so-splitter__panel', 1).getBoundingClientRect()

			const x = handle.left + handle.width / 2
			const y = handle.top + handle.height / 2

			return axis === 'horizontal'
				? [x - first.right, handle.width, second.left - x]
				: [y - first.bottom, handle.height, second.top - y]
		}

		expect(inspect('horizontal')).toEqual([12, 6, 12])

		preview.update({ ...props, offset: 0 })
		await expect.poll(() => inspect('horizontal')).toEqual([0, 6, 0])

		preview.update({ ...props, thumb: false, orientation: 'vertical' })
		await expect.poll(() => inspect('vertical')).toEqual([12, 6, 12])
		expect(root.querySelectorAll('.so-splitter__grip')).toHaveLength(0)

		await expect.poll(() => ready).toBe(true)
		const separator = part(root, '[role="separator"]')
		separator.focus()
		expect(document.activeElement).toBe(separator)
		await userEvent.keyboard('{ArrowDown}')
		await expect.poll(() => separator.getAttribute('aria-valuenow')).toBe('26')

		const secondSeparator = part(root, '[role="separator"]', 1)
		const layout = part(root, '.so-splitter')
		const track = layout.getBoundingClientRect()
		const handle = secondSeparator.getBoundingClientRect()
		const panelLength = [...layout.querySelectorAll('.so-splitter__panel')].reduce(
			(total, panel) => total + panel.getBoundingClientRect().height,
			0,
		)
		const position = { x: 0.5, y: (handle.top + handle.height / 2 - track.top) / track.height }
		const pixels = 12
		await commands.quickDrag('.pg-splitter-preview', position, {
			...position,
			y: position.y + pixels / track.height,
		})
		await expect
			.poll(() => Number(secondSeparator.getAttribute('aria-valuenow')))
			.toBeCloseTo(49 + (pixels * 100) / panelLength, 0)
		expect(separator.getAttribute('aria-valuenow')).toBe('26')

		preview.update({ panels, orientation: 'vertical' })
		await expect.poll(() => inspect('vertical')).toEqual([0, 4, 0])
		await expect.poll(() => root.querySelectorAll('.so-splitter__grip').length).toBe(2)
	})
})

it('renders a named icon only while the grip is shown', async () => {
	const ctrl = new TSplitter({ panels })
	const root = render({
		render: () =>
			h(Splitter, { ctrl }, () => [
				h(Splitter.Panel, { panel: 'files' }, () => 'Files'),
				h(
					Splitter.Handle,
					{ panel: 'files', aria_label: 'Files' },
					{
						icon: () => h('span', 'Custom icon'),
					},
				),
				h(Splitter.Panel, { panel: 'editor' }, () => 'Editor'),
				h(Splitter.Handle, { panel: 'editor', aria_label: 'Editor' }),
				h(Splitter.Panel, { panel: 'preview' }, () => 'Preview'),
			]),
	})

	await expect
		.poll(() => root.querySelector('.so-splitter__grip')?.textContent)
		.toBe('Custom icon')
	ctrl.thumb = false
	await expect.poll(() => root.querySelector('.so-splitter__grip')).toBeNull()
	expect(root.querySelectorAll('[role="separator"]')).toHaveLength(2)
	ctrl.thumb = true
	await expect
		.poll(() => root.querySelector('.so-splitter__grip')?.textContent)
		.toBe('Custom icon')
})

it('waits for hover intent and highlights a drag immediately', async () => {
	const host = await loadHost('vue')
	const root = document.createElement('div')
	root.style.width = '400px'
	root.dataset.soTheme = 'oren'
	document.body.append(root)

	let ready = false
	const preview = host.mount(root, {
		component: 'splitter',
		props: { panels },
		onEvent: (event, [value]) => {
			if (event === 'ready') ready = value === true
		},
	})
	mounts.push({ root, preview })

	await expect.poll(() => ready).toBe(true)

	const handle = part(root, '[role="separator"]')
	const grip = part(handle, '.so-splitter__grip')
	const panel = part(root, '.so-splitter__panel')
	const colors = () =>
		[
			getComputedStyle(handle, '::before').backgroundColor,
			getComputedStyle(grip).borderTopColor,
			getComputedStyle(handle).color,
		].map((color) => pixel([color]).join())

	await userEvent.hover(panel)
	const idle = colors()

	await userEvent.hover(handle)
	expect(getComputedStyle(handle, '::before').transitionDelay).toBe('0.1s')

	// Leave enough time for pointer travel over the browser RPC even under load.
	await userEvent.hover(panel)
	root.style.setProperty('--so-splitter-hover-delay', '600ms')
	await userEvent.hover(handle)
	expect(getComputedStyle(grip).transitionDelay).toBe('0.6s')
	expect(colors()).toEqual(idle)

	await userEvent.hover(panel)
	expect(colors()).toEqual(idle)
	expect(grip.getAnimations()).toHaveLength(0)

	await userEvent.hover(handle)
	await expect.poll(() => colors().every((color, index) => color !== idle[index])).toBe(true)
	const active = colors()

	await userEvent.hover(panel)
	await userEvent.hover(handle)
	expect(colors()).toEqual(idle)

	await commands.mouseDown()
	try {
		expect(handle.hasAttribute('data-dragging')).toBe(true)
		expect(colors()).toEqual(active)
		expect(getComputedStyle(handle, '::before').transitionProperty).toBe('none')
	} finally {
		await commands.mouseUp()
	}
})
