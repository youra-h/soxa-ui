/**
 * Дескриптор TagsItem (TTagsItem).
 *
 * Наследует `ValueControlDescriptor` (value, name, disabled, focused, size,
 * variant, ...), добавляет `text`, `closable`, `closeAria`. Имя крестика —
 * шаблон локали с текстом тега: его пишет плагин имён.
 * Плагина подсветки здесь нет: в отличие от ListBoxItem, по тегам ходит
 * настоящий фокус, а не подсветка. Клавиатура набора — плагин владельца
 * (`TagsKeyboardPluginDescriptor`), остановку Tab пишет коллекция.
 *
 * Размер тегу диктует набор, поэтому вход `size` снят. `variant` — вход, в
 * отличие от остальных элементов коллекций (`OWNER_STYLE_PROPS`): вариант у
 * тега свой, и в одном наборе бывают теги разного цвета. Набор его не пишет —
 * тег без своего варианта тема красит вариантом набора.
 *
 * Строка тега (`row`) — не проп, а экземпляр, которым владеет тег, как поле
 * Select: за жизнь тега он не меняется, и разметка отдаёт его кнопке через
 * `ctrl`.
 */
import { CollectionInitialPartPluginDescriptor } from '../../plugins/collection-initial.plugin'

import { defineComponent, defineDescriptor, defineType } from '../../../../protected/define'
import { TTagsItem } from '@soxa-ui/core'
import { tagStopIn } from '@soxa-ui/plugins'
import { ValueControlDescriptor } from '../value-control.descriptor'
import { ActionPluginDescriptor, TagsItemNamesPluginDescriptor } from '../../plugins'

export const TagsItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TTagsItem,

		extends: ValueControlDescriptor(),

		contribution: {
			slots: {
				leading: { description: 'Перед текстом тега' },
				default: {
					scope: {
						text: defineType<string>(String),
						selected: defineType<boolean>(Boolean),
					},
					description: 'Содержимое тега. Задано — переопределяет проп text',
				},
				trailing: { description: 'После текста тега' },
				// Подмена иконки закрытия в одном месте; по умолчанию она берётся из
				// пакета иконок по роли `close` (см. `ICON_ROLES`)
				'close-icon': { description: 'Иконка кнопки закрытия' },
			},
			props: {
				// Размер тега задаёт набор: вход снят. Вариант — свой, вход
				// остаётся от `ValueControlDescriptor`
				size: { protected: true },
				text: { type: String, triggers: ['change:text'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
				/** The list container includes both the row and remove button. */
				rootAria: {
					type: Object,
					protected: true,
					triggers: ['change:rootAria'],
				},
				/** The remove button name and its mode-dependent tab stop. */
				closeAria: {
					type: Object,
					protected: true,
					triggers: ['change:closeAria'],
				},
			},
			events: ['change:text', 'change:closable'],
		},

		plugins: [
			CollectionInitialPartPluginDescriptor,
			// Корень — пилюля вокруг строки и крестика, фокус держит остановка
			// тега: с выбором — строка-опция, без выбора — крестик (у строки
			// `listitem` `tabindex` нет). Туда `focused = true` и ставит фокус
			ActionPluginDescriptor.with({ focusTarget: tagStopIn }),
			// Имя крестика от локали — с первой отрисовки
			TagsItemNamesPluginDescriptor,
		],
	}),
)
