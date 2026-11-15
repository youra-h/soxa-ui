import { createContext, useContext, type JSX } from 'solid-js'
import { Tabs } from '@soxa-ui/solid'
import { scopeOf, itemOf, newRun } from './cross-plan.mjs'
type TRun = ReturnType<typeof newRun>
type TSetProps = { candidate?: boolean; scenario?: string; count?: number; prefix?: string }
type TContentProps = { value: string; children?: JSX.Element }
const Run = createContext<TRun>()
const Scope = createContext<ReturnType<typeof scopeOf>>()
function runOf() {
	const run = useContext(Run)
	if (!run) throw new Error('Missing experiment run')
	return run
}
function Root(props: { children?: JSX.Element; content: () => JSX.Element }) {
	const run = runOf()
	const scope = scopeOf(run)
	return (
		<Scope.Provider value={scope}>
			{run.phase === 'scan' ? (
				<>
					{props.children}
					{props.content()}
				</>
			) : (
				<Tabs engine={scope.engine} content={props.content}>
					{props.children}
				</Tabs>
			)}
		</Scope.Provider>
	)
}
function Item(props: { value: string; text: string; active?: boolean }) {
	const run = runOf()
	const scope = useContext(Scope)
	if (!scope) throw new Error('Missing experiment scope')
	const ctrl = itemOf(scope, props, run.phase)
	return run.phase === 'scan' ? null : <Tabs.Item {...props} ctrl={ctrl} />
}
function Content(props: TContentProps) {
	return runOf().phase === 'scan' ? props.children : <Tabs.Content {...props} />
}
function Set(props: TSetProps) {
	const R = props.candidate ? Root : Tabs
	const I = props.candidate ? Item : Tabs.Item
	const C = props.candidate ? Content : Tabs.Content
	const count = props.count ?? 2
	const prefix = props.prefix ?? ''
	return (
		<R
			content={() => (
				<>
					{Array.from({ length: count }, (_, i) => (
						<C value={prefix + i}>
							Panel {prefix + i}
							{(props.scenario === 'nested' && i === count - 1) ||
							props.scenario === 'inactive-nested' ? (
								<Set
									candidate={props.candidate}
									prefix={i === 0 ? 'hidden-' : 'nested-'}
								/>
							) : null}
						</C>
					))}
					{props.scenario === 'conditional' ? (
						<C value={prefix + 'last'}>Panel {prefix}last</C>
					) : null}
				</>
			)}
		>
			{Array.from({ length: count }, (_, i) =>
				props.scenario === 'conditional' && i === 1 ? null : (
					<I value={prefix + i} text={'Tab ' + prefix + i} active={i === count - 1} />
				),
			)}
			{props.scenario === 'conditional' ? (
				<I value={prefix + 'last'} text={'Tab ' + prefix + 'last'} active />
			) : null}
		</R>
	)
}
export function Page(props: TSetProps & { run: TRun }) {
	return (
		<Run.Provider value={props.run}>
			<Set {...props} />
		</Run.Provider>
	)
}
