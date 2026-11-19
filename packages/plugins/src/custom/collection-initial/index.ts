import { TBasePlugin } from '../../base'
import type { IMountSnapshotPort, IPluginContext } from '../../base'

/** Serializable owner declaration, retained once by the native mount. */
export interface ICollectionInitialSource {
	readonly items: readonly Readonly<Record<string, unknown>>[]
	readonly panels?: readonly ICollectionInitialPanel[]
}

export interface ICollectionInitialPanel {
	readonly value?: string | number
	readonly id?: string
}

/** Installation input of a part: the descriptor's `panel` and a prepared mount's declaration. */
export interface ICollectionInitialPartOptions {
	readonly prepared?: boolean
	readonly panel?: boolean
	readonly id?: string
	readonly value?: string | number
}

/** Descriptor carriers consume initial input without exposing it as DOM or core state. */
export class TCollectionInitialPlugin extends TBasePlugin {
	static defaultValues = { initial: undefined }
	initial: ICollectionInitialSource | undefined
}

/** Retains a prepared part's declaration separately from the shared model's live state. */
export class TCollectionInitialPartPlugin extends TBasePlugin {
	static defaultValues = { initial: undefined }
	initial: number | undefined
	prepared = false
	declaredId: string | undefined
	declaredValue: string | number | undefined
	panel = false
	/** A prepared panel's link to its tab, merged into the panel's state by the adapter. */
	aria: IMountSnapshotPort | undefined

	override install(ctx: IPluginContext, options: ICollectionInitialPartOptions = {}): void {
		super.install(ctx, options)

		this.prepared = options.prepared === true
		this.declaredId = options.id
		this.declaredValue = options.value
		this.panel = options.panel === true
	}
}
