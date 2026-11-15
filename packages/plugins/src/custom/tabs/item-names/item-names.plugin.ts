import type { ITabsItem } from '@soxa-ui/core'
import { formatName } from '../../../locale/locale'
import { TNamesPlugin } from '../../../locale/names.plugin'
import type { TTranslations } from '../../../locale/types'

/**
 * TTabsItemNamesPlugin — имя кнопки закрытия таба от локали: в `closeAria`,
 * вместе с текстом таба — «Close Настройки».
 *
 * Без текста все кнопки закрытия в наборе назывались бы одинаково, и по
 * списку элементов скринридера («Close, кнопка» пять раз подряд) выбрать
 * нужную было бы невозможно. Как имя складывается с текстом, решает шаблон
 * локали (`tabs.close`): порядок слов у каждого языка свой. Сменился текст —
 * имя переписывается.
 */
export class TTabsItemNamesPlugin extends TNamesPlugin<ITabsItem> {
	protected override _name(owner: ITabsItem, translations: TTranslations): void {
		this._setName('closeAria', owner.closeAria, formatName(translations.tabs.close, owner.text))
	}

	protected override _watch(owner: ITabsItem, name: () => void): void {
		this._listenTo(owner.events, 'change:text', name)
	}
}
