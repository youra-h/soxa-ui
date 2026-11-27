import type {
	IBatchCollectionProps,
	ICollectionProps,
	TActivationCollectionFacadeEvents,
	TActivationExtension,
	TActivationItemFacadeEvents,
	TBatchExtension,
	TCollectionEngine,
	TFactoryExtension,
	TMetaExtension,
	TOrderExtension,
	TPlainExtension,
	TUniqueExtension,
} from '../../../base/collection'
import type { IStepper } from '../types'
import type { IStepperItem, IStepperItemProps } from '../item/types'
import type { TStepperExtension } from './stepper.extension'

export type TStepperCollectionExtensions = {
	factory: TFactoryExtension<IStepperItem>
	unique: TUniqueExtension<IStepperItem>
	meta: TMetaExtension<IStepperItem>
	order: TOrderExtension<IStepperItem>
	plain: TPlainExtension<IStepperItem>
	batch: TBatchExtension<IStepperItem>
	activation: TActivationExtension<IStepperItem>
	stepper: TStepperExtension
}

export type TStepperCollection = TCollectionEngine<
	IStepperItem,
	TStepperCollectionExtensions,
	{ owner: IStepper }
>

export type TStepperCollectionEngine = TCollectionEngine<any, any>

export interface IStepperCollectionProps
	extends
		ICollectionProps<TStepperCollectionEngine>,
		IBatchCollectionProps<IStepperItemProps, IStepperItem> {}

export type TStepperExtensionEvents = {
	'change:steps': () => void
}

export type TStepperCollectionEvents = TActivationCollectionFacadeEvents<IStepperItem> &
	TStepperExtensionEvents

export type TStepperCollectionItemEvents = TActivationItemFacadeEvents & TStepperExtensionEvents
