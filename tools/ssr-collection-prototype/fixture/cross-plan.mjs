import { createEngineTabs } from '@soxa-ui/core'

export const RUN = 'ssr-prototype-run'
export const SCOPE = 'ssr-prototype-scope'

/** Scope ordinals deliberately test an alternative to native tree-position ids. */
export function scopeOf(run) {
	const id = String(run.next++)
	let entries = run.plan.get(id)
	if (!entries && run.phase === 'scan') run.plan.set(id, (entries = new Map()))
	if (!entries) throw new Error('Scope identity changed: ' + id)
	const engine =
		run.phase === 'scan'
			? null
			: createEngineTabs({
					items: [...entries.values()].map(({ active, ...props }) => ({
						...props,
						_: { active },
					})),
				})
	return { entries, engine }
}

export function itemOf(scope, props, phase) {
	if (phase === 'scan') {
		scope.entries.set(props.value, { ...props })
		return null
	}
	const ctrl = scope.engine.extensions.batch.items.find((item) => item.value === props.value)
	if (!ctrl) throw new Error('Declaration missing: ' + props.value)
	return ctrl
}

export function newRun(phase, plan = new Map()) {
	return { phase, plan, next: 0 }
}
