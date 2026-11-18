# @soxa-ui/react

## 0.4.1

### Patch Changes

- b17d612: Fix Select and DatePicker aria-controls references when their popup panels are absent during server rendering and hydration.
- Updated dependencies [480231a]
- Updated dependencies [859c3c6]
- Updated dependencies [dd5946d]
- Updated dependencies [b17d612]
  - @soxa-ui/plugins@0.4.1
  - @soxa-ui/setup@0.4.1
  - @soxa-ui/core@0.4.1

## 0.4.0

### Patch Changes

- 1bd5a03: CodeBlock: preserve keyboard focus while copying, prevent duplicate clipboard requests, and ignore stale clipboard feedback.
- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- 5ba63f4: Add a non-modal Dialog mode that preserves page interaction, keyboard navigation and focus without changing the default modal behavior.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 274d746: Add a horizontal and vertical Separator with semantic and decorative modes across all adapters.
- Graduate the approved beta packages to stable versions.
- Updated dependencies [b38633b]
- Updated dependencies [1bd5a03]
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
- Updated dependencies
  - @soxa-ui/plugins@0.4.0
  - @soxa-ui/core@0.4.0
  - @soxa-ui/setup@0.4.0

## 0.4.0-beta.0

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- 5ba63f4: Add a non-modal Dialog mode that preserves page interaction, keyboard navigation and focus without changing the default modal behavior.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 274d746: Add a horizontal and vertical Separator with semantic and decorative modes across all adapters.
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
  - @soxa-ui/core@0.4.0-beta.0
  - @soxa-ui/setup@0.4.0-beta.0
  - @soxa-ui/plugins@0.4.0-beta.0

## 0.3.0

### Minor Changes

- 1d2d4a0: Restrict adapter entry points to application components, helpers and consumer types. Remove assembly, profile, binding, generated metadata and template exports; use supported component props, slots, refs and core models instead. Vue now exports all component Props types. No public internal entry point is provided.
- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- e682670: Publish only explicitly declared descriptor events. Internal property triggers no longer appear as component callbacks, Vue events, Angular outputs or Web Component events. Declare application notifications in contribution.events; property state refresh and two-way model updates remain driven by triggers.
- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- 0690162: Frame: rename position to strategy and TFramePosition to TFrameStrategy. Replace the prop, controller property and change:position event with strategy and change:strategy; Angular outputs use soChangeStrategy.

### Patch Changes

- 53fb45f: Add Badge for inline labels, capped numeric counters and dots, with accessible names, anchored placement and theme styling across all adapters.
- ab9735f: Add Breadcrumbs as a collection with external engines, composable Item parts and standard activation. Include localized accessible names, theme separators and native-link overflow menus that preserve breadcrumb membership. Expose root-level gap scales and separator geometry for theme and scoped customization.
- a15bae2: Prevent CodeBlock copy actions from covering source text, including horizontally scrolled lines. Show the copy icon by default and add the copy slot for custom button content across all adapters. Register the new copy role in both icon packs; update your icon pack or provide the copy slot when upgrading CodeBlock.
- 0909342: Add built-in safe CodeBlock syntax highlighting, including server rendering. Use compact white layouts with a single tab toolbar, smaller copy actions and tighter line-number gutters. Clarify snippet selection and shorten copy labels.
- ba29be7: Keep overflowing disabled Tabs and Table content reachable and scrollable by keyboard without adding tab stops when content fits or contains an available tab stop. Preserve native disabled behavior when Web Components are re-enabled.
- db54848: Fix selected tag list semantics so each remove button belongs to its list item while preserving tag selection and keyboard behavior.
- 1ffabcd: Add ToggleButton and ToggleGroup with persistent pressed state, collection-backed selection and accessible keyboard navigation. Preserve explicit native form attributes while defaulting toggle controls to non-submitting buttons. Keep long ToggleGroup rows reachable in their own scroll viewport on narrow screens.
- 1bb3ea8: Add CodeBlock with accessible code display, line numbers, highlighted lines, clipboard feedback and snippets powered by Tabs across all adapters.
- de65c13: Preserve valid list semantics for urgent toast notifications while retaining the alert role on the existing card and separate text-only announcements across all framework adapters.
- a491c3f: README: the stylesheets of the theme per component, next to the whole one; Angular — the page of the six components fits the budget of a new project with them.
- cd8de41: React: every module of the package that needs React opens with `'use client'`, so a Server Component — a page of the Next.js App Router — imports the components as they are, without wrappers. The entry stays a server module: the types and the helpers without React import into a Server Component too.
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- 0bda355: Server Components: a Server Component writes the parts through the owner too (`Tabs.Item`, `Select.Item`, `Table.Row`), not only by their flat names — the module that hangs the parts on the owner is a server module now, and the owner and each part come as references of their own.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [a15bae2]
- Updated dependencies [0909342]
- Updated dependencies [8212af4]
- Updated dependencies [c7b5a90]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [6dfea13]
- Updated dependencies [1bb3ea8]
- Updated dependencies [de65c13]
- Updated dependencies [9c002f7]
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [7415726]
- Updated dependencies [7335dd6]
- Updated dependencies [13101c7]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [1c78107]
- Updated dependencies [bcd5555]
- Updated dependencies [ac39aa9]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0
  - @soxa-ui/setup@0.3.0
  - @soxa-ui/plugins@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/core@0.3.0-beta.1
  - @soxa-ui/plugins@0.3.0-beta.1
  - @soxa-ui/setup@0.3.0-beta.1

## 0.3.0-beta.0

### Minor Changes

- 1d2d4a0: Restrict adapter entry points to application components, helpers and consumer types. Remove assembly, profile, binding, generated metadata and template exports; use supported component props, slots, refs and core models instead. Vue now exports all component Props types. No public internal entry point is provided.
- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- e682670: Publish only explicitly declared descriptor events. Internal property triggers no longer appear as component callbacks, Vue events, Angular outputs or Web Component events. Declare application notifications in contribution.events; property state refresh and two-way model updates remain driven by triggers.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- 0690162: Frame: rename position to strategy and TFramePosition to TFrameStrategy. Replace the prop, controller property and change:position event with strategy and change:strategy; Angular outputs use soChangeStrategy.

### Patch Changes

- a491c3f: README: the stylesheets of the theme per component, next to the whole one; Angular — the page of the six components fits the budget of a new project with them.
- cd8de41: React: every module of the package that needs React opens with `'use client'`, so a Server Component — a page of the Next.js App Router — imports the components as they are, without wrappers. The entry stays a server module: the types and the helpers without React import into a Server Component too.
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- 0bda355: Server Components: a Server Component writes the parts through the owner too (`Tabs.Item`, `Select.Item`, `Table.Row`), not only by their flat names — the module that hangs the parts on the owner is a server module now, and the owner and each part come as references of their own.
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [7415726]
- Updated dependencies [7335dd6]
- Updated dependencies [13101c7]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [bcd5555]
- Updated dependencies [ac39aa9]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0-beta.0
  - @soxa-ui/plugins@0.3.0-beta.0
  - @soxa-ui/setup@0.3.0-beta.0

## 0.3.0-alpha.7

### Minor Changes

- 26cc7e3: Same events on every platform, found by the new parity run. Angular: an output of an event with several arguments now emits their tuple, like `detail` in Web Components — `(soChangeActivation)` gives `[item, previous]`, `(soChangeSelection)` gives `[selected, changed]`; read the first element where you used `$event` directly. Vue: the consumer no longer hears a component's teardown (`v-model:items` of a `v-if`-ed owner is no longer emptied), and Icon with a glyph component in `tag` hands its node to the plugins. Web Components: a removed element sends no events. Svelte: the markup items joining while mounting reach `onItemAdded` and the other handlers. React: typing after a choice in Select goes after the chosen text. Markup groups (`Menu.Group`, `ListBox.Group`, `Select.Group`) have their label from their first item on React.
- 1d91ecc: React adapter: the peer floor of react and react-dom is now ^19.3.0. React 19.2 kept a stale useEffectEvent closure in a memo component redrawn by context, and collection items under StrictMode or <Activity> did not enter the live collection. Upgrade react and react-dom to 19.3 or newer.
- 515db01: React, Solid and Svelte: a part's click action (activate a tab, choose an option, toggle a section, press a menu item, turn a page, close a panel or a tag, clear a field, the DatePicker's Cancel and Done) is a native listener on the part's node, set as soon as the node exists, as in Vue, Web Components and Angular. The owner's `onActionClick` and `onActionPress` now come after the action: a handler that read the state before the click (the previous tab, the previous choice) reads the new one — take the previous value from the change event (`onChangeActivation`, `onChangeSelection`) instead. A click right after the mount, before the first frame, is no longer lost on the tabs' and tags' crosses and the fields' clear buttons. The consumer's `onClick` on a part still runs after the action.
- d278f0f: The adapter context has a fourth phase, detach: the first moment of the teardown, before the children go. The context only reports it; every adapter stops the consumer on it, and a collection reports it to its items and Tabs panels, so in Svelte, Solid and Angular an item no longer hears its siblings leave when the whole collection goes. An Angular component taken out of the document sends nothing (its owner heard its items leave one by one), and a React item no longer hears its own entry into the collection: what the acceptance writes is the starting state, as in the other adapters. Breaking: TCollectionItemExtension and TTabsContentBindingExtension take the own context of the item or the panel instead of its instance, and take the instance from it: { adapter, elevator } instead of { item: adapter.instance, elevator } and { content: adapter.instance, elevator }. IAdapterContext has detach() and the detach event.

