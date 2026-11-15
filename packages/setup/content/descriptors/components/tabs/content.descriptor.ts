/**
 * Дескрипторы панели таба (`TabsContent`).
 *
 * Две штуки — как у элемента: собственный (props панели) и коллекционный
 * (активность и ARIA-связка, выводятся фасадом). Смешивать нельзя: core
 * отвечает за props и events, коллекционная часть — за членство в коллекции.
 */
import { CollectionInitialPartPluginDescriptor } from '../../plugins/collection-initial.plugin'

import { defineComponent, defineDescriptor } from '../../../../protected/define'
import { TTabsContent, TTabsContentCollectionFacade } from '@soxa-ui/core'
import { ComponentViewDescriptor } from '../component-view.descriptor'
import { IdPluginDescriptor, TabsContentWarnPluginDescriptor } from '../../plugins'

export const TabsContentDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTabsContent,

		extends: ComponentViewDescriptor(),

		/** Собственные props панели (выводятся классом TTabsContent). */
		contribution: {
			props: {
				value: { type: [String, Number], triggers: ['change:value'] },
			},
			slots: {
				default: { description: 'Содержимое панели' },
			},
			events: ['change:value'],
		},

		plugins: [
			CollectionInitialPartPluginDescriptor,
			// `id` панели — проп `id`: на панель ведёт `aria-controls` её таба, и
			// `id` приложения главнее формулы таба. На панель и в ссылку таба его
			// кладёт связка панели (`TTabsContentBindingExtension`)
			IdPluginDescriptor,
			TabsContentWarnPluginDescriptor,
		],
	}),
)

export const TabsCollectionContentDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTabsContentCollectionFacade,

		/**
		 * Коллекционные props панели (выводятся фасадом TTabsContentCollectionFacade).
		 *
		 * Отделены от собственных ровно как у элемента (`TabsCollectionItemDescriptor`):
		 * активность — свойство членства в коллекции, а не панели.
		 *
		 * ARIA-связки здесь нет: `id` и `aria-labelledby` пишет прямо в `aria`
		 * панели `TTabsContentBindingExtension` — то единственное место, где
		 * известно, что панель и таб нашли друг друга. `role` и `tabindex` панель
		 * пишет себе сама.
		 */
		contribution: {
			props: {
				active: { type: Boolean, protected: true, triggers: ['change:active'] },
			},
			events: ['change:active'],
		},
	}),
)
