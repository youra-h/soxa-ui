import { createContext, useContext, useRef, type ComponentProps } from 'react'
import { Tabs } from '@soxa-ui/react'
import { TIsolatedExecution } from './scope.mjs'

export const ComponentIsolationContext = createContext<TIsolatedExecution | undefined>(undefined)

function EndOfSubtree() {
	useContext(ComponentIsolationContext)?.dispose()
	return null
}

/** Test-only candidate for an internal Tabs render branch, not an application wrapper. */
export function ComponentScopedTabs(props: ComponentProps<typeof Tabs>) {
	const retained = useRef<TIsolatedExecution | null>(null)
	if (!retained.current) retained.current = new TIsolatedExecution()
	return (
		<ComponentIsolationContext value={retained.current}>
			<Tabs
				{...props}
				content={
					<>
						{props.content}
						<EndOfSubtree />
					</>
				}
			/>
		</ComponentIsolationContext>
	)
}
