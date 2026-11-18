import {
	createAdapterContext,
	TCollectionPreparation,
	collectionNeedsPreparation,
} from '@soxa-ui/setup'
import { AngularElevatorFactory } from '../elevator'
import { nearestLocale } from '../locale/context'
import { nextMountId } from './mount-id'

/**
 * Сборка компонента Angular, как `createVueAdapterContext` у Vue: id
 * монтирования — номер сборки в приложении, локаль — ближайшего
 * `LocaleProviderDirective`. Зовётся в контексте инъекции, который даёт база.
 * AGENTS.md (Angular), «Сборка — `createAngularAdapterContext`».
 */
export const createAngularAdapterContext: typeof createAdapterContext = (
	descriptor,
	options,
	config,
) => {
	if (collectionNeedsPreparation(descriptor, config))
		config = {
			...config,
			preparation: config?.preparation ?? new TCollectionPreparation(AngularElevatorFactory),
		}
	// Чужой набор (фасад коллекции): id и локаль у того, кто его собрал, —
	// номер сборки на фасад не тратится, и номера сервера и браузера сходятся
	if (config?.bundle !== undefined) return createAdapterContext(descriptor, options, config)

	return createAdapterContext(
		descriptor,
		{
			...options,
			mountId: options.mountId ?? nextMountId(),
			locale: options.locale ?? nearestLocale(),
		},
		config,
	)
}
