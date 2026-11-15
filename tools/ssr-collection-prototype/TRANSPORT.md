# Доставка начального состава для SSR-коллекций

Задача [1an4hvw5ytb](https://app.clickup.com/t/1an4hvw5ytb), 15.11.2026.
**Пункт 1 реализован во всех шести адаптерах как проверяемый кандидат.**
Комментарии владельца 2244 и план 2254 разрешают совместимый явный initial.
Отрицательный native transport gate ниже сохраняется как историческое
доказательство границ прежнего API; он не запрещает выбранный явный вход.

Общий setup сохраняет снимок plain data на срок native owner mount,
материализует его штатными factory/batch/meta и разрешает ordinal до создания
части. Production ids plugin получает связи до install. Один общий state port
соединяет актуальные атрибуты ядра с mount-local id и именами кнопок.
Подписки на внешний engine/ctrl включаются при принятии монтирования.
Согласие владельца 2319 покрывает два protected файла из предложения 2276.
Глубокое копирование остаётся кандидатом реализации; его цена измеряется отдельно.

Исходные 24 файла эксперимента перенесены без merge из
[PR #881](https://github.com/youra-h/soxa-ui/pull/881), head
`5ce1f7bd0`. Его отрицательные assertions и оба исторических JSON сохранены.
Исторические native transport проверки используют неизменённый опубликованный `@soxa-ui/react@0.4.0`
и React 19.3.1. Они не заменяют компоненты Soxa на Candidate между проходами.

## Воспроизведение и граница доказательств

Из корня:

```sh
npm run check:ssr-collection-prototype -- --native-only
```

При наличии временной фикстуры, уже созданной этим инструментом:

```sh
npm run check:ssr-collection-prototype -- --native-only --reuse <absolute-fixture-directory>
```

Повторное использование проверяет имя фикстуры и закреплённые версии/registry
в lock-файле. Оно не устанавливает зависимости и не изменяет `node_modules`.
Результат — `native-transport-results.json` в фикстуре; сохранённый запуск —
[results/2026-11-15-native-transport.json](results/2026-11-15-native-transport.json).

[fixture/native-transport.mjs](fixture/native-transport.mjs) — исполняемые
проверки нативных границ, а не реализация принятия веток. Пользовательские
компоненты записывают факт исполнения и возвращают обычные части Soxa.
HTML читается только assertion-проверками результата; план из HTML не строится,
HTML/DOM не переписывается. Ручной `accept()` или заранее переданный plan здесь
не выдаются за доставку принятого состава.

| Нативный эксперимент                                                                                | Проверенный результат                                                                                                | Следствие                                                                                                 |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `renderToString` одного и того же поддерева изнутри компонента, затем возврат этого же поддерева    | Внутренний запрос читает default чужого Context; окончательный — значение Provider. Native `useId` также различается | Локальный дополнительный renderer не переносит произвольных предков приложения автоматически              |
| Два `renderToString` одного и того же полного root element object                                   | Идентичные HTML, Context и native ids для детерминированного дерева                                                  | Старый Candidate tree mismatch не является общим запретом повторного SSR                                  |
| `renderToString` с приостановленным primary                                                         | Primary исполняется, но в HTML только fallback; effects/cleanup отсутствуют                                          | Исполнение декларации не подтверждает её принадлежность результату                                        |
| `renderToPipeableStream`, выдача только после `onAllReady`                                          | В trace primary и fallback; в HTML только primary. Native callbacks без аргументов и без component cleanup           | Окончание запроса не предоставляет набор принятых деклараций                                              |
| Полный повтор после сохранённого снаружи resolved resource                                          | Fallback во втором исполнении отсутствует                                                                            | Host, сохраняющий ресурсы приложения, имеет больше возможностей, чем компонент библиотеки                 |
| Два полных потоковых SSR одного root object с Provider, создающим ресурс на запрос                  | Оба законченных запроса снова исполняют fallback; HTML идентичен и содержит только primary                           | Дополнительный проход сам по себе не сохраняет request-local hook state и не становится сигналом принятия |
| `react-dom/static.prerenderToNodeStream`                                                            | Fallback исполняется, но отсутствует в окончательном HTML; результат — `prelude`, `postponed: null`                  | Статический prerender также не возвращает принятый список экземпляров                                     |
| Готовый таб из `items`, поздняя пользовательская панель с собственным id, выдача после `onAllReady` | Панель присутствует с `application-panel`, ранний `aria-controls` остался формульным; ранний таб исполнился один раз | Буферизация выдачи не повторяет уже выполненную сериализацию ранних атрибутов                             |

Последний сценарий использует таб из данных с `_: { active: true }` и обычный
слот `item`, чтобы изолировать зависимость от позднего id от отдельного дефекта
SSR-регистрации элементов из React-разметки. Все восемь сценариев требуют пустых
`console.warn/error`; ожидаемые отрицательные результаты проверяются явно.

Это ограничение исторически проверенных вариантов, а не доказательство невозможности
любого renderer или общего механизма. Исторический native gate не проверяет
гидратацию, производительность, browser или исправление Tags. Зелёный запуск доказывает
воспроизводимость наблюдений; он не означает прохождение gate.

## Выбранный контракт общего слоя

```tsx
<Tabs
  initial={{
    items: [
      { value: 'general', text: 'General' },
      { value: 'privacy', _: { active: true } },
    ],
    panels: [{ value: 'general' }, { value: 'privacy', id: 'privacy-panel' }],
  }}
  content={
    <>
      <Tabs.Content initial={0}>General</Tabs.Content>
      <Tabs.Content initial={1}>Private</Tabs.Content>
    </>
  }
>
  <Tabs.Item initial={0} />
  <Tabs.Item initial={1} />
</Tabs>
```

Эта форма подключена к публичным компонентам. Корневой
initial — plain serializable data, без helper import или класса на RSC
boundary. У Tags тот же механизм: items и Item initial={ordinal}.
Ordinal — позиция в явном source, а не счётчик исполнения. Duplicate и
undefined value остаются отдельными models. Поиск пары сохраняет нынешнюю
семантику первого item по каноническому value.

Снимок читается один раз на native owner mount. После materialization
источник истины — engine; повторная сборка и mount части не повторяют
начальную активацию или metadata. Обновления приходят существующими
items/engine/ctrl. Части получают тот же materialized ctrl до create.
При ordinal запрещён второй источник model props/meta на части; DOM attrs
и слоты сохраняются. Vue implicit defaults требуют native presence/
normalization до resolver; она применяется только к prepared parts, сохраняя
прежние правила legacy props.
После удаления или замены исходного ctrl remount его ordinal диагностирует
отсутствие модели в актуальном engine; initial не восстанавливает её скрыто.

Внешние engine/ctrl сохраняют identity/ownership. Initial описывает уже
существующие порядок, props и metadata; проверка не создаёт и не заменяет
внешние models. Plain metadata сравнивается по содержимому snapshot, не
по identity клонированного объекта. Отдельного active/selected state нет.

Табовый ids plugin получает prepared link до install и остаётся единственным
автором правил пары. Общий read-only state port возвращает один итоговый
state.aria из актуального core aria и immutable link. Второго mutable aria
store и дополнительных template spreads нет. Тот же port сохраняет
mount-local подпись кнопки закрытия рядом с актуальными атрибутами ядра.

## Разрешённая защищённая граница

Владелец разрешил ровно два файла (комментарий 2319):

- [types.ts](../../packages/setup/protected/adapter/context/types.ts):
  optional typed per-mount plugin installation options.
- [own-bundle.class.ts](../../packages/setup/protected/adapter/context/own-bundle.class.ts):
  static options → mount overrides до первой установки объявленных plugins.

Неизвестный или повторный ctor отклоняется до установки любого plugin.
Descriptor, registry и exchange не меняются. Без input работает прежний путь.
Третьего protected изменения нет.

## Карта реализации и проверок

Алгоритмы находятся в [initial.ts](../../packages/setup/content/extensions/collection/initial.ts),
[initial-source.class.ts](../../packages/setup/content/extensions/collection/initial-source.class.ts)
и [aria-state.class.ts](../../packages/setup/content/extensions/collection/aria-state.class.ts).
Адаптеры сохраняют источник своим native lifetime и доставляют нормализованные props.

| Адаптер        | Native lifetime                                      | Проверки нового режима                                                                                                                                                                                                                                                                        |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React          | `useCollectionInitial` вне пересобираемой связки     | [SSR/hydrate](../../packages/ui/react/__tests__/collection-initial.spec.tsx), [StrictMode/Activity/concurrent client](../../packages/ui/react/__tests__/collection-initial-lifetime.spec.tsx), [completed/aborted Fizz](../../packages/ui/react/__tests__/collection-initial-stream.spec.tsx) |
| Vue            | Один setup; toRaw и presence входов prepared parts   | [SSR/hydrate](../../packages/ui/vue/__tests__/collection-initial.spec.ts), [external SSR](../../packages/ui/vue/__tests__/collection-initial-external.spec.ts)                                                                                                                                |
| Svelte         | Один native init; живой accessor props               | [SSR](../../packages/ui/svelte/__tests__/collection-initial.server.spec.ts), [hydrate](../../packages/ui/svelte/__tests__/hydration/collection-initial.hydration.spec.ts)                                                                                                                     |
| Solid          | Один native init; getters и штатные окна гидратации  | [SSR](../../packages/ui/solid/__tests__/collection-initial.server.spec.tsx), [hydrate](../../packages/ui/solid/__tests__/hydration/collection-initial.hydration.spec.tsx)                                                                                                                     |
| Angular        | ngOnInit, app-local mount id, normalized input delta | [renderApplication + provideClientHydration](../../packages/ui/angular/__tests__/collection-initial.server.spec.ts)                                                                                                                                                                           |
| Web Components | Source живёт у DOM host через пересборки binding     | [waiting/deferral и consumer move](../../packages/ui/webc/__tests__/collection-initial.spec.ts)                                                                                                                                                                                               |

Common source/resolver проверяет текущий engine, тот же ctrl, duplicate/undefined
value, удаление/replacement без воскрешения ordinal, внешние metadata и отсутствие
повторного seed. Initial без children использует обычный data renderer.
Новые ctrl после live replacement не получают identity исходного source.
Необъявленные поздние ветви находятся за границей initial. Lazy content ради
discovery не исполняется; scan/replay и исправление HTML/DOM не используются.

Для plugin foreign subscriptions добавлен [TPluginMount](../../packages/plugins/src/base/mount.class.ts):
install готовит локальные данные, attach принимает подписки, destroy отменяет
непринятую работу или снимает принятые слушатели. Проверены неизменность внешнего
engine/ctrl до принятия, после aborted/completed SSR и при конкурентном
отброшенном client root; состав, meta, owner, aria, closeAria и dataset сохраняются.
Native React server и client tests разделены по renderer Context slots:
предупреждения React не подавляются ради неподдерживаемого смешивания renderer
в одном JS realm.

Vue, Svelte, Solid и Angular в своём native server runtime читают подготовленный
снимок без attach и подписок. Проверки используют существующий внешний owner:
после SSR сохраняются его identity, models и атрибуты, слушатели не остаются.
На клиенте принятие и cleanup идут обычным lifecycle адаптера.

Локально прошли полная сборка, типы setup/plugins и шести адаптеров (Angular —
ngc/AOT, Svelte — svelte-check), наборы unit/SSR/hydration тестов setup/plugins
и адаптеров. Отдельно прошли public API (162), объявленные импорты (85) и
React client directive (47). Полный Chromium: 129 файлов, 4473 теста;
новый initial browser probe отдельно прошёл в Chromium и Docker WebKit.
Результаты установки собранных tarball в приложения и полного remote CI
фиксируются в отчёте задачи и проверках PR #882 для соответствующего commit.

Native SSR-матрицы Vue, Solid, Svelte и Angular дополнительно проверяют первый,
второй и отсутствующий active, disabled/visible/rendered, отдельные identity при
повторных/отсутствующих value, ранние панели и custom ids, вложенные owner и
неисполнение содержимого неактивной панели. Angular сохраняет consumer-owned
hosts скрытыми; проверяется их видимость и пустое неактивное содержимое.
При этой проверке исправлено преждевременное чтение native children getter
в prepared panel: общий resolver теперь накладывает props ленивым view.
Отдельный setup-тест проверяет frozen props и отсутствие вычисления children
при resolution/create; native Solid-тест проверяет реальное исполнение ветвей.

## Стоимость кандидата

После сборки пакетов, последовательно без параллельных сборок:

```powershell
$env:NODE_ENV = 'production'
node --expose-gc tools/ssr-collection-prototype/initial-performance.mjs
node --expose-gc tools/ssr-collection-prototype/initial-memory.mjs
```

Оба инструмента используют [одну фикстуру](initial-fixture.mjs) и собранные
пакеты checkout. Nested — 16 объектов с массивами на item в поддерживаемой
metadata `_.payload`, которая реально попадает в engine. Для 1000 items вход
занимает 521,691 bytes. Размеры 100/1000, flat/nested сохранены в обоих JSON.

### Время и стадии

[Скрипт](initial-performance.mjs) проверяет эквивалентность полного HTML,
состава, активности, одной Tab-остановки и взаимных ссылок до измерений.
Generated ids нормализуются только в assertion вне таймера; renderer выдаёт
исходный HTML. Три прогрева и девять измерений, SSR-режимы чередуются.
[Результат](results/2026-11-15-initial-performance.json): 15.11.2026 18:27 UTC,
Node 24.20.0, React 19.3.1, Ryzen 9 9950X3D, production; хеши JS внутри JSON.

| Items | Metadata | Capture + shape validation, ms | External validation, ms | Prepared materialization, ms | Ordinary materialization, ms |
| ----- | -------- | -----------------------------: | ----------------------: | ---------------------------: | ---------------------------: |
| 100   | flat     |                          0.095 |                   0.054 |                        0.446 |                        0.347 |
| 1000  | flat     |                          0.828 |                   0.228 |                        2.843 |                        2.556 |
| 100   | nested   |                          0.989 |                   0.392 |                         0.31 |                        0.271 |
| 1000  | nested   |                          9.374 |                   3.635 |                        3.261 |                        2.824 |

Capture включает глубокую копию, freeze и структурную валидацию source:
производственный путь не подменяется ради отделения этих операций. Отдельная
validation проверяет существующий complete external engine методом
`_validateExternal`: это tools-only probe текущей реализации, а не API для
потребителя. Materialization измеряет штатные factory/batch/meta; prepared
дополнительно строит связи. Создание engine и capture исключены из таймера
материализации. Эти таймеры относятся к разным стадиям/путям и не складываются
в total SSR.

| Items | Metadata | Initial SSR, median ms | Existing items SSR, median ms | Retained snapshot, bytes |
| ----- | -------- | ---------------------: | ----------------------------: | -----------------------: |
| 100   | flat     |                  5.484 |                         4.376 |                    19321 |
| 1000  | flat     |                  64.11 |                         56.06 |                   168886 |
| 100   | nested   |                  5.548 |                         3.393 |                   243788 |
| 1000  | nested   |                 67.733 |                         46.79 |                  2448988 |

В этой фикстуре capture 1000 вложенных items занял около 9.4 ms, удерживаемый
снимок — 2.45 MB. Полный initial SSR включает дополнительные затраты помимо
копирования. Снимок обходит весь вход; deep copy остаётся проверяемым кандидатом,
без согласованного порога приемлемости или утверждения окончательной архитектуры.
Полный таймер — React renderToString; HTTP, Flight/RSC и гидратация в него не входят.

### Временные выделения, пик и success/abort cleanup

[Скрипт памяти](initial-memory.mjs) запускает отдельный процесс для каждого из
16 случаев: initial/items × success/abort × 100/1000 × flat/nested.
[Сырой результат](results/2026-11-15-initial-memory.json) содержит 3 серии по
3 запроса, исходные bytes, baseline и memory до/после GC каждой серии.
Перед ними — 3 прогрева по 10 items. Это отдельные профилируемые прогоны:
их накладные расходы не входят в latency-таблицу.

Success — реальный завершённый Fizz. Abort — тот же Tabs плюс Suspense с
request-local pending resource: shell действительно выдаётся, затем stream
отменяется, проверяется ровно один ожидаемый callback ошибки. HTML/chunks,
stream и request graph выходят из helper перед тремя GC с переходами event loop.

Allocation sampling V8 Inspector использует интервал 16 KiB и оба флага
includeObjectsCollectedByMajorGC/MinorGC: временные уже собранные объекты
учитываются в **оценке** выделений. Она включает также collect/assert и runtime
измерительного batch. Это не точный счётчик байтов и не отдельная
цена копирования. `beforeGC.heapUsed - afterGC.heapUsed` — наблюдаемый объём
освобождённого heap, а не все временные выделения между GC. Profiling payload
получается после memory readings, чтобы сам returned profile не попал в retained.

Peak — `process.resourceUsage().maxRSS * 1024`, абсолютный OS high-water RSS
всей жизни свежего процесса, включая imports/fixture/warmup и profiler overhead.
Baseline peak и конечный peak сохранены отдельно. Это не изолированный точный
пик фазы SSR; нулевой прирост high-water не означает нулевую память операции.
Post-GC heap delta знаковая, включает runtime/JIT/profiler caches и также не
приравнивается к размеру request или утечке. MB = 1,000,000 bytes.

Для 1000 items с вложенной metadata:

| Mode    | Outcome | Sampled allocation estimate, MB/request | Whole-process peak RSS, MB | Post-GC heap delta after 9 requests, MB | Live sources / engines |
| ------- | ------- | --------------------------------------: | -------------------------: | --------------------------------------: | ---------------------: |
| initial | success |                                  172.86 |                    316.465 |                                    0.87 |                  0 / 0 |
| initial | abort   |                                 173.535 |                    333.451 |                                   0.819 |                  0 / 0 |
| items   | success |                                 125.621 |                    323.281 |                                   0.811 |                  0 / 0 |
| items   | abort   |                                 126.192 |                    313.479 |                                   0.779 |                  0 / 0 |

WeakRef-аудит наблюдал ровно 9 созданных source (initial) и 9 request-owned
engine (оба режима), после success и abort живых осталось **0 во всех 16 случаях**.
Обычный items не создаёт initial source. Исходный plain input намеренно остаётся
живым как fixture; внешние engine/ctrl не предсоздаются ради этого замера.
Сохранённый retained heap — диагностический остаток после полного SSR; отдельно
удерживаемый snapshot в таблице полного SSR измерен другим свежим процессом после GC.

Убран отдельный Set предков на каждый вложенный объект; prepared link находится
через owner-local Map по ctrl. Проверка текущего членства и поиск первой пары
по live value ещё читают batch и не объявляются O(1). Эти измерения предъявляют
стоимость и пределы кандидата; один локальный запуск не задаёт SLA.

## Next App Router: граница host

Проверен опубликованный tarball **Next 16.4.3**, соответствующий минимальному
диапазону текущего [install-smoke](../install-smoke/projects/next/package.json).
Происхождение и хеши прочитанных файлов —
[results/2026-11-15-next-host-audit.json](results/2026-11-15-next-host-audit.json).
Это аудит исходников, не запуск приложения Next и не доказательство отсутствия
всех возможных интеграций.

`dist/server/app-render/app-render.js` владеет двумя уровнями: Flight/RSC payload
и последующим Fizz `App` над этим payload. В обычном dynamic path он сам создаёт
`appElement`, запускает `renderToNodeFizzStream` с request store и передаёт
результат в `continueFizzStream`. Soxa-компонент находится внутри этого исполнения.
Страница приложения не передаёт библиотеке root renderer или его request store.
Текущий [smoke page](../install-smoke/projects/next/app/page.tsx) — Server Component,
а модули UI библиотеки имеют client boundary; обёртка вокруг Tabs не заменяет
host границу исполнения всего приложения.

Из проверенных внешних точек `InstrumentationModule` содержит `register` и
`onRequestError`; `NextAdapter` — `modifyConfig` и `onBuildComplete`.
`useServerInsertedHTML` регистрирует вставку HTML, а `waitForAllReady` задерживает
выдачу потока. Эти поверхности не предоставляют показанный выше принятый
список экземпляров или повтор root с сохранением произвольных ресурсов.
Подтверждённого способа подключить исследованный host replay к App Router
без нового требования к приложению сейчас **нет**.

## Решение владельца и статус продолжения

Владелец выбрал пункт 1: совместимый явный initial с полным начальным
описанием состава и пар, plain object на RSC boundary. Повторное разрешение
на сам initial API, имена или обычную внутреннюю архитектуру не требуется.
Разрешение на breaking прежнего API не получено.

Пункт 2 — host/renderer integration — остаётся разрешённым исследованием
при доказанном провале выбранного варианта. Необъявленные поздние ветви за границей initial не считаются провалом пункта 1.

Кандидат подготовлен в задаче 1an4hvw5ytb и PR #882 для проверки владельцем.
Готовность PR и workflow-статус фиксируются после обязательных проверок;
они не означают одобрение deep copy как окончательной архитектуры или разрешение на выпуск.
