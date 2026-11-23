/**
 * Фикстура темы: реестры значений оформления для тестов (AGENTS.md,
 * «Оформление: значения объявляет тема»).
 *
 * Имена условные и намеренно не совпадают с именами oren. Фикстура открывает
 * их всей программе типов — и коду `src` в ней тоже. С именами oren ядро
 * могло бы снова завести `variant: 'normal'` умолчанием, и «Типы — Core»
 * этого бы не заметили; с условными такое умолчание не компилируется.
 *
 * Что ядро само не объявляет ни одного значения, стережёт
 * `theme-registries.spec.ts`: тип значения равен ровно именам отсюда.
 */
export {}

declare module '@soxa-ui/core' {
	interface IAlertViews {
		solid: true
		hollow: true
	}

	interface IAvatarShapes {
		rounded: true
	}
	interface IBadgeViews {
		solid: true
		hollow: true
	}

	interface IComponentVariants {
		brand: true
		danger: true
	}

	interface IButtonViews {
		solid: true
		ghost: true
	}

	interface IBackdropViews {
		clear: true
		frosted: true
	}

	interface ITabsViews {
		pills: true
		cards: true
	}

	interface ICheckBoxViews {
		bare: true
		boxed: true
	}

	interface IRadioGroupViews {
		pip: true
		halo: true
	}

	interface ISkeletonShapes {
		square: true
		pill: true
	}

	interface ISkeletonAnimations {
		shimmer: true
		blink: true
	}
}
