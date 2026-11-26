import type { ISplitter, ISplitterHandle, ISplitterPanel } from '@soxa-ui/core'
import type { TInstanceContext } from '../../../protected/adapter/context'
import type { IElevatorKey, TElevatorFactory } from '../../../protected/adapter/elevator'

type TSplitterLink = { owner: ISplitter; idFor: (panel: string) => string }

const SPLITTER: IElevatorKey<TSplitterLink | null> = { name: 'soxa:splitter' }

interface ISplitterExtensionOptions {
	elevator: TElevatorFactory
}

export class TSplitterExtension {
	constructor(context: TInstanceContext<ISplitter>, { elevator }: ISplitterExtensionOptions) {
		const bundle = context.bundle

		if (!bundle) return

		elevator(SPLITTER).down({
			owner: context.instance,
			idFor: (panel) => bundle.createId(`panel-${encodeURIComponent(panel)}`),
		})
	}
}

export class TSplitterPartExtension {
	constructor(
		context: TInstanceContext<ISplitterPanel | ISplitterHandle>,
		{ elevator }: ISplitterExtensionOptions,
	) {
		const link = elevator(SPLITTER).up()

		if (!link) return

		const { owner, idFor } = link
		const part = context.instance
		const events: {
			on(event: 'change:panel', handler: () => void): void
			off(event: 'change:panel', handler: () => void): void
		} = part.events
		const isHandle = 'size' in part

		const sync = (): void => {
			part.sync(owner)
			const index = owner.indexOf(part.panel)
			const id = index >= 0 ? idFor(part.panel) : null

			if (isHandle) {
				part.aria.add('aria-controls', index < owner.sizes.length - 1 ? id : null)
			} else {
				part.attrs.add('id', id)
			}
		}

		// The first render has the full layout. Only accepted parts subscribe to their owner.
		sync()

		context.events.on('attach', () => {
			events.on('change:panel', sync)
			owner.events.on('change:panels', sync)
			owner.events.on('change:sizes', sync)
			owner.events.on('change:orientation', sync)
			owner.events.on('change:disabled', sync)
			owner.events.on('change:activeThumb', sync)
			if (isHandle) owner.events.on('change:thumb', sync)
			sync()
		})

		context.events.on('destroy', () => {
			events.off('change:panel', sync)
			owner.events.off('change:panels', sync)
			owner.events.off('change:sizes', sync)
			owner.events.off('change:orientation', sync)
			owner.events.off('change:disabled', sync)
			owner.events.off('change:activeThumb', sync)
			if (isHandle) owner.events.off('change:thumb', sync)
			part.sync(null)
			if (isHandle) part.aria.remove('aria-controls')
			else part.attrs.remove('id')
		})
	}
}
