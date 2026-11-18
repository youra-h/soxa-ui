/**
 * useAdapter — связка adapter-context с React через обмен `adapter.connect()`:
 * состояние — внешнее хранилище `useSyncExternalStore`, входы — эффектом,
 * события — колбэкам-пропсам, корень — `TRootRef`.
 * AGENTS.md (React), «Связка и состояние».
 */

import {
	useEffect,
	useInsertionEffect,
	useLayoutEffect,
	useMemo,
	useReducer,
	useSyncExternalStore,
} from 'react'
import { collectionInitialInputs, collectionInitialState, toInstanceState } from '@soxa-ui/setup'
import type {
	IAdapterContext,
	TExchange,
	IComponentContract,
	TAdapterState,
	TStateSnapshot,
} from '@soxa-ui/setup'
import type { IPluginBundle } from '@soxa-ui/plugins'
import { ReactProfile } from '../common'
import { TEventCallbacks } from './event-callbacks.class'
import { TRootRef, consumerRefOf, type TRootSource } from './root-ref.class'
import { TStableSnapshot } from './stable-snapshot.class'

export type TBinding<
	C extends IComponentContract = IComponentContract,
	TProps extends object = object,
> = {
	ctrl: C['instance']
	plugins: IPluginBundle | null
	/** Ref корня: привязка к `TElementPlugin`, и тот же узел — `ref` потребителя. */
	ref: (el: Element | null) => void
	/** Ref корня внутри обёртки (`toWrappedRootProps`): только привязка. */
	bindRef: (el: Element | null) => void
	/** Корень значением — для `useRootElement`. */
	root: TRootSource
	/** Пропсы, которые компонент не съел: уходят атрибутами в DOM. */
	forwardProps: Partial<TProps>
	state: TAdapterState<C>
}

/** Связка, к которой добавляют фасад: компонента или уже с фасадом. */
type TOwnerBinding<TProps extends object> = {
	forwardProps: Partial<TProps>
	state: object
}

/** Связка `TOwner` вместе с фасадом коллекции `F`: состояние обоих. */
export type TCollectionBinding<
	TOwner extends TOwnerBinding<TProps>,
	F extends IComponentContract,
	TProps extends object,
> = Omit<TOwner, 'state'> & { state: TOwner['state'] & TAdapterState<F> }

/** Связка контекста, её снимок и приёмник событий: контекст пересобран — все новые. */
type TStore = Readonly<{
	adapter: IAdapterContext
	binding: TExchange
	snapshot: TStableSnapshot
	callbacks: TEventCallbacks
}>

function bind(adapter: IAdapterContext): TStore {
	const binding = adapter.connect(ReactProfile)

	return {
		adapter,
		binding,
		snapshot: new TStableSnapshot(collectionInitialState(adapter, binding.state)),
		callbacks: new TEventCallbacks(adapter),
	}
}

function rebind(_: TStore, adapter: IAdapterContext): TStore {
	return bind(adapter)
}

/** Общее у компонента и фасада: состояние, входы и события. */
function useExchange(
	adapter: IAdapterContext,
	props: object,
): { binding: TExchange; state: TStateSnapshot } {
	const [store, dispatch] = useReducer(rebind, adapter, bind)

	// Пересобранный контекст: обновление на рендере React применяет сразу
	if (store.adapter !== adapter) dispatch(adapter)

	const { binding, snapshot, callbacks } = store

	const state = useSyncExternalStore(
		snapshot.subscribe,
		snapshot.getSnapshot,
		snapshot.getSnapshot,
	)

	// Связка пишет только сменившееся с прошлого раза: повтор не откатит то,
	// что поменяли ядро или код через инстанс
	useEffect(() => {
		binding.inputs.full(collectionInitialInputs(adapter, props))
	}, [props, binding])

	// Подписка до первой отрисовки: `ready` из TElementPlugin не потеряется
	callbacks.update(props)

	useLayoutEffect(() => callbacks.listen(binding), [binding, callbacks])

	return { binding, state }
}

export function useAdapter<C extends IComponentContract, TProps extends object>(
	adapter: IAdapterContext<C>,
	props: TProps,
): TBinding<C, TProps> {
	const { binding, state } = useExchange(adapter, props)
	const root = useMemo(() => new TRootRef(adapter), [adapter])
	const consumer = consumerRefOf(props)

	// `ref` потребителя — до привязки ref узлов; сменился только он — после
	useInsertionEffect(() => root.consume(consumer), [root, consumer])
	useLayoutEffect(() => root.sync(), [root, consumer])

	const forwardProps = useMemo(() => binding.forward(props), [props, binding])

	return {
		ctrl: adapter.instance,
		plugins: adapter.bundle,
		ref: root.attach,
		bindRef: root.bind,
		root,
		forwardProps,
		state: toInstanceState<C>(state),
	}
}

/**
 * Связка компонента вместе с фасадом его коллекции. `ctrl` и корень —
 * компонента; фасад добавляет своё состояние и отбирает свои имена из того,
 * что компонент не съел.
 */
export function useCollectionAdapter<
	TOwner extends TOwnerBinding<TProps>,
	F extends IComponentContract,
	TProps extends object,
>(owner: TOwner, facade: IAdapterContext<F>, props: TProps): TCollectionBinding<TOwner, F, TProps> {
	const { binding, state } = useExchange(facade, props)
	const forwardProps = useMemo(
		() => binding.forward(owner.forwardProps),
		[owner.forwardProps, binding],
	)
	return { ...owner, forwardProps, state: { ...owner.state, ...toInstanceState<F>(state) } }
}
