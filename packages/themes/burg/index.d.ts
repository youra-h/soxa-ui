export {}

declare module '@soxa-ui/core' {
	interface IComponentVariants {
		normal: true
		negative: true
		accent: true
		positive: true
		caution: true
	}

	interface IAlertViews {
		soft: true
		outlined: true
		filled: true
	}

	interface IToastsItemViews {
		soft: true
		outlined: true
		filled: true
	}

	interface IBadgeViews {
		filled: true
		outlined: true
	}

	interface ISkeletonShapes {
		rounded: true
		circle: true
		rect: true
	}

	interface ISkeletonAnimations {
		pulse: true
		wave: true
		none: true
	}

	interface IAvatarShapes {
		circle: true
		rounded: true
		rect: true
	}

	interface ITabsViews {
		line: true
		contained: true
		outline: true
	}

	interface IButtonViews {
		filled: true
		outlined: true
		plain: true
	}

	interface ICheckBoxViews {
		filled: true
		outlined: true
		plain: true
	}

	interface IBackdropViews {
		dim: true
		blur: true
		none: true
	}

	interface IRadioGroupViews {
		dot: true
		ring: true
	}
}
