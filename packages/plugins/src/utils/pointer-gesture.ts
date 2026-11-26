/**
 * Owns a single captured pointer through release, cancellation or unmount.
 * The plugin keeps the component's drag state and applies its model commands.
 */
export class TPointerGesture {
	private _capture: { root: Element; pointer: number } | null = null
	private _trailingClick = false

	canStart(event: PointerEvent): boolean {
		return this._capture === null && event.button === 0 && !event.defaultPrevented
	}

	start(root: Element, event: PointerEvent): void {
		this._capture = { root, pointer: event.pointerId }
		this._trailingClick = false

		event.preventDefault()
		root.setPointerCapture?.(event.pointerId)
	}

	owns(event: PointerEvent): boolean {
		const capture = this._capture

		if (!capture || capture.pointer !== event.pointerId) return false

		// Taking capture from a descendant can bubble its lostpointercapture to this root.
		return event.type !== 'lostpointercapture' || event.target === capture.root
	}

	finish(event?: PointerEvent): boolean {
		if (event && !this.owns(event)) return false

		const capture = this._capture
		this._capture = null
		this._trailingClick = event?.type === 'pointerup'

		if (!capture) return false

		if (capture.root.hasPointerCapture?.(capture.pointer))
			capture.root.releasePointerCapture(capture.pointer)

		return true
	}

	preventTrailingClick(event: MouseEvent): void {
		if (!this._trailingClick) return

		this._trailingClick = false
		event.preventDefault()
	}
}
