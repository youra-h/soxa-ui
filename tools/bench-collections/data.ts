export function data(n: number, kind: string) {
	const items = Array.from({ length: n }, (_, index) => ({
		value: `v${index}`,
		text: `Item ${index}`,
		_: kind === 'tabs' ? { active: index === 1 } : { selected: index === 1 },
	}))
	return {
		n,
		kind,
		items,
		source: {
			items,
			...(kind === 'tabs' ? { panels: items.map((item) => ({ value: item.value })) } : {}),
		},
	}
}
export type Spec = ReturnType<typeof data> & { mode: string; library?: string }
