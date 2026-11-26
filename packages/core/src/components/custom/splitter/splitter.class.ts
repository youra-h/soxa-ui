import { TComponentView } from '../../base/component-view'
import type { TDefaultValues } from '../../base/component'
import type { TOrientation } from '../../../common'
import type { TSlideEdge } from '../slide'
import { clamp, EPSILON, fitSizes, normalizePanels, type TPanel } from './layout'
import type { ISplitterPanelConfig } from './panel/types'
import type { ISplitter, ISplitterProps, TSplitterEvents } from './types'

export class TSplitter
	extends TComponentView<ISplitterProps, TSplitterEvents>
	implements ISplitter
{
	static override baseClass = 'so-splitter'

	static defaultValues: typeof TComponentView.defaultValues &
		TDefaultValues<
			ISplitterProps,
			'panels' | 'orientation' | 'offset' | 'thumb' | 'disabled',
			'width'
		> = {
		...TComponentView.defaultValues,
		panels: [],
		orientation: 'horizontal',
		offset: 0,
		width: undefined,
		thumb: true,
		disabled: false,
	}

	readonly largeStep = 10

	private _panels: readonly TPanel[]
	private _sizes: readonly number[]
	private _orientation: TOrientation
	private _offset: number
	private _width: number | undefined
	private _thumb: boolean
	private _disabled: boolean
	private _drag: { index: number; offset: number; sizes: readonly number[] } | undefined
	private readonly _restore = new Map<string, number>()

	constructor(props: Partial<ISplitterProps> = {}) {
		super(props)

		const defaults = (new.target as typeof TSplitter).defaultValues

		this._panels = normalizePanels(props.panels ?? defaults.panels)
		this._sizes = fitSizes(
			this._panels,
			this._panels.map((panel) => panel.defaultSize),
		)
		this._orientation = props.orientation ?? defaults.orientation
		this._offset = TSplitter._normalizeOffset(props.offset ?? defaults.offset)
		this._width = TSplitter._normalizeWidth(props.width ?? defaults.width)
		this._thumb = props.thumb ?? defaults.thumb
		this._disabled = props.disabled ?? defaults.disabled
		this._dataset.add('orientation', this._orientation)
		this._dataset.add('offset', this._offset > 0 ? '' : null)
	}

	get panels(): readonly ISplitterPanelConfig[] {
		return this._panels
	}

	set panels(value: readonly ISplitterPanelConfig[]) {
		const oldValue = this._panels
		const panels = normalizePanels(value)
		const sameLayout =
			panels.length === oldValue.length &&
			panels.every((panel, index) => {
				const old = oldValue[index]

				return (
					panel.id === old.id &&
					panel.minSize === old.minSize &&
					panel.maxSize === old.maxSize &&
					panel.defaultSize === old.defaultSize &&
					panel.collapsible === old.collapsible
				)
			})

		if (sameLayout) return

		this.release()

		const previous = new Map(oldValue.map((panel, index) => [panel.id, this._sizes[index]]))
		this._panels = panels

		for (const key of this._restore.keys()) {
			if (!panels.some((panel) => panel.id === key && panel.collapsible))
				this._restore.delete(key)
		}

		const sizes = fitSizes(
			panels,
			panels.map((panel) => previous.get(panel.id) ?? panel.defaultSize),
		)

		this._writeSizes(sizes)
		this.events.emit('change:panels', { newValue: panels, oldValue })
	}

	get orientation(): TOrientation {
		return this._orientation
	}

	set orientation(value: TOrientation) {
		const oldValue = this._orientation

		if (oldValue === value) return

		this.release()
		this._orientation = value
		this._dataset.add('orientation', value)
		this.events.emit('change:orientation', { newValue: value, oldValue })
	}

	get offset(): number {
		return this._offset
	}

	set offset(value: number) {
		const oldValue = this._offset
		const newValue = TSplitter._normalizeOffset(value)

		if (oldValue === newValue) return

		this.release()
		this._offset = newValue
		this._dataset.add('offset', newValue > 0 ? '' : null)
		this.events.emit('change:offset', { newValue, oldValue })
	}

	get width(): number | undefined {
		return this._width
	}

	set width(value: number | undefined) {
		const oldValue = this._width
		const newValue = TSplitter._normalizeWidth(value)

		if (oldValue === newValue) return

		this.release()
		this._width = newValue
		this.events.emit('change:width', { newValue, oldValue })
	}

	get thumb(): boolean {
		return this._thumb
	}

	set thumb(newValue: boolean) {
		const oldValue = this._thumb

		if (oldValue === newValue) return

		this._thumb = newValue
		this.events.emit('change:thumb', { newValue, oldValue })
	}

	get splitterStyle(): Record<string, string> {
		const style: Record<string, string> = { '--so-splitter-offset': `${this._offset}px` }

		if (this._width !== undefined) style['--so-splitter-width'] = `${this._width}px`

		return style
	}

	private static _normalizeOffset(value: number): number {
		return Number.isFinite(value) ? Math.max(0, value) : 0
	}

	private static _normalizeWidth(value: number | undefined): number | undefined {
		return value !== undefined && Number.isFinite(value) && value > 0 ? value : undefined
	}

	get disabled(): boolean {
		return this._disabled
	}

	set disabled(value: boolean) {
		const oldValue = this._disabled

		if (oldValue === value) return

		this._disabled = value

		if (value) this.release()

		this.events.emit('change:disabled', { newValue: value, oldValue })
	}

	get inverted(): boolean {
		return this.orientation === 'vertical'
	}

	get sizes(): readonly number[] {
		return this._sizes
	}

	get activeThumb(): number | undefined {
		return this._drag?.index
	}

	indexOf(panel: string): number {
		return this._panels.findIndex(({ id }) => id === panel)
	}

	rangeOf(index: number): readonly [min: number, max: number] {
		const limits = this._limits(index)

		if (!limits) return [0, 0]

		const { min, max, total, canCollapseFirst, canCollapseSecond } = limits
		const current = this._sizes[index]
		const canExpandBoth = min <= max + EPSILON

		return [
			canCollapseFirst ? 0 : canExpandBoth ? min : current,
			canCollapseSecond ? total : canExpandBoth ? max : current,
		]
	}

	grab(index: number, fraction: number): boolean {
		if (this.disabled || this._drag || index < 0 || index >= this._sizes.length - 1)
			return false

		const [min, max] = this.rangeOf(index)

		if (max - min <= EPSILON) return false

		this._drag = { index, offset: fraction * 100 - this._sizes[index], sizes: this._sizes }
		this._dataset.add('dragging', '')
		this.events.emit('change:activeThumb', { newValue: index, oldValue: undefined })

		return true
	}

	drag(fraction: number): void {
		const drag = this._drag

		if (!drag) return

		this._resize(drag.index, fraction * 100 - drag.offset)
	}

	release(): void {
		const drag = this._drag

		if (!drag) return

		this._drag = undefined
		this._dataset.remove('dragging')
		this.events.emit('change:activeThumb', { newValue: undefined, oldValue: drag.index })

		if (drag.sizes !== this._sizes) this.events.emit('commit', this._sizes)
	}

	shift(index: number, count: number): void {
		const size = this._sizes[index]

		this._commitResize(index, size + count, Math.sign(count))
	}

	moveToEdge(index: number, edge: TSlideEdge): void {
		this._commitResize(index, this.rangeOf(index)[edge === 'start' ? 0 : 1])
	}

	activate(index: number): void {
		const panel = this._panels[index]

		if (panel) this._toggle(index, index + 1)
	}

	togglePanel(panel: string): void {
		const index = this.indexOf(panel)

		this._toggle(index, index === this._panels.length - 1 ? index - 1 : index + 1)
	}

	private _toggle(index: number, neighborIndex: number): void {
		if (this.disabled || this._drag) return

		const state = this._panels[index]
		const adjacent = this._panels[neighborIndex]

		if (!state?.collapsible || !adjacent) return

		const before = neighborIndex < index
		const boundary = Math.min(index, neighborIndex)
		const neighbor = this._sizes[neighborIndex]
		const current = this._sizes[index]
		const total = neighbor + current
		let size = 0

		if (current > EPSILON) {
			if (total < adjacent.minSize || total > adjacent.maxSize + EPSILON) return
		} else {
			const min = Math.max(state.minSize, total - adjacent.maxSize)
			const max = Math.min(state.maxSize, total - adjacent.minSize)

			if (min > max + EPSILON) return

			const restored =
				this._restore.get(state.id) || state.defaultSize || 100 / this._sizes.length
			size = clamp(restored, min, Math.max(min, max))
		}

		this._commitResize(boundary, before ? total - size : size)
	}

	private _limits(index: number) {
		const first = this._panels[index]
		const second = this._panels[index + 1]

		if (!first || !second) return null

		const total = this._sizes[index] + this._sizes[index + 1]

		return {
			total,
			min: Math.max(first.minSize, total - second.maxSize),
			max: Math.min(first.maxSize, total - second.minSize),
			firstMin: first.minSize,
			secondMin: second.minSize,
			canCollapseFirst:
				first.collapsible && total >= second.minSize && total <= second.maxSize + EPSILON,
			canCollapseSecond:
				second.collapsible && total >= first.minSize && total <= first.maxSize + EPSILON,
		}
	}

	private _commitResize(index: number, desired: number, direction = 0): void {
		if (this.disabled || this._drag) return

		const oldSizes = this._sizes

		this._resize(index, desired, direction)

		if (oldSizes !== this._sizes) this.events.emit('commit', this._sizes)
	}

	private _resize(index: number, desired: number, direction = 0): void {
		const limits = this._limits(index)

		if (!limits || !Number.isFinite(desired)) return

		const { total, min, max, firstMin, secondMin, canCollapseFirst, canCollapseSecond } = limits
		const previous = this._sizes[index]
		let size = previous

		// A collapsed panel is a separate legal size below its ordinary minimum.
		// Arrows cross that gap in one step. Dragging crosses it at the midpoint.
		if (
			canCollapseFirst &&
			(direction < 0 ? desired < firstMin : direction === 0 && desired <= firstMin / 2)
		) {
			size = 0
		} else if (
			canCollapseSecond &&
			(direction > 0 ? desired > max : direction === 0 && total - desired <= secondMin / 2)
		) {
			size = total
		} else if (min <= max + EPSILON) {
			size = clamp(desired, min, Math.max(min, max))
		}

		if (Math.abs(size - previous) <= EPSILON) return

		if (size === 0) this._restore.set(this._panels[index].id, previous)
		if (size === total) this._restore.set(this._panels[index + 1].id, total - previous)

		const sizes = [...this._sizes]
		sizes[index] = size
		sizes[index + 1] = total - size

		this._writeSizes(sizes)
	}

	private _writeSizes(newValue: readonly number[]): void {
		const oldValue = this._sizes
		this._sizes = newValue
		this.events.emit('change:sizes', { newValue, oldValue })
	}

	override getProps(): ISplitterProps {
		return {
			...super.getProps(),
			panels: this.panels,
			orientation: this.orientation,
			offset: this.offset,
			width: this.width,
			thumb: this.thumb,
			disabled: this.disabled,
		}
	}
}
