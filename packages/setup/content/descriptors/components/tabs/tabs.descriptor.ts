/**
 * Дескриптор Tabs (TTabs).
 *
 * Наследование:
 * - ControlDescriptor (disabled, focused, size, variant, rendered, visible, present, tag, classes)
 *
 * Добавляет: orientation, alignment, position, view, closable + плагины Tabs.
 */
import { CollectionInitialPluginDescriptor } from '../../plugins/collection-initial.plugin'

import { defineComponent, defineDescriptor, defineType } from '../../../../protected/define'
import { TTabs } from '@soxa-ui/core'
import type { ITabsItem } from '@soxa-ui/core'
import { barOf, tabStopOf } from '@soxa-ui/plugins'
import { ControlDescriptor } from '../control.descriptor'
import {
	ActionPluginDescriptor,
	ScrollFocusPluginDescriptor,
	CollectionBundlesPluginDescriptor,
	CollectionElementsPluginDescriptor,
	DragPluginDescriptor,
	TabsActiveTabPluginDescriptor,
	TabsKeyboardPluginDescriptor,
	TabsLayoutPluginDescriptor,
} from '../../plugins'

export const TabsDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTabs,

		extends: ControlDescriptor(),

		contribution: {
			/**
			 * `content` отделён от `default` не по вкусу, а структурно: `default`
			 * кладётся внутрь `[role=tablist]`, и панель, попав туда, оказалась бы в
			 * списке табов. Раньше панели уходили в динамический слот
			 * `panel:${value}`, который резолвил только Vue; теперь это статический
			 * слот с компонентами `TabsContent`.
			 *
			 * Слоты табов при работе через проп `items` — проброс слотов таба:
			 * `item-<слот>` (`default` — `item`), scope — scope слота таба плюс
			 * сам таб.
			 */
			slots: {
				leading: { description: 'Перед списком табов' },
				default: { description: 'Табы — элементы коллекции' },
				trailing: { description: 'После списка табов' },
				content: { description: 'Панели табов — компоненты TabsContent' },
				item: {
					scope: {
						item: defineType<ITabsItem>(Object),
						text: defineType<string>(String),
						active: defineType<boolean>(Boolean),
					},
					description: 'Содержимое таба при работе через проп items',
				},
				'item-leading': {
					scope: { item: defineType<ITabsItem>(Object) },
					description: 'Перед содержимым таба',
				},
				'item-trailing': {
					scope: { item: defineType<ITabsItem>(Object) },
					description: 'После содержимого таба',
				},
				'item-close-icon': {
					scope: { item: defineType<ITabsItem>(Object) },
					description: 'Иконка кнопки закрытия таба',
				},
			},
			props: {
				scrollAttrs: { type: Object, protected: true, triggers: ['change:scrollAttrs'] },
				orientation: { type: String, triggers: ['change:orientation'] },
				alignment: { type: String, triggers: ['change:alignment'] },
				position: { type: String, triggers: ['change:position'] },
				view: { type: String, triggers: ['change:view'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
			},
			// events: [
			// 	'item:close',
			// 	'item:closable',
			// 	'item:disabled',
			// 	'item:text',
			// 	'item:rendered',
			// 	'item:visible',
			// 	'item:present',
			// ],
			events: [
				'change:orientation',
				'change:alignment',
				'change:position',
				'change:view',
				'change:closable',
			],
		},

		plugins: [
			CollectionInitialPluginDescriptor.with({ panelDefaultValue: '' }),
			ScrollFocusPluginDescriptor.with({ target: barOf }),
			// Фокус держит таб-остановка, а корень — рамка со списком и панелями:
			// туда `focused = true` и ставит фокус, как Tab, мимо кнопки в
			// слоте `leading`. Остановку плагин берёт у модели, через реестр
			// элементов ниже
			ActionPluginDescriptor.with({ focusTarget: tabStopOf }),
			// Коллекция: реестр bundles + доступ к DOM-элементам
			CollectionBundlesPluginDescriptor,
			CollectionElementsPluginDescriptor,
			// Tabs-специфичные
			TabsLayoutPluginDescriptor,
			TabsActiveTabPluginDescriptor,
			// Клавиатура по APG Tabs: стрелки, Home/End, Delete
			TabsKeyboardPluginDescriptor,
			// Drag-and-drop
			DragPluginDescriptor,
		],
	}),
)
