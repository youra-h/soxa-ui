import { createUniqueId } from 'solid-js'
import {
	createAdapterContext,
	TCollectionPreparation,
	collectionNeedsPreparation,
} from '@soxa-ui/setup'
import { useElevator } from '../elevator'
import { nearestLocale } from '../locale/context'

/**
 * Сборка компонента Solid поверх `createAdapterContext`: id монтирования —
 * `createUniqueId()` (совпадает на сервере и при гидратации), локаль —
 * ближайшего `LocaleProvider`. Контекст на чужом наборе (фасад коллекции) их
 * не берёт: они у того, кто набор собрал. Зовётся в теле компонента.
 */
export const createSolidAdapterContext: typeof createAdapterContext = (
	descriptor,
	options,
	config,
) => {
	if (collectionNeedsPreparation(descriptor, config))
		config = {
			...config,
			preparation: config?.preparation ?? new TCollectionPreparation(useElevator().elevator),
		}
	if (config?.bundle !== undefined) return createAdapterContext(descriptor, options, config)

	return createAdapterContext(
		descriptor,
		{
			...options,
			mountId: options.mountId ?? createUniqueId(),
			locale: options.locale ?? nearestLocale(),
		},
		config,
	)
}
