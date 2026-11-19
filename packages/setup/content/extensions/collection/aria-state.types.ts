/**
 * Read-only state ports used to derive one mount's ARIA without writing its data model.
 */
import type { IMountSnapshotPort } from '@soxa-ui/plugins'

import type { TStateStore } from '../../../protected/adapter/exchange'

export type TCollectionStatePort = Pick<TStateStore, 'getSnapshot' | 'subscribe'>

export interface ICollectionAriaStateOptions {
	readonly state: TCollectionStatePort
	/** The mount's document link, merged into its `aria`. */
	readonly link?: IMountSnapshotPort
	/** Records by state field (`closeAria`), merged into those fields. */
	readonly outputs?: readonly IMountSnapshotPort<Readonly<Record<string, unknown>>>[]
}