### Patch Changes

- 88e4f4f: Calendar: weeks are keyed by their place in the grid, so switching to a language with another first day of the week keeps six days of seven in their row instead of rebuilding the month.
- e2718e4: Collection items no longer re-render with their owner. In React every collection item (the `*/item` parts and the menu items) stands under the render boundary, as Table's rows do; in Vue an owner that draws its items from data relays its `item*` slots to them only when it has any. Opening DatePicker no longer redraws every day of the month, opening Select every option.
- 1a322fe: `AccordionItem` slots now carry their own section (`item`) in scope in every adapter, the way a table row's `cell` slot carries its own row; Accordion relays its `item-*` slots from that scope instead of its loop variable. React: Accordion no longer redraws every section with the owner when the consumer gives `item-content`.
- Updated dependencies [26cc7e3]
- Updated dependencies [5d8b7ca]
- Updated dependencies [d278f0f]
- Updated dependencies [1a322fe]
- Updated dependencies [843f9ef]
  - @soxa-ui/setup@0.3.0-alpha.7
  - @soxa-ui/core@0.3.0-alpha.7
  - @soxa-ui/plugins@0.3.0-alpha.7

## 0.3.0-alpha.6

### Minor Changes

- 101269c: Menu, its submenus and DatePicker build their panel content on the first opening (`contentRendered`): a menu nobody opened is its trigger and an empty panel, a date picker nobody opened is a field with a button. Closing still only hides the panel and keeps the content. In Angular, menu items written in markup are a projection — Angular creates them with the menu and only inserts them on the first opening; items from `items` and the calendar are created then.
  
  What broke and how to update: before the first opening, menu items and the DatePicker calendar are neither in the document nor in the menu's collection. Code that reads them earlier should open the panel first (`open`). Opening the menu by a key still highlights the edge item — a frame later, once the items are drawn.
- 7ac5495: DatePicker no longer builds its calendar up front: days and month pickers appear on the first opening, and date fields are created for the mode that needs them, so a closed picker holds just its field. Until the first opening or a mode change `ctrl.engine` has no calendar (`engine.options.get('owner')` is `undefined`) and commands such as `selection.chooseDate()` do nothing — open the picker (`ctrl.open = true`) before driving its calendar from code.
- 2e2ff15: Calendar month picker places create their list on the first opening of their popover: `pickers[i].list` is now `{ ctrl, engine }`, `undefined` until then, and `pickers[i].engine` is gone — read `pickers[i].list?.ctrl` and `pickers[i].list?.engine`.
- 54f5b1d: Select builds options from `items` on the first opening of its panel (`contentRendered`), as Menu and DatePicker do; closing only hides them, and options written in markup are mounted as before. `Virtual` measures its window once the first drawn item enters the document.
  
  What broke and how to update: before the first opening, options from `items` are not in the document and have no `id` — open the panel (`open`) before reading them.

### Patch Changes

- 90f3931: Lighter collection items and closers: Vue components pass changed props to the core before a parent-driven render instead of a watch over every prop (Select and ListBox pages are 14% lighter, a button 15%); the close buttons of Tabs, Tags, Toasts, Popover, Dialog and Drawer are mounted only when shown instead of assembling a hidden button
- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- Updated dependencies [101269c]
- Updated dependencies [a73c5bf]
- Updated dependencies [7ac5495]
- Updated dependencies [a6a77f8]
- Updated dependencies [765030a]
- Updated dependencies [2e2ff15]
- Updated dependencies [2dec183]
- Updated dependencies [54f5b1d]
- Updated dependencies [5429a39]
- Updated dependencies [604ae77]
  - @soxa-ui/core@0.3.0-alpha.6
  - @soxa-ui/setup@0.3.0-alpha.6
  - @soxa-ui/plugins@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.5
  - @soxa-ui/plugins@0.3.0-alpha.5
  - @soxa-ui/setup@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- 8eb76c2: Обмен с ядром держит меньше памяти на компонент (общий слой setup, линии и входы без объекта на свойство).
- Updated dependencies [6f96bae]
- Updated dependencies [8eb76c2]
- Updated dependencies [1c703ad]
- Updated dependencies [8bb9bdc]
  - @soxa-ui/core@0.3.0-alpha.4
  - @soxa-ui/setup@0.3.0-alpha.4
  - @soxa-ui/plugins@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- 11e25c7: Tabs: слоты `leading` и `trailing` стоят не в списке табов, а рядом с ним, в новом ряду `.so-tabs__bar`, — выравнивание `center`, `end` и `stretch` работает со слотами, а в `[role=tablist]` остались только табы. Обновление: классы слотов — `.so-tabs__leading` и `.so-tabs__trailing` вместо `.so-tabs__list--leading` и `.so-tabs__list--trailing`; `.so-tabs > .so-tabs__list` пишите через ряд: `.so-tabs > .so-tabs__bar > .so-tabs__list`. Своя тема: `--so-tabs-active-*` и `--so-tabs-gap-*` плагин раскладки пишет на ряд, место таба отсчитывается от него — линию и отметку рисуйте на ряду; поле `listEl` у `TActiveTabOffset` переименовано в `barEl`.
- 582d3a6: Строки ListBox, Select, меню и тегов рисует деталь ItemRow (TItemRow): роль и остановку Tab строки пишет только элемент, tabindex="-1" опции Select — ядро (TSelectExtension), а не разметка. Экземпляр строки создаёт её монтирование и отпускает снятие, поэтому под окном Virtual строк в памяти столько, сколько показано. Ломающее: у TTagsItem больше нет row; в Web Components строка — <div is="so-item-row-div"> и <span is="so-item-row-span"> (registerItemRowTag) вместо so-button-div и so-button-span, а registerButtonTag (Button на div и span) удалён — кнопке на другом теге в разметке библиотеки места нет; в Angular — атрибут so-item-row вместо so-button. Обновиться: искать строку по классу .so-button или по этим именам, а не через tag.row.
- fc30695: ListBox объявляет скринридеру элемент под стрелками: у элементов `id`, узел списка ссылается на подсвеченный через `aria-activedescendant`. `TSelectItemIdsPlugin` → `TOptionIdsPlugin`, `SelectItemIdsPluginDescriptor` → `OptionIdsPluginDescriptor`: замените импорт. `onHighlightChanged(null)` наследника `TListNavigationPlugin` приходит и от `trackHighlight`, гасящего отметку. `bundle:unregistered` реестра наборов (`TCollectionBundlesPlugin`) приходит и тогда, когда элемент ушёл из коллекции, а не только когда снято его монтирование.
- 7a86466: `id`, который задаёт приложение, держит новый `TIdPlugin` (проп `id`) — у полей и у элементов ListBox, Select, Tabs, Accordion и пунктов меню со своей панелью: ссылки ARIA ведут на этот `id`, а в Angular он больше не теряется. Сломалось: свойства `id` и события `change:id` у `TInputControl` (Input, NumberInput, Textarea, CheckBox, Switch, Rating, Select, DateInput, DatePicker) больше нет — задавайте `id` пропом компонента, читайте из состояния; `id` в данных `items` не поддерживается — ссылайтесь на элемент по `value`. `IFieldInputControl` и `TFieldControl` удалены — связка поля видит контрол как `IFieldControl`. В Web Components `el.ctrl.id` больше нет: `el.id = …` и `setAttribute('id', …)` у элемента с полем уходят на поле (пустой — снят), прочесть — `el.state.id`. Тип состояния адаптера (`TAdapterState`) называет и входы плагинов; новый тип `DescriptorPluginProps`.

### Patch Changes

