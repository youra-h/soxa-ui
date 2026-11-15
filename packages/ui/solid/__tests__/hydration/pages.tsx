import { Separator } from '@soxa-ui/solid'
/**
 * Страницы гидратации — одна разметка на две сборки.
 *
 * Для сервера их собирает и рисует перед прогоном гидратации его
 * `globalSetup` (`server.tsx`), сам прогон собирает их для браузера с метками
 * гидратации и гидратирует разметку сервера той же страницей
 * (`*.hydration.spec.tsx`). Узлы сервера браузер находит по ключам
 * гидратации, а ключи выводятся из места компонента в дереве — поэтому
 * страница у сервера и браузера одна.
 *
 * Движок снаружи (`engine`) — только у гидратации: по нему тест меняет
 * коллекцию после гидратации. Сервер рисует страницу без него, и разметка от
 * этого не меняется — движок пуст, и элементы разметки входят в него в том
 * же порядке.
 *
 * Ожидание данных границы `Suspense` (`wait`) — только у сервера: такую
 * страницу он отдаёт потоком и содержимое границы досылает после оболочки
 * (`streamOf` в `server.tsx`). Браузер получает данные вместе с разметкой, и
 * у гидратации они готовы сразу.
 */

import { Show, Suspense, createResource, createSignal, type Accessor, type JSX } from 'solid-js'
import type {
	TAccordionCollection,
	TAttributesMap,
	TListBoxCollection,
	TTableCollection,
	TTableColumnSource,
	TTabsCollection,
	TTagsCollection,
} from '@soxa-ui/core'
import {
	Alert,
	Avatar,
	Badge,
	CodeBlock,
	Accordion,
	Dialog,
	AlertDialog,
	Field,
	ListBox,
	Input,
	RadioGroup,
	Table,
	Tabs,
	Tags,
	Toasts,
	useToasts,
} from '@soxa-ui/solid'
import { KeyedFor } from '../../src/adapter/runtime/KeyedFor'
import { createPartNodes } from '../../src/adapter/runtime/part-node'
import { createPartProps, createRootProps } from '../../src/adapter/common/root'
import * as flow from '../../src/adapter/runtime/flow'

/** Движок табов страницы — только у гидратации. */
export type TTabsPageProps = { readonly engine?: TTabsCollection }

/** Движок тегов страницы — только у гидратации. */
export type TTagsPageProps = { readonly engine?: TTagsCollection }

/** Движок секций страницы — только у гидратации. */
export type TAccordionPageProps = { readonly engine?: TAccordionCollection }

/** Движок списка страницы — только у гидратации. */
export type TListBoxPageProps = { readonly engine?: TListBoxCollection }

/** Табы разметкой, активный вторым: у сервера остановок Tab две (`collections.md`, «Цена»). */
export function TabsActiveSecond(props: TTabsPageProps): JSX.Element {
	return (
		<Tabs engine={props.engine}>
			<Tabs.Item value="a" text="A" />
			<Tabs.Item value="b" text="B" active />
		</Tabs>
	)
}

/** Табы разметкой, активный первым: остановка Tab одна и у сервера. */
export function TabsActiveFirst(props: TTabsPageProps): JSX.Element {
	return (
		<Tabs engine={props.engine}>
			<Tabs.Item value="a" text="A" active />
			<Tabs.Item value="b" text="B" />
		</Tabs>
	)
}

/**
 * Табы разметкой и панель со своим `id`: у сервера таб, отданный раньше
 * панели, ведёт на формулу, а ссылку на `id` панели получает с гидратацией.
 */
export function TabsContentOwnId(props: TTabsPageProps): JSX.Element {
	return (
		<Tabs
			engine={props.engine}
			content={
				<Tabs.Content value="a" id="general">
					Панель A
				</Tabs.Content>
			}
		>
			<Tabs.Item value="a" text="A" active />
			<Tabs.Item value="b" text="B" />
		</Tabs>
	)
}

