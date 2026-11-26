import { describe, expect, it, vi } from 'vitest'
import { TSplitter } from '@soxa-ui/core'

const panels = [
	{ id: 'files', defaultSize: 25, minSize: 15, maxSize: 45, collapsible: true },
	{ id: 'editor', defaultSize: 50, minSize: 20, maxSize: 75 },
	{ id: 'preview', minSize: 10, maxSize: 60, collapsible: true },
]

describe('Splitter', () => {
	it('clamps the affected pair and commits once after dragging', () => {
		const splitter = new TSplitter({ panels })
		const commit = vi.fn()
		splitter.events.on('commit', commit)

		expect(splitter.sizes).toEqual([25, 50, 25])
		expect(splitter.grab(0, 0.27)).toBe(true)
		splitter.drag(0.37)
		expect(splitter.sizes).toEqual([35, 40, 25])
		splitter.drag(1)
		expect(splitter.sizes).toEqual([45, 30, 25])
		expect(commit).not.toHaveBeenCalled()
		splitter.release()
		expect(commit).toHaveBeenCalledExactlyOnceWith([45, 30, 25])
	})

	it('honors the minimum, collapse and restoration on both sides', () => {
		const splitter = new TSplitter({ panels })
		splitter.shift(0, -10)
		expect(splitter.sizes).toEqual([15, 60, 25])
		splitter.shift(0, -1)
		expect(splitter.sizes).toEqual([0, 75, 25])
		splitter.activate(0)
		expect(splitter.sizes).toEqual([15, 60, 25])
		splitter.shift(1, -20)
		splitter.togglePanel('preview')
		expect(splitter.sizes).toEqual([15, 40, 45])
		splitter.shift(1, 20)
		splitter.togglePanel('preview')
		expect(splitter.sizes).toEqual([15, 60, 25])
	})

	it('collapses and restores a trailing panel when its neighbor can take the space', () => {
		const splitter = new TSplitter({
			panels: [
				{ id: 'primary', minSize: 20 },
				{ id: 'secondary', defaultSize: 30, minSize: 15, collapsible: true },
			],
		})

		splitter.togglePanel('secondary')
		expect(splitter.sizes).toEqual([100, 0])
		splitter.togglePanel('secondary')
		expect(splitter.sizes).toEqual([70, 30])
		splitter.moveToEdge(0, 'end')
		expect(splitter.sizes).toEqual([100, 0])
		splitter.shift(0, -1)
		expect(splitter.sizes).toEqual([85, 15])
	})

	it('does not start a drag on a fixed boundary', () => {
		const splitter = new TSplitter({
			panels: [
				{ id: 'first', minSize: 40, maxSize: 40 },
				{ id: 'second', minSize: 60, maxSize: 60 },
			],
		})

		expect(splitter.rangeOf(0)).toEqual([40, 40])
		expect(splitter.grab(0, 0.4)).toBe(false)
	})

	it('preserves live panel sizes by ID between valid configuration changes', () => {
		const splitter = new TSplitter({ panels })
		splitter.shift(0, 10)
		splitter.panels = [panels[1], panels[0], panels[2]]
		expect(splitter.sizes).toEqual([40, 35, 25])
		expect(() => {
			splitter.panels = [panels[0], panels[0]]
		}).toThrow(RangeError)
		expect(splitter.sizes).toEqual([40, 35, 25])
		splitter.disabled = true
		expect(splitter.grab(0, 0.4)).toBe(false)
		splitter.shift(0, -10)
		expect(splitter.sizes).toEqual([40, 35, 25])
	})
})
