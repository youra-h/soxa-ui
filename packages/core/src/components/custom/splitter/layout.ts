import type { ISplitterPanelConfig } from './types'

export type TPanel = Required<Pick<ISplitterPanelConfig, 'minSize' | 'maxSize'>> &
	ISplitterPanelConfig

export const EPSILON = 1e-8

export function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(value, max))
}

export function normalizePanels(config: readonly ISplitterPanelConfig[]): TPanel[] {
	const seen = new Set<string>()
	const panels = config.map((panel) => {
		const { id, minSize = 0, maxSize = 100, defaultSize } = panel

		if (!id || seen.has(id))
			throw new RangeError('Splitter panel IDs must be unique and nonempty')
		if (
			!Number.isFinite(minSize) ||
			!Number.isFinite(maxSize) ||
			minSize < 0 ||
			maxSize > 100 ||
			minSize > maxSize ||
			(defaultSize !== undefined &&
				(!Number.isFinite(defaultSize) || defaultSize < 0 || defaultSize > 100))
		) {
			throw new RangeError(`Invalid sizes for splitter panel "${id}"`)
		}

		seen.add(id)

		return { ...panel, minSize, maxSize }
	})

	if (
		panels.length &&
		(panels.reduce((sum, panel) => sum + panel.minSize, 0) > 100 + EPSILON ||
			panels.reduce((sum, panel) => sum + panel.maxSize, 0) < 100 - EPSILON)
	) {
		throw new RangeError('Splitter panel limits must accommodate a total size of 100%')
	}

	return panels
}

export function fitSizes(
	panels: readonly TPanel[],
	requested: readonly (number | undefined)[],
): number[] {
	const specified = requested.reduce<number>((sum, size) => sum + (size ?? 0), 0)
	const unspecified = requested.filter((size) => size === undefined).length
	const share = unspecified ? (100 - specified) / unspecified : 0
	const sizes = panels.map((panel, index) =>
		clamp(requested[index] ?? share, panel.minSize, panel.maxSize),
	)
	const remainder = 100 - sizes.reduce((sum, size) => sum + size, 0)

	if (Math.abs(remainder) <= EPSILON) return sizes

	// Divide the correction by available capacity so every panel remains within its bounds.
	const capacity = panels.map((panel, index) =>
		remainder > 0 ? panel.maxSize - sizes[index] : sizes[index] - panel.minSize,
	)
	const total = capacity.reduce((sum, size) => sum + size, 0)

	return sizes.map((size, index) =>
		clamp(
			size + (remainder * capacity[index]) / total,
			panels[index].minSize,
			panels[index].maxSize,
		),
	)
}
