import { TBasePlugin } from '../../base'
import type { IPluginContext } from '../../base'

/** Serializable owner declaration, retained once by the native mount. */
export interface ICollectionInitialSource {
	readonly items: readonly Readonly<Record<string, unknown>>[]
	readonly panels?: readonly ICollectionInitialPanel[]
}

export interface ICollectionInitialPanel {
	readonly value?: string | number
	readonly id?: string
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
	aria:
		| {
				getSnapshot(): Readonly<Record<string, unknown>>
				subscribe(listener: () => void): () => void
		  }
		| undefined

	override install(
		ctx: IPluginContext,
		options: { prepared?: boolean; id?: string; value?: string | number; panel?: boolean } = {},
	): void {
		super.install(ctx, options)

		this.prepared = options.prepared === true
		this.declaredId = options.id
		this.declaredValue = options.value
		this.panel = options.panel === true
	}
}
