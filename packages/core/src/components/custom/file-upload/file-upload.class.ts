import { createEngine } from '../../base/collection'
import { TControl } from '../../base/control'
import type {
	IFileUpload,
	IFileUploadItem,
	IFileUploadProps,
	IFileUploadRejection,
	TFileUploadEvents,
} from './types'

type TSettings = Required<
	Pick<
		IFileUploadProps,
		'accept' | 'name' | 'form' | 'multiple' | 'required' | 'maxFileSize' | 'maxFiles'
	>
>

function matches(file: File, rules: readonly string[]): boolean {
	if (!rules.length) return true

	const name = file.name.toLowerCase()
	const type = file.type.toLowerCase()

	return rules.some((rule) => {
		if (rule.startsWith('.')) return name.endsWith(rule)
		if (rule.endsWith('/*')) return type.startsWith(rule.slice(0, -1))
		return type === rule
	})
}

export default class TFileUpload
	extends TControl<IFileUploadProps, TFileUploadEvents>
	implements IFileUpload
{
	static override baseClass = 'so-file-upload'
	static override defaultValues: typeof TControl.defaultValues & TSettings = {
		...TControl.defaultValues,
		accept: '',
		name: '',
		form: '',
		multiple: false,
		required: false,
		maxFileSize: Infinity,
		maxFiles: Infinity,
	}

	private readonly _items = createEngine<IFileUploadItem>().extensions.batch
	private readonly _settings: TSettings
	private _rejections: readonly IFileUploadRejection[] = []
	private _nextId = 0
	private _dragging = false

	constructor(props: Partial<IFileUploadProps> = {}) {
		super(props)

		const defaults = (new.target as typeof TFileUpload).defaultValues

		this._settings = {
			accept: props.accept ?? defaults.accept,
			name: props.name ?? defaults.name,
			form: props.form ?? defaults.form,
			multiple: props.multiple ?? defaults.multiple,
			required: props.required ?? defaults.required,
			maxFileSize: props.maxFileSize ?? defaults.maxFileSize,
			maxFiles: props.maxFiles ?? defaults.maxFiles,
		}

		this._dataset.add('dragging', false)
	}

	get accept() {
		return this._settings.accept
	}
	set accept(value: string) {
		this._set('accept', value)
	}

	get name() {
		return this._settings.name
	}
	set name(value: string) {
		this._set('name', value)
	}

	get form() {
		return this._settings.form
	}
	set form(value: string) {
		this._set('form', value)
	}

	get multiple() {
		return this._settings.multiple
	}
	set multiple(value: boolean) {
		this._set('multiple', value)

		if (!value && this.items.length > 1) this._replace(this.items.slice(0, 1))
	}

	get required() {
		return this._settings.required
	}
	set required(value: boolean) {
		this._set('required', value)
	}

	get maxFileSize() {
		return this._settings.maxFileSize
	}
	set maxFileSize(value: number) {
		this._set('maxFileSize', value)
	}

	get maxFiles() {
		return this._settings.maxFiles
	}
	set maxFiles(value: number) {
		this._set('maxFiles', value)
	}

	get dragging(): boolean {
		return this._dragging
	}
	set dragging(value: boolean) {
		if (this._dragging === value) return

		this._dragging = value
		this._dataset.add('dragging', value)
	}

	get items(): readonly IFileUploadItem[] {
		return this._items.items
	}

	get files(): readonly File[] {
		return this.items.map(({ file }) => file)
	}

	get rejections(): readonly IFileUploadRejection[] {
		return this._rejections
	}

	addFiles(files: readonly File[]): void {
		if (this.disabled || !files.length) return

		const current = this.items
		const accepted: IFileUploadItem[] = this.multiple ? [...current] : []
		const rejected: IFileUploadRejection[] = []

		const rules = this.accept
			.toLowerCase()
			.split(',')
			.map((rule) => rule.trim())
			.filter(Boolean)
		const limit = this.multiple ? this.maxFiles : Math.min(1, this.maxFiles)

		for (const file of files) {
			if (!matches(file, rules)) rejected.push({ file, reason: 'type' })
			else if (file.size > this.maxFileSize) rejected.push({ file, reason: 'size' })
			else if (accepted.length + 1 > limit) rejected.push({ file, reason: 'count' })
			else accepted.push({ id: ++this._nextId, file })
		}

		// A rejected single selection leaves the current file in the control.
		this._replace(accepted.length || this.multiple ? accepted : current)
		this._setRejections(rejected)

		if (rejected.length) this.events.emit('reject', rejected)
	}

	removeFile(id: number): void {
		if (this.disabled) return

		const items = this.items
		const kept = items.filter((item) => item.id !== id)

		if (kept.length === items.length) return

		this._replace(kept)
		this._setRejections([])
	}

	resetFiles(): void {
		this._replace([])
		this._setRejections([])
	}

	override getProps(): IFileUploadProps {
		return { ...super.getProps(), ...this._settings }
	}

	private _set<K extends keyof TSettings>(key: K, value: TSettings[K]): void {
		if (this._settings[key] === value) return

		this._settings[key] = value
		this.events.emit('change:settings')
	}

	private _replace(items: readonly IFileUploadItem[]): void {
		const current = this.items
		const changed =
			current.length !== items.length || current.some((item, index) => item !== items[index])

		if (changed) this._items.items = items

		// Native input synchronization precedes public callbacks, including on rejection.
		this.events.emit('selection')

		if (changed) {
			this.events.emit('change:files', {
				newValue: this.files,
				oldValue: current.map(({ file }) => file),
			})
		}
	}

	private _setRejections(rejections: readonly IFileUploadRejection[]): void {
		if (!rejections.length && !this._rejections.length) return

		this._rejections = rejections
		this.events.emit('change:rejections')
	}
}
