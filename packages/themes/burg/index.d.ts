export {}

declare module '@soxa-ui/core' {
	interface IComponentVariants {
		normal: true
		negative: true
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
