import { TButton } from '@soxa-ui/core'
import { TBasePlugin } from '@soxa-ui/plugins'
import type { IPluginContext } from '@soxa-ui/plugins'
import { definePlugin } from '@soxa-ui/setup'
import type { AuditEvents } from './plugin-types'

/** Report changes to a button's text for application auditing. */
export class TTextAuditPlugin extends TBasePlugin<TButton, AuditEvents> {
	static readonly defaultValues = { prefix: 'audit' }
	private _prefix = TTextAuditPlugin.defaultValues.prefix
	records = 0

	get prefix(): string {
		return this._prefix
	}
	set prefix(value: string) {
		if (value === this._prefix) return

		this._prefix = value
		this.events.emit('change:prefix', value)
	}

	override install(ctx: IPluginContext, options?: unknown): void {
		super.install(ctx, options)
		const owner = ctx.getInstance()
		if (!(owner instanceof TButton)) return

		// The controller may outlive this mount; the base removes this subscription.
		this._listenTo(owner.events, 'change:text', ({ newValue }) => {
			this.records++
			this.events.emit('record', { prefix: this.prefix, text: newValue })
		})
	}
}

definePlugin({
	ctor: TTextAuditPlugin,
	namespace: 'audit',
	contribution: {
		props: { prefix: { type: String, triggers: ['change:prefix'] } },
		events: ['record'],
	},
})
