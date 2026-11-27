/**
 * Манифест стенда не должен расходиться с компонентами.
 *
 * Описания пропов живут не в контракте, а здесь — значит библиотека может
 * уехать вперёд молча. Прежнее демо так и сгнило: панели свойств были написаны
 * руками, компоненты обросли пропами, и стенд годами показывал не то.
 *
 * Проверка идёт от дескрипторов к манифесту, а не наоборот: источник истины —
 * компонент.
 */

import { describe, it, expect } from 'vitest'
import { underscorePropNaming } from '@soxa-ui/setup'
import { COMPONENTS } from '../src/registry'
import {
	describeProp,
	optionsForProp,
	valuesForProp,
	presetForProp,
	PRESETS,
	PREVIEW_PROPS,
	propControls,
} from '../src/props'
import type { TPropControl } from '../src/types'

/**
 * Строки, которые стенд показывает, — все группы страницы.
 *
 * Считает их та же `propControls`, что строит страницу: своя копия фильтра
 * здесь расходилась бы со страницей молча, а с плагинными пропами разошлась бы
 * наверняка. Все группы, а не одна: пока проверка смотрела только компонентный
 * дескриптор, описания для `mode` с фасада коллекции никто не требовал — а
 * страница его и не показывала.
 */
function editableControls(entry: (typeof COMPONENTS)[number]): TPropControl[] {
	return Object.values(propControls(entry)).flat()
}

/**
 * Записываемые пропы компонента по имени разметки (`underscorePropNaming`) —
 * со строкой и без: свои, фасада коллекции и плагинов. Без `protected`: обмен
 * их не пишет, и пресет с таким пропом не выставил бы ничего.
 */
function writableProps(entry: (typeof COMPONENTS)[number]): Set<string> {
	const props = [
		...entry.descriptor().getProps(),
		...(entry.collectionDescriptor?.().props ?? []),
	]

	return new Set(
		props.filter((prop) => !prop.protected).map((prop) => underscorePropNaming(prop.name)),
	)
}

describe('манифест покрывает контракт', () => {
	it.each(COMPONENTS.map((entry) => [entry.id, entry] as const))(
		'%s: у каждого редактируемого пропа есть описание',
		(_id, entry) => {
			const missing = editableControls(entry)
				.map((control) => control.name)
				.filter((name) => !describeProp(entry.id, name))

			expect(missing).toEqual([])
		},
	)

	/**
	 * Select без списка значений — пустой выпадающий список. Проверяем, что
	 * контрол и данные согласованы, а не по отдельности правдоподобны.
	 */
	it.each(COMPONENTS.map((entry) => [entry.id, entry] as const))(
		'%s: у каждого select-пропа есть непустой список значений',
		(_id, entry) => {
			const broken = editableControls(entry)
				.filter((control) => control.kind === 'select')
				.map((control) => control.name)
				.filter((name) => !optionsForProp(entry.id, name)?.length)

			expect(broken).toEqual([])
		},
	)
})

/**
 * Пресеты строк ссылаются на пропы по имени, как и описания. Переименуй
 * `removeOnBackspace` или `mode` в компоненте — и строка молча перестала бы
 * выставлять то, без чего её проп не виден: ошибки нет, переключатель есть,
 * эффекта нет.
 *
 * Ключ пресета — строка страницы, а имена внутри — записываемые пропы
 * компонента, со строкой или без: состав строки `groupSeparators` — данные
 * (`items` и `groups`), а строки у них нет (`NON_EDITABLE`). Переименованный
 * проп сверка с объявленными пропами ловит так же, как сверка со строками.
 */
describe('пресеты строк', () => {
	it.each(Object.entries(PRESETS))('%s: пресеты ссылаются на настоящие пропы', (id, rows) => {
		const entry = COMPONENTS.find((candidate) => candidate.id === id)

		if (!entry) throw new Error(`нет компонента «${id}»`)

		const withRow = new Set(editableControls(entry).map((control) => control.name))
		const writable = writableProps(entry)
		const broken: string[] = []

		for (const [row, preset] of Object.entries(rows)) {
			if (!withRow.has(row)) broken.push(`строка ${row}`)

			for (const [name, value] of Object.entries(preset)) {
				if (!writable.has(name)) {
					broken.push(`${row} → ${name}`)
					continue
				}

				// Значение перечислимого пропа — из его же списка, иначе пресет
				// выставил бы то, чего компонент не знает
				const options = optionsForProp(id, name)

				// Composite controls store the source object, while their options contain display labels.
				const values = valuesForProp(id, name)
				const known = values
					? Object.values(values).includes(value)
					: typeof value === 'string' && options?.includes(value)
				if (options && !known) {
					broken.push(`${row} → ${name}=${String(value)}`)
				}
			}
		}

		expect(broken).toEqual([])
	})

	/**
	 * Разделитель встаёт только между секциями групп, а превью рисует состав без
	 * групп — у Menu ещё и с ручными `Menu.Separator`, которых свойство не
	 * трогает. Без состава с группами строка показала бы переключатель, который
	 * ничего не меняет. Компоненты — по строке, а не списком: коллекция, которой
	 * разделитель добавят, попадёт сюда сама.
	 */
	const SEPARATED = COMPONENTS.filter((entry) =>
		editableControls(entry).some((control) => control.name === 'groupSeparators'),
	).map((entry) => entry.id)

	it.each(SEPARATED)('%s: строка groupSeparators рисует состав с группами', (id) => {
		expect(Object.keys(presetForProp(id, 'groupSeparators'))).toEqual(
			expect.arrayContaining(['items', 'groups']),
		)
	})
})

/**
 * Пропсы превью — тоже по имени. Переименуй `text` у Button — и превью молча
 * нарисовало бы кнопку без подписи, а строка открылась бы с умолчанием. Имя —
 * проп со строкой на странице: значение превью без строки задать нечему, и
 * оно было бы не пропом превью, а содержимым, которому место в превью хоста.
 */
describe('пропсы превью', () => {
	it.each(Object.entries(PREVIEW_PROPS))(
		'%s: пропсы превью — настоящие пропы со строкой',
		(id, props) => {
			const entry = COMPONENTS.find((candidate) => candidate.id === id)

			if (!entry) throw new Error(`нет компонента «${id}»`)

			const names = new Set(editableControls(entry).map((control) => control.name))
			const broken: string[] = []

			for (const [name, value] of Object.entries(props)) {
				if (!names.has(name)) {
					broken.push(name)
					continue
				}

				// A preset exposes labels to the editor and values to the preview.
				const presets = valuesForProp(id, name)
				const options: readonly unknown[] | undefined = presets
					? Object.values(presets)
					: optionsForProp(id, name)

				if (options && !options.includes(value)) {
					broken.push(`${name}=${String(value)}`)
				}
			}

			expect(broken).toEqual([])
		},
	)
})

describe('реестр', () => {
	it('идентификаторы уникальны — по ним строится маршрут', () => {
		const ids = COMPONENTS.map((entry) => entry.id)

		expect(new Set(ids).size).toBe(ids.length)
	})

	it('каждый дескриптор собирается и отдаёт ctor', () => {
		for (const entry of COMPONENTS) {
			expect(entry.descriptor().ctor, entry.id).toBeTypeOf('function')
		}
	})
})
