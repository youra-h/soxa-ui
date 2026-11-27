import {
	TBaseItemExtension,
	TBaseOwnerItemExtension,
	activationOf,
	batchOf,
	plainOf,
} from '../../../base/collection'
import type { IExtensionContext, TBaseItemEventsExtension } from '../../../base/collection'
import type { IStepper } from '../types'
import type { IStepperItem } from '../item/types'
import { TStepperItem } from '../item/item.class'
import type { TStepperExtensionEvents } from './types'

class TStepperItemExtension extends TBaseItemExtension<
	IStepperItem,
	TStepperExtension,
	TStepperExtensionEvents & TBaseItemEventsExtension
> {
	constructor(item: IStepperItem, parent: TStepperExtension) {
		super(item, parent)
		this.events.relayAll(parent.events)
	}

	get number(): number {
		return this._parent.indexOf(this._item) + 1
	}

	get hasSeparator(): boolean {
		return this._parent.hasSeparator(this._item)
	}

	get canActivate(): boolean {
		return this._parent.canActivate(this._item)
	}

	get interactive(): boolean {
		return this._parent.interactive
	}
}

export class TStepperExtension extends TBaseOwnerItemExtension<
	IStepperItem,
	TStepperItemExtension,
	TStepperExtensionEvents,
	{ owner: IStepper }
> {
	readonly name = 'stepper'
	private _items: ReadonlyArray<IStepperItem> = []
	private _positions = new Map<IStepperItem, number>()
	private _firstIncomplete = 0
	private _syncing = false

	constructor() {
		super(TStepperItemExtension)
	}

	override install(ctx: IExtensionContext<IStepperItem, { owner: IStepper }>): void {
		super.install(ctx)

		const activation = activationOf(ctx)
		const plain = plainOf(ctx)
		const batch = batchOf(ctx)
		const refresh = () => this._refresh()
		const signals = [
			'change:completed',
			'change:disabled',
			'change:present',
			'change:value',
		] as const
		const observe = (item: IStepperItem) => {
			for (const signal of signals) item.events.on(signal, refresh)
		}
		const unobserve = (item: IStepperItem) => {
			for (const signal of signals) item.events.off(signal, refresh)
		}

		batch?.items.forEach(observe)
		plain?.events.on('item:added', ({ item }) => {
			if (!(item instanceof TStepperItem)) return

			observe(item)
			this._inheritStyle(item)
		})
		plain?.events.on('item:removed', (event) => unobserve(event.item))
		plain?.events.on('item:updated', ({ item }) => this._inheritStyle(item))
		batch?.events.on('change:shown', refresh)

		activation?.events.on('item:activate:before', (event) => {
			if (!this.canActivate(event.item)) event.preventDefault()
		})
		activation?.events.on('change:activation', (item, previous) => {
			previous?.aria.remove('aria-current')
			item?.aria.add('aria-current', 'step')
			this._publishActive()
			this.events.emit('change:steps')
		})

		ctx.options.watch('owner', (owner, scope) => {
			if (owner) {
				const inheritStyle = () => batch?.items.forEach((item) => this._inheritStyle(item))

				inheritStyle()
				scope.on(owner.events, 'change:size', inheritStyle)
				scope.on(owner.events, 'change:variant', inheritStyle)

				scope.on(owner.events, 'change:value:before', (event) => {
					if (this._syncing) return

					const target = this._items.find((item) => item.value === event.value)
					if (target && !this.canActivate(target)) event.preventDefault()
				})
				scope.on(owner.events, 'change:value', refresh)
				scope.on(owner.events, 'change:disabled', refresh)
				scope.on(owner.events, 'change:linear', refresh)
				scope.on(owner.events, 'change:interactive', refresh)
			}

			refresh()
		})
	}

	private _inheritStyle(item: IStepperItem): void {
		const owner = this._ctx.options.get('owner')
		if (!owner) return

		item.size = owner.size
		item.variant = owner.variant
	}

	get interactive(): boolean {
		return this._ctx.options.get('owner')?.interactive ?? true
	}

	indexOf(item: IStepperItem | undefined): number {
		return item ? (this._positions.get(item) ?? -1) : -1
	}

	hasSeparator(item: IStepperItem): boolean {
		const index = this.indexOf(item)

		return index >= 0 && index < this._items.length - 1
	}

	canActivate(item: IStepperItem): boolean {
		const owner = this._ctx.options.get('owner')
		const index = this.indexOf(item)
		if (index < 0 || item.disabled || owner?.disabled) return false
		if (!owner?.linear) return true

		const current = this.indexOf(activationOf(this._ctx)?.activeItem)

		return index <= current || index <= this._firstIncomplete
	}

	adjacent(direction: -1 | 1): IStepperItem | undefined {
		const current = this.indexOf(activationOf(this._ctx)?.activeItem)

		for (
			let index = current + direction;
			index >= 0 && index < this._items.length;
			index += direction
		) {
			const item = this._items[index]
			if (this.canActivate(item)) return item
		}

		return undefined
	}

	private _refresh(): void {
		const owner = this._ctx.options.get('owner')
		const previousIndex = owner
			? this._items.findIndex((item) => item.value === owner.value)
			: -1

		this._items = (batchOf(this._ctx)?.shown ?? []).filter((item) => item.present)
		this._positions = new Map(this._items.map((item, index) => [item, index]))
		const incomplete = this._items.findIndex((item) => !item.completed)
		this._firstIncomplete = incomplete < 0 ? this._items.length : incomplete

		if (owner && !this._syncing) this._reconcile(owner, previousIndex)
		this.events.emit('change:steps')
	}

	private _reconcile(owner: IStepper, previousIndex: number): void {
		const activation = activationOf(this._ctx)
		if (!activation) return

		const current = activation.activeItem
		if (current && this.indexOf(current) < 0) activation.reset()

		const requested = owner.value
		const target = this._items.find((item) => item.value === requested)
		if (target && activation.activate(target)) return

		// A requested item may arrive later. Only replace one known to have left the list.
		if (!target && requested !== undefined && previousIndex < 0) return

		if (!target || !activation.activeItem) {
			const index = Math.max(0, previousIndex)
			const candidates = [
				...this._items.slice(index),
				...this._items.slice(0, index).reverse(),
			]

			for (const item of candidates) {
				if (activation.activate(item)) break
			}
		}

		this._publishActive()
	}

	private _publishActive(): void {
		const owner = this._ctx.options.get('owner')
		const active = activationOf(this._ctx)?.activeItem
		if (!owner || !active || this._syncing) return

		this._syncing = true
		try {
			owner.value = active.value
		} finally {
			this._syncing = false
		}
	}
}
