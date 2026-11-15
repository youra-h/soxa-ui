import type { ITagsItem } from '@soxa-ui/core'
import { formatName } from '../../../locale/locale'
import { TNamesPlugin } from '../../../locale/names.plugin'
import type { TTranslations } from '../../../locale/types'

/**
 * TTagsItemNamesPlugin — имя кнопки закрытия тега от локали: в `closeAria`,
 * вместе с текстом тега, как у таба (`TTabsItemNamesPlugin`). `tabindex` того
 * же набора пишет коллекция, а не плагин.
 */
export class TTagsItemNamesPlugin extends TNamesPlugin<ITagsItem> {
	protected override _name(owner: ITagsItem, translations: TTranslations): void {
		this._setName('closeAria', owner.closeAria, formatName(translations.tags.close, owner.text))
	}

	protected override _watch(owner: ITagsItem, name: () => void): void {
		this._listenTo(owner.events, 'change:text', name)
	}
}