/** Теги разметкой с выбором, выбран второй: у сервера остановок Tab две, как у табов. */
export function TagsSelectedSecond(props: TTagsPageProps): JSX.Element {
	return (
		<Tags mode="single" engine={props.engine}>
			<Tags.Item value="a" text="A" />
			<Tags.Item value="b" text="B" selected />
		</Tags>
	)
}

/** Счётчик зонда — только у гидратации: мемо раскладки зовёт его на каждый свой пересчёт. */
export type TRootProbeProps = { readonly onCompute?: () => void }

/**
 * Корень, чью раскладку гидратация не меняет, — зонд второго прохода: его
 * мемо раскладки (`createRootProps`) зовёт `onCompute` на каждый пересчёт.
 */
export function RootProbe(props: TRootProbeProps): JSX.Element {
	const root = createRootProps(() => {
		props.onCompute?.()

		return { state: { classes: ['probe'] }, sets: [{ 'data-probe': 'served' }], forward: {} }
	})

	return <div {...root()} />
}

/** Вход соседа зонда: меняет набор узла выше при своей сборке, как контрол — `for` подписи. */
function ProbeEntry(props: { readonly enter: () => void }): JSX.Element {
	props.enter()

	return <i />
}

/**
 * Узел, у которого набора до входа соседа нет (`undefined`), — зонд первого
 * значения помощника части (`createPartProps`): сосед ниже задаёт набор,
 * когда узел уже напечатан, — у сервера в разметке, у браузера во время
 * гидратации.
 */
export function PartProbe(): JSX.Element {
	const [set, setSet] = createSignal<TAttributesMap>()
	const part = createPartProps(set)

	return (
		<div>
			<span {...part()} />
			<ProbeEntry enter={() => setSet({ 'data-probe': 'entered' })} />
		</div>
	)
}

/** Запись зонда петли по ключу. */
export type TProbeRecord = { readonly key: string; readonly text: string }

/**
 * Структура, чей источник после неё меняет вход соседа, — зонд примитивов
 * адаптера: ветки (`Show`), петель по записи и по месту (`For`, `Index`), по
 * ключу (`KeyedFor`) и узлов записей (`createPartNodes`). Сервер печатает их до входа соседа — пустыми, — и
 * браузер собирает их в той же точке, а вход соседа меняет их источник уже во
 * время гидратации. Примитивы — по пути модуля: в бочку адаптера они не входят.
 */
export function StructureProbe(): JSX.Element {
	const [entered, setEntered] = createSignal(false)
	const texts = (): readonly string[] => (entered() ? ['entered'] : [])
	const records = (): readonly TProbeRecord[] => texts().map((text) => ({ key: text, text }))
	const nodes = createPartNodes({
		each: records,
		by: (record) => record.key,
		tag: () => 'b',
		attributes: () => ({ class: 'nodes' }),
		text: (record) => record.text,
	})

	return (
		<div>
			<flow.Show when={entered()}>
				<b class="show">entered</b>
			</flow.Show>
			<flow.For each={texts()}>{(text) => <b class="for">{text}</b>}</flow.For>
			<flow.Index each={texts()}>{(text) => <b class="index">{text()}</b>}</flow.Index>
			<KeyedFor each={records()} by={(record) => record.key}>
				{(record) => <b class="keyed">{record().text}</b>}
			</KeyedFor>
			{nodes}
			<ProbeEntry enter={() => setEntered(true)} />
		</div>
	)
}

/**
 * Поле с контролом со своим `id`: подпись сервер печатает раньше, чем контрол
 * вошёл в поле, и её `for` ведёт на `id` поля контрола от поля
 * (`<id монтирования>-control`), а не на `email` (`field.server.spec.tsx`).
 */
export function FieldOwnId(): JSX.Element {
	return (
		<Field label="Почта">
			<Input id="email" />
		</Field>
	)
}

/**
 * Поле с группой: группу подпись называет ссылкой `aria-labelledby`, а `for`
 * сервер печатает — подпись у него раньше, чем группа вошла в поле.
 */
export function FieldGroup(): JSX.Element {
	return (
		<Field label="Выбор">
			<RadioGroup>
				<RadioGroup.Item value="a">А</RadioGroup.Item>
			</RadioGroup>
		</Field>
	)
}

