import { createEngineTabs } from '@soxa-ui/core'

/** Request-local declarations, collected before any live engine is created. */
export class TPlan {
	scopes = new Map()

	scope(id, phase) {
		let scope = this.scopes.get(id)

		if (!scope && phase === 'scan') {
			scope = new Map()
			this.scopes.set(id, scope)
		}

		if (!scope) throw new Error('Scope identity changed between passes: ' + id)

		return scope
	}

	engine(id) {
		return createEngineTabs({
			items: [...this.scope(id, 'render').values()].map(({ active, ...props }) => ({
				...props,
				_: { active },
			})),
		})
	}
}
