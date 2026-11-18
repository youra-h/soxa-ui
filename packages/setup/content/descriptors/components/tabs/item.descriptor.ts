/**
 * Дескриптор TabsItem.
 *
 * Наследует ValueControlDescriptor (value, name, disabled, focused, size, variant, ...)
 * и добавляет tag, text, closable, слоты строки и крестика + коллекционный плагин (active, order).
 * Имя крестика — шаблон локали с текстом таба: его пишет плагин имён.
 */
import { CollectionInitialPartPluginDescriptor } from '../../plugins/collection-initial.plugin'

import { defineComponent, defineDescriptor, defineType } from '../../../../protected/define'
import { TTabsItem } from '@soxa-ui/core'
import { tabIn } from '@soxa-ui/plugins'
import { ValueControlDescriptor } from '../value-control.descriptor'
import { OWNER_STYLE_PROPS } from '../stylable.descriptor'
import {
	ActionPluginDescriptor,
	IdPluginDescriptor,
	TabsItemIdsPluginDescriptor,
	TabsItemNamesPluginDescriptor,
} from '../../plugins'

export const TabsItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTabsItem,

		extends: ValueControlDescriptor(),

		contribution: {
			// Слоты строки те же, что у элементов остальных коллекций: перед текстом,
			// текст, после текста. Строку рисует один и тот же `Button`
			slots: {
				leading: { description: 'Перед текстом таба' },
				default: {
					scope: {
						text: defineType<string>(String),
						active: defineType<boolean>(Boolean),
					},
					description: 'Содержимое таба. Задано — переопределяет проп text',
				},
				trailing: { description: 'После текста таба' },
				// Подмена иконки закрытия в одном месте; по умолчанию она берётся из
				// пакета иконок по роли `close` (см. `ICON_ROLES`)
				'close-icon': { description: 'Иконка кнопки закрытия' },
			},
			props: {
				// Размер и вид таба задаёт набор: входы сняты
				...OWNER_STYLE_PROPS,
				text: { type: String, triggers: ['change:text'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
				/**
				 * Набор кнопки закрытия: отдельный, а не часть `aria` — `aria`
				 * описывает сам таб, а это кнопка рядом с ним. `tabindex` пишет
				 * таб, имя с текстом таба — `TTabsItemNamesPlugin`.
				 */
				closeAria: { type: Object, protected: true, triggers: ['change:closeAria'] },
			},
			events: ['change:text', 'change:closable'],
		},

		plugins: [
			CollectionInitialPartPluginDescriptor,
			// Фокус держит строка таба с ролью, а корень — обёртка вокруг неё и
			// крестика: туда `focused = true` и ставит фокус
			ActionPluginDescriptor.with({ focusTarget: tabIn }),
			// Связка «таб ↔ панель»: `id` таба — проп `id` или от монтирования —
			// и `aria-controls` его панели
			IdPluginDescriptor,
			TabsItemIdsPluginDescriptor,
			// Имя крестика от локали — с первой отрисовки
			TabsItemNamesPluginDescriptor,
		],
	}),
)
