import { TActivationCollectionFacade, TActivationItemFacade } from '../../../base/collection'
import type {
	TCollectionFacadeOptions,
	TCollectionFacadeProps,
	TItemContext,
} from '../../../base/collection'
import {
	activationExtensions,
	completeEngine,
	createComponentEngine,
} from '../../../base/collection/create/internal'
import type { TCreateEngineOptions } from '../../../base/collection'
import type { IStepper } from '../types'
import type { IStepperItem } from '../item/types'
import { TStepperItem } from '../item/item.class'
import { TStepperExtension } from './stepper.extension'
import type {
	TStepperCollection,
	TStepperCollectionEvents,
	TStepperCollectionExtensions,
	TStepperCollectionItemEvents,
	TStepperCollectionEngine,
} from './types'

function stepperExtensions() {
	return {
		...activationExtensions<IStepperItem>(TStepperItem),
		stepper: () => new TStepperExtension(),
	}
}

export function createEngineStepper(
	options: TCreateEngineOptions<IStepperItem> & { owner?: IStepper } = {},
): TStepperCollection {
	return createComponentEngine(stepperExtensions(), options)
}

export class TStepperCollectionFacade extends TActivationCollectionFacade<
	IStepperItem,
	TStepperCollectionExtensions,
	TStepperCollectionEvents
> {
	constructor(
		props: TCollectionFacadeProps<IStepperItem> = {},
		options: TCollectionFacadeOptions<TStepperCollectionEngine, IStepper> = {},
	) {
		super(
			{},
			{
				engine: completeEngine(options.engine, stepperExtensions()),
				owner: options.owner,
			},
		)

		if (!options.engine) this.bindOwner()
		this.events.relayAll(this.extensions.stepper.events)
		this.applyProps(props)
	}

	get stepper_canNext(): boolean {
		return this.extensions.stepper.adjacent(1) !== undefined
	}

	get stepper_canPrevious(): boolean {
		return this.extensions.stepper.adjacent(-1) !== undefined
	}

	readonly next = (): boolean => this._move(1)
	readonly previous = (): boolean => this._move(-1)

	private _move(direction: -1 | 1): boolean {
		const item = this.extensions.stepper.adjacent(direction)

		return item !== undefined && this.extensions.activation.activate(item)
	}
}

export class TStepperItemCollectionFacade extends TActivationItemFacade<
	IStepperItem,
	TStepperCollectionExtensions,
	TStepperCollectionItemEvents
> {
	override setContext(context: TItemContext<IStepperItem, TStepperCollectionExtensions>): void {
		super.setContext(context)
		this.events.relayAll(context.adapters.stepper.events)
	}

	get stepper_number(): number {
		return this._context?.adapters.stepper.number || 1
	}

	get stepper_hasSeparator(): boolean {
		return this._context?.adapters.stepper.hasSeparator ?? false
	}

	get stepper_canActivate(): boolean {
		return this._context?.adapters.stepper.canActivate ?? false
	}

	get stepper_interactive(): boolean {
		return this._context?.adapters.stepper.interactive ?? true
	}
}