- 28470f6: Tags без выбора: строка тега больше не берёт фокус от клика (у неё нет `tabindex`), а `focused = true` тега ставит фокус на его крестик; строку рисует новый `TItemRow` — кнопка, чью роль и остановку Tab пишет владелец
- 0471962: Tabs: свой `id` на `Tabs.Content` — проп `id` (`TIdPlugin`): он стоит на панели вместо формулы таба, и `aria-controls` таба ведёт на него, а в Angular `id` панели больше не теряется. Ссылку таб получает со входа панели: в разметке сервера Vue, React, Svelte и Solid таб до гидратации ведёт на формулу, а `id` панели уже свой. `TTabsItemIdsPlugin` получил `bindPanel` и `unbindPanel`, `TCollectionExtension` опускает детям реестр наборов коллекции. В Web Components пустой `id` у панели, поля даты и DatePicker снимает проп, как у полей.
- Updated dependencies [a14dfe5]
- Updated dependencies [11e25c7]
- Updated dependencies [8110fc3]
- Updated dependencies [0ab715a]
- Updated dependencies [582d3a6]
- Updated dependencies [28470f6]
- Updated dependencies [0471962]
- Updated dependencies [fc30695]
- Updated dependencies [64be9ca]
- Updated dependencies [fcd14b4]
- Updated dependencies [a09886b]
- Updated dependencies [241082a]
- Updated dependencies [734ff59]
- Updated dependencies [7a86466]
- Updated dependencies [b6d9450]
- Updated dependencies [b5a5d78]
- Updated dependencies [ad1de00]
- Updated dependencies [53a3fe6]
  - @soxa-ui/plugins@0.3.0-alpha.3
  - @soxa-ui/core@0.3.0-alpha.3
  - @soxa-ui/setup@0.3.0-alpha.3

## 0.3.0-alpha.2

### Minor Changes

