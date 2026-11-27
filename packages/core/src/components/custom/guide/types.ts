import type { TValuePayload } from '../../../common'
import type { ICloseRequestable, ILayerProps, TCloseEvent } from '../../base/layer'
import type { IFrame, TFrameEvents, TFramePlacement } from '../frame'

/** DOM reference or a point in viewport CSS pixels. */
export type TGuideAnchor =
	| { readonly element: () => Element | null }
	| { readonly point: { readonly x: number; readonly y: number } }

/** While the step is shown, this event advances the guide once. */
export interface IGuideAdvance {
	readonly source: EventTarget
	readonly event: string
}

export interface IGuideStep {
	readonly id: string
	readonly title: string
	readonly description?: string
	readonly mode?: 'modal' | 'nonmodal'
	readonly anchor?: TGuideAnchor
	readonly placement?: TFramePlacement
	readonly advanceOn?: IGuideAdvance
}

export interface IGuideProps extends ILayerProps {
	steps?: readonly IGuideStep[]
}

export type TGuideEvents = TFrameEvents & {
	'change:steps': (payload: TValuePayload<readonly IGuideStep[]>) => void
	'change:step': (payload: TValuePayload<IGuideStep | undefined>) => void
	'change:modal': (payload: TValuePayload<boolean>) => void
	'close:before': (event: TCloseEvent) => void
	complete: () => void
}

export interface IGuide extends IFrame<IGuideProps, TGuideEvents>, ICloseRequestable {
	get steps(): readonly IGuideStep[]
	set steps(value: readonly IGuideStep[] | undefined)
	readonly step: IGuideStep | undefined
	readonly stepNumber: number
	readonly stepCount: number
	readonly modal: boolean
	start(id?: string): boolean
	next(): boolean
	previous(): boolean
	goTo(id: string): boolean
	close(): void
}
