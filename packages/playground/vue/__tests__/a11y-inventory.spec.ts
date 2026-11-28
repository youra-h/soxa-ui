import { describe, expect, it } from 'vitest'
import {
	A11Y_ADAPTERS,
	A11Y_CASES,
	A11Y_COMPONENTS,
	COMPONENTS,
	auditInventoryErrors,
	type IPreviewHost,
} from '@soxa-ui/playground-shared'

const sources = import.meta.glob<string>('../browser/axe-*.spec.ts', {
	query: '?raw',
	import: 'default',
	eager: true,
})
const ids = COMPONENTS.map((entry) => entry.id)
const host: IPreviewHost = {
	previews: A11Y_COMPONENTS,
	fixtures: A11Y_CASES.flatMap((entry) => (entry.fixture ? [entry.fixture] : [])),
	mount() {
		throw new Error('Inventory checks never mount components')
	},
	setLocale() {},
}

describe('mandatory axe inventory', () => {
	it('distinguishes actual previews, consumer paths and the unused Interactive base reference', () => {
		const entries = [
			...new Map(A11Y_CASES.map((entry) => [entry.component, entry.coverage])).entries(),
		]
		expect(entries.filter(([, coverage]) => coverage === 'direct')).toHaveLength(50)
		expect(entries).toContainEqual(['tree', 'direct'])
		expect(entries).toContainEqual(['sidebar', 'direct'])
		expect(entries.filter(([, coverage]) => coverage === 'consumer')).toHaveLength(7)
		expect(entries.filter(([, coverage]) => coverage === 'semantic-reference')).toEqual([
			['interactive', 'semantic-reference'],
		])
		expect(A11Y_CASES.find((entry) => entry.component === 'interactive')?.id).toBe(
			'interactive/semantic-reference',
		)
	})
	it('has a browser suite entry for every adapter', () => {
		const paths = Object.keys(sources)
			.filter((path) => path !== '../browser/axe-gate.spec.ts')
			.sort()
		expect(paths).toEqual(A11Y_ADAPTERS.map((id) => '../browser/axe-' + id + '.spec.ts').sort())
		for (const id of A11Y_ADAPTERS)
			expect(sources['../browser/axe-' + id + '.spec.ts']).toContain(
				"auditSuite('" + id + "')",
			)
	})
	it('rejects new registry entries rather than silently intersecting them', () => {
		expect(auditInventoryErrors(host, ids, 'vue')).toEqual([])
		expect(auditInventoryErrors(host, [...ids, 'new-component'], 'vue')).not.toEqual([])
	})
	it('requires the Stepper preview in every adapter', () => {
		const withoutStepper = { ...host, previews: host.previews.filter((id) => id !== 'stepper') }
		for (const adapter of A11Y_ADAPTERS)
			expect(auditInventoryErrors(withoutStepper, ids, adapter)).toEqual([
				'stepper/current-step: missing consumer stepper',
			])
	})
	it('rejects a missing consumer or named fixture in a host', () => {
		expect(
			auditInventoryErrors(
				{ ...host, previews: host.previews.filter((id) => id !== 'select') },
				ids,
				'vue',
			),
		).not.toEqual([])
		expect(auditInventoryErrors({ ...host, fixtures: [] }, ids, 'vue')).not.toEqual([])
	})
})
