import type { TScenario } from './types'

/** Manual lines use the existing list theme while remaining outside option semantics. */
export const LIST_SEPARATOR_SCENARIOS: readonly TScenario[] = ['list-box', 'select'].map(
	(component): TScenario => ({
		id: component + '/slots/manual-separators',
		component,
		topic: 'slots',
		kind: 'auto',
		title: 'Группы с ручным разделителем',
		description: 'Линию между группами задаёт потребитель; она не становится опцией списка.',
		fixture: component + '-separators',
		run: async (ctx) => {
			await ctx.frame()
			await ctx.frame()
			const block = component === 'select' ? 'so-select' : 'so-list-box'
			const input = ctx.scene.querySelector('input[role="combobox"]')
			const list =
				component === 'select'
					? document.getElementById(input?.getAttribute('aria-controls') ?? '')
					: ctx.scene.querySelector('.so-list-box__list')
			const line = list?.querySelector('.' + block + '__separator')

			ctx.check(
				line?.getAttribute('aria-hidden') === 'true',
				'Разделитель скрыт от вспомогательных технологий',
			)
			ctx.check(
				line !== undefined && line !== null && !line.hasAttribute('role'),
				'Разделитель не получает роль опции',
			)
			ctx.check(
				list?.querySelectorAll('[role="option"]').length === 2,
				'В списке только две опции',
			)
		},
	}),
)
