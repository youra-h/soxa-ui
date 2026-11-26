import type { IFileUpload } from '@soxa-ui/core'
import type { IPluginContext, TPluginEvents } from '../../base'
import { TNamesPlugin } from '../../locale/names.plugin'
import type { TTranslations } from '../../locale/types'

import { FILE_UPLOAD_NAMES } from '../../locale/locale'

type TNames = NonNullable<TTranslations['fileUpload']>
type TEvents = TPluginEvents & { 'change:presentation': () => void }
type TRow = {
	readonly id: number
	readonly file: File
	readonly extension: string
	readonly sizeText: string
	readonly removeLabel: string
}

export class TFileUploadNamesPlugin extends TNamesPlugin<IFileUpload, TEvents> {
	private _locale = 'en-US'
	private _names: TNames = FILE_UPLOAD_NAMES
	private _owner?: IFileUpload
	private _rows: readonly TRow[] = []

	get choose(): string {
		return this._names.choose
	}

	get drop(): string {
		return this._names.drop
	}

	get browse(): string {
		return this._names.browse ?? this._names.choose
	}

	get hint(): string {
		const limit = this._owner?.maxFileSize ?? Infinity
		return Number.isFinite(limit)
			? this._names.limit.replace('{size}', this._format(limit))
			: ''
	}

	get rows(): readonly TRow[] {
		return this._rows
	}

	get message(): string {
		return (
			this._owner?.rejections
				.map(({ file, reason }) => this._names[reason].replace('{name}', () => file.name))
				.join(' ') ?? ''
		)
	}

	override install(ctx: IPluginContext): void {
		this._locale = ctx.locale.locale.tag
		super.install(ctx)
		this._listenTo(ctx.locale.events, 'change', () => {
			this._locale = ctx.locale.locale.tag
			if (this._owner) this._updateRows(this._owner)
			this.events.emit('change:presentation')
		})
	}

	protected override _name(owner: IFileUpload, translations: TTranslations): void {
		this._owner = owner
		this._names = translations.fileUpload ?? FILE_UPLOAD_NAMES
		this._updateRows(owner)
		this.events.emit('change:presentation')
	}

	protected override _watch(owner: IFileUpload, name: () => void): void {
		this._listenTo(owner.events, 'change:settings', name)
		this._listenTo(owner.events, 'change:files', name)
		this._listenTo(owner.events, 'change:rejections', name)
	}

	private _updateRows(owner: IFileUpload): void {
		const previous = new Map(this._rows.map((row) => [row.id, row]))
		this._rows = owner.items.map(({ id, file }) => {
			const dot = file.name.lastIndexOf('.')
			const extension = dot > 0 ? file.name.slice(dot + 1, dot + 6).toUpperCase() : ''
			const sizeText = this._format(file.size)
			const removeLabel = this._names.remove.replace('{name}', () => file.name)
			const row = previous.get(id)
			return row?.file === file &&
				row.sizeText === sizeText &&
				row.removeLabel === removeLabel
				? row
				: { id, file, extension, sizeText, removeLabel }
		})
	}

	private _format(bytes: number): string {
		const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
		const scale = Math.min(units.length - 1, Math.floor(Math.log10(Math.max(1, bytes)) / 3))
		return new Intl.NumberFormat(this._locale, {
			style: 'unit',
			unit: units[scale],
			unitDisplay: 'short',
			maximumFractionDigits: 1,
		}).format(bytes / 1000 ** scale)
	}
}
