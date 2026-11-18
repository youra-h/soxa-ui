import { CollectionInitial } from './pages'
/**
 * Разметка сервера для гидратации — её рисует сервер той же версии solid-js,
 * что гидратирует браузер.
 *
 * Гидратации нужны обе сборки страницы сразу, а в одном прогоне компоненты
 * собраны под одно окружение. Поэтому этот модуль собирается для сервера
 * отдельно от прогона и рисует страницы (`pages.tsx`), как сервер приложения,
 * — с ключами гидратации (`data-hk`) и метками вставок. Грузит его и отдаёт
 * разметку спекам `globalSetup` проекта `hydration` (`global-setup.ts`), а в
 * документ её кладёт прогон гидратации (`serve.ts`). Разметка не хранится в
 * репозитории: снимок сервера из lock на нижней границе peer гидратировала бы
 * другая версия solid-js (docs/agents/build.md, «Версии пакетов»).
 *
 * Страницу с границей `Suspense`, которая ждёт данных, сервер отдаёт потоком
 * (`renderToStream`): оболочку — сразу, с меткой на месте границы, а её
 * содержимое — следом, когда данные пришли, вместе со скриптом, который
 * ставит его на место метки. Разметка такой страницы — поток целиком, как его
 * получает браузер; досланное от оболочки отделяет прогон гидратации
 * (`serveStreamed` в `serve.ts`).
 *
 * Остров сервер рисует отдельно, своим ключом гидратации (`renderId`): у
 * каждого острова в браузере свой `hydrate()` с тем же ключом.
 *
 * Окружение тестов (`setup.ts`) — первым импортом: прогоны получают его через
 * `setupFiles`, а этот модуль грузит не прогон. Без пакета иконок сервер
 * нарисовал бы на месте иконок заглушки, и гидратация разошлась бы с ним.
 */

import '../setup'
import type { JSX } from 'solid-js'
import { renderToStream, renderToString } from 'solid-js/web'
import {
	AlertPage,
	AlertDialogPage,
	SeparatorPage,
	BadgePage,
	AvatarPage,
	CodeBlockPage,
	AccordionLayerStreamed,
	FieldControlStreamed,
	FieldGroup,
	FieldOwnId,
	IslandEntry,
	IslandProbe,
	ListBoxEmptyStreamed,
	ListBoxWithEmpty,
	PartNodesProbe,
	PartProbe,
	RootProbe,
	RootProbeStreamed,
	StructureProbe,
	TableSelectable,
	TabsActiveFirst,
	TabsActiveSecond,
	TabsActiveStreamed,
	TabsContentOwnId,
	TabsContentStreamed,
	TabsStreamed,
	TagsSelectedSecond,
	TagsSelectedStreamed,
	ToastsBodyStreamed,
	type TStreamedPageProps,
} from './pages'

/**
 * Поток сервера целиком. Данные границы разрешаются, когда оболочка уже
 * записана: иначе граница успела бы в оболочку и досылать было бы нечего.
 */
function streamOf(page: (props: TStreamedPageProps) => JSX.Element): Promise<string> {
	let release = () => {}
	const wait = new Promise<void>((resolve) => (release = resolve))

	return new Promise((resolve) => {
		const chunks: string[] = []
		// `end` в типе `pipe` не объявлен, но в конце потока Solid его зовёт
		const writable = {
			write(chunk: string) {
				chunks.push(chunk)
				release()
			},
			end: () => resolve(chunks.join('')),
		}

		renderToStream(() => page({ wait })).pipe(writable)
	})
}

/**
 * Разметка сервера всех страниц гидратации — по имени страницы. Потоки идут
 * по очереди: следующий начинается, когда предыдущий закончился.
 */
export async function renderServerMarkup() {
	return {
		'collection-initial': renderToString(() => <CollectionInitial />),
		'collection-initial-auto': renderToString(() => <CollectionInitial automatic />),
		// Страница целиком (`renderToString`)
		alert: renderToString(() => <AlertPage />),
		'alert-dialog': renderToString(() => <AlertDialogPage />),
		avatar: renderToString(() => <AvatarPage />),
		separator: renderToString(() => <SeparatorPage />),
		badge: renderToString(() => <BadgePage />),
		'code-block': renderToString(() => <CodeBlockPage />),
		'tabs-active-second': renderToString(() => <TabsActiveSecond />),
		'tabs-active-first': renderToString(() => <TabsActiveFirst />),
		'tabs-content-own-id': renderToString(() => <TabsContentOwnId />),
		'tags-selected-second': renderToString(() => <TagsSelectedSecond />),
		'root-probe': renderToString(() => <RootProbe />),
		'part-probe': renderToString(() => <PartProbe />),
		'part-nodes-probe': renderToString(() => <PartNodesProbe />),
		'structure-probe': renderToString(() => <StructureProbe />),
		'field-own-id': renderToString(() => <FieldOwnId />),
		'field-group': renderToString(() => <FieldGroup />),
		'list-box-with-empty': renderToString(() => <ListBoxWithEmpty />),
		'table-selectable': renderToString(() => <TableSelectable />),

		// Граница `Suspense`, досланная потоком (`renderToStream`)
		'tabs-streamed': await streamOf((props) => <TabsStreamed wait={props.wait} />),
		'tabs-active-streamed': await streamOf((props) => <TabsActiveStreamed wait={props.wait} />),
		'tags-selected-streamed': await streamOf((props) => (
			<TagsSelectedStreamed wait={props.wait} />
		)),
		'field-control-streamed': await streamOf((props) => (
			<FieldControlStreamed wait={props.wait} />
		)),
		'root-probe-streamed': await streamOf((props) => <RootProbeStreamed wait={props.wait} />),
		'accordion-layer-streamed': await streamOf((props) => (
			<AccordionLayerStreamed wait={props.wait} />
		)),
		'tabs-content-streamed': await streamOf((props) => (
			<TabsContentStreamed wait={props.wait} />
		)),
		'list-box-empty-streamed': await streamOf((props) => (
			<ListBoxEmptyStreamed wait={props.wait} />
		)),
		'toasts-body-streamed': await streamOf((props) => <ToastsBodyStreamed wait={props.wait} />),

		// Острова — своим ключом гидратации, тем же у `hydrate()` острова в браузере
		'island-probe': renderToString(() => <IslandProbe mark={() => 'served'} />, {
			renderId: 'a',
		}),
		'island-entry': renderToString(() => <IslandEntry enter={() => {}} />, { renderId: 'b' }),
	}
}

/** Разметка сервера по имени страницы. */
export type TServerMarkup = Awaited<ReturnType<typeof renderServerMarkup>>

/** Имя страницы, разметку которой рисует сервер. */
export type TServerPage = keyof TServerMarkup
