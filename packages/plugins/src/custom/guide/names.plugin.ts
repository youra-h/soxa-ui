import type { IGuide } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext, type TPluginEvents } from '../../base'
import { GUIDE_NAMES } from '../../locale/locale'

type TGuideNamesEvents = TPluginEvents & { 'change:labels': () => void }
type TLabels = { previous: string; forward: string; close: string; progress: string }

export class TGuideNamesPlugin extends TBasePlugin<IGuide, TGuideNamesEvents> {
	private _labels: TLabels = { previous: '', forward: '', close: '', progress: '' }

	get labels(): TLabels {
		return this._labels
	}

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const owner = ctx.getInstance<IGuide>()
		if (!owner) return

		const sync = (): void => {
			const { tag, translations } = ctx.locale.locale
			const guide = translations.guide ?? GUIDE_NAMES
			const numbers = new Intl.NumberFormat(tag)

			this._labels = {
				previous: guide.previous,
				forward: owner.stepNumber === owner.stepCount ? guide.done : guide.next,
				close: translations.modal.close,
				progress: guide.progress
					.replace('{step}', numbers.format(owner.stepNumber))
					.replace('{count}', numbers.format(owner.stepCount)),
			}

			this.events.emit('change:labels')
		}

		this._listenTo(ctx.locale.events, 'change', sync)
		this._listenTo(owner.events, 'change:step', sync)
		this._listenTo(owner.events, 'change:steps', sync)
		sync()
	}
}
