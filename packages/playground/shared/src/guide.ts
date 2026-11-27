import type { IGuideStep } from '@soxa-ui/core'
import { FRAME_PLACEMENTS } from './enums'
import type { TJsonPropParser } from './types'

export const GUIDE_STEPS: readonly IGuideStep[] = [
	{
		id: 'welcome',
		title: 'Знакомство с Playground',
		description: 'На этом шаге фокус остаётся внутри окна Guide.',
		mode: 'modal',
	},
	{
		id: 'framework',
		title: 'Настройки стенда',
		description: 'Guide подсвечивает элемент, найденный по CSS-селектору.',
		anchor: {
			element:
				'.pg__header [data-guide-anchor="framework"], .pg__header [data-guide-anchor="settings"]',
		},
		placement: 'bottom',
	},
	{
		id: 'point',
		title: 'Точка на экране',
		description: 'Поменяйте x и y, чтобы переместить подсветку.',
		anchor: { point: { x: 240, y: 220 } },
		placement: 'bottom',
	},
]

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value)

function validAnchor(value: unknown): boolean {
	if (!isRecord(value) || Object.keys(value).length !== 1) return false
	if (typeof value.element === 'string') return value.element.trim() !== ''

	const point = value.point
	return isRecord(point) && Number.isFinite(point.x) && Number.isFinite(point.y)
}

export const parseGuideSteps: TJsonPropParser = (text) => {
	let value: unknown

	try {
		value = JSON.parse(text)
	} catch {
		return { error: 'Введите корректный JSON.' }
	}

	if (!Array.isArray(value)) return { error: 'Ожидается массив шагов.' }

	const ids = new Set<string>()
	for (const [index, step] of value.entries()) {
		const prefix = `Шаг ${index + 1}`
		if (
			!isRecord(step) ||
			typeof step.id !== 'string' ||
			!step.id.trim() ||
			typeof step.title !== 'string' ||
			!step.title.trim()
		) {
			return { error: `${prefix} должен содержать непустые строки id и title.` }
		}
		if (ids.has(step.id)) return { error: `${prefix} повторяет id «${step.id}».` }
		ids.add(step.id)

		if (
			(step.description !== undefined && typeof step.description !== 'string') ||
			(step.mode !== undefined && step.mode !== 'modal' && step.mode !== 'nonmodal') ||
			(step.placement !== undefined &&
				!FRAME_PLACEMENTS.some((side) => side === step.placement))
		) {
			return { error: `${prefix} содержит недопустимые description, mode или placement.` }
		}
		if (step.anchor !== undefined && !validAnchor(step.anchor)) {
			return {
				error: `${prefix} ожидает anchor.element с CSS-селектором или anchor.point с числами x и y.`,
			}
		}
		if (Object.hasOwn(step, 'advanceOn')) {
			return { error: `${prefix}: advanceOn принимает EventTarget из JavaScript.` }
		}
	}

	return { value }
}
