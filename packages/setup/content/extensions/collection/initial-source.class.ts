/**
 * One owner-local initial snapshot, its data models and predeclared document links.
 */
import { activationOf, batchOf, factoryOf, metaOf, selectionOf } from '@soxa-ui/core'
import type { TCollectionEngine } from '@soxa-ui/core'
import type {
	ICollectionInitialLink,
	ICollectionInitialOptions,
	ICollectionInitialPanel,
	ICollectionInitialSource,
	TCollectionInitialMount,
} from './initial.types'

function isPlain(value: unknown): value is Record<string, unknown> {
	if (typeof value !== 'object' || value === null) return false

	const prototype: unknown = Object.getPrototypeOf(value)

	return prototype === Object.prototype || prototype === null
}

/** Snapshot before any engine writes: later edits to the application's object are not new input. */
function copy(value: unknown, ancestors: Set<object> = new Set()): unknown {
	if (
		value === undefined ||
		value === null ||
		typeof value === 'string' ||
		typeof value === 'boolean' ||
		(typeof value === 'number' && Number.isFinite(value))
	) {
		return value
	}

	if (!Array.isArray(value) && !isPlain(value)) {
		throw new Error('Collection initial source must contain plain serializable data.')
	}
	if (ancestors.has(value)) throw new Error('Collection initial source must not be cyclic.')

	ancestors.add(value)

	if (Object.getOwnPropertySymbols(value).length > 0) {
		throw new Error('Collection initial source must not contain symbol keys.')
	}

	try {
		if (Array.isArray(value)) return Object.freeze(value.map((entry) => copy(entry, ancestors)))

		return Object.freeze(
			Object.fromEntries(
				Object.entries(value).map(([key, entry]) => [key, copy(entry, ancestors)]),
			),
		)
	} finally {
		ancestors.delete(value)
	}
}

/** Compare captured plain data by content; cloning must not change external metadata identity. */
function sameData(actual: unknown, expected: unknown): boolean {
	if (Object.is(actual, expected)) return true

	if (Array.isArray(expected)) {
		return (
			Array.isArray(actual) &&
			actual.length === expected.length &&
			expected.every((entry, index) => sameData(actual[index], entry))
		)
	}

	if (!isPlain(expected) || !isPlain(actual)) return false

	const keys = Object.keys(expected)

	return (
		Object.keys(actual).length === keys.length &&
		keys.every((key) => Object.hasOwn(actual, key) && sameData(actual[key], expected[key]))
	)
}

function valueOf(source: Readonly<Record<string, unknown>>): string | number | undefined {
	const value = source.value

	if (value !== undefined && typeof value !== 'string' && typeof value !== 'number') {
		throw new Error('Collection initial value must be a string or a number.')
	}

	return value
}

function idOf(source: Readonly<Record<string, unknown>>): string | undefined {
	const id = source.id

	if (id !== undefined && typeof id !== 'string') {
		throw new Error('Collection initial id must be a string.')
	}

	return id
}

/** Validate the captured declaration completely before materialization can mutate an engine. */
function sourceOf(value: unknown): ICollectionInitialSource {
	const snapshot = copy(value)

	if (!isPlain(snapshot) || !Array.isArray(snapshot.items)) {
		throw new Error('Collection initial source must declare an items array.')
	}

	for (const key of Object.keys(snapshot)) {
		if (key !== 'items' && key !== 'panels') {
			throw new Error(`Unknown collection initial source property: ${key}.`)
		}
	}

	const items: Readonly<Record<string, unknown>>[] = []

	for (const item of snapshot.items) {
		if (!isPlain(item)) throw new Error('Collection initial items must be plain objects.')

		valueOf(item)
		idOf(item)

		if (item._ !== undefined && !isPlain(item._)) {
			throw new Error('Collection initial item meta must be a plain object.')
		}
		if ('active' in item || 'selected' in item) {
			throw new Error('Collection initial item state belongs in the _ meta object.')
		}

		items.push(item)
	}

	let panels: ICollectionInitialPanel[] | undefined

	if (snapshot.panels !== undefined) {
		if (!Array.isArray(snapshot.panels)) {
			throw new Error('Collection initial panels must be an array.')
		}

		panels = snapshot.panels.map((panel: unknown) => {
			if (!isPlain(panel)) throw new Error('Collection initial panels must be plain objects.')

			for (const key of Object.keys(panel)) {
				if (key !== 'value' && key !== 'id') {
					throw new Error(`Unknown collection initial panel property: ${key}.`)
				}
			}

			return Object.freeze({ value: valueOf(panel), id: idOf(panel) })
		})
	}

	return Object.freeze({ items: Object.freeze(items), panels: panels && Object.freeze(panels) })
}

function ordinalOf(value: unknown, length: number): number {
	if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value >= length) {
		throw new Error('Collection initial ordinal must be an integer within its declared source.')
	}

	return value
}

