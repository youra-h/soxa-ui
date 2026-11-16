import React, { Suspense } from 'react'
import { Tabs as Ark } from '@ark-ui/react/tabs'
import * as Radix from '@radix-ui/react-tabs'
import * as ShadcnRadix from './shadcn-radix'
import * as ShadcnBase from './shadcn-base'

export const libraries = {
	ark: Ark,
	radix: Radix,
	'shadcn-radix': {
		Root: ShadcnRadix.Tabs,
		List: ShadcnRadix.TabsList,
		Trigger: ShadcnRadix.TabsTrigger,
		Content: ShadcnRadix.TabsContent,
	},
	'shadcn-base': {
		Root: ShadcnBase.Tabs,
		List: ShadcnBase.TabsList,
		Trigger: ShadcnBase.TabsTrigger,
		Content: ShadcnBase.TabsContent,
	},
}
export function resource(ready = false) {
	let resolved = ready
	let finish!: () => void
	const promise = new Promise<void>((resolve) => {
		finish = resolve
	})
	return {
		read() {
			if (!resolved) throw promise
		},
		resolve() {
			resolved = true
			finish()
		},
	}
}
export function Wait({ gate }) {
	gate.read()
	return null
}
export function Example({
	library,
	selected = 'b',
	gate,
	scenario = 'sync',
	customId = false,
	onChange,
	show = true,
	rootKey = 'root',
}) {
	const P = libraries[library]
	const rootProps =
		selected === null
			? { onValueChange: onChange }
			: { defaultValue: selected, onValueChange: onChange }
	const trigger = (value) => (
		<P.Trigger key={value} value={value}>
			{value.toUpperCase()}
		</P.Trigger>
	)
	const suspended = (
		<>
			<P.Trigger value="b">B</P.Trigger>
			<Wait gate={gate} />
		</>
	)
	const second = !show ? null : scenario === 'sync' ? (
		trigger('b')
	) : (
		<Suspense
			fallback={
				scenario === 'fallback-trigger' ? (
					trigger('fallback')
				) : (
					<span data-fallback="">WAITING</span>
				)
			}
		>
			{suspended}
		</Suspense>
	)
	return (
		<P.Root key={rootKey} {...rootProps}>
			<P.List aria-label="Example tabs">
				{trigger('a')}
				{second}
				{trigger('c')}
			</P.List>
			{['a', 'b', 'c', 'fallback'].map((value) => (
				<P.Content
					key={value}
					value={value}
					{...(customId && value === 'b' ? { id: 'custom-panel' } : {})}
				>
					{'PANEL-' + value}
				</P.Content>
			))}
		</P.Root>
	)
}