/**
 * ListBox разметкой со слотом пустого списка: слот стоит после элементов, и
 * сервер решает, рисовать ли его, когда элементы уже вошли в коллекцию, —
 * его в разметке нет. Браузер при гидратации обязан решить так же
 * (`list-box.hydration.spec.tsx`).
 */
export function ListBoxWithEmpty(): JSX.Element {
	return (
		<ListBox empty={<span class="empty">Пусто</span>}>
			<ListBox.Item value="a" text="A" />
		</ListBox>
	)
}

/** Записи зонда узлов записей — у сервера и в начале гидратации. */
export const PART_NODES_RECORDS: readonly TProbeRecord[] = [
	{ key: 'a', text: 'A' },
	{ key: 'b', text: 'B' },
]

/** Записи снаружи — только у гидратации: по ним тест меняет список после неё. */
export type TPartNodesProbeProps = { readonly records?: Accessor<readonly TProbeRecord[]> }

/** Узлы записей (`createPartNodes`) — узел на запись, атрибут и текст от записи. */
export function PartNodesProbe(props: TPartNodesProbeProps): JSX.Element {
	const nodes = createPartNodes({
		each: () => props.records?.() ?? PART_NODES_RECORDS,
		by: (record) => record.key,
		tag: () => 'li',
		attributes: (record) => ({ 'data-key': record.key }),
		text: (record) => record.text,
	})

	return <ul>{nodes}</ul>
}

export type TTablePageProps = { readonly engine?: TTableCollection }

/** Записи таблицы страницы: ключ — `id`. */
export const TABLE_RECORDS = [
	{ id: 1, name: 'Анна', age: 30 },
	{ id: 2, name: 'Борис', age: 41 },
]

const TABLE_COLUMNS: TTableColumnSource[] = [
	{ field: 'name', text: 'Имя', rowHeader: true },
	{ field: 'age', text: 'Возраст', align: 'end' },
]

/**
 * Таблица с колонкой выбора: ячейки строк — узлы записей
 * (`createPartNodes`), ячейка выбора и поле флажка — узлы частей
 * (`createPartNode`), корни строк и флажков — `Root`.
 */
export function TableSelectable(props: TTablePageProps): JSX.Element {
	return (
		<Table
			engine={props.engine}
			items={TABLE_RECORDS.map((data) => ({ data }))}
			columns={TABLE_COLUMNS}
			mode="multiple"
		/>
	)
}

/**
 * Ожидание данных границы `Suspense` — только у сервера: он дорисовывает
 * границу, когда `wait` разрешился, а оболочку отдаёт раньше.
 */
export type TStreamedPageProps = { readonly wait?: Promise<void> }

/**
 * Содержимое границы `Suspense`, которое ждёт данных: у сервера — пока не
 * разрешился `wait`, у браузера данные готовы сразу, как пришедшие с
 * разметкой. Ждёт ресурс: его чтение и держит границу у сервера.
 */
function WithData(props: TStreamedPageProps & { readonly children: JSX.Element }): JSX.Element {
	const [ready] = createResource(() => props.wait?.then(() => true) ?? true)

	return <Show when={ready()}>{props.children}</Show>
}

/**
 * Табы целиком за границей `Suspense`: сервер досылает их потоком после
 * оболочки, с двумя остановками Tab, и браузер гидратирует их позже основной
 * гидратации — все мемо раскладки собраны в позднем окне.
 */
export function TabsStreamed(props: TTabsPageProps & TStreamedPageProps): JSX.Element {
	return (
		<Suspense>
			<WithData wait={props.wait}>
				<Tabs engine={props.engine}>
					<Tabs.Item value="a" text="A" />
					<Tabs.Item value="b" text="B" active />
				</Tabs>
			</WithData>
		</Suspense>
	)
}

/**
 * Табы, активный за границей `Suspense`: таб выше сервер печатает в оболочке
 * с остановкой Tab, и его гидратирует основная гидратация, а активный —
 * поздняя: остановку он забирает у таба, гидратированного раньше.
 */
