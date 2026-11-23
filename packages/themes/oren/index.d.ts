/**
 * The values of the look of the oren theme — exactly those it has CSS for.
 *
 * The library declares no `variant`, `view`, `shape` or `animation` values of
 * its own: its registries are empty, and the theme augments them here (root
 * `AGENTS.md`, «Оформление: значения объявляет тема»). Once this file is in
 * the program, the props of the components take these names, and the compiler
 * rejects a typo.
 *
 * It comes into the program by either of two ways: with the stylesheet
 * imported from a module of TS — `import '@soxa-ui/theme-oren'` — or with the
 * behavior, `@soxa-ui/theme-oren/setup`, whose declarations reference this
 * file. The second works in any build: Angular CLI takes the stylesheet from
 * `styles` in `angular.json` and Nuxt from `css` in `nuxt.config.ts`, and
 * there no module of TS imports it.
 *
 * A value that is the look of the block without a modifier (`normal`, `filled`
 * of Button, `outlined` of CheckBox, `line`, `dot`, `rounded`, `pulse`) may
 * have no rule of its own in the CSS, but it is declared all the same: it can
 * be set explicitly, and `normal` of ProgressLinear, ProgressSpinner and Rating
 * is not the base but the neutral.
 */
export {}

declare module '@soxa-ui/core' {
	/** The shape of an avatar. Without a shape: `circle`. */
	interface IAvatarShapes {
		circle: true
		rounded: true
		rect: true
	}

	/** Inline message surfaces. Without a view: a soft fill. */
	interface IAlertViews {
		outlined: true
		soft: true
		filled: true
	}

	/** Toast surfaces. The default uses a solid fill for typed messages. */
	interface IToastsItemViews {
		soft: true
	}

	interface IBadgeViews {
		filled: true
		outlined: true
	}

	/**
	 * The color by meaning. Without a variant — the neutral; `accent` for
	 * ProgressLinear and ProgressSpinner, which inside a button take the color
	 * of its text; `caution` for the stars of Rating. A button does not
	 * override a variant set on its indicator, and on the button's fill of the
	 * same family the indicator nearly disappears.
	 */
	interface IComponentVariants {
		normal: true
		accent: true
		positive: true
		negative: true
		caution: true
	}

	/** The view of a button and of the rows Button draws: ListBox, Accordion, Tags. */
	interface IButtonViews {
		filled: true
		plain: true
		outlined: true
		none: true
	}

	/** The view of tabs. Without a view — `line`. */
	interface ITabsViews {
		line: true
		contained: true
		outline: true
	}

	/**
	 * The view of a checkbox. Without a view — `outlined`: a box in a border,
	 * the check in the color of the variant. `filled` differs from it only in a
	 * checked box: it is filled with the saturated color of the variant, with a
	 * white check on it; an unchecked one looks as in `outlined`. `plain` — no
	 * border and no background, for dense lists.
	 */
	interface ICheckBoxViews {
		outlined: true
		filled: true
		plain: true
	}

	/**
	 * The view of a radio — what marks the choice. Without a view — `dot`: a
	 * dot inside a thin ring, like the check inside the box of a checkbox.
	 * `ring` — the ring thickens.
	 */
	interface IRadioGroupViews {
		dot: true
		ring: true
	}

	/** The shape of a skeleton. Without a shape — `rounded`. */
	interface ISkeletonShapes {
		rect: true
		rounded: true
		circle: true
	}

	/** The animation of a skeleton. Without an animation — `pulse`. */
	interface ISkeletonAnimations {
		pulse: true
		wave: true
		none: true
	}
}
