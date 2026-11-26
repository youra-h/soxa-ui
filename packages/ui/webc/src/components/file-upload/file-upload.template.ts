import type { IFileUpload } from '@soxa-ui/core'
import { hasIcon, type DescriptorPluginOutputs, type FileUploadDescriptor } from '@soxa-ui/setup'
import { bind, roleIcon, TKeyedLoop, type ITemplate, type ITemplateContext } from '../../adapter'
import type { TButtonElementProps } from '../button'
import { iconButton } from '../common/icon-button'

type TOutputs = DescriptorPluginOutputs<typeof FileUploadDescriptor>
type TContext = ITemplateContext<IFileUpload, unknown, TOutputs>
type TRow = NonNullable<TContext['state']['names_rows']>[number]

type TParts = {
	readonly input: HTMLInputElement
	readonly choose: HTMLButtonElement
	readonly browse: HTMLButtonElement
	readonly drop: Text
	readonly hint: HTMLDivElement
	readonly message: HTMLDivElement
	readonly list: HTMLUListElement
	readonly rows: TKeyedLoop<TRow, number, HTMLLIElement>
}
type TCard = {
	readonly remove: TButtonElementProps
	readonly size: HTMLSpanElement
	readonly extension: HTMLSpanElement
	readonly image: HTMLImageElement
}

const parts = new WeakMap<HTMLElement, TParts>()
const cards = new WeakMap<HTMLLIElement, TCard>()

function part<K extends keyof HTMLElementTagNameMap>(
	doc: Document,
	tag: K,
	name: string,
): HTMLElementTagNameMap[K] {
	const element = doc.createElement(tag)
	element.className = name
	return element
}

function partsOf(root: HTMLElement): TParts {
	const template = parts.get(root)
	if (!template) throw new Error('FileUpload template is not mounted')
	return template
}

function updateCard(ctx: TContext, node: HTMLLIElement, row: TRow): void {
	const card = cards.get(node)
	if (!card) throw new Error('FileUpload card is not mounted')
	card.remove.disabled = ctx.state.disabled ?? false
	card.remove.setAttribute('aria-label', row.removeLabel)
	card.size.textContent = row.sizeText
	card.extension.textContent = row.extension
	const preview = ctx.state.native_previews?.[row.id]
	if (preview) {
		if (card.image.getAttribute('src') !== preview) card.image.src = preview
	} else card.image.removeAttribute('src')
	card.image.hidden = !preview
	card.extension.hidden = !!preview
}

function createCard(ctx: TContext, row: TRow): HTMLLIElement {
	const doc = ctx.root.ownerDocument
	const node = part(doc, 'li', 'so-file-upload__item')
	const preview = part(doc, 'div', 'so-file-upload__preview')
	const image = doc.createElement('img')
	const extension = doc.createElement('span')
	const details = part(doc, 'div', 'so-file-upload__details')
	const name = doc.createElement('bdi')
	const size = part(doc, 'span', 'so-file-upload__size')
	const { button: remove } = iconButton(
		doc,
		{
			embedded: 'file-upload.remove',
			iconEmbedded: 'file-upload.remove-icon',
			className: 'so-file-upload__remove',
			role: 'close',
		},
		false,
	)

	preview.setAttribute('aria-hidden', 'true')
	image.alt = ''
	preview.append(image, extension)
	name.textContent = row.file.name
	details.append(name, size)
	remove.setAttribute('data-file-id', String(row.id))
	node.append(preview, details, remove)

	const sample = ctx.sample('item-progress')
	if (sample) {
		const progress = part(doc, 'div', 'so-file-upload__progress')
		progress.append(sample)
		node.append(progress)
	}

	cards.set(node, { remove, size, image, extension })
	updateCard(ctx, node, row)
	return node
}

export const fileUploadTemplate: ITemplate<IFileUpload, unknown, TOutputs> = {
	create(root) {
		const doc = root.ownerDocument
		const input = part(doc, 'input', 'so-file-upload__input')
		const dropzone = part(doc, 'div', 'so-file-upload__dropzone')
		const symbol = part(doc, 'span', 'so-file-upload__symbol')
		const choose = part(doc, 'button', 'so-file-upload__choose')
		const prompt = part(doc, 'div', 'so-file-upload__prompt')
		const drop = doc.createTextNode('')
		const browse = part(doc, 'button', 'so-file-upload__browse')
		const hint = part(doc, 'div', 'so-file-upload__hint')
		const message = part(doc, 'div', 'so-file-upload__message')
		const list = part(doc, 'ul', 'so-file-upload__list')

		input.type = 'file'
		input.tabIndex = -1
		symbol.setAttribute('aria-hidden', 'true')
		choose.type = browse.type = 'button'
		symbol.append(roleIcon(hasIcon('upload') ? 'upload' : 'arrowUpward'))
		choose.append(symbol)
		prompt.append(drop, browse)
		message.setAttribute('role', 'status')
		list.setAttribute('role', 'list')
		dropzone.append(choose, prompt, hint)
		root.append(input, dropzone, message, list)
		const rows = new TKeyedLoop<TRow, number, HTMLLIElement>(list, null, (row) => row.id)
		parts.set(root, { input, choose, browse, drop, hint, message, list, rows })
		return { slots: { 'item-progress': { mode: 'sample' } } }
	},
	bindings: [
		bind(
			['accept', 'name', 'form', 'multiple', 'required', 'disabled', 'names_choose'],
			(ctx) => {
				const { input, choose, browse } = partsOf(ctx.root)
				for (const key of ['accept', 'name', 'form'] as const) {
					const value = ctx.state[key]
					if (value) input.setAttribute(key, value)
					else input.removeAttribute(key)
				}
				input.multiple = ctx.state.multiple ?? false
				input.required = ctx.state.required ?? false
				input.disabled = choose.disabled = browse.disabled = ctx.state.disabled ?? false
				input.setAttribute('aria-label', ctx.state.names_choose ?? '')
				choose.setAttribute('aria-label', ctx.state.names_choose ?? '')
			},
		),
		bind(['names_drop', 'names_browse', 'names_hint', 'names_message'], (ctx) => {
			const { drop, browse, hint, message } = partsOf(ctx.root)
			drop.data = (ctx.state.names_drop ?? '') + ' '
			browse.textContent = ctx.state.names_browse ?? ''
			hint.textContent = ctx.state.names_hint ?? ''
			message.textContent = ctx.state.names_message ?? ''
		}),
		bind(['names_rows', 'disabled', 'native_previews'], (ctx) => {
			const { list, rows } = partsOf(ctx.root)
			const files = ctx.state.names_rows ?? []
			list.hidden = !files.length
			rows.draw(
				files,
				(row) => createCard(ctx, row),
				(node, row) => updateCard(ctx, node, row),
			)
		}),
	],
}
