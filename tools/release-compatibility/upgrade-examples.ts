import {
	TFrame,
	TGuide,
	type IFrame,
	type ICollectionTransactionOptions,
	type ICollectionTransactions,
} from '@soxa-ui/core'
import { TAnchorPlugin, TPluginMount, type TFramePlacement } from '@soxa-ui/plugins'
import {
	collectionInitialOwnerOptions,
	collectionInitialState,
	TCollectionAriaState,
} from '@soxa-ui/setup'
import type {
	IAdapterContext,
	IAdapterContextOptions,
	TCollectionStatePort,
	TItemGroupPart,
} from '@soxa-ui/setup'

export function examples(
	context: IAdapterContext,
	state: TCollectionStatePort,
	adapterOptions: IAdapterContextOptions,
	transactions: ICollectionTransactions,
) {
	const mount = new TPluginMount()
	mount.patch('aria', { 'aria-controls': 'panel' })
	const pendingAria = mount.patches.aria
	const directView = new TCollectionAriaState(state, mount)
	const view = collectionInitialState(context, state)
	const options = collectionInitialOwnerOptions(adapterOptions)
	const transactionOptions: ICollectionTransactionOptions = { timeout: 1000, rollback() {} }
	const attempt = transactions.begin(transactionOptions)
	const group: TItemGroupPart = {
		uid: 1,
		label: 'Group',
		visible: true,
		events: { on() {}, off() {} },
	}
	mount.accept()
	attempt.commit()
	return { pendingAria, directView, view, options, group }
}

export function guideExample() {
	const frame: IFrame = new TFrame()
	const anchor = new TAnchorPlugin()
	const placement: TFramePlacement = 'bottom-start'
	anchor.placement = placement
	anchor.point = { x: 160, y: 90 }
	frame.show()

	return new TGuide({
		steps: [{ id: 'point', title: 'Editor', placement, anchor: { point: anchor.point } }],
	})
}
