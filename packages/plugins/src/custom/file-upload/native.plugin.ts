import type { IFileUpload } from '@soxa-ui/core'
import { TBasePlugin } from '../../base'
import type { IPluginContext, TPluginEvents } from '../../base'
import { TElementPlugin } from '../element'

type TPreviews = Readonly<Record<number, string>>
type TEvents = TPluginEvents & { 'change:previews': () => void }

export function fileUploadInput(root: Element): HTMLInputElement | null {
	return root.querySelector<HTMLInputElement>('.so-file-upload__input')
}

export function fileUploadChoose(root: Element): HTMLButtonElement | null {
	return root.querySelector<HTMLButtonElement>('.so-file-upload__choose')
}

/** The native input remains the form's source, even after a drop or removal. */
export class TFileUploadNativePlugin extends TBasePlugin<IFileUpload, TEvents> {
	private _cleanup?: () => void
	private _previews: TPreviews = {}

	get previews(): TPreviews {
		return this._previews
	}

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const owner = ctx.getInstance<IFileUpload>()

		if (!owner) return

		const element = ctx.get(TElementPlugin)

		element?.events.on('bind', (root) => {
			this._cleanup?.()
			this._cleanup = root ? this._bind(root, owner) : undefined
		})
	}

	override destroy(): void {
		this._cleanup?.()
		this._cleanup = undefined

		super.destroy()
	}

	private _bind(root: Element, owner: IFileUpload): (() => void) | undefined {
		const input = fileUploadInput(root)
		const choose = fileUploadChoose(root)
		const browse = root.querySelector<HTMLButtonElement>('.so-file-upload__browse')
		const doc = root.ownerDocument
		const win = doc.defaultView

		if (!input || !choose || !win) return

		let active = true
		const urls = new Map<number, string>()

		const syncPreviews = (): void => {
			if (typeof win.URL.createObjectURL !== 'function') return

			const images = owner.items.filter(({ file }) => file.type.startsWith('image/'))
			const ids = new Set(images.map(({ id }) => id))
			let changed = false

			for (const [id, url] of urls) {
				if (ids.has(id)) continue
				win.URL.revokeObjectURL(url)
				urls.delete(id)
				changed = true
			}

			for (const { id, file } of images) {
				if (urls.has(id)) continue
				urls.set(id, win.URL.createObjectURL(file))
				changed = true
			}

			if (changed) this._setPreviews(Object.fromEntries(urls))
		}

		const sync = (): void => {
			const files = owner.files
			const nativeFiles = Array.from(input.files ?? [])

			if (
				nativeFiles.length !== files.length ||
				nativeFiles.some((file, i) => file !== files[i])
			) {
				if (!files.length) input.value = ''
				else {
					const transfer = new win.DataTransfer()
					for (const file of files) transfer.items.add(file)
					input.files = transfer.files
				}
			}

			syncPreviews()
		}

		const pick = (): void => {
			if (!owner.disabled && !input.matches(':disabled')) input.click()
		}

		const change = (): void => {
			if (owner.disabled || input.matches(':disabled')) {
				sync()
				return
			}

			const files = Array.from(input.files ?? [])

			if (files.length) owner.addFiles(files)
			else sync()
		}

		const remove = (event: Event): void => {
			if (!(event.target instanceof win.Element)) return

			const button = event.target.closest<HTMLButtonElement>('.so-file-upload__remove')

			if (
				button?.closest('.so-file-upload') !== root ||
				owner.disabled ||
				button.matches(':disabled')
			)
				return

			const focused = doc.activeElement === button

			owner.removeFile(Number(button.dataset.fileId))
			if (focused) choose.focus()
		}

		const reset = (event: Event): void => {
			if (event.target !== input.form) return

			// The reset event is cancelable and precedes native input clearing.
			queueMicrotask(() => {
				if (active && !event.defaultPrevented) owner.resetFiles()
			})
		}

		const invalid = (): void => {
			queueMicrotask(() => {
				if (active && doc.activeElement === input) choose.focus()
			})
		}

		owner.events.on('selection', sync)

		choose.addEventListener('click', pick)
		browse?.addEventListener('click', pick)
		input.addEventListener('change', change)
		input.addEventListener('invalid', invalid)
		root.addEventListener('click', remove)
		doc.addEventListener('reset', reset, true)

		sync()

		return () => {
			active = false

			owner.events.off('selection', sync)
			choose.removeEventListener('click', pick)
			browse?.removeEventListener('click', pick)
			input.removeEventListener('change', change)
			input.removeEventListener('invalid', invalid)
			root.removeEventListener('click', remove)
			doc.removeEventListener('reset', reset, true)

			for (const url of urls.values()) win.URL.revokeObjectURL(url)
			if (urls.size) this._setPreviews({})
		}
	}

	private _setPreviews(previews: TPreviews): void {
		this._previews = previews

		this.events.emit('change:previews')
	}
}