function metadataOf(source: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {
	return isPlain(source._) ? source._ : {}
}

/**
 * One initial declaration snapshot and its materialization, retained by the native owner lifetime.
 * It owns no active/selected state: after the first batch write the engine is authoritative.
 */
export class TCollectionInitialSource {
	readonly source: ICollectionInitialSource
	private _engine: TCollectionEngine<any, any> | undefined
	private _items: readonly object[] | undefined
	private readonly _links = new Map<object, ICollectionInitialLink>()
	private readonly _ordinals = new Map<object, number>()
	private readonly _external: TCollectionEngine<any, any> | undefined
	private readonly _panelDefaultValue: string | number | undefined

	constructor(options: ICollectionInitialOptions) {
		if (options.items !== undefined) {
			throw new Error('Collection initial and items cannot be supplied together.')
		}

		this.source = sourceOf(options.initial)
		this._external = options.engine
		this._panelDefaultValue = options.panelDefaultValue

		// Validate the entire external source before a facade can complete or bind its engine.
		if (options.engine) this._validateExternal(options.engine)
	}

	get engine(): TCollectionEngine<any, any> | undefined {
		return this._engine ?? this._external
	}

	get items(): readonly object[] {
		if (!this._items) throw new Error('Collection initial source has not been materialized.')

		return this._items
	}

	/** Create owned models once, or validate external ones, then prepare both ends of every link. */
	materialize(engine: TCollectionEngine<any, any>, mount: TCollectionInitialMount): void {
		if (this._engine) {
			if (this._engine !== engine) {
				throw new Error('Collection initial source cannot be shared between owner engines.')
			}

			return
		}

		if (this._external && this._external !== engine) {
			throw new Error('Collection initial source must retain its external engine.')
		}

		const batch = batchOf<object>(engine)
		const factory = factoryOf<object>(engine)

		if (!batch || !factory) {
			throw new Error('Collection initial source needs an item factory and batch extension.')
		}

		if (this._external) this._validateExternal(engine)
		else batch.items = this.source.items

		const items = batch.items

		if (
			items.length !== this.source.items.length ||
			items.some((item) => factory.isSource(item))
		) {
			throw new Error('Collection initial source did not materialize its declared items.')
		}

		const firstByValue = new Map<unknown, number>()

		const links = this.source.items.map((source, ordinal) => {
			const value: unknown = Reflect.get(items[ordinal], 'value')

			if (!firstByValue.has(value)) firstByValue.set(value, ordinal)

			return {
				tabId: idOf(source) ?? mount.createId(`initial-tab-${ordinal}`),
				panelId: mount.createId(`initial-panel-${ordinal}`),
				tabFallbackId: mount.createId(`initial-tab-${ordinal}`),
				panelFallbackId: mount.createId(`initial-panel-${ordinal}`),
			}
		})

		// Value only finds a pair; every item retains its distinct ordinal and model.
		for (const panel of this.source.panels ?? []) {
			const ordinal = firstByValue.get(this._panelValue(panel))

			if (ordinal !== undefined) {
				links[ordinal].panelId = panel.id ?? mount.createId(`initial-panel-${ordinal}`)
			}
		}

		this._engine = engine
		this._items = Object.freeze([...items])

		items.forEach((item, index) => {
			this._links.set(item, Object.freeze(links[index]))
			this._ordinals.set(item, index)
		})
	}

	/** Resolve a declaration position without recreating data removed from the live engine. */
	item<T extends object>(ordinal: unknown, ctor: new (...args: any[]) => T, ctrl?: T): T {
		const item = this.items[ordinalOf(ordinal, this.items.length)]

		// The engine owns live membership after initial acceptance; removed data must not revive.
		if (!batchOf<object>(this._engine)?.items.includes(item)) {
			throw new Error('Collection initial item is no longer in its owner engine.')
		}

		if (!(item instanceof ctor)) {
			throw new Error('Collection initial item belongs to a different component type.')
		}
		if (ctrl !== undefined && ctrl !== item) {
			throw new Error('Collection initial ordinal and ctrl must identify the same item.')
		}

		return item
	}

	panel(ordinal: unknown): ICollectionInitialPanel {
		const panels = this.source.panels

		if (!panels) throw new Error('Collection initial source does not declare panels.')

		return panels[ordinalOf(ordinal, panels.length)]
	}

	link(item: object): ICollectionInitialLink | undefined {
		return this._links.get(item)
	}

	ordinal(item: object): number | undefined {
		return this._ordinals.get(item)
	}

	/** Match the panel against current membership while retaining the item's prepared IDs. */
	panelLink(ordinal: unknown): ICollectionInitialLink | undefined {
		const panel = this.panel(ordinal)
		const item = batchOf<object>(this._engine)?.items.find(
			(item) => Reflect.get(item, 'value') === this._panelValue(panel),
		)

		return item ? this.link(item) : undefined
	}

	private _panelValue(panel: ICollectionInitialPanel): string | number | undefined {
		return panel.value ?? this._panelDefaultValue
	}

	/** External models and metadata are checked, never rewritten to fit the declaration. */
	private _validateExternal(engine: TCollectionEngine<any, any>): void {
		const batch = batchOf<object>(engine)
		const factory = factoryOf<object>(engine)

		if (!batch || !factory || batch.items.length !== this.source.items.length) {
			throw new Error('Collection initial source must describe an existing complete engine.')
		}

		batch.items.forEach((item, ordinal) => {
			if (factory.isSource(item)) {
				throw new Error(
					'Collection initial external engine must already contain item models.',
				)
			}

			const source = this.source.items[ordinal]

			for (const [key, value] of Object.entries(source)) {
				if (key !== '_' && key !== 'id' && !sameData(Reflect.get(item, key), value)) {
					throw new Error(
						`Collection initial external item ${ordinal} differs at ${key}.`,
					)
				}
			}

			for (const [key, value] of Object.entries(metadataOf(source))) {
				const actual =
					key === 'active'
						? activationOf<object>(engine)?.isActive(item)
						: key === 'selected'
							? selectionOf<object>(engine)?.isSelected(item)
							: metaOf<object>(engine)?.get(item)?.[key]

				if (!sameData(actual, value)) {
					throw new Error(
						`Collection initial external item ${ordinal} differs at _.${key}.`,
					)
				}
			}
		})
	}
}