export function TabsActiveStreamed(props: TTabsPageProps & TStreamedPageProps): JSX.Element {
	return (
		<Tabs engine={props.engine}>
			<Tabs.Item value="a" text="A" />
			<Suspense>
				<WithData wait={props.wait}>
					<Tabs.Item value="b" text="B" active />
				</WithData>
			</Suspense>
		</Tabs>
	)
}

/** Теги с выбором, выбранный за границей `Suspense` — как у табов. */
export function TagsSelectedStreamed(props: TTagsPageProps & TStreamedPageProps): JSX.Element {
	return (
		<Tags mode="single" engine={props.engine}>
			<Tags.Item value="a" text="A" />
			<Suspense>
				<WithData wait={props.wait}>
					<Tags.Item value="b" text="B" selected />
				</WithData>
			</Suspense>
		</Tags>
	)
}

/**
 * Поле, контрол со своим `id` за границей `Suspense`: подпись гидратирует
 * основная гидратация, с `for` на `id` поля контрола от поля, а контрол —
 * поздняя.
 */
export function FieldControlStreamed(props: TStreamedPageProps): JSX.Element {
	return (
		<Field label="Почта">
			<Suspense>
				<WithData wait={props.wait}>
					<Input id="email" />
				</WithData>
			</Suspense>
		</Field>
	)
}

/**
 * Корень, набор которого меняют обе гидратации: вход соседа в основной и вход
 * соседа за границей `Suspense` в поздней. Зонд мемо раскладки, которое к
 * позднему окну уже отдаёт живое: сервер напечатал `served`, основная
 * гидратация дописала `main`, поздняя должна дописать `late`.
 */
export function RootProbeStreamed(props: TStreamedPageProps): JSX.Element {
	const [mark, setMark] = createSignal('served')
	const root = createRootProps(() => ({
		state: {},
		sets: [{ 'data-probe': mark() }],
		forward: {},
	}))

	return (
		<div {...root()}>
			<ProbeEntry enter={() => setMark('main')} />
			<Suspense>
				<WithData wait={props.wait}>
					<ProbeEntry enter={() => setMark('late')} />
				</WithData>
			</Suspense>
		</div>
	)
}

/**
 * Секция в панели слоя, соседняя — за границей `Suspense`. Панель Dialog
 * сервер не печатает — портала у него нет, — и секцию A браузер рисует сам,
 * после основной гидратации, а её набор панели (`contentAria`) помощник части
 * не держит. Выбор у секций одиночный, и секция B, выбранная и вошедшая в
 * коллекцию в позднем окне, забирает его у секции A.
 */
export function AccordionLayerStreamed(
	props: TAccordionPageProps & TStreamedPageProps,
): JSX.Element {
	return (
		<Accordion engine={props.engine}>
			<Dialog visible title="Окно">
				<Accordion.Item value="a" text="A" selected>
					Ответ A
				</Accordion.Item>
			</Dialog>
			<Suspense>
				<WithData wait={props.wait}>
					<Accordion.Item value="b" text="B" selected>
						Ответ B
					</Accordion.Item>
				</WithData>
			</Suspense>
		</Accordion>
	)
}

/**
 * Панель вне границы `Suspense`, её таб — за ней. Сервер печатает оболочку
 * без панели: таба `b` к ней ещё нет. В позднем окне таб входит, и панель
 * становится активной.
 */
export function TabsContentStreamed(props: TTabsPageProps & TStreamedPageProps): JSX.Element {
	return (
		<Tabs engine={props.engine} content={<Tabs.Content value="b">Панель B</Tabs.Content>}>
			<Tabs.Item value="a" text="A" />
			<Suspense>
				<WithData wait={props.wait}>
					<Tabs.Item value="b" text="B" active />
				</WithData>
			</Suspense>
		</Tabs>
	)
}

/**
 * Есть ли элемент в разметке — только у гидратации: так приложение снимает
 * элемент после гидратации. Сервер рисует страницу без этого пропа — с
 * элементом.
 */
export type TPresencePageProps = { readonly present?: Accessor<boolean> }

