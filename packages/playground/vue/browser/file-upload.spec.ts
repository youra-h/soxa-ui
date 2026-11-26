import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { userEvent } from 'vitest/browser'
import type { IPreviewHandle } from '@soxa-ui/playground-shared'
import { enUS } from '@soxa-ui/plugins'
import { useLanguage } from '../src/composables/useLanguage'
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

describe.each(FRAMEWORKS)('FileUpload · $id', ({ id }) => {
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
		const browse = find<HTMLButtonElement>(dropzone, '.so-file-upload__browse')
		const prompt = find<HTMLElement>(dropzone, '.so-file-upload__prompt')
		const hint = find<HTMLElement>(dropzone, '.so-file-upload__hint')
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

		expect(choose.textContent?.trim()).toBe('')
		expect(choose.getAttribute('aria-label')).toBe('Choose files')
		expect(browse.textContent?.trim()).toBe('click to upload')
		expect(prompt.textContent?.replace(/\s+/g, ' ').trim()).toBe(
			'Drag your file here or click to upload',
		)
		expect(hint.textContent).toMatch(/^Maximum file size:/)
		expect(hint.getBoundingClientRect().top).toBeGreaterThan(prompt.getBoundingClientRect().top)
		expect(parseFloat(getComputedStyle(hint).fontSize)).toBeLessThan(
			parseFloat(getComputedStyle(prompt).fontSize),
		)

		const picker = vi.spyOn(input, 'click').mockImplementation(() => {})
		choose.focus()
		await userEvent.keyboard('{Enter}')
		expect(picker).toHaveBeenCalledTimes(1)
		browse.focus()
		await userEvent.keyboard(' ')
		expect(picker).toHaveBeenCalledTimes(2)
		picker.mockRestore()

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
		expect(remove.classList.contains('so-button')).toBe(true)
		expect(remove.querySelector('svg')).not.toBeNull()
		remove.focus()
		await userEvent.keyboard('{Enter}')
		expect(names()).toEqual(['image.png'])
		expect(document.activeElement).toBe(choose)

		handle.update({ ...props, disabled: true })
		await expect.poll(() => input.disabled).toBe(true)
		expect(choose.disabled).toBe(true)
		expect(browse.disabled).toBe(true)
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

it('keeps the simulated upload and byte counts in the selected playground language', async () => {
	const scope = effectScope()
	const settings = scope.run(useLanguage)!
	const previousLanguage = settings.language.value
	try {
		settings.choose('en-US')
		const host = await loadHost('vue')
		const target = document.createElement('div')
		container = target
		document.body.append(target)
		handle = host.mount(target, { component: 'file-upload', props: {} })
		await expect.poll(() => target.querySelector('input[type=file]')).not.toBeNull()
		await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

		vi.useFakeTimers({ toFake: ['performance', 'setInterval', 'clearInterval'] })
		const input = find<HTMLInputElement>(target, 'input[type=file]')
		input.files = transfer(new File([new Uint8Array(2000)], 'sample.txt')).files
		input.dispatchEvent(new Event('change', { bubbles: true }))

		await expect
			.poll(() => target.querySelector('.upload-status')?.textContent)
			.toContain('Uploading')
		expect(target.querySelector('.so-progress-spinner')).not.toBeNull()

		await vi.advanceTimersByTimeAsync(6000)
		expect(find(target, '.upload-percent').textContent?.trim()).toBe('50%')
		expect(find(target, '.upload-size').textContent?.trim()).toBe('1 kB of 2 kB')

		settings.choose('ru-RU')
		await expect.poll(() => find(target, '.upload-status').textContent).toContain('Загрузка')
		expect(find(target, '.upload-size').textContent).toContain(' из ')
		expect(find(target, '.upload-percent').textContent?.trim()).toBe(
			new Intl.NumberFormat('ru-RU', { style: 'percent' }).format(0.5),
		)

		settings.choose('en-US')
		await vi.advanceTimersByTimeAsync(6000)
		await expect.poll(() => find(target, '.upload-status').textContent).toContain('Done')
		expect(find(target, '.upload-size').textContent?.trim()).toBe('2 kB of 2 kB')
		expect(target.querySelector('.so-progress-spinner')).toBeNull()
	} finally {
		handle?.unmount()
		handle = undefined
		vi.useRealTimers()
		settings.choose(previousLanguage)
		scope.stop()
	}
})
