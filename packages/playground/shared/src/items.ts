/**
 * Shared playground collection data for every adapter.
 *
 * Previews render collection content because it is not a descriptor prop.
 * Property presets also use these values: Select's tagsOverflow preset selects
 * every item without duplicating the selection values.
 *
 * Five rows exercise overflow, row limits and tab wrapping.
 */
export const COLLECTION_ITEMS = [
	{ value: 'a', text: 'Первый' },
	{ value: 'b', text: 'Второй' },
	{ value: 'c', text: 'Третий' },
	{ value: 'd', text: 'Четвёртый' },
	{ value: 'e', text: 'Пятый' },
] as const

export const SIDEBAR_GROUPS = [
	{
		label: 'Выпуск',
		items: [
			{ text: 'Календарь публикаций', icon: 'calendar', current: true },
			{ text: 'Задачи редакции', icon: 'check', current: false },
			{ text: 'Напоминания', icon: 'notification', current: false },
		],
	},
	{
		label: 'Материалы',
		items: [
			{ text: 'Черновики', icon: 'copy', current: false },
			{ text: 'Избранные статьи', icon: 'star', current: false },
			{ text: 'Редакционный справочник', icon: 'info', current: false },
		],
	},
] as const

/** Значения состава — то, чем задают выбор целиком. */
export const COLLECTION_VALUES = COLLECTION_ITEMS.map((item) => item.value)

/**
 * Состав с группами — для блока групп коллекций, у которых группы есть
 * (ListBox, Select, Menu), и для их строки `groupSeparators`: её пресет
 * (`PRESETS`) рисует компонент на нём же. Метка группы — в отметках элемента
 * (`_.group`). В данных фрукты и овощи вперемешку, а у воды группы нет: видно
 * и то, что группы встают порядком `groups`, и то, что элементы без группы
 * идут за заявленными группами, через разделитель.
 */
export const GROUPED_ITEMS = [
	{ value: 'apple', text: 'Яблоко', _: { group: 'fruit' } },
	{ value: 'carrot', text: 'Морковь', _: { group: 'veg' } },
	{ value: 'pear', text: 'Груша', _: { group: 'fruit' } },
	{ value: 'potato', text: 'Картофель', _: { group: 'veg' } },
	{ value: 'water', text: 'Вода' },
]

/** Тот же состав без меток: группу элемента считает `groupBy` (`produceGroupOf`). */
export const PRODUCE_ITEMS = GROUPED_ITEMS.map(({ value, text }) => ({ value, text }))

/** Порядок групп состава и их подписи — `groups`. */
export const PRODUCE_GROUPS = [
	{ key: 'fruit', label: 'Фрукты' },
	{ key: 'veg', label: 'Овощи' },
]

/**
 * Группа элемента состава по его значению — `groupBy` блока групп: та же
 * группировка, что метками, только ключ считает функция. Элемент — экземпляр
 * коллекции, и значение функция берёт у него.
 */
export function produceGroupOf(item: object): string | undefined {
	const value = Reflect.get(item, 'value')

	if (value === 'apple' || value === 'pear') return 'fruit'
	if (value === 'carrot' || value === 'potato') return 'veg'

	return undefined
}

/**
 * Тысяча элементов списка — для окна (обёртка `Virtual`), как тысяча строк
 * таблицы ниже: на пяти элементах окно не видно. Текст — в одну строку: в окне
 * высота элементов одна на все.
 */
export const COLLECTION_MANY_ITEMS = Array.from({ length: 1000 }, (_, index) => ({
	value: `item-${index + 1}`,
	text: `Пункт ${index + 1}`,
}))

/**
 * Записи приложения для таблицы стенда — то, что показывают её строки.
 *
 * Пять, как у остальных коллекций, и с полями, по которым видно сортировку:
 * текст в алфавите языка и числа. Своё у таблицы — запись, а не текст и
 * значение элемента: колонки раскладывают её по полям.
 */
