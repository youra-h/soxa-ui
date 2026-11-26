import type { TLocale, TLocalePatch, TPartialTranslations, TTranslations } from './types'

/** Defaults for complete custom locales created before AlertDialog. */
export const ALERT_DIALOG_NAMES = Object.freeze({ confirm: 'Confirm', cancel: 'Cancel' })

/** Defaults for custom locales created before CodeBlock. */
export const CODE_BLOCK_NAMES = Object.freeze({
	region: 'Code',
	copy: 'Copy',
	copied: 'Copied',
	error: 'Unable to copy code',
})

export const FILE_UPLOAD_NAMES = Object.freeze({
	choose: 'Choose files',
	drop: 'Drag your file here or',
	browse: 'click to upload',
	limit: 'Maximum file size: {size}',
	remove: 'Remove {name}',
	type: '{name}: unsupported file type.',
	size: '{name}: file is too large.',
	count: '{name}: file limit reached.',
})

/** Defaults for locales written before Breadcrumbs was introduced. */
export const BREADCRUMBS_NAMES = Object.freeze({
	navigation: 'Breadcrumbs',
	overflow: 'Show hidden breadcrumbs',
})

/** Место для имени части в строке-шаблоне. */
const NAME = '{name}'

/**
 * Строка с именем части: шаблон из локали, на месте `{name}` — имя.
 *
 * ```ts
 * formatName('Закрыть {name}', 'Настройки') // 'Закрыть Настройки'
 * formatName('Закрыть {name}', '')          // 'Закрыть'
 * ```
 *
 * Имя приходит без пробелов по краям. Пустое имя — у части имени нет, и
 * строка остаётся без него: пробел, который стоял при имени, не повисает ни
 * по краям, ни двойным в середине.
 */
export function formatName(template: string, name: string): string {
	return template.split(NAME).join(name.trim()).replace(/ {2,}/g, ' ').trim()
}

/**
 * Локаль поверх готовой: свой тег, свои строки, остальное — от `base`.
 *
 * ```ts
 * const esMX = extendLocale(esES, { tag: 'es-MX' })
 * const mn = extendLocale(enUS, {
 * 	tag: 'mn-MN',
 * 	translations: { modal: { close: 'Хаах' } },
 * })
 * ```
 *
 * Так делают регион готового языка, свою формулировку строки и язык, который
 * переведён не целиком: чего в правке нет, остаётся от `base`; ключ со
 * значением `undefined` строку не задаёт. Результат заморожен, как и готовые
 * локали: объект один на всё поддерево, и правка на месте молча
 * переименовала бы кнопки у всех компонентов, не сообщив ни одному.
 */
export function extendLocale(base: TLocale, patch: TLocalePatch): TLocale {
	return Object.freeze({
		tag: patch.tag ?? base.tag,
		translations: overlay(base.translations, patch.translations ?? {}),
	})
}

/**
 * Готовая локаль пакета — замороженной вместе с разделами, как результат
 * `extendLocale`. Наружу не выходит: свою полную локаль приложение пишет
 * обычным объектом.
 */
export function freezeLocale(locale: TLocale): TLocale {
	return extendLocale(locale, {})
}

/**
 * Строки правки поверх строк `base`. Разделы перечислены поимённо: новый
 * раздел без строки здесь — ошибка компиляции, а не молча строки `base`.
 */
function overlay(base: TTranslations, patch: TPartialTranslations): TTranslations {
	return Object.freeze({
		alertDialog: Object.freeze({
			...ALERT_DIALOG_NAMES,
			...base.alertDialog,
			...defined(patch.alertDialog),
		}),
		alert: Object.freeze({ close: base.modal.close, ...base.alert, ...defined(patch.alert) }),
		codeBlock: Object.freeze({
			...CODE_BLOCK_NAMES,
			...base.codeBlock,
			...defined(patch.codeBlock),
		}),
		breadcrumbs: Object.freeze({
			...BREADCRUMBS_NAMES,
			...base.breadcrumbs,
			...defined(patch.breadcrumbs),
		}),
		fileUpload: Object.freeze({
			...FILE_UPLOAD_NAMES,
			...base.fileUpload,
			...defined(patch.fileUpload),
		}),
		modal: section(base, patch, 'modal'),
		dialog: section(base, patch, 'dialog'),
		popover: section(base, patch, 'popover'),
		tabs: section(base, patch, 'tabs'),
		tags: section(base, patch, 'tags'),
		toasts: section(base, patch, 'toasts'),
		scroller: section(base, patch, 'scroller'),
		pagination: section(base, patch, 'pagination'),
		field: section(base, patch, 'field'),
		numberInput: section(base, patch, 'numberInput'),
		table: section(base, patch, 'table'),
		calendar: section(base, patch, 'calendar'),
		datePicker: section(base, patch, 'datePicker'),
		rating: section(base, patch, 'rating'),
		textarea: section(base, patch, 'textarea'),
	})
}

/** Раздел `key`: строки `base`, поверх — заданные строки того же раздела правки. */
function section<K extends keyof TTranslations>(
	base: TTranslations,
	patch: TPartialTranslations,
	key: K,
): TTranslations[K] {
	const result: TTranslations[K] = { ...base[key], ...defined(patch[key]) }

	Object.freeze(result)

	return result
}

/** Строки раздела без ключей со значением `undefined`: такой ключ строку не задаёт. */
function defined<T extends object>(part: Partial<T> | undefined): Partial<T> {
	const result: Partial<T> = {}

	if (part === undefined) return result

	for (const key in part) {
		const value = part[key]

		if (value !== undefined) result[key] = value
	}

	return result
}
