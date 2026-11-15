/**
 * Дескриптор Tags (TTags).
 *
 * Наследует `ValueControlDescriptor` и добавляет `closable` плюс плагины
 * коллекции и клавиатуру. Списочных плагинов ListBox (высота, подсветка,
 * прокрутка) и drag-and-drop здесь нет: у ListBox фокус на контейнере, а у
 * Tags с выбором он ходит по самим тегам — у каждого свой крестик. Модель —
 * APG Listbox на roving tabindex, как у Tabs: весь набор — одна остановка
 * Tab, стрелки между тегами (`TagsKeyboardPluginDescriptor`). Без выбора
 * (`mode="none"`) набор — список без действия у строк, и клавиатура молчит.
 * См. AGENTS, «Граница переиспользования» и «Готовые паттерны».
 */
import { CollectionInitialPluginDescriptor } from '../../plugins/collection-initial.plugin'

import { defineComponent, defineDescriptor, defineType } from '../../../../protected/define'
import { TTags } from '@soxa-ui/core'
import type { ITagsItem } from '@soxa-ui/core'
import { tagStopOf } from '@soxa-ui/plugins'
import { ValueControlDescriptor } from '../value-control.descriptor'
import {
	ActionPluginDescriptor,
	CollectionBundlesPluginDescriptor,
	CollectionElementsPluginDescriptor,
	TagsKeyboardPluginDescriptor,
	TagsScrollPluginDescriptor,
} from '../../plugins'

export const TagsDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTags,

		extends: ValueControlDescriptor(),

		contribution: {
			/**
			 * Tags — не список: заголовка и подвала ListBox здесь нет, потому что у
			 * задачи нет потребителя для них. Слоты элементов статические и
			 * получают элемент через scope (см. ListBox).
			 *
			 * `default` отдаёт показанные теги (`shown` — состав после отбора):
			 * своя разметка раскладывает их, как ей нужно, — в ленту `Scroller`,
			 * в ряд с хвостом в `Popover` за кнопкой. Своего замера и панели у
			 * набора нет, и раскладка сверх `wrap` и `scroll` — дело того, кто
			 * заполняет слот.
			 *
			 * Слоты тегов при работе через проп `items` — проброс слотов тега:
			 * `item-<слот>` (`default` — `item`), scope — scope слота тега плюс
			 * сам тег.
			 */
			slots: {
				default: {
					scope: { shown: defineType<ReadonlyArray<ITagsItem>>(Array) },
					description: 'Теги — элементы коллекции; scope — показанные теги',
				},
				item: {
					scope: {
						item: defineType<ITagsItem>(Object),
						text: defineType<string>(String),
						selected: defineType<boolean>(Boolean),
					},
					description: 'Содержимое тега при работе через проп items',
				},
				'item-leading': {
					scope: { item: defineType<ITagsItem>(Object) },
					description: 'Перед содержимым тега',
				},
				'item-trailing': {
					scope: { item: defineType<ITagsItem>(Object) },
					description: 'После содержимого тега',
				},
				'item-close-icon': {
					scope: { item: defineType<ITagsItem>(Object) },
					description: 'Иконка кнопки закрытия тега',
				},
			},
			props: {
				closable: { type: Boolean, triggers: ['change:closable'] },
				/**
				 * Внешний вид тегов — модификатор набора: по нему тема рисует
				 * пилюлю каждого тега целиком, вместе с кнопкой закрытия. Тегам
				 * значение не доставляется.
				 */
				view: { type: String, triggers: ['change:view'] },
				/**
				 * Что делать с тегами, которым не хватило ширины ряда: переносить
				 * (`wrap`, по умолчанию) или прокручивать (`scroll`). Само значение
				 * уезжает в тему через `data-overflow`.
				 */
				overflow: { type: String, triggers: ['change:overflow'] },
			},
			events: ['change:closable', 'change:view', 'change:overflow'],
		},

		plugins: [
			CollectionInitialPluginDescriptor,
			// Фокус держит остановка набора — с выбором тег-остановка, без него
			// первый крестик, — а корень — ряд тегов: туда `focused = true` и
			// ставит фокус. Остановку плагин берёт у модели, через реестр
			// элементов ниже
			ActionPluginDescriptor.with({ focusTarget: tagStopOf }),
			// Коллекция: реестр bundles + доступ к DOM-элементам
			CollectionBundlesPluginDescriptor,
			CollectionElementsPluginDescriptor,
			// Клавиатура по APG Listbox, пока выбор включён: стрелки, Home/End, Delete
			TagsKeyboardPluginDescriptor,
			// Доводка тега под фокусом в окно ряда, который прокручивается сам (`scroll`)
			TagsScrollPluginDescriptor,
		],
	}),
)
