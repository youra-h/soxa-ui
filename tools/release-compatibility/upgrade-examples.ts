import type { ICollectionTransactionOptions, ICollectionTransactions } from '@soxa-ui/core'
import { TPluginMount } from '@soxa-ui/plugins'
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