- fad39ae: Адаптер React: хуки сборки useSetupXxx больше не экспортируются из пакета — это внутренняя проводка компонентов. Свою сборку собирайте хуками адаптера: useComponent((create) => create(XDescriptor(), { ctrl, props }), props) для одного контекста, useAdapterContext + useCollectionAdapter(useAdapter(adapter, props), facade, props) для коллекции. Сигнатура useCollectionAdapter сменилась: (owner, facade, props) вместо (adapter, props, forward), результат — связка компонента вместе с фасадом.
- 84f4ad3: Select.Item: выбор опции — клик по строке, как у ListBox, Menu и Tabs: клик потребителя по опции приходит после выбора (раньше — до него), и stopPropagation в нём выбор больше не отменяет. Кто читал в обработчике прежнее значение — берите его из события смены значения (oldValue); отменить выбор — подпиской на item:select:before.

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.
- 9e146cc: Всё, что React и Svelte уводят телепортом, — панели Frame, Popover и Tooltip, окно Dialog, выезжающая панель Drawer, а у Svelte ещё список Select и регион Toasts, — лежит в обёртке `<div style="display: contents">`, а с `contained` — ещё и в таком же узле места. Смена `contained` и `target` переносит панель тем же узлом, набранное в ней остаётся. Цель, пропавшая на лету, вынимает панель из документа, а вернувшаяся получает тот же узел. Панель, начавшая на месте (у React — после серверной разметки), при первом уходе с места один раз собирается заново. Селекторы прямого потомка через телепорт (`body > .so-frame`) замените селекторами потомка.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.
- 7137eaa: Группы из разметки (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`) входят в группировку коллекции, и `sections` описывают их с подписью. Элемент без группы больше не уходит в конец, а остаётся на своём месте среди незаявленных групп; чтобы вернуть прежний порядок, заявите группы в `groups`.
- 8d4064e: `onChangeSelected` элемента коллекции (`ListBox.Item`, `Select.Item`, `Tags.Item`, `Accordion.Item`, `Table.Row`, флажки и переключатели `Menu`) и `onChangeActive` (`Tabs.Item`, `Tabs.Content`, `RadioGroup.Item`) приходят только элементу, чьё состояние сменилось, и несут новое значение: `onChangeSelected={(selected) => …}`. `change:selection` владельца вторым аргументом отдаёт элементы, чья отметка сменилась, `change:activation` — прежний активный; в Web Components `detail` этих двух событий — пара: где читали `detail`, читайте `detail[0]`.
- 2b5f080: Коллекция над движком, который держит другой компонент, больше не бросает «движок уже принадлежит другому компоненту»: привязка владельца — у последнего принятого монтирования, а его снятие возвращает её предыдущему живому. Смена `key` и перенос без `ctrl` над внешним движком больше не падают. Обновиться: на ошибку не опираться — второй компонент на том же движке теперь молча забирает его у первого.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- f6863bb: В React появились ProgressLinear, Slider, Rating, Pagination и Scroller — с той же разметкой и тем же поведением, что во Vue, — и базовые слои Interactive, ValueControl и InputControl (типы пропсов и хуки `useSetupInteractive`, `useSetupValueControl`, `useSetupInputControl`). Значение ползунков Slider и Rating ведёт поле адаптера `NativeInput`: `live.value` принимает и число, в узел оно уходит строкой.
- 5dfcc0c: Popover, Tooltip, Dialog и Drawer в React: панель у триггера, подсказка, модальное окно и выезжающая панель — как во Vue. Хук адаптера `useRootElement` отдаёт корень компонента значением рендера
- 309ce24: DragAndDrop во всех адаптерах: перестановка элементов Tabs, ListBox и Accordion перетаскиванием, события `move:before` и `move` (`onMoveBefore`/`onMove`, `(soMoveBefore)`/`(soMove)`, `so:move:before`/`so:move`); в Angular — `<ng-container so-drag-and-drop>`, в Web Components — `<so-drag-and-drop>`
- 63eaf38: Menu в React: меню у кнопки и контекстное меню с подменю (в том числе из данных), группами, флажками, переключателями и пунктом с панелью — как во Vue. Помощник адаптера `toPartClass` отдаёт классы части строкой для `className`.
- b45c170: Компонент над тем же `ctrl`, перемонтированный в другом месте, больше не трогает прежний посреди чужого рендера: сборка над инстансом атомарна для остальных его монтирований. Их состояние и уведомления приходят после сборки — уведомление получает и прежний, снятый тем же проходом, один раз; отменяемые события (`*:before`) уходят сразу, и `preventDefault` работает, как вне перемонтирования. В React смена `key` над внешним `ctrl` больше не печатает «Cannot update a component while rendering a different component», в том числе из обработчиков, меняющих состояние родителя, а в `Suspense` — не зацикливается: повтор рендера берёт id монтирования отброшенной сборки.
- a588e35: Toasts и хук useToasts() в React: менеджер оборачивает приложение, потомок показывает тост через useToasts().show(…)
- 9b3a3f5: NumberInput в React, Solid, Svelte и Web Components (`<div is="so-number-input">`) — поле числа в формате языка: шаг и границы, клавиши, кнопки «−» и «+» с удержанием, число уходит в форму скрытым полем, как во Vue
- 743c56c: Textarea в React, Solid, Svelte, Angular и Web Components — многострочное поле с авторостом и счётчиком символов, как во Vue
- 83a21ad: React: поле даты DateInput, календарь Calendar (Calendar.Item) и DatePicker; тема oren находит панель выбора месяца и года календаря и в разметке React
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- 9764543: Tags и Select в React: набор тегов с закрытием и выбором и поле выбора с панелью — одиночный и множественный выбор с тегами в поле, ввод с поиском и отбором, группы, окно `Virtual`, — как во Vue.
- Updated dependencies [5c4558e]
- Updated dependencies [0f59387]
- Updated dependencies [ad16bef]
- Updated dependencies [7e375e6]
- Updated dependencies [0179add]
- Updated dependencies [b74ddc6]
- Updated dependencies [89db4ae]
- Updated dependencies [e7d4c96]
- Updated dependencies [88078c4]
- Updated dependencies [434d622]
- Updated dependencies [74f6de3]
- Updated dependencies [ba30620]
- Updated dependencies [4fc4efa]
- Updated dependencies [b45c170]
- Updated dependencies [0091f1d]
- Updated dependencies [7137eaa]
- Updated dependencies [9d181a3]
- Updated dependencies [d7ee0bc]
- Updated dependencies [fba7c84]
- Updated dependencies [d495df8]
- Updated dependencies [0da817b]
- Updated dependencies [132cffc]
- Updated dependencies [8d4064e]
- Updated dependencies [b3cb2f3]
- Updated dependencies [2b5f080]
- Updated dependencies [8d55e75]
- Updated dependencies [2036526]
  - @soxa-ui/plugins@0.3.0-alpha.1
  - @soxa-ui/setup@0.3.0-alpha.1
  - @soxa-ui/core@0.3.0-alpha.1

## 0.3.0-alpha.0

### Minor Changes

- 3f19e5e: Table: атрибуты, которые приложение пишет на компонент, кроме класса и стиля, — `aria-label`, `id`, `data-*`, в Vue, React, Solid и Svelte и обработчики, у Svelte attachment-ы, в Angular и Web Components статические атрибуты разметки — теперь на `table`, где её роль и имя, а не на окне прокрутки `.so-table__viewport`; класс, стиль, скрытие и `ref` — по-прежнему окно. Angular: `<so-table>` вместо `<div so-table>`. Тема oren делает окно таблицы блоком сама (`display: block`) — и на незнакомом браузеру теге `<so-table>`.
- 2e3950e: ListBox и Tabs: атрибуты, которые приложение пишет на компонент, кроме класса и стиля, — `aria-*`, `id`, `tabindex`, `data-*`, в Vue, React, Solid и Svelte и обработчики — теперь на узле списка (`[role=listbox]`, `[role=tablist]`), а не на корне; `ref` — по-прежнему корень. Angular: `<so-list-box>` и `<so-tabs>` вместо `<div so-list-box>` и `<div so-tabs>`.
- 8e2e31e: ListBox и Select: группы пунктов из данных, как у Menu (`_: { group }`, `groupBy`, `groups`), части `ListBox.Group` и `Select.Group`. `TMenuGroupIdsPlugin` заменён общим плагином имени группы `TItemGroupIdsPlugin` (описание — `ItemGroupIdsPluginDescriptor` вместо `MenuGroupIdsPluginDescriptor`), типы `IMenuGroup`, `IMenuGroupProps`, `TMenuGroupEvents` — общими `IItemGroup`, `IItemGroupProps`, `TItemGroupEvents` — замените импорт. Рисование отдаёт разметке ListBox и Select секции: в поверхности компонента `drawnSections` вместо `drawn` (событие `change:drawnSections`). Список с группами окно `Virtual` не рисует.
- a61b6a5: Ячейка таблицы отдаёт готовый текст значения (`cell.text`) — одним правилом во всех адаптерах. Удалён помощник `toText` адаптеров: вместо `toText(cell.value)` читайте `cell.text`, а в своём слоте `cell` — `toText(value)` из `@soxa-ui/core` (в шаблоне Angular — пайп `soText`, он теперь зовёт её).
- 6408875: ListBox объявляет себя списком для скринридера: корень — `role="listbox"` (в `mode="multiple"` — ещё `aria-multiselectable="true"`), пункт — `role="option"` вместо `role="button"`, плитка панели выбора месяца и года Calendar — тоже. Обновление: эти пункты ищите по роли `option`, а не `button`.
- 958c866: ListBox: список — свой узел `.so-list-box__list` внутри корня, шапка и подвал — вне его. Роль, имя и остановка Tab — на этом узле, и прокручивается тоже он: в пределе `maxRows` ровно строки, а шапка и подвал при прокрутке стоят на месте. Стили фокуса и прокрутки и селекторы по `role` и `tabindex` корня ListBox переносите на него. `focused = true` из кода фокус в список пока не ставит — как у Input и Tabs, корень которых фокус не держит.

### Patch Changes

- 4206633: Tabs: корень набора несёт `data-disabled`, как ListBox и Table: по нему тема гасит выключенный набор вместе с панелями.
- dd15cd3: Поле формы Field в React, Solid, Svelte, Angular (`<div so-field>`) и Web Components (`<div is="so-field">`): подпись, подсказка и ошибка связаны с Input, CheckBox, Switch и RadioGroup внутри — `for` подписи или ссылка `aria-labelledby` у группы, справка в `aria-describedby`, ошибка — `aria-invalid` и `data-invalid` контрола. На корне Input, CheckBox и Switch теперь и `dataset` (`data-disabled`, `data-invalid`): по ним тема красит поле и подпись поля формы.
- Updated dependencies [dca2a76]
- Updated dependencies [8bbb7d8]
- Updated dependencies [7731c71]
- Updated dependencies [bc530a2]
- Updated dependencies [7872e77]
- Updated dependencies [a67b85a]
- Updated dependencies [f4676b7]
- Updated dependencies [5f4c58a]
- Updated dependencies [7002663]
- Updated dependencies [7f54086]
- Updated dependencies [88a6ccf]
- Updated dependencies [f06e5f9]
- Updated dependencies [d4c3583]
- Updated dependencies [51ce716]
- Updated dependencies [0ad9f22]
- Updated dependencies [8e2e31e]
- Updated dependencies [b3b63db]
- Updated dependencies [1411d88]
- Updated dependencies [ce9316e]
- Updated dependencies [a61b6a5]
- Updated dependencies [47e560d]
- Updated dependencies [10c38fe]
- Updated dependencies [6408875]
- Updated dependencies [e977046]
- Updated dependencies [04fb073]
- Updated dependencies [fb85110]
- Updated dependencies [76329be]
- Updated dependencies [958c866]
- Updated dependencies [b810fa0]
- Updated dependencies [4429cbc]
- Updated dependencies [f256e0f]
  - @soxa-ui/plugins@0.3.0-alpha.0
  - @soxa-ui/core@0.3.0-alpha.0
  - @soxa-ui/setup@0.3.0-alpha.0

## 0.2.0

### Minor Changes

- c124dad: Общий слой адаптеров переписан: пакета `@soxa-ui/accessor` больше нет, всё общее живёт в `@soxa-ui/setup`. Компоненты, дескрипторы и API приложения (`usePlugins`, `useExtensions`, `useTheme`, `setIcons`, `createAdapterContext`, `withParts`) не изменились.
  
  Ломающее — для тех, кто пишет свой адаптер или читает метаданные дескриптора:
  
  - `bindComponent(adapter, profile)` заменён на `adapter.connect(profile)`. Вместо методов связки — три порта: `state.subscribe` / `state.getSnapshot`, `inputs.full` / `inputs.delta` и `offer` у одного входа, `events.listen`; спред несъеденных пропсов — `forward`. Слушатель состояния получает имя свойства во фреймворке, а не запись поверхности.
  - `surfaceOf(descriptor, profile)` заменён на `TSurface.of(descriptor, profile)`. Записи поверхности ссылаются на описание пропа (`prop.spec`), полей `key`, `protected`, `triggers` у них больше нет; список `inputs` убран — входы отдаёт обмен.
  - `IPropDeclaration` заменён классом `TPropSpec`: те же поля `name`, `type`, `protected`, `triggers`, `default` (ключ есть, только если умолчание объявлено) плюс `hasDefault`, `read(owner)`, `assign(owner, value)`.
  - `TName`, `INamingStrategy`, `IContribution`, `IPropDefinition`, `ISlotDefinition`, `ISlotDeclaration`, `IContextElevator` импортируются из `@soxa-ui/setup`.
  - Контекст адаптера больше не отдаёт `accessor` и `writePluginProps`: `pluginProps` — обычный вход обмена.
  - О двух пропах или событиях с одним полным именем в составе компонента дескриптор сообщает в консоль при построении (`console.error`); раньше на этом падало монтирование.
  
  Пакет `@soxa-ui/setup` объявлен `"sideEffects": false`: приложение с одной кнопкой больше не тянет дескрипторы и плагины остальных компонентов (бандл одного `ButtonDescriptor` — 159 KiB вместо 466). Плагин с объявленным контрактом (`definePlugin`) ставьте снаружи определением, а не классом — `usePlugins(TButton, [AnchorPluginDescriptor])`, можно с `.with(options)`: импорт определения держит в бандле модуль, где записан контракт, иначе `pluginProps` до плагина в продакшен-сборке не дойдут.
  
  Поведение обмена значениями не менялось: прежние тесты связки, внешних плагинов и сборки проходят на новом ядре без правок ожиданий.
- 20c28fa: React: под StrictMode и внутри `<Activity>` компонент больше не теряет плагины. Раньше лишний цикл эффектов уничтожал набор плагинов, а компонент жил дальше с тем же контекстом: узел не привязывался к `TElementPlugin`, `onElementReady`, нажатия и фокус не приходили. Контекст теперь уничтожает `useAdapterContext`, а когда React заново устанавливает эффекты, хук собирает новый контекст фабрикой последнего рендера; без `ctrl` инстанс при этом новый. `useAdapter` контекст больше не уничтожает. Как обновиться: контекст, переданный в `useAdapter` не из `useAdapterContext`, уничтожайте сами при размонтировании (`adapter.destroy()`).
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 268439c: id в разметке строят плагины от id монтирования, ядро их не строит. Удалены IComponentView.idBase, опция конструктора idBase и второй аргумент конструктора компонентов ядра (IComponentOptions), TFactoryExtension.bindIdBase. Адаптер передаёт useId опцией контекста mountId, плагины строят id через ctx.createId(part). Части без экземпляра — живые наборы ядра: triggerAria (Popover, Tooltip), titleAria, bodyAria, listAria у Select вместо list_aria фасада, contentAria у Accordion.Item вместо content_aria. Поле Input, CheckBox, Switch без своего id — без атрибута.
- c449ef7: Слоты больше не наследуются через `extends`: дескриптор объявляет ровно те, что рисует разметка его компонента, — и в рантайме (`slots`), и в типе (`DescriptorSlots`); пропсы, события и плагины наследуются как прежде. Поэтому `default` от ComponentView больше не достаётся компонентам без содержимого — Icon, Input, CheckBox, Switch, Slider, ProgressLinear, ProgressSpinner, Calendar, Table, Table.Row, DateInput, DatePicker: раньше React принимал у них `children` по типу, а содержимое молча пропадало. В React `children` больше не приходит и из атрибутов DOM (`TDomAttributes`), как в Solid и Svelte: содержимое — только слот `default`. Ломающее: дескриптор-наследник теряет слоты родителя — объявите в его `slots` всё, что рисует его шаблон, включая `default`. У баз без своей разметки (`ModalLayerDescriptor`, `FieldDescriptor`, `ControlDescriptor`, `StylableDescriptor`, `TextableDescriptor`) слотов нет, и `ControlProps`, `StylableProps`, `TextableProps` адаптеров `children` не принимают; `clear` объявляют Input, DateInput и DatePicker, `close-icon` — Dialog и Drawer. У `TSlotDeclaration` больше нет `key` и `inheritFrom`. Подпись контрола — `Label` вложением, а не содержимое CheckBox или Switch.
- e376e9c: Кнопка очистки — часть поля. Input и DateInput получили `clearable`, `clearLabel`, имя кнопки `clearAria`, команду `clear` и слот `clear` — общая база ядра `TField` и дескриптор `FieldDescriptor`. Кнопка стоит первой в слоте у конца поля, а в теме oren она квадрат со стороной в строку слота, как кнопка календаря DatePicker, а не низкая и широкая. Select свою кнопку больше не рисует: `clearable` и `clearLabel` он отдаёт полю, а выбор снимает по событию `clear` поля. Ломает: у Select сняты `clearAria` (имя кнопки — `select.field.clearAria`) и модификатор `so-select--clearable` (теперь `so-input--clearable` у поля), у `TSelectCollectionFacade` — `clear`: очищайте поле, `select.field.clear()`. Класс кнопки `.so-select__clear` стал `.so-input__clear`, признак детали `embedded` — `input.clear` вместо `select.clear`.
- bf6a08c: Плагин объявляется один раз, константой: `XPluginDescriptor` — определение, а не фабрика. Вызовы `XPluginDescriptor()` заменить на `XPluginDescriptor`, опции установки — `XPluginDescriptor.with(options)`; у `definePlugin` поля `options` больше нет. У дескриптора снят `getSlots()` — слоты читаются полем `slots`; декларации дескриптора `readonly` и заморожены.
- 4785689: Таблица: сортирует маленькая кнопка рядом с подписью в заголовке колонки `sortable`, а не весь заголовок — нажатие по ячейке шапки больше не сортирует. Своё действие по заголовку (меню, триггер Popover) ставят контролом в подпись — слот `header`. Имя кнопке даёт локаль: новая строка `table.sort` с подписью колонки на месте `{name}` («Sort by Имя»); локаль, написанную целиком своим объектом `TLocale`, дополните ею, `extendLocale` возьмёт её из основы. Колонка ядра: `toggleSort()` — просьба отсортировать (`sort:request`, её выполняет расширение сортировки коллекции строк), набор `contentAria` переименован в `textAria`, новый набор кнопки — `sortAria`. Разметка заголовка: `.so-table-column__content` — ряд из подписи `.so-table-column__text` (у всех колонок, на неё ссылается `aria-labelledby` заголовка) и кнопки `.so-table-column__sort` со стрелкой `.so-table-column__sort-icon` в её области текста; кнопку рисует `Table.Column`, а не таблица. Тема oren: кнопка — квадрат вокруг стрелки в кегль заголовка, стрелка неотсортированной колонки проступает при наведении на заголовок и фокусе кнопки, сортируемый заголовок больше не подсвечивается.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- 7cea82e: Из типов пропсов компонентов снят `plugins`: такого пропа нет, готовый бандл снаружи не принимается, доступ к плагинам даёт событие `bundle:create`. React, Solid и Svelte больше не поглощают `plugins`: переданный, он уходит в атрибуты корня, как любой необъявленный проп.
- 3c38d3d: Связывание компонента с фреймворком — одно на все шесть адаптеров.
  
  Публичная поверхность компонента в именах фреймворка — `surfaceOf(descriptor, profile)` из `@soxa-ui/setup`: экспортные имена пропов и событий, умолчания и типы для статического слоя, список съеденных пропсов. Считается один раз на пару «дескриптор × профиль» и заменяет `TDescriptorInspector`, который пересчитывал то же самое на каждом монтировании и в двух режимах. Профиль (`IAdapterProfile`) — стратегия имён и слот по умолчанию, одна константа на адаптер: `VueProfile`, `ReactProfile`, `SolidProfile`, `SvelteProfile`, `WebcProfile`, `AngularProfile`.
  
  На монтирование адаптер берёт связку `bindComponent(adapter, profile)`: стартовое состояние, подписки на триггеры, проброс событий с дедупликацией, чтение и запись пропсов с guard'ом, спред несъеденных пропсов. Своих циклов по аксессору у адаптеров больше нет — остаётся только то, куда писать значение и как отдать событие.
  
  Удалены: `TDescriptorInspector` из `@soxa-ui/accessor`; `createInspectorFactory`, `collectEventBindings`, `collectForwardProps` из `@soxa-ui/setup`; `createInspector`, `useSyncProps`, `useSyncEvents` и их опции из адаптеров, а также `bindOutput`/`bindInput`/`buildInitialState`/`bindEvents` из Angular. Как обновиться: вместо `createInspector(descriptor).getExportEvents()` — `surfaceOf(descriptor, VueProfile).exportEvents`, вместо `getExportProps()` — `.exportProps`.
- f7b4492: Spinner удалён: компонент Vue и React, класс ядра `TSpinner` с типами `ISpinner`, `ISpinnerProps` и `TSpinnerEvents`, плагин `TSpinnerLayoutPlugin`, дескрипторы `SpinnerDescriptor` и `SpinnerLayoutPluginDescriptor` и стили Spinner в теме oren. Замена — ProgressSpinner с `indeterminate`: строчное кольцо той же шкалы размеров, которое бежит по кругу, пока доля неизвестна. Как обновиться: `<Spinner />` → `<ProgressSpinner indeterminate />`, имя — тем же `aria_label`. Отличия: роль кольца — `progressbar` без `aria-valuenow`, а не живая область `status`; содержимого у кольца нет — текст ставят рядом и связывают через `aria_labelledBy`; толщину кольца задаёт тема долей диаметра, пропа `borderWidth` и переменной толщины кольца больше нет. В React ProgressSpinner пока нет — его перенос идёт отдельно.
- 268439c: Владелец коллекции — опция движка: engine.options.set({ owner }) / get / watch, а не аргумент конструкторов расширений. Движок переживает компонент и переходит к следующему владельцу; второй живой владелец на одном движке — ошибка. Фабрики расширений (tabsExtensions и соседи) без аргументов, createEngine\* — owner необязателен; resolveEngine заменён completeEngine. Активацию и выбор можно отменить: item:activate:before (TActivateEvent) и item:select:before (TSelectEvent), activate/select/toggle возвращают boolean; отменённое value откатывается к выбору. Тема oren: выключенный активный таб приглушён, как остальные.
- 6bd5ac2: Язык и строки библиотеки — локаль поддерева, а не пропсы. Сняты пропсы со строками: `closeLabel` (Dialog, Drawer, Popover, Tabs.Item, Tags.Item), `maximizeLabel` (Dialog), `clearLabel` (Input, DateInput, Select), `prevLabel` и `nextLabel` (Scroller, Calendar), `prevYearLabel`, `nextYearLabel`, `prevYearsLabel` и `nextYearsLabel` (Calendar), `triggerLabel`, `startLabel` и `endLabel` (DatePicker), `selectAllLabel` (Table). `locale` у Calendar, DateInput, DatePicker и Table больше не вход.
  
  Как обновиться: оберните приложение — на сервере тоже, в каждом запросе — провайдером локали адаптера:
  
  ```vue
  <LocaleProvider :locale="ruRU">
    <App />
  </LocaleProvider>
  ```
  
  Локаль — `{ tag, translations }` из `@soxa-ui/plugins`: тег BCP 47 для Intl и строки библиотеки, данные без функций (место имени части — `{name}`). Готовые — `enUS`, `ruRU`, `zhCN`, `frFR`, `esES`, `arEG`; свою пишут объектом типа `TLocale` или собирают поверх готовой — `extendLocale(enUS, { tag: 'mn-MN', translations: { modal: { close: 'Хаах' } } })`. Смена пропа провайдера доезжает до компонентов на лету, без перемонтирования; вложенный провайдер даёт поддереву свой язык; без провайдера — английский.
  
  В ядре строк больше нет: наборы кнопок (`closeAria`, `maximizeAria`, `prevAria`, `nextAria`, `clearAria`) — живые `TAria`, имена в них пишут плагины имён (`TNamesPlugin` и наследники). Тег в `locale` ядра пишет `TLocalePlugin`. Контексту сборки локаль приходит опцией `locale` (`createAdapterContext`), плагину — `IPluginContext.locale`.
- 496dc31: `ref` потребителя получает корень компонента — узел, на который ложатся его класс и атрибуты, — у всех компонентов React, Solid и Svelte, у полей тоже: у Input, CheckBox, Switch и RadioGroup.Item это корень, а не `<input>` (до поля — `ref.querySelector('input')`), у таблицы React — её окно `div.so-table__viewport`. React: `ref` — проп компонентов (`Ref<Element>`), его отдают так же, как узлу: функции — узлом, при снятии — её очисткой или `null`, объекту — в `current`; сменившийся между рендерами `ref` корень к `TElementPlugin` не перепривязывает. Ломающее для Solid: `ref` поля раньше получал `<input>`, теперь — корень поля; тип `TFieldRef` и второй аргумент `fieldText` удалены. Svelte: новый связываемый проп `ref` — `<Button bind:ref={button} />` (`bind:this` у компонента даёт экземпляр, а не узел), при снятии — `null`; setup-функции компонентов принимают третьим аргументом приёмник корня.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- b50cc61: У контекста адаптера фаза «принят фреймворком»: `IAdapterContext.attach()` и событие `attach` — пара к `destroy()`, зовёт её рантайм адаптера в момент монтирования своего фреймворка. `TCollectionItemExtension` при сборке берёт движок и регистратор через лифт и отдаёт фасаду контекст элемента, а регистрирует элемент и применяет `meta` на `attach`. React: `ListBox` с `ListBox.Item` — первая коллекция адаптера; лифт — один контекст со слоем значений, детям его отдаёт `Elevate`, `ReactElevatorFactory` удалена; `useAdapterContext` отдаёт фабрике лифт компонента, принимает несколько контекстов, принимает их (`attach()`) при коммите и возвращает `{ contexts, layer }` (было — сам контекст); фасад коллекции связывает `useCollectionAdapter`; атрибуты снаружи ложатся на корень поверх наборов ядра, `ref` адаптера — последним (`toRootProps`).
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
- 45fce47: Слоты элементов коллекций пробрасываются целиком: владелец, который рисует элементы из `items`, отдаёт каждый слот элемента как `item-<слот>`, и scope проброса — scope слота элемента плюс сам элемент. `item` у ListBox, Select, Tags и Accordion получает `{ item, text, selected }`, у Tabs — `{ item, text, active }`, у RadioGroup — `{ item, active }`, у Calendar и DatePicker — `{ item, text }`; `header` у Table — `{ column, text, sortable }`. Новые слоты — `item-indicator-icon` у ListBox и Select, `item-close-icon` у Tabs и Tags, `item-leading-icon` и `item-trailing-icon` у Accordion: иконку подменяют одному элементу условием по `item.value`. У ListBox появился слот `empty` — пока элементов нет, как у Select. Подпись `RadioGroup.Item` получает `{ active }`. Стрелку Accordion, подменённую слотом, тема oren поворачивает так же, как стрелку по умолчанию: класс `so-accordion-item__arrow` переехал с иконки на обёртку слота, а пустую обёртку тема прячет. В React владелец отдаёт элементу функцию слота (`relaySlot`), а не готовый узел.
- 45499b2: Смонтированный компонент на React больше не держит пропсы первого рендера: их держали приёмник событий и очистка сборки в адаптере. У таблицы после замены данных прежний список строк со всеми записями уходит из памяти, не дожидаясь размонтирования.
- f42ab50: RadioGroup в адаптере React: группа нативных радио — `<RadioGroup.Item>` разметкой (и плоский `RadioGroupItem`) или `items` со слотом `item`. Общий `name` раздаёт группа, отметку сообщает нативный `checked`, состояние для темы (`data-selected`, `data-disabled`, модификаторы вида и размера) — на корне-`label` радио, как во Vue; выбор пользователя отдаёт `onChangeValue` группы. Поле адаптера (`NativeInput`) пишет отметку в узел на каждую смену состояния ядра, даже совпавшую с узлом: иначе радио, с которого отметку сняло значение снаружи, React не дал бы выбрать снова. Атрибуты DOM в типах пропсов (`TDomAttributes`) вычитают и защищённые пропсы дескриптора: `name` и `size` у `RadioGroup.Item` раздаёт группа, и атрибутами поля их не задать.
- 445c257: Компонент над движком или `ctrl`, пришедшими снаружи, больше не остаётся на них после размонтирования. `relay` и `relayAll` держат источник, только пока цель слушают, поэтому фасад коллекции уходит с внешнего движка вместе со своими подписчиками — во всех адаптерах. Хук `then` правила `relay` срабатывает тоже только тогда. React: сборка, которую он отбросил до коммита (Suspense, прерванный рендер), уничтожается следующей сборкой того же `ctrl` или движка. Один `ctrl` — один компонент, один движок — один компонент.
- fb7dff2: Отметка CheckBox — svg иконки по роли без компонента Icon: смена отметки больше не собирает контекст и плагины иконки. Размер отметке даёт тема флажка (so-check-box\_\_mark). Во Vue компонент иконки роли (`useIcon`) один на роль
- b0938c0: Открытость слоя для темы — `data-open` у панели любого Frame: слой (`TLayer`) пишет его сам, проекцией `visible`, и проводки в разметке не нужно. Тема oren проявляет и гасит по нему панели Select и DatePicker на месте, как Popover у триггера без жеста: одна прозрачность его временем, а закрытая панель, пока гаснет, нажатий не ловит. У Popover `data-open` панели теперь пишет её Frame, а из набора `panelDataset` он ушёл; у Dialog и Drawer атрибут прежний.
- 5efeeb0: React, Solid и Svelte: перерисовка родителя больше не откатывает состояние компонента к разметке. Раньше в ядро заново писались все переданные пропсы, и смена любого из них возвращала к значению из разметки то, что с тех пор поменяли сам компонент или код через инстанс: текст, выставленный через инстанс, пропадал от смены `disabled`. Теперь пишется только проп, сменившийся с прошлого рендера, — как во Vue, Angular и Web Components.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 6903a74: React: обёртка `Virtual` — окно для длинных списков, как во Vue: `<Virtual><ListBox items={…} /></Virtual>` рисует только видимые элементы, а на месте остальных — распорки той же высоты под `aria-hidden`; выключатель — `enabled`. ListBox без детей рисует то, что отдаёт рисование коллекции (`drawn`), одной петлёй с ключом записи: элемент, который остался в окне при прокрутке, не перемонтируется. Перевод стиля ядра в объект стиля React доступен как `toReactStyle`. Подхват окна коллекцией разделён по фазам контекста: сборка ставит только своё — плагин замера и стратегию окна, — а на выключатель обёртки коллекция подписывается, когда её приняли (`attach`); коллекция, собранная и выброшенная без приёма, подписки на обёртке больше не оставляет. Тип подключения к окну в `@soxa-ui/setup` — `TVirtualConnect` с `IVirtualConnection` вместо `TVirtualAttach`.
- b9d5deb: В React появились Icon, Label, Frame, Spinner и Skeleton — с той же разметкой и тем же поведением, что во Vue. Frame рисует панель в цели `target` (по умолчанию `body`) через новый `Teleport` адаптера; при серверном рендере панели нет, она появляется после гидратации. Новый `toRootLayout` сливает на корне классы и стиль ядра с `className` и `style` потребителя, а имена стиля плагина раскладки переводит в camelCase (`z-index` → `zIndex`). Слот, чьё имя совпало с атрибутом DOM, больше не сужается до строки атрибута: `content` у Label принимает разметку.
- 72df2c0: Внутренние имена setup-слоя коллекций React (Accordion, ListBox, Tabs, RadioGroup) приведены к правилу имён: контекст фасада — `collectionAdapter`, связка — `collectionBinding`. Примеры `relay` в документации ядра — на `this._engine`. Поведение не меняется.
- 5d2d8a9: Слой setup собирает компонент по одному составу. Состав монтирования (плагины дескриптора плюс регистрации приложения) считается один раз, и по нему строятся набор плагинов, units аксессора и начальные значения плагинных пропсов — раньше каждый выяснял состав сам, и плагины реестра доходили только до набора.
  
  Дескриптор стал описанием типа и только им: методы `createBundle` и `createAccessor` с него сняты (их звала одна сборка), а сам он строится один раз на тип — `defineDescriptor` кэширует фабрику, и монтирование больше не пересобирает всю цепочку до `EntityContribution`.
  
  Расширения `TPluginsBindingExtension` и `TPluginPropsExtension` удалены вместе с `resolveDefaultExtensions` и полем `defaultExtensions` в конфиге контекста. Начальные значения плагинных пропсов пишет сборка, а корневой узел привязывается методом контекста `adapter.bindElement(el)` — у компонента без `TElementPlugin` он ничего не делает. Как обновиться: `adapter.get(TPluginsBindingExtension)?.bindElement(el)` заменить на `adapter.bindElement(el)`, `{ defaultExtensions: [] }` из вызовов `createAdapterContext` убрать.
  
  `IAdapterContextOptions` и `IAdapterContextConfig` теперь экспортируются из `@soxa-ui/setup`.
- 0fc492f: Автоматические id в разметке (поле, панели, связки табов и секций, список Select, name группы радио, data-owner) строятся от основы экземпляра idBase, а не от счётчика uid: адаптеры Vue и React дают её из useId, и при серверном рендере id на сервере и в браузере совпадают. Новая опция конструктора idBase; элементы коллекции из items получают основу владельца с номером. В React фабрика useAdapterContext получает функцию сборки create — компонентам собирать контекст ею.
- 626dd60: Размонтированный компонент больше не остаётся в памяти до следующего события на странице. React DOM помнит узел своего дерева, на который пришло последнее событие, и после размонтирования, а вместе с узлом — ref корня; ref адаптера теперь отпускает компонент, когда тот уничтожен. Раньше так в памяти оставалась, например, таблица со всеми строками и их записями.
- 2f80cc3: Table в React: выбор строки больше не перерисовывает ячейки. Строки (`Table.Row`) и их ячейки стоят под границей перерисовки адаптера — `withRenderBoundary` из `@soxa-ui/react`, обёртка `memo` без своего сравнения: таблица перерисовывается на каждый выбор, а строку перерисовывают только её собственное состояние и новые входы, ячейки — только новые ячейки, их набор или новый слот `cell`. «Выбрать все» на тысячах строк больше не зовёт слот `cell` на каждую ячейку. Граница держит, пока приложение отдаёт слот `cell` одним и тем же объектом: стрелка в разметке перерисует ячейки на каждый рендер приложения, но не на выбор.
  
  Компоненты React больше не перерисовываются второй раз сразу после монтирования: адаптер отдаёт React состояние так, что значение, то же по содержимому, остаётся прежним объектом. Раньше повторное чтение при подписке давало новые объекты составных значений, и строка таблицы при монтировании рисовалась дважды — со всеми ячейками и слотом `cell` на каждую.
- 4100cf5: React: слот, ставший пустым (`{cond && <Icon />}` при ложном условии, `null`), больше не глушит `text` и прочее запасное содержимое компонента. Vue: только комментарий.
- cd29b8f: Calendar: заголовок месяца — кнопка, открывающая панель выбора месяца и года. Панель накрывает календарь целиком, её шапка встаёт на место ряда заголовков; в ней список месяцев — ровная сетка 4×3 с подписями по центру, год в шапке переключает на годы по 12, стрелки листают год и страницу лет. Имена стрелок — новые пропсы prevYearLabel, nextYearLabel, prevYearsLabel, nextYearsLabel. Frame и Popover получили проп contained: панель не телепортируется, а встаёт в ближайшем позиционированном предке (Popover — накрывает его целиком). ListBox сообщает о выборе пользователя событием choose расширения списка.
- c37e233: Кнопки, которые компоненты рисуют сами, — очистка полей, крестики окна, панели, поповера, табов и тегов, листание календаря и ленты, кнопки DatePicker, строка таба, заголовок секции Accordion, сортировка колонки таблицы — получили `type="button"`. У `<button>` без `type` тип `submit`: в форме клик по очистке поля отправлял форму, а Enter в поле нажимал первую такую кнопку, и поле очищалось вместо отправки. Button, который ставит приложение, остаётся кнопкой отправки, как нативная `<button>`. В React, Solid и Svelte пропсы Button несут атрибуты кнопки: `type`, `form`, `name` и `value` типизированы.
- fafbf5f: В React появились Input, CheckBox и Switch — с той же разметкой и тем же поведением, что во Vue. Значение полей ведёт ядро: текст, отметку и «выбрано частично» проводит новое поле адаптера `NativeInput` — умолчание атрибутом (так значение попадает и в серверную разметку), свойство — в узел, если разошлось с ним. Контролируемого поля React нет: значение задаёт проп `value` или `ctrl`, смену сообщает `onChangeValue`. Атрибуты потребителя поля делит, как Vue: `className` и `style` — корню, остальное — `<input>` (`toControlAttrs`). Новый `roleIcon(role)` даёт `Icon` тег иконки из зарегистрированного пакета. `UseDomProps` вычитает из атрибутов DOM и имена событий дескриптора — `onInput` у полей теперь колбэк события `input`, а не обработчик DOM, — и принимает тип атрибутов параметром (`TFieldAttributes` у полей). Во Vue корень Input рисуется по `tag`, а не всегда `div`.
- 5659d22: Инициализация компонента одинакова во всех адаптерах и идёт теми же путями, что и изменения.
  
  Пропсы применяет сборка компонента. Внешний `ctrl` и плагины получают через сеттер всё, что отличается от объявленного умолчания; свой инстанс получает пропсы ядра конструктором, и второй раз они не пишутся. Адаптеры стартовых значений больше не пишут, поэтому коллекция с пропом `items` во Vue при монтировании больше не очищается и не заполняется повторно. Проп, равный умолчанию, внешний `ctrl` не трогает. Пересборка контекста в React (StrictMode, `<Activity>`) — такое же монтирование: разметка снова применяется к внешнему `ctrl`.
  
  Значения из ядра фреймворк получает подпиской на связку. `binding.subscribe(listener)` сразу отдаёт каждое свойство тем же вызовом, что и срабатывание триггера, дальше — изменения; `binding.getSnapshot()` отдаёт неизменяемый снимок (React рисует по нему через `useSyncExternalStore`). Порядок «подписка, потом чтение» держит связка, поэтому изменение ядра между рендером и подпиской больше не теряется в React и Svelte. `update:<prop>` для `v-model` объявляет профиль Vue (`IAdapterProfile.model`) и эмитит связка в `bindEvents`.
  
  Как обновиться, если вы пишете свой адаптер: `binding.state()` и `binding.bindOutput(write)` заменены на `binding.subscribe(write)` (он же отдаёт начальное состояние) и `binding.getSnapshot()`; у `bindComponent` больше нет третьего параметра `previous`.
- 8fc8eb4: Table в React: таблица с частями `Table.Column` и `Table.Row` (и плоскими `TableColumn`, `TableRow`) на том же ядре, что во Vue, — колонки и строки данными (`columns`, `items`) или движком снаружи, сортировка кнопкой заголовка, выбор строк чекбоксами с «выбрать все», ручка ширины и перестановка колонок (события `onColumnResize`, `onColumnMove`), сетка (`grid`), закреплённая шапка, слоты `header`, `cell` и `empty` и окно `<Virtual><Table … /></Virtual>`. Атрибуты потребителя и скрытие достаются окну таблицы `div.so-table__viewport`, классы и наборы — `table`. Новые помощники адаптера: `toWrappedRootProps` — корень внутри своей обёртки, `toText` — значение неизвестного типа текстом по правилу интерполяции Vue.
- 9aa7f6f: Один файл на компонент: контракт объявляется прямо в дескрипторе. Отдельных файлов contribution больше нет — их читал только свой дескриптор, а компонент приходилось собирать по двум местам. Дескриптор теперь целиком описывает компонент: наследование, пропсы, события, слоты и плагины. Плагины устроены так же — `definePlugin({ ctor, namespace, contribution: { … } })`.
  
  Из `@soxa-ui/setup` удалены фабрики `*Contribution` (`ButtonContribution` и ещё 53) и `LIST_PROPS`. `defineType`, `TPropType` и `TEmptySlotScope` переехали в `define` и экспортируются оттуда.
  
  Служебные пропсы адаптера — `TAdapterProps` (`ctrl`, `embedded`), пропсы компонента из дескриптора — `DescriptorComponentProps`, колбэк-события — `DescriptorCallbackEvents`. Раньше то же было объявлено в каждом адаптере отдельно (`TBaseComponentProps` во Vue, `TReactComponentProps`, `TSolidComponentProps`, `TSvelteComponentProps` — удалены).
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- c9aaade: Адаптеры Vue, React, Solid и Web Components уезжают собранным ESM с декларациями в dist, а не исходниками
- 87a7a4d: Выходы плагинов — защищённые пропсы, которые плагин вычисляет, а разметка только читает (`dismiss_ownerAttribute`, `layout_styles`, `keyboard_highlightedUid`, `editable_query`, `listItem_highlighted`), — типизирует дескриптор. Тип выхода — четвёртый аргумент `definePlugin`, `Pick` геттера класса плагина; выходы плагинов дескриптора собирает `DescriptorPluginOutputs<typeof XDescriptor>`. Контекст адаптера несёт их вторым параметром, `IAdapterContext<TInstance, TOutputs>`: его выводит `createAdapterContext` из состава плагинов дескриптора. `state` у `useAdapter` React, Solid и Svelte теперь типа `TAdapterState<TInstance, TOutputs>` — свойства инстанса и выходы; во Vue выходы передаются третьим аргументом `useAdapter`, и шаблоны Select, Frame, Icon, Spinner и Skeleton читают их с типом геттера плагина. Удалён `TDismissPluginProps`: он описывал `dismiss_ownerAttribute` рукой и с плагином не сверялся. Как обновиться: вместо `TDismissPluginProps` взять `DescriptorPluginOutputs<typeof SelectDescriptor>` (или дескриптора, в состав которого входит `DismissPluginDescriptor`).
- 01f1404: ProgressSpinner в адаптере React: индикатор выполнения кольцом — доля готового (`value` на шкале `min`–`max`) или бег, пока она неизвестна (`indeterminate`). Роль `progressbar` с `aria-value*`, `data-indeterminate`, доля переменной `--so-progress-spinner-fraction` и рисунок под `aria-hidden` — те же, что во Vue; имя — `aria_label` или `aria_labelledBy`. Ожидание без доли, которое раньше давал Spinner, — то же кольцо с `indeterminate`. Раскладка корня (`toRootProps`, `toRootLayout`) принимает последним аргументом стиль-выход компонента: он ложится поверх стиля плагина раскладки и под стилем потребителя, а `display: none` скрытого корня — поверх всех.
- 5c86dce: React: Tabs и Accordion. Tabs — набор табов с частями `Tabs.Item` и `Tabs.Content` (плоские `TabsItem` и `TabsContent`): табы — детьми или из `items` со слотами `item`, `item-leading`, `item-trailing`; панели — в слоте `content`, панель показана, пока активен таб того же `value`. ARIA-связка «таб ↔ панель», клавиатура по APG Tabs (стрелки, `Home`/`End`, `Delete`) и кнопка закрытия (`closable`) — как у Vue. Accordion — секции `Accordion.Item` (плоский `AccordionItem`) детьми или из `items` со слотами `item`, `item-leading`, `item-trailing`, `item-content`; `mode="multiple"` держит раскрытыми несколько. Табы и секции разметки входят в коллекцию при коммите. Панель Tabs (`TTabsContentBindingExtension` в `@soxa-ui/setup`) подписывается на движок и своё `value`, когда адаптер принимает компонент (`attach`), а не при сборке: в React сборка идёт на рендере, и отброшенный рендер оставлял бы на шине движка лишнего подписчика.
- Updated dependencies [85bcbed]
- Updated dependencies [1ed86e6]
- Updated dependencies [f535f0d]
- Updated dependencies [bb9cd8f]
- Updated dependencies [fe0551e]
- Updated dependencies [45fce47]
- Updated dependencies [b97ee10]
- Updated dependencies [dd5c935]
- Updated dependencies [c9d24bc]
- Updated dependencies [c124dad]
- Updated dependencies [8595512]
- Updated dependencies [b919172]
- Updated dependencies [eae46e4]
- Updated dependencies [9e0c6e7]
- Updated dependencies [a7cf90d]
- Updated dependencies [ed00f0c]
- Updated dependencies [8b89d9e]
- Updated dependencies [cf94344]
- Updated dependencies [89815b8]
- Updated dependencies [b4243ba]
- Updated dependencies [c037d5c]
- Updated dependencies [4f1c80f]
- Updated dependencies [0b61b6a]
- Updated dependencies [581d47a]
- Updated dependencies [b84aaf2]
- Updated dependencies [8b77053]
- Updated dependencies [de54fc7]
- Updated dependencies [3a72379]
- Updated dependencies [bd02d06]
- Updated dependencies [5c4c620]
- Updated dependencies [4df23ca]
- Updated dependencies [445c257]
- Updated dependencies [2e53a0f]
- Updated dependencies [0d1a6cb]
- Updated dependencies [e982bdf]
- Updated dependencies [dd268c6]
- Updated dependencies [b6b8274]
- Updated dependencies [b0938c0]
- Updated dependencies [5efeeb0]
- Updated dependencies [7b387fb]
- Updated dependencies [d88ab2e]
- Updated dependencies [f2bc1f9]
- Updated dependencies [4fa09bc]
- Updated dependencies [b45d550]
- Updated dependencies [9e22258]
- Updated dependencies [61bd37d]
- Updated dependencies [1a1a8e9]
- Updated dependencies [b850687]
- Updated dependencies [6903a74]
- Updated dependencies [a58f169]
- Updated dependencies [e76d680]
- Updated dependencies [700c746]
- Updated dependencies [7c9d5c6]
- Updated dependencies [ccd7713]
- Updated dependencies [6071ef5]
- Updated dependencies [17bc937]
- Updated dependencies [72df2c0]
- Updated dependencies [19d58ac]
- Updated dependencies [a91b783]
- Updated dependencies [bd02d06]
- Updated dependencies [5d2d8a9]
- Updated dependencies [268439c]
- Updated dependencies [95c608b]
- Updated dependencies [c449ef7]
- Updated dependencies [60f8114]
- Updated dependencies [e4cedbf]
- Updated dependencies [5514596]
- Updated dependencies [6cd5781]
- Updated dependencies [0fc492f]
- Updated dependencies [e0aa88f]
- Updated dependencies [021af92]
- Updated dependencies [c5e3798]
- Updated dependencies [0ac7524]
- Updated dependencies [21ba816]
- Updated dependencies [0c6f41d]
- Updated dependencies [01e60e2]
- Updated dependencies [05d9f0a]
- Updated dependencies [e07fd63]
- Updated dependencies [f3e1083]
- Updated dependencies [a8e75d7]
- Updated dependencies [c0c7b0a]
- Updated dependencies [e376e9c]
- Updated dependencies [d23da50]
- Updated dependencies [ff6b7a2]
- Updated dependencies [b715bb9]
- Updated dependencies [01e6c91]
- Updated dependencies [186903f]
- Updated dependencies [a1d81be]
- Updated dependencies [dcee2e2]
- Updated dependencies [0f36216]
- Updated dependencies [bf6a08c]
- Updated dependencies [f7769b8]
- Updated dependencies [8d5c70b]
- Updated dependencies [4785689]
- Updated dependencies [6103988]
- Updated dependencies [7b97cec]
- Updated dependencies [7fd538d]
- Updated dependencies [eaffd69]
- Updated dependencies [5c40d3d]
- Updated dependencies [6476cb7]
- Updated dependencies [9972268]
- Updated dependencies [dcb1c8b]
- Updated dependencies [7876446]
- Updated dependencies [251e29a]
- Updated dependencies [0abcc93]
- Updated dependencies [7bee975]
- Updated dependencies [b2d8b19]
- Updated dependencies [cd29b8f]
- Updated dependencies [7cea82e]
- Updated dependencies [ceb0a8e]
- Updated dependencies [251e7e2]
- Updated dependencies [3bfa716]
- Updated dependencies [20a45da]
- Updated dependencies [43af3f3]
- Updated dependencies [4c7715f]
- Updated dependencies [260b56e]
- Updated dependencies [7336a0b]
- Updated dependencies [5659d22]
- Updated dependencies [b37a7a1]
- Updated dependencies [b1fad65]
- Updated dependencies [b3dccfc]
- Updated dependencies [2c76370]
- Updated dependencies [3c38d3d]
- Updated dependencies [f7b4492]
- Updated dependencies [29ccac8]
- Updated dependencies [268439c]
- Updated dependencies [5f48561]
- Updated dependencies [792ab59]
- Updated dependencies [b16c0b3]
- Updated dependencies [50f05bd]
- Updated dependencies [2f920ac]
- Updated dependencies [9aa7f6f]
- Updated dependencies [3c56a74]
- Updated dependencies [89ab825]
- Updated dependencies [1d68664]
- Updated dependencies [6bd5ac2]
- Updated dependencies [2788652]
- Updated dependencies [cab24c8]
- Updated dependencies [0f36216]
- Updated dependencies [20c28fa]
- Updated dependencies [c0c7b0a]
- Updated dependencies [3daf6b0]
- Updated dependencies [5c86dce]
- Updated dependencies [4a8dc74]
- Updated dependencies [5cdd861]
- Updated dependencies [63bb30a]
- Updated dependencies [dadfec8]
- Updated dependencies [62d2c7c]
- Updated dependencies [de9a974]
- Updated dependencies [84ab767]
- Updated dependencies [e182825]
- Updated dependencies [5e219b7]
- Updated dependencies [b26c05f]
- Updated dependencies [883e44a]
- Updated dependencies [f8b8ef4]
- Updated dependencies [090daba]
- Updated dependencies [080cf7a]
- Updated dependencies [c3032e2]
- Updated dependencies [0471882]
- Updated dependencies [89ab825]
- Updated dependencies [25ecd85]
- Updated dependencies [81755d0]
- Updated dependencies [cd197a5]
- Updated dependencies [312ec01]
- Updated dependencies [87a7a4d]
- Updated dependencies [884a39d]
- Updated dependencies [130ecc5]
- Updated dependencies [593087a]
- Updated dependencies [b2288b1]
- Updated dependencies [e6213d6]
- Updated dependencies [b2d21dd]
- Updated dependencies [6cddad0]
- Updated dependencies [4100cf5]
- Updated dependencies [b50cc61]
- Updated dependencies [01b6fbc]
- Updated dependencies [8d77de0]
- Updated dependencies [72428d0]
- Updated dependencies [b89d322]
- Updated dependencies [1d4551c]
- Updated dependencies [5c86dce]
- Updated dependencies [1b8b606]
- Updated dependencies [daad2de]
- Updated dependencies [b50cc61]
- Updated dependencies [55eccf2]
- Updated dependencies [83dd6f6]
- Updated dependencies [0886ef3]
  - @soxa-ui/core@0.2.0
  - @soxa-ui/plugins@0.2.0
  - @soxa-ui/setup@0.2.0
