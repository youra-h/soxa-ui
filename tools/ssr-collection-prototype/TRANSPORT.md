# Доставка начального состава для SSR-коллекций

Задача [1an4hvw5ytb](https://app.clickup.com/t/1an4hvw5ytb), 15.11.2026.
**Пункт 1 выбран владельцем; production-интеграция ещё не завершена.**
Комментарии владельца 2244 и план 2254 разрешают совместимый явный initial.
Отрицательный native transport gate ниже сохраняется как историческое
доказательство границ прежнего API; он не запрещает выбранный явный вход.

Текущий независимый срез в setup: immutable owner-local снимок plain data,
штатная materialization через factory/batch/meta, resolver по ordinal до
создания части и общий read-only state port с одним итоговым aria.
Native adapters и production ids plugin пока этот срез не потребляют.
Отдельное разрешение на два protected файла ожидается. Это промежуточный
результат, не приёмка задачи.

Исходные 24 файла эксперимента перенесены без merge из
[PR #881](https://github.com/youra-h/soxa-ui/pull/881), head
`5ce1f7bd0`. Его отрицательные assertions и оба исторических JSON сохранены.
Новые проверки используют неизменённый опубликованный `@soxa-ui/react@0.4.0`
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

Это ограничение проверенных вариантов, а не доказательство невозможности
любого renderer или общего механизма. Гидратация, производительность, browser
и исправление Tags этим этапом не проверяются. Зелёный запуск доказывает
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

Это целевая форма, ещё не подключённая к публичным компонентам. Корневой
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
normalization до resolver; эта интеграция ещё предстоит.
После удаления или замены исходного ctrl remount его ordinal диагностирует
отсутствие модели в актуальном engine; initial не восстанавливает её скрыто.

Внешние engine/ctrl сохраняют identity/ownership. Initial описывает уже
существующие порядок, props и metadata; проверка не создаёт и не заменяет
внешние models. Plain metadata сравнивается по содержимому snapshot, не
по identity клонированного объекта. Отдельного active/selected state нет.

Табовый ids plugin получает prepared link до install и остаётся единственным
автором правил пары. Общий read-only state port возвращает один итоговый
state.aria из актуального core aria и immutable link. Второго mutable aria
store и дополнительных template spreads нет. Пока port проверен через
настоящий exchange с подставленным readonly link; production plugin wiring
ещё отсутствует.

## Недостающий механизм и узкая защищённая граница

В [TOwnBundle](../../packages/setup/protected/adapter/context/own-bundle.class.ts)
descriptor plugins устанавливаются через bundle.use в конструкторе, а
TInputPort.seed выполняется позже. Carrier prop не успевает передать link
до синхронной записи ids plugin в external ctrl.aria. PluginProps также
управляет внешними, а не уже объявленными собственными plugins.
Позднее исправление id оставило бы speculative writes и не исправило бы уже
сериализованный ранний tab.

Предложено ровно два protected файла:

- [types.ts](../../packages/setup/protected/adapter/context/types.ts): optional
  typed per-mount plugin installation options в context options / bundle mount.
- [own-bundle.class.ts](../../packages/setup/protected/adapter/context/own-bundle.class.ts):
  перед install уже объявленного descriptor plugin объединить его static
  options с per-mount options; приоритет у per-mount. Без input прежний путь.

Это явный вход одного mount, без descriptor mutation, registry, exchange
или content dependency. Он не добавляет произвольные plugins. Ambient
WeakMap/global transport не используется. Developer proposal опубликован
в задаче; ответ владельца ещё ожидается. Protected файлы не изменялись.

Общий state port пользуется существующими getSnapshot/subscribe. Третьего
protected изменения по текущему исполняемому proof не требуется. Проверены
stable snapshot, live readonly link и core aria changes, cleanup обеих
подписок и abandoned assembly без core writes или удержанных слушателей.

## Текущая проверенность и оставшаяся работа

- Source/resolver: настоящие factory/batch/meta, Tabs и Tags, ordinal
  identities, custom ids, read-once, внешние models/meta, ошибки и owner
  isolation. Mount initial части не повторяет meta.apply.
- Common state port: настоящий setup exchange, link пока тестовый. Эти
  unit tests не доказывают native SSR HTML или hydration.
- Initial без children: штатный data renderer рисует prepared ctrl без ordinal.
  Он должен получить тот же link и не повторять metadata seed. Это ещё не
  подключено; новые ctrl после live items replacement не являются исходными
  initial models и не должны получать их ordinal identity.
- Native adapters: production integration не подключена. Старые negative
  assertions и исторические JSON сохраняются.
- После разрешения остаются plugin carrier/descriptors/generated surfaces
  всех шести адаптеров, native retention/presence, настоящие SSR/hydration/
  lifecycle/ownership проверки, build/types, install smokes, Chromium/
  WebKit и полный remote CI точного PR head.
- Ветви вне явного initial — выбранная граница, а не провал пункта 1.
  Lazy content ради discovery не исполняется; scan/replay/HTML patch запрещены.

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
при доказанном провале выбранного варианта. Сейчас подтверждена конкретная
недостающая protected проводка пункта 1; это не такой провал.

Все связанные остатки остаются в задаче 1an4hvw5ytb и draft PR #882.
Зелёные независимые unit tests не означают APPROVED или завершение задачи.
