/**
 * `<div is="so-select">` — поле выбора, паттерн Combobox. Корень — рамка и якорь
 * панели; его поле — деталь Input, и атрибуты разметки едут через неё на
 * `<input>`. Модуль регистрирует и части. docs/architecture.md, Layer 8d,
 * «Набор тегов и поле выбора».
 */

import { SelectCollectionDescriptor, SelectDescriptor } from '@soxa-ui/setup'
import type { ISelect, TSelectCollectionFacade } from '@soxa-ui/core'
import { ElementBase, defineElement } from '../../adapter'
import type { TElementClassOf, TElementType } from '../../adapter'
import { TSelectGroupElement } from './group'
import { TSelectSeparatorElement } from './separator'
import { TSelectItemElement } from './item'
import { selectTemplate } from './select.template'
import { setupSelect } from './setup.component'

export const TSelectElement: TElementClassOf<
	typeof HTMLDivElement,
	typeof SelectDescriptor,
	ISelect,
	TSelectCollectionFacade
> = ElementBase(HTMLDivElement, {
	descriptor: SelectDescriptor,
	facade: SelectCollectionDescriptor,
	template: selectTemplate,
	root: { strategy: 'host', sets: ['attrs', 'dataset'], control: true },
	setup: setupSelect,
})

defineElement('so-select', TSelectElement, 'div')
defineElement('so-select-separator', TSelectSeparatorElement, 'div')
defineElement('so-select-group', TSelectGroupElement, 'div')
defineElement('so-select-item', TSelectItemElement, 'div')

/** `id` — проп `TIdPlugin`: атрибут и `el.id` уходят на поле, у корня своего `id` нет. */
export type TSelectElementProps = TElementType<typeof TSelectElement>
