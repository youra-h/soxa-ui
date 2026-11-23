/**
 * Toast metadata: message, appearance, urgency and the card/close attribute sets.
 * Toasts are created through show(), and only their manager renders them.
 * Description remains a text prop; custom markup belongs to the content slot.
 */

import { defineComponent, defineDescriptor, defineType } from '../../../../protected/define'
import { TToastsItem } from '@soxa-ui/core'
import type { TToastsItemType } from '@soxa-ui/core'
import { ComponentViewDescriptor } from '../component-view.descriptor'
import { SwipePluginDescriptor, ToastsItemNamesPluginDescriptor } from '../../plugins'

export const ToastsItemDescriptor = defineDescriptor(() =>
	defineComponent({
		ctor: TToastsItem,

		extends: ComponentViewDescriptor(),

		contribution: {
			slots: {
				// Подмена значка вида в одном месте; по умолчанию он берётся из пакета
				// иконок по роли вида (см. `ICON_ROLES`). Пока тост ждёт, на месте
				// значка кольцо — и на месте значка из слота тоже
				icon: {
					scope: { type: defineType<TToastsItemType | undefined>(String) },
					description:
						'Значок тоста — перед текстом. Без слота — значок вида; пока тост ждёт — кольцо',
				},
				default: {
					scope: { text: defineType<string>(String) },
					description: 'Текст тоста. Задано — переопределяет проп text',
				},
				content: {
					description: 'Своё содержимое под текстом. Без слота — render тоста',
				},
				// Подмена иконки закрытия в одном месте; по умолчанию она берётся из
				// пакета иконок по роли `close` (см. `ICON_ROLES`)
				'close-icon': { description: 'Иконка кнопки закрытия' },
			},
			props: {
				text: { type: String, triggers: ['change:text'] },
				description: { type: String, triggers: ['change:description'] },
				/**
				 * Вид сообщения: модификатор `--type-<v>` и значок вида. Union ядра, а
				 * не значение темы: значок по нему выбирает разметка
				 */
				type: { type: String, triggers: ['change:type'] },
				view: { type: String, triggers: ['change:view'] },
				/** Тост ждёт: на месте значка кольцо, и сам тост не закрывается */
				loading: { type: Boolean, triggers: ['change:loading'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
				duration: { type: Number, triggers: ['change:duration'] },
				alert: { type: Boolean, triggers: ['change:alert'] },
				/**
				 * Своё содержимое под текстом. Ядро значение не читает: что это и как
				 * его нарисовать, знает адаптер (во Vue — компонент с пропом `toast`)
				 */
				render: { type: [Object, Function], triggers: ['change:render'] },
				/** Attribute sets are outputs: the model owns semantics, adapters only bind them. */
				cardAria: {
					type: Object,
					protected: true,
					triggers: ['change:cardAria'],
				},
				closeAria: {
					type: Object,
					protected: true,
					triggers: ['change:closeAria'],
				},
			},
			events: [
				'change:text',
				'change:description',
				'change:type',
				'change:view',
				'change:loading',
				'change:closable',
				'change:duration',
				'change:alert',
				'change:render',
			],
		},

		plugins: [
			// Имя крестика от локали, вместе с текстом тоста — с первой отрисовки
			ToastsItemNamesPluginDescriptor,
			// Смахнуть тост к стороне его места. Открытость тоста — `open`
			SwipePluginDescriptor,
		],
	}),
)