/**
 * Слот пустого списка вне границы `Suspense`, элемент — за ней. Сервер
 * печатает слот в оболочке: элемента к нему ещё нет. В позднем окне элемент
 * входит, и список перестаёт быть пустым.
 */
export function ListBoxEmptyStreamed(
	props: TListBoxPageProps & TPresencePageProps & TStreamedPageProps,
): JSX.Element {
	return (
		<ListBox engine={props.engine} empty={<span class="empty">Пусто</span>}>
			<Suspense>
				<WithData wait={props.wait}>
					<Show when={props.present?.() ?? true}>
						<ListBox.Item value="a" text="A" />
					</Show>
				</WithData>
			</Suspense>
		</ListBox>
	)
}

/** Компонент приложения, который показывает тост прямо из тела. */
function ToastOnBuild(): JSX.Element {
	useToasts().show('Сохранено')

	return <i />
}

/**
 * Тост, показанный из тела компонента за границей `Suspense`. Регион
 * менеджера сервер не печатает — портала у него нет, — и браузер рисует его
 * сам, после основного окна, а тост входит в коллекцию в позднем окне.
 */
export function ToastsBodyStreamed(props: TStreamedPageProps): JSX.Element {
	return (
		<Toasts>
			<Suspense>
				<WithData wait={props.wait}>
					<ToastOnBuild />
				</WithData>
			</Suspense>
		</Toasts>
	)
}

/**
 * Остров с корнем, набор которого задаёт состояние снаружи острова (`mark`),
 * — зонд мемо раскладки, которое меняет гидратация другого острова: у
 * каждого острова свой `hydrate()`, и окно второго открывается, когда корень
 * первого уже гидратирован.
 */
export function IslandProbe(props: { readonly mark: Accessor<string> }): JSX.Element {
	const root = createRootProps(() => ({
		state: {},
		sets: [{ 'data-probe': props.mark() }],
		forward: {},
	}))

	return <div {...root()} />
}

/** Остров со входом, который при своей сборке меняет состояние снаружи острова (`enter`). */
export function IslandEntry(props: { readonly enter: () => void }): JSX.Element {
	return <ProbeEntry enter={props.enter} />
}

/** A named counter with an independently accessible anchor. */
export function BadgePage(): JSX.Element {
	return <Badge value={120} aria_label="120 unread" anchor={<button>Inbox</button>} />
}

/** Tabs and inert source share one structure between the server and the browser. */
export function CodeBlockPage(): JSX.Element {
	return (
		<CodeBlock
			snippets={[
				{ value: 'first', label: 'First', code: 'one' },
				{ value: 'second', label: 'Second', code: '<img src=x>\n' },
			]}
			value="second"
			lineNumbers
		/>
	)
}

export function AlertPage(): JSX.Element {
	return (
		<Alert closable role="status" title="Notice">
			Content
		</Alert>
	)
}

export function AvatarPage(): JSX.Element {
	return (
		<Avatar.Group overflow={3}>
			<Avatar src="/avatar.png" initials="AL" aria_label="Ada" />
		</Avatar.Group>
	)
}

export function SeparatorPage(): JSX.Element {
	return (
		<>
			<Separator orientation="vertical" />
			<Separator decorative />
		</>
	)
}

export function AlertDialogPage(): JSX.Element {
	return (
		<AlertDialog visible title="Delete?">
			Cannot undo
		</AlertDialog>
	)
}

/** Explicit composition is delivered through the normal native provider. */
export function CollectionInitial(props: { automatic?: boolean } = {}) {
	const initial = {
		items: [
			{ value: 'a', text: 'A' },
			{ value: 'b', text: 'B', id: 'tab-b', _: { active: true } },
		],
		panels: [{ value: 'a' }, { value: 'b', id: 'panel-b' }],
	}
	return (
		<Tabs
			initial={initial}
			content={
				<>
					<Tabs.Content initial={0}>A</Tabs.Content>
					<Tabs.Content initial={1}>B</Tabs.Content>
				</>
			}
		>
			{props.automatic ? undefined : (
				<>
					<div>
						<Tabs.Item initial={0} />
					</div>
					<Tabs.Item initial={1} />
				</>
			)}
		</Tabs>
	)
}
