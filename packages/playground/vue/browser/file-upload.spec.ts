import { afterEach, describe, expect, it } from 'vitest'
import { userEvent } from 'vitest/browser'
import type { IPreviewHandle } from '@soxa-ui/playground-shared'
import { enUS } from '@soxa-ui/plugins'
import { FRAMEWORKS, loadHost } from '../src/hosts'
import '@soxa-ui/theme-oren'

let handle: IPreviewHandle | undefined
let form: HTMLFormElement | undefined
let container: HTMLElement | undefined

afterEach(() => {
	handle?.unmount()
	handle = undefined
	container?.remove()
	container = undefined
	form?.remove()
	form = undefined
})

function find<T extends Element>(root: HTMLElement, selector: string): T {
	const element = root.querySelector<T>(selector)
	if (!element) throw new Error('FileUpload element missing: ' + selector)
	return element
}

function transfer(...files: File[]): DataTransfer {
	const store = new DataTransfer()
	for (const file of files) store.items.add(file)
	return store
}

describe.each(FRAMEWORKS)('FileUpload ? $id', ({ id }) => {
	it('keeps native FormData in sync through selection, drop, rejection, removal and reset', async () => {
		const host = await loadHost(id)
		host.setLocale(enUS)
		const target = document.createElement('div')
		container = target
		target.style.cssText = 'max-inline-size: 320px'
		target.dataset.soTheme = 'oren-dark'
		form = document.createElement('form')
		form.id = 'file-upload-browser-form'
		document.body.append(form, target)
		const props = {
			name: 'attachments',
			form: form.id,
			accept: '.txt, image/*',
			multiple: true,
			required: true,
			maxFiles: 2,
			maxFileSize: 100,
		}
		handle = host.mount(target, { component: 'file-upload', props })

		await expect
			.poll(() => target.querySelector<HTMLInputElement>('input[type=file]')?.form)
			.toBe(form)
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
		const input = find<HTMLInputElement>(target, 'input[type=file]')
		const choose = find<HTMLButtonElement>(target, '.so-file-upload__choose')
		const dropzone = find<HTMLElement>(target, '.so-file-upload__dropzone')
		const names = () =>
			(new FormData(form).getAll('attachments') as File[]).map((file) => file.name)
		const drop = (...files: File[]) =>
			dropzone.dispatchEvent(
				new DragEvent('drop', {
					dataTransfer: transfer(...files),
					cancelable: true,
					bubbles: true,
				}),
			)

		expect(input.validity.valueMissing).toBe(true)
		input.files = transfer(new File(['a'], 'picked.txt')).files
		input.dispatchEvent(new Event('change', { bubbles: true }))
		const png = Uint8Array.from(
			atob(
				'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFcYAAAAASUVORK5CYII=',
			),
			(character) => character.charCodeAt(0),
		)
		const photo = new File([png], 'image.png', { type: 'image/png' })
		expect(drop(photo, new File(['b'], 'third.txt'))).toBe(false)
		expect(names()).toEqual(['picked.txt', 'image.png'])
		expect(input.validity.valueMissing).toBe(false)

		await expect
			.poll(() => target.querySelector('[role=status]')?.textContent)
			.toContain('third.txt')
		await expect
			.poll(() =>
				target
					.querySelector('.so-file-upload__preview > img:not([hidden])')
					?.getAttribute('src'),
			)
			.toMatch(/^blob:/)
		expect(dropzone.getBoundingClientRect().width).toBeLessThanOrEqual(320)
		expect(getComputedStyle(dropzone).borderBlockStartStyle).toBe('dashed')

		const remove = find<HTMLButtonElement>(target, '.so-file-upload__remove')
		remove.focus()
		await userEvent.keyboard('{Enter}')
		expect(names()).toEqual(['image.png'])
		expect(document.activeElement).toBe(choose)

		handle.update({ ...props, disabled: true })
		await expect.poll(() => input.disabled).toBe(true)
		expect(names()).toEqual([])
		drop(new File(['d'], 'disabled.txt'))
		expect(input.files?.length).toBe(1)
		handle.update(props)
		await expect.poll(() => input.disabled).toBe(false)
		expect(names()).toEqual(['image.png'])

		form.addEventListener('reset', (event) => event.preventDefault(), { once: true })
		form.reset()
		await Promise.resolve()
		expect(names()).toEqual(['image.png'])
		form.reset()
		await expect.poll(() => target.querySelector('.so-file-upload__item')).toBeNull()
		expect(input.files?.length).toBe(0)
		expect(input.validity.valueMissing).toBe(true)
	})
})
