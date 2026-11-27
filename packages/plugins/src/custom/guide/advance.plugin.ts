import type { IGuide } from '@soxa-ui/core'
import { TBasePlugin, type IPluginContext } from '../../base'
import { TElementPlugin } from '../element'

export class TGuideAdvancePlugin extends TBasePlugin<IGuide> {
	private _subscription: AbortController | null = null

	override install(ctx: IPluginContext): void {
		super.install(ctx)

		const guide = ctx.getInstance<IGuide>()
		const element = ctx.get(TElementPlugin)
		if (!guide || !element) return

		let stepId: string | undefined
		let source: EventTarget | undefined
		let event: string | undefined

		const sync = (): void => {
			const step = guide.visible && element.element ? guide.step : undefined
			const advance = step?.advanceOn
			if (stepId === step?.id && source === advance?.source && event === advance?.event)
				return

			this._stop()
			stepId = step?.id
			source = advance?.source
			event = advance?.event
			if (!advance) return

			const subscription = new AbortController()
			this._subscription = subscription
			advance.source.addEventListener(advance.event, () => guide.next(), {
				signal: subscription.signal,
			})
		}

		this._listenTo(guide.events, 'change:step', sync)
		this._listenTo(guide.events, 'change:visible', sync)
		this._listenTo(element.events, 'bind', sync)
		sync()
	}

	override destroy(): void {
		this._stop()
		super.destroy()
	}

	private _stop(): void {
		this._subscription?.abort()
		this._subscription = null
	}
}
