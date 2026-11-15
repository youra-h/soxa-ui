import { plainOf, selectOf, selectionOf, tagsOf } from '@soxa-ui/core'
import { TAriaPlugin } from '../../component-view'
import { TCollectionBundlesPlugin } from '../../collection'
import type { ISelect } from '@soxa-ui/core'
import { TBasePlugin } from '../../../base'
import type { IPluginContext } from '../../../base'
import { TPopupControls } from '../../overlay/popup-controls'

/** Keeps deterministic popup IDs and only references a bound popup. */
export class TSelectIdsPlugin extends TBasePlugin {
	private _controls: TPopupControls | undefined

	/** Internal Frame bundle hookup, exposed only as a protected descriptor output. */
	readonly bindPanel = (bundle: unknown): void => this._controls?.bindPanel(bundle)

	override destroy(): void {
		this._controls?.destroy()
		super.destroy()
	}

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const select = ctx.getInstance<ISelect>()

		if (!select) return

		const listId = ctx.createId('list')

		select.listAria.add('id', listId)
		this._controls = new TPopupControls(
			select.field.aria,
			listId,
			() => select.open && select.visible,
		)
		const sync = (): void => this._controls?.sync()

		this._listenTo(select.events, 'change:open', sync)
		this._listenTo(select.events, 'change:visible', sync)

		// A multiple combobox has an empty text input; its selected tags supply
		// the description without replacing form hints or the consumer's name.
		const tagsId = ctx.createId('selected')
		const aria = ctx.get(TAriaPlugin)

		ctx.get(TCollectionBundlesPlugin)?.events.on('engine:bound', (engine) => {
			const tags = tagsOf(engine)
			const selection = selectionOf(engine)
			const selected = selectOf(engine)

			const sync = (): void => {
				const list = tags?.tags

				list?.aria.add('id', tagsId)
				list?.aria.add('aria-label', selected?.text || null)

				if (aria) aria.parts = tags?.hasTags ? { describedBy: tagsId } : {}
			}

			const bindTags = (): void => {
				sync()

				const plain = plainOf(tags?.engine)

				this._listenTo(plain?.events, 'item:updated', sync)
				this._listenTo(plain?.events, 'change:items', sync)
			}

			bindTags()
			this._listenTo(tags?.events, 'change:tags', bindTags)
			this._listenTo(selection?.events, 'change:selection', sync)
		})
	}
}
