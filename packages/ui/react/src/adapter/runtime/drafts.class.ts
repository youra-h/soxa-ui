/**
 * Tracks assemblies React has not accepted. A retry can discard a draft
 * that borrowed the same controller or engine. Acceptance and destruction
 * both remove the draft's entries. See the React adapter's AGENTS.md.
 */

import type { IAdapterContextOptions } from '@soxa-ui/setup'

function isObject(value: unknown): value is object {
	return typeof value === 'object' && value !== null
}

type TDraft = {
	readonly held: readonly object[]
	readonly destroy: () => void
	/** Id монтирования черновика: его `id` уже лежат в `ctrl`. */
	readonly mountId: string
}

export type TTaken = { readonly held: object[]; readonly mountId?: string }

export class TDrafts {
	/** Непринятые сборки — по каждому объекту, который они взяли снаружи. */
	private readonly _drafts = new WeakMap<object, TDraft>()

	/** Взятое снаружи — `ctrl` и движок фасада; id — выброшенного черновика того же `ctrl`. */
	take(options: IAdapterContextOptions): TTaken {
		const engine: unknown = options.options ? Reflect.get(options.options, 'engine') : undefined
		const held = [options.ctrl, engine].filter(isObject)
		const mountId = options.ctrl ? this._drafts.get(options.ctrl)?.mountId : undefined

		for (const value of held) this._discard(value)

		return { held, mountId }
	}

	add(held: readonly object[], destroy: () => void, mountId: string): void {
		if (held.length === 0) return

		const draft = { held, destroy, mountId }

		for (const value of held) this._drafts.set(value, draft)
	}

	forget(held: readonly object[]): void {
		for (const value of held) {
			if (this._drafts.get(value)?.held === held) this._drafts.delete(value)
		}
	}

	private _discard(value: object): void {
		const draft = this._drafts.get(value)

		if (draft === undefined) return

		this.forget(draft.held)
		draft.destroy()
	}
}
