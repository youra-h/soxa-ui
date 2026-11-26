import type { TSlideDirection } from '../../slide/types'

export type TSplitterDrag = {
	direction: TSlideDirection
	box: DOMRectReadOnly
	length: number
}
