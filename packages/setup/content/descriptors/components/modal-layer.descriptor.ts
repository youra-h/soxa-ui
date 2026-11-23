/**
 * Дескриптор ModalLayer (TModalLayer) — модальный слой, общая база окна и
 * выезжающей панели.
 *
 * Наследует LayerDescriptor (видимость, тег, наборы, цель телепорта, номер в
 * общем стеке) и добавляет то, что следует из модальности: размер, кнопку
 * закрытия, `dismissible`, запрос закрытия, выходы для частей без экземпляра
 * и плагины модального слоя. Раскладку — место, край, разворот, жест —
 * приносят наследники вместе со своим плагином раскладки.
 *
 * Открытость — `visible`: модальный слой сам и есть слой, и `open` рядом с
 * ним был бы вторым путём к одному факту. Поэтому плагины слоя ставятся с
 * `property: 'visible'`.
 *
 * Имена кнопок — от локали поддерева: их пишет в наборы (`closeAria`, у окна —
 * `maximizeAria`) плагин имён наследника, как связки — его плагин `ids`.
 *
 * Слотов у базы нет: своей разметки у неё нет ни в одном адаптере, а слоты не
 * наследуются. Заголовок, содержимое, подвал и иконку крестика окно и панель
 * объявляют сами — по своим шаблонам.
 */

import {
	defineComponent,
	defineDescriptor,
	type IPluginDefinition,
} from '../../../protected/define'
import { TModalLayer } from '@soxa-ui/core'
import {
	DismissPluginDescriptor,
	HideOutsidePluginDescriptor,
	ModalFocusPluginDescriptor,
	ScrollLockPluginDescriptor,
} from '../plugins'
import { LayerDescriptor } from './layer.descriptor'

/** Internal builder: descendants choose one focus strategy without installing a second trap. */
export function createModalLayerDescriptor(focus: IPluginDefinition) {
	return defineComponent({
		ctor: TModalLayer,

		extends: LayerDescriptor(),

		contribution: {
			props: {
				backdrop: { type: String, triggers: ['change:backdrop'] },
				backdropClasses: { type: Array, protected: true, triggers: ['change:backdrop'] },
				width: { type: [Number, String], triggers: ['change:width'] },
				height: { type: [Number, String], triggers: ['change:height'] },
				closable: { type: Boolean, triggers: ['change:closable'] },
				dismissible: { type: Boolean, triggers: ['change:dismissible'] },
				/**
				 * Сторона связки у заголовка — части без экземпляра. Набор слоя:
				 * `id` в него пишет плагин связок наследника (`ids`), шаблон
				 * раскладывает на свой элемент.
				 */
				titleAria: { type: Object, protected: true, triggers: ['change:titleAria'] },
				/**
				 * Набор кнопки закрытия: кнопка — сосед содержимого. Имя в него
				 * пишет плагин имён наследника.
				 */
				closeAria: { type: Object, protected: true, triggers: ['change:closeAria'] },
				/**
				 * Номер слоя и открытость у подложки: они у неё те же, что у
				 * панели. По открытости подложка гаснет вместе с панелью.
				 */
				backdropDataset: {
					type: Object,
					protected: true,
					triggers: ['change:zIndex', 'change:visible'],
				},
			},
			/**
			 * Пользователь закрывает панель: кнопкой, нажатием мимо, Escape или
			 * жестом. `preventDefault()` оставляет её открытой.
			 */
			events: [
				'close:before',
				'change:backdrop',
				'change:width',
				'change:height',
				'change:closable',
				'change:dismissible',
			],
		},

		plugins: [
			// Нажатие мимо — по подложке. Без `focusOutside`: фокус из модального
			// слоя не уходит, его держит модель фокуса. Раньше фокуса и фона:
			// оба берут у него панель
			DismissPluginDescriptor.with({ property: 'visible' }),
			// Фокус в панель и назад, Tab по кругу, Escape
			focus,
			// Фон под панелью немой для скринридера
			HideOutsidePluginDescriptor.with({ property: 'visible', modal: true }),
			// Страница под панелью не прокручивается
			ScrollLockPluginDescriptor.with({ property: 'visible', modal: true }),
		],
	})
}

export const ModalLayerDescriptor = defineDescriptor(() =>
	createModalLayerDescriptor(
		ModalFocusPluginDescriptor.with({ property: 'visible', modal: true }),
	),
)
