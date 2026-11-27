import type { TValuePayload } from '../../../common'
import type { ICloseRequestable, ILayerProps, TCloseEvent } from '../../base/layer'
import type { IFrame, TFrameEvents } from '../frame'
import type { TBackdropView } from '../../base/modal-layer'

/** DOM reference or a point in viewport CSS pixels. */
export type TGuideAnchor =
	| { readonly element: string | (() => Element | null) }
	| { readonly point: { readonly x: number; readonly y: number } }

/** While the step is shown, this event advances the guide once. */
export interface IGuideAdvance {
	readonly source: EventTarget
	readonly event: string
}

/** Logical panel placement shared by DOM and viewport anchors. */
export type TGuidePlacement =
	| 'bottom-start'
	| 'bottom'
	| 'bottom-end'
	| 'top-start'
	| 'top'
	| 'top-end'
	| 'end-start'
	| 'end'
	| 'end-end'
	| 'start-start'
	| 'start'
	| 'start-end'

export interface IGuideStep {
	readonly id: string
	readonly title: string
	readonly description?: string
	readonly mode?: 'modal' | 'nonmodal'
	readonly anchor?: TGuideAnchor
	readonly placement?: TGuidePlacement
	readonly advanceOn?: IGuideAdvance
}

export interface IGuideProps extends ILayerProps {
	/** Backdrop view. By default, only modal steps have a backdrop. */
	backdrop?: TBackdropView
	/** Shows the close button at the top of the panel. */
	closable?: boolean
	steps?: readonly IGuideStep[]
}

export type TGuideEvents = TFrameEvents & {
	'change:backdrop': (payload: TValuePayload<TBackdropView | undefined>) => void
	'change:closable': (payload: TValuePayload<boolean>) => void
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
	backdrop: TBackdropView | undefined
	readonly backdropClasses: string[]
	readonly backdropRendered: boolean
	closable: boolean
	start(id?: string): boolean
	next(): boolean
	previous(): boolean
	goTo(id: string): boolean
	close(): void
}
