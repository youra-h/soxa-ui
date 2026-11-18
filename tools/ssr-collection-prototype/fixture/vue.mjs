import { createSSRApp, defineComponent, Fragment, h, inject, provide, useId } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { Tabs as LibraryTabs } from '@soxa-ui/vue'
import { TPlan } from './plan.mjs'

const RUN = Symbol('run')
const SCOPE = Symbol('scope')

const CandidateItem = defineComponent({
	inheritAttrs: false,
	setup(_, { attrs }) {
		const run = inject(RUN)
		const scope = inject(SCOPE)

		if (run.phase === 'scan') {
			scope.entries.set(attrs.value, { ...attrs })
			return () => null
		}

		const ctrl = scope.engine.extensions.batch.items.find((item) => item.value === attrs.value)

		if (!ctrl) throw new Error('Declaration missing from first pass')

		return () => h(LibraryTabs.Item, { ...attrs, ctrl })
	},
})

const CandidateContent = defineComponent({
	inheritAttrs: false,
	setup(_, { attrs, slots }) {
		const run = inject(RUN)

		return () =>
			run.phase === 'scan' ? slots.default?.() : h(LibraryTabs.Content, attrs, slots)
	},
})

const CandidateRoot = defineComponent({
	setup(_, { slots }) {
		const run = inject(RUN)
		const id = useId()
		const entries = run.plan.scope(id, run.phase)
		const engine = run.phase === 'render' ? run.plan.engine(id) : null

		provide(SCOPE, { entries, engine })

		if (engine) run.engines.set(id, engine)

		return () =>
			run.phase === 'scan'
				? h(Fragment, null, [slots.default?.(), slots.content?.()])
				: h(LibraryTabs, { engine }, slots)
	},
})

const Candidate = Object.assign(CandidateRoot, { Item: CandidateItem, Content: CandidateContent })

function page(Tabs, count, customId) {
	return h(Tabs, null, {
		default: () =>
			Array.from({ length: count }, (_, index) =>
				h(Tabs.Item, {
					value: String(index),
					text: 'Tab ' + index,
					active: index === count - 1,
				}),
			),
		content: () =>
			Array.from({ length: count }, (_, index) =>
				h(
					Tabs.Content,
					{
						value: String(index),
						...(customId && index === count - 1 ? { id: 'custom-panel' } : {}),
					},
					() => 'Panel ' + index,
				),
			),
	})
}

export const baseline = (count = 2, customId = false) =>
	renderToString(createSSRApp({ render: () => page(LibraryTabs, count, customId) }))

export async function prepare(count = 2, customId = false) {
	const plan = new TPlan()
	const scan = createSSRApp({
		setup() {
			provide(RUN, { plan, phase: 'scan', engines: new Map() })
			return () => page(Candidate, count, customId)
		},
	})

	await renderToString(scan)

	return plan
}

export async function renderPrepared(plan, count = 2, customId = false) {
	const engines = new Map()
	const app = createSSRApp({
		setup() {
			provide(RUN, { plan, phase: 'render', engines })
			return () => page(Candidate, count, customId)
		},
	})

	return { html: await renderToString(app), engines }
}

export async function prototype(count = 2, customId = false) {
	return renderPrepared(await prepare(count, customId), count, customId)
}
