import type { IFileUpload } from '@soxa-ui/core'
import { TBasePlugin } from '../../base'
import type { IPluginContext } from '../../base'
import { TElementPlugin } from '../element'
import { fileUploadInput } from './native.plugin'

function hasFiles(event: DragEvent): boolean {
	return event.dataTransfer?.types.includes('Files') ?? false
}

export class TFileUploadDropPlugin extends TBasePlugin<IFileUpload> {
	private _cleanup?: () => void

	override install(ctx: IPluginContext): void {
		super.install(ctx)
		const owner = ctx.getInstance<IFileUpload>()
		if (!owner) return

		ctx.get(TElementPlugin)?.events.on('bind', (root) => {
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
		const zone = root.querySelector<HTMLElement>('.so-file-upload__dropzone')
		const input = fileUploadInput(root)
		if (!zone || !input) return

		const enabled = (): boolean => !owner.disabled && !input.matches(':disabled')
		let depth = 0
		const clear = (): void => {
			depth = 0
			owner.dragging = false
		}
		const enter = (event: DragEvent): void => {
			if (!hasFiles(event) || !enabled()) return
			depth++
			owner.dragging = true
		}
		const over = (event: DragEvent): void => {
			if (!hasFiles(event)) return
			event.preventDefault()
			if (event.dataTransfer) event.dataTransfer.dropEffect = enabled() ? 'copy' : 'none'
		}
		const leave = (): void => {
			if (--depth <= 0) clear()
		}
		const drop = (event: DragEvent): void => {
			if (!hasFiles(event)) return
			event.preventDefault()
			event.stopPropagation()
			clear()
			if (enabled()) owner.addFiles(Array.from(event.dataTransfer?.files ?? []))
		}
		const disabled = (): void => {
			if (owner.disabled) clear()
		}

		zone.addEventListener('dragenter', enter)
		zone.addEventListener('dragover', over)
		zone.addEventListener('dragleave', leave)
		zone.addEventListener('drop', drop)
		owner.events.on('change:disabled', disabled)

		return () => {
			clear()
			owner.events.off('change:disabled', disabled)
			zone.removeEventListener('dragenter', enter)
			zone.removeEventListener('dragover', over)
			zone.removeEventListener('dragleave', leave)
			zone.removeEventListener('drop', drop)
		}
	}
}
