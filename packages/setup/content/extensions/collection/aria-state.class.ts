/**
 * One standard mount snapshot with read-only document relationships and localized part names.
 */
import type { TStateListener, TStateSnapshot } from '../../../protected/adapter/exchange'
import type { ICollectionAriaStateOptions } from './aria-state.types'
function recordOf(value: unknown): Readonly<Record<string, unknown>> {
	return typeof value === 'object' && value !== null
		? Object.fromEntries(Object.entries(value))
		: {}
}
const EMPTY = Object.freeze({})

/** The core owns state; these overlays belong to one DOM mount and never write a shared model. */
export class TCollectionAriaState {
	private _base: TStateSnapshot | undefined
	private _link: Readonly<Record<string, unknown>> | undefined
	private _outputs: readonly Readonly<Record<string, unknown>>[] = []
	private _snapshot: TStateSnapshot | undefined
	private readonly _fields = new Map<string, { base: unknown; link: unknown; value: unknown }>()
	constructor(private readonly _options: ICollectionAriaStateOptions) {}

	getSnapshot(): TStateSnapshot {
		const base = this._options.state.getSnapshot()
		const link = this._options.link?.getSnapshot() ?? EMPTY
		const outputs = (this._options.outputs ?? []).map((output) => output.getSnapshot())
		if (
			this._snapshot &&
			this._base === base &&
			this._link === link &&
			outputs.every((output, index) => output === this._outputs[index])
		)
			return this._snapshot
		const snapshot = { ...base }
		const combine = (name: string, patch: unknown): void => {
			const cached = this._fields.get(name)
			if (cached && cached.base === base[name] && cached.link === patch)
				snapshot[name] = cached.value
			else {
				const value = Object.freeze({ ...recordOf(base[name]), ...recordOf(patch) })
				this._fields.set(name, { base: base[name], link: patch, value })
				snapshot[name] = value
			}
		}
		if (this._options.link) combine('aria', link)
		for (const output of outputs)
			for (const [name, value] of Object.entries(output)) combine(name, value)
		this._base = base
		this._link = link
		this._outputs = outputs
		this._snapshot = Object.freeze(snapshot)
		return this._snapshot
	}

	subscribe(listener: TStateListener): () => void {
		const releases = (this._options.outputs ?? []).map((output) =>
			output.subscribe(() => {
				const snapshot = this.getSnapshot()
				for (const name of Object.keys(output.getSnapshot())) listener(name, snapshot[name])
			}),
		)
		if (this._options.link)
			releases.push(
				this._options.link.subscribe(() => listener('aria', this.getSnapshot().aria)),
			)
		releases.push(
			this._options.state.subscribe((name) => {
				listener(name, this.getSnapshot()[name])
			}),
		)
		return () => {
			for (const release of releases) release()
		}
	}
}
