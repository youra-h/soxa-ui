import { lengthAlong, type ISlideParts } from '../slide'

export const splitterSlideParts: ISlideParts = {
	track: (_, root) => root,
	field: (thumb) =>
		thumb instanceof HTMLElement && !thumb.hasAttribute('data-disabled') ? thumb : null,
	index: (thumb) => Number(thumb.getAttribute('data-index') ?? -1),
	// Panel rectangles exclude the offset, so pointer movement maps to panel space.
	length: (direction, track) =>
		Array.from(track.children).reduce(
			(length, child) =>
				child.classList.contains('so-splitter__panel')
					? length + lengthAlong(direction, child.getBoundingClientRect())
					: length,
			0,
		),
}