export const TABLE_RECORDS = [
	{ id: 1, name: 'Анна Смирнова', city: 'Казань', age: 30 },
	{ id: 2, name: 'Борис Петров', city: 'Омск', age: 41 },
	{ id: 3, name: 'Вера Иванова', city: 'Тверь', age: 25 },
	{ id: 4, name: 'Глеб Сорокин', city: 'Пермь', age: 37 },
	{ id: 5, name: 'Дина Орлова', city: 'Сочи', age: 29 },
]

/**
 * Строки таблицы стенда — над записями. Одна выключена: выключенную строку
 * пользователь не выбирает, и чекбокс шапки её не считает.
 */
export const TABLE_ROWS = TABLE_RECORDS.map((data) => ({ data, disabled: data.id === 4 }))

/**
 * Строки над записями стенда по кругу, с номером в имени и ключе: `count`
 * строк для таблицы, которую видно в окне прокрутки.
 */
function numberedRows(count: number) {
	return Array.from({ length: count }, (_, index) => {
		const record = TABLE_RECORDS[index % TABLE_RECORDS.length]

		return { data: { ...record, id: index + 1, name: `${record.name} ${index + 1}` } }
	})
}

/**
 * Тысяча строк — для окна (обёртка `Virtual`): на пяти строках окно не видно,
 * а на тысяче видно, что в документе только видимые.
 */
export const TABLE_MANY_ROWS = numberedRows(1000)

/**
 * Сорок строк — для закреплённой шапки (`stickyHead`) без окна: пять строк
 * не прокручиваются, а тысяча без окна рисовалась бы целиком.
 */
export const TABLE_SCROLL_ROWS = numberedRows(40)

/**
 * Колонки таблицы стенда — данными: имя называет строки (`rowHeader`), все
 * сортируются, у возраста — ширина и выравнивание по концу, как у чисел.
 * Своих `resizable` и `reorderable` у колонок нет — их дают пропы таблицы,
 * одной строкой стенда на все колонки. Ширину меняет ручка у края заголовка —
 * в границах колонки, а место — перетаскивание заголовка и Ctrl+Shift+←/→ на
 * нём.
 *
 * Границы — у всех трёх. Имя и город — без своей ширины: их раскладывает
 * таблица по месту (`columnFit`), в их границах. На широком экране имя
 * встаёт у своей верхней границы, а не шире неё, и ручка берёт его без
 * скачка — на этом случае раскладку ядра и проверяют.
 */
export const TABLE_COLUMNS = [
	{
		field: 'name',
		text: 'Имя',
		rowHeader: true,
		sortable: true,
		minWidth: 120,
		maxWidth: 360,
	},
	{
		field: 'city',
		text: 'Город',
		sortable: true,
		minWidth: 100,
		maxWidth: 300,
	},
	{
		field: 'age',
		text: 'Возраст',
		align: 'end' as const,
		width: 120,
		sortable: true,
		minWidth: 80,
		maxWidth: 200,
	},
]

/** Ordered native-link trail shared by the Breadcrumbs previews. */
export const BREADCRUMBS_ITEMS = [
	{ text: 'Главная', href: '#home' },
	{ text: 'Каталог', href: '#catalog' },
	{ text: 'Электроника', href: '#electronics' },
	{ text: 'Телефоны', href: '#phones' },
	{ text: 'Смартфоны', href: '#smartphones' },
	{ text: 'Товар', _: { active: true } },
]

export const TREE_PREVIEW_EXPANDED = ['accounts']

export const TREE_PREVIEW_PROPS = {
	items: [
		{
			value: 'accounts',
			text: 'Accounts',
			children: [
				{
					value: 'acme',
					text: 'Acme',
					children: [{ value: 'acme-projects', text: 'Projects' }],
				},
				{ value: 'globex', text: 'Globex' },
			],
		},
		{
			value: 'support',
			text: 'Support',
			children: [
				{ value: 'faq', text: 'Frequently asked questions' },
				{ value: 'contact', text: 'Contact' },
			],
		},
	],
	guides: true,
	aria_label: 'Sections',
}
