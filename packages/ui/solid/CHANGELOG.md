# @soxa-ui/solid

## 0.4.2

### Patch Changes

- 1d1d17a: Add explicit initial collection sources for consistent server-rendered membership and tab-panel accessibility links across adapters.
- 1490654: Centralize prepared collection assembly before model construction across adapters.
- Updated dependencies [1d1d17a]
- Updated dependencies [22d2116]
- Updated dependencies [1490654]
  - @soxa-ui/setup@0.4.2
  - @soxa-ui/plugins@0.4.2
  - @soxa-ui/core@0.4.2

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

- 672226f: Preserve the Breadcrumbs overflow trigger and restore keyboard focus after closing its menu in Solid.
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
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
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
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
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

- 5d8b7ca: Event callbacks run before Solid renders the new state, as on the other platforms: Menu's `onChangeOpen` now comes before its panel's items join. Read the rendered DOM after the callback (an effect or `queueMicrotask`), not inside it
- a20cdd5: A component's own assembly no longer sends events: on Vue, Svelte, Solid and Web Components a context listens to its events after it is accepted, and a collection binds its facades before the component, as React and Angular do. What the facade writes into the component while mounting is the starting state: Calendar no longer sends `change:months` (and Vue `update:months`) with the months it shows on mount, Table no longer sends `change:dataset`; read the starting value from the instance (`ctrl.months`) instead of waiting for the first event. Svelte and Solid adapter API: `useCollectionAdapter` no longer takes the rest of the attributes — `joinBindings` chains them from the component's rest.
- 515db01: React, Solid and Svelte: a part's click action (activate a tab, choose an option, toggle a section, press a menu item, turn a page, close a panel or a tag, clear a field, the DatePicker's Cancel and Done) is a native listener on the part's node, set as soon as the node exists, as in Vue, Web Components and Angular. The owner's `onActionClick` and `onActionPress` now come after the action: a handler that read the state before the click (the previous tab, the previous choice) reads the new one — take the previous value from the change event (`onChangeActivation`, `onChangeSelection`) instead. A click right after the mount, before the first frame, is no longer lost on the tabs' and tags' crosses and the fields' clear buttons. The consumer's `onClick` on a part still runs after the action.
- d278f0f: The adapter context has a fourth phase, detach: the first moment of the teardown, before the children go. The context only reports it; every adapter stops the consumer on it, and a collection reports it to its items and Tabs panels, so in Svelte, Solid and Angular an item no longer hears its siblings leave when the whole collection goes. An Angular component taken out of the document sends nothing (its owner heard its items leave one by one), and a React item no longer hears its own entry into the collection: what the acceptance writes is the starting state, as in the other adapters. Breaking: TCollectionItemExtension and TTabsContentBindingExtension take the own context of the item or the panel instead of its instance, and take the instance from it: { adapter, elevator } instead of { item: adapter.instance, elevator } and { content: adapter.instance, elevator }. IAdapterContext has detach() and the detach event.

### Patch Changes

- 88e4f4f: Calendar: weeks are keyed by their place in the grid, so switching to a language with another first day of the week keeps six days of seven in their row instead of rebuilding the month.
- 1a322fe: `AccordionItem` slots now carry their own section (`item`) in scope in every adapter, the way a table row's `cell` slot carries its own row; Accordion relays its `item-*` slots from that scope instead of its loop variable. React: Accordion no longer redraws every section with the owner when the consumer gives `item-content`.
- ea743a8: Svelte and Solid: the consumer no longer hears a component's teardown. The markup items leaving the collection no longer send `onChangeItems` with an ever shorter list (a consumer keeping it in its state lost the list with a hidden owner), nor the unbinding of its root (`onElementRemoved`). On Svelte the blur of a removed focused node still comes, as on Web Components: the framework removes the nodes before any hook.
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

### Minor Changes

- d2a81a7: Минимальная версия Solid — 1.9.13 вместо 1.9.10: серверная сборка `solid-js/web` до 1.9.13 не экспортирует `use`, и адаптер не загружался при серверном рендере. Обновитесь до solid-js 1.9.13 или новее.

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.5
  - @soxa-ui/plugins@0.3.0-alpha.5
  - @soxa-ui/setup@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- 986c3b9: Table на Solid: корень компонента — Root адаптера вместо Dynamic, ячейки строки без слота — одно мемо на строку (createPartNodes), поле флажка и ячейка выбора — createPartNode без спреда, сигнал свойства связки — по первому чтению; память таблицы на 5000 строк — 460 → 229 МБ, рендер — 1,76 → 1,51 с
- 7db01d2: Table на Solid: состояние связки — сигнал на свойство вместо глубокого стора, ячейка — без Dynamic; память таблицы на 5000 строк — 503 МБ вместо 1,28 ГБ, рендер — 1,8 с вместо 3,4 с
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

- bd594ec: Адаптер Solid: удержание в окнах гидратации — один помощник createHeldMemo на раскладку, ветки и петли; комментарии сокращены до шапок со ссылкой на packages/ui/solid/AGENTS.md. Сломалось: у TBinding нет поля plugins — набор берите у контекста (adapter.bundle); useCollectionAdapter(adapter, props, owner) принимает связку компонента вместо её forwardProps и отдаёт слитую связку (состояние обоих — joinState, ctrl и ref — компонента), тип TCollectionBinding заменён на TJoinedBinding.
- 84f4ad3: Select.Item: выбор опции — клик по строке, как у ListBox, Menu и Tabs: клик потребителя по опции приходит после выбора (раньше — до него), и stopPropagation в нём выбор больше не отменяет. Кто читал в обработчике прежнее значение — берите его из события смены значения (oldValue); отменить выбор — подпиской на item:select:before.
- 17e61b1: Адаптер Solid: `useCollectionAdapter` снова отвечает только за фасад, связку компонента с фасадами сводит новый `joinBindings`, как в Angular и Web Components. Сломалось: `useCollectionAdapter(adapter, props, forward)` принимает аксессор атрибутов (`owner.forwardProps`) вместо связки владельца и отдаёт `TCollectionBinding`; у `TJoinedBinding` второй параметр — тип состояния фасада. Обновиться: `joinBindings(owner, useCollectionAdapter(facade, props, owner.forwardProps))` вместо `useCollectionAdapter(facade, props, owner)`.

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.
- 391b7c7: Solid: слот, по которому компонент выбирает между вашим содержимым и своим (элементы из данных у коллекций, значки по умолчанию, обёртки краёв Tabs и подвала Calendar, `ResolvedSlot`), теперь задан по значению: компонент в слоте — содержимое, даже если ничего не нарисовал. Элемент разметки, удалённый движком, больше не возвращается в коллекцию невидимым. `<Show when={false}>` в таком слоте запасное больше не включает — если оно нужно, пишите условие значением: `{cond() && <X />}`.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.
- 7137eaa: Группы из разметки (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`) входят в группировку коллекции, и `sections` описывают их с подписью. Элемент без группы больше не уходит в конец, а остаётся на своём месте среди незаявленных групп; чтобы вернуть прежний порядок, заявите группы в `groups`.
- 8d4064e: `onChangeSelected` элемента коллекции (`ListBox.Item`, `Select.Item`, `Tags.Item`, `Accordion.Item`, `Table.Row`, флажки и переключатели `Menu`) и `onChangeActive` (`Tabs.Item`, `Tabs.Content`, `RadioGroup.Item`) приходят только элементу, чьё состояние сменилось, и несут новое значение: `onChangeSelected={(selected) => …}`. `change:selection` владельца вторым аргументом отдаёт элементы, чья отметка сменилась, `change:activation` — прежний активный; в Web Components `detail` этих двух событий — пара: где читали `detail`, читайте `detail[0]`.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- dece2aa: Solid: содержимое слотов со scope — подсказки ручек Slider, пунктов, табов, секций и ячеек Table — больше не пересоздаётся при каждой смене scope, если читать его в разметке (`scope.text`)
- 72cc6e8: Frame и Popover в Solid при смене `contained` на лету переносят панель тем же узлом: содержимое не пересобирается, набранное в полях сохраняется.
- 43b6270: В Solid — DateInput, Calendar с `Calendar.Item` и DatePicker: поле даты по частям, сетки месяцев с выбором месяца и года и поле с календарём в панели.
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- 4a66001: Slider, Rating, ProgressLinear, Pagination и Scroller в Solid: ползунок с одной или несколькими ручками — метки, подсказка со значением, слоты `mark` и `thumb`; оценка звёздами — половинки, предпросмотр наведением, только для показа, обязательность, слот `icon`; индикатор выполнения линией; постраничная навигация — окно с пропусками, стрелки, движок снаружи, слоты `item`, `prev-icon` и `next-icon`; лента со стрелками — `viewportAria` и слоты значков. Ползунок и оценка берут связку поля формы `Field`, как Input. Сервер рисует их целиком: окно и текущую страницу, ручки, звёзды и значения полей. Базовые слои Interactive, ValueControl и InputControl — типы пропсов и `setupInteractive`, `setupValueControl`, `setupInputControl`, как у Control.
- 62de756: Dialog, Drawer и Toasts в Solid: модальное окно, выезжающая панель (смахивание, `contained`) и уведомления из кода — `useToasts()` под `<Toasts>`; своё содержимое тоста — компонент Solid с пропом `toast` (`TToastRender`).
- 309ce24: DragAndDrop во всех адаптерах: перестановка элементов Tabs, ListBox и Accordion перетаскиванием, события `move:before` и `move` (`onMoveBefore`/`onMove`, `(soMoveBefore)`/`(soMove)`, `so:move:before`/`so:move`); в Angular — `<ng-container so-drag-and-drop>`, в Web Components — `<so-drag-and-drop>`
- 49b6b0f: Solid: поздняя гидратация границы `Suspense`, досланной потоком, больше не падает и не оставляет лишних узлов вне границы. Панель `Tabs.Content` появляется, слот `empty` у ListBox и Select уходит, тост, показанный из тела компонента за границей, рисуется: ветки и петли компонентов, сменившиеся в окне гидратации, перестраиваются после него.
- fb5643a: Solid: атрибуты корня, сменившиеся во время гидратации, теперь доходят до разметки — у табов и тегов разметкой, где активный не первый, после гидратации остаётся одна остановка Tab
- 9b3a3f5: NumberInput в React, Solid, Svelte и Web Components (`<div is="so-number-input">`) — поле числа в формате языка: шаг и границы, клавиши, кнопки «−» и «+» с удержанием, число уходит в форму скрытым полем, как во Vue
- 743c56c: Textarea в React, Solid, Svelte, Angular и Web Components — многострочное поле с авторостом и счётчиком символов, как во Vue
- c51c055: Solid: набор тегов Tags (`Tags.Item`) и поле выбора Select (`Select.Item`, `Select.Group`) — панель со списком, отбор, теги выбранного, окно `Virtual`; `ResolvedSlot` принимает scope слота.
- 95be535: Menu в Solid: меню у кнопки и контекстное меню (`openOn="contextmenu"`), части `Menu.Item`, `Menu.CheckboxItem`, `Menu.RadioGroup` с `Menu.RadioItem`, `Menu.Submenu`, `Menu.PopoverItem`, `Menu.Group`, `Menu.Separator` и плоские имена; пункты разметкой и данными — `items`, группы, подменю из вложенных `items`. Новый помощник адаптера — классы части строкой (`toPartClass`).
- 83a21ad: React: поле даты DateInput, календарь Calendar (Calendar.Item) и DatePicker; тема oren находит панель выбора месяца и года календаря и в разметке React
- 80cbd5c: Solid: атрибуты, сменившиеся в поздней гидратации — у границы `Suspense`, которую сервер дослал потоком, и у острова, — доходят до разметки: у табов и тегов, где активный за такой границей, остаётся одна остановка Tab, а `for` подписи Field ведёт на контрол за ней
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- de85cf3: Popover и Tooltip в Solid: панель с произвольным содержимым у триггера и подсказка по наведению и фокусу — поведение, разметка и слоты как у Vue. Scope слота `trigger` читайте в разметке — `trigger={(scope) => <Button {...scope.triggerAria} />}`: так триггер не пересоздаётся при открытии
- 85060e4: Solid: атрибуты внутренних узлов (подписи Field, `<input>` полей, ячеек таблицы и др.), сменившиеся во время гидратации, доходят до разметки — например, `for` подписи Field у поля со своим `id`
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
- e888c8f: Минимальные версии фреймворков ниже: Vue 3.5.21 вместо 3.5.32, Solid 1.9.10 вместо 1.9.17, Angular 21.1 вместо 22.1.5.
- e3c57b9: Table и Virtual в Solid: таблица с частями `Table.Column` и `Table.Row` (и плоскими `TableColumn`, `TableRow`) — колонки и строки данными или движком снаружи, сортировка, выбор строк с «выбрать все», ручка ширины и перестановка колонок, сетка, закреплённая шапка, слоты `header`, `cell`, `empty` и окно `<Virtual><Table … /></Virtual>`. Атрибуты и `ref` потребителя — окну `div.so-table__viewport`. Новый помощник адаптера — раскладка корня внутри обёртки.
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
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- fdafcd8: Коллекции ListBox, Tabs, Accordion и RadioGroup в Solid: части через точку (`Tabs.Item`, `Tabs.Content`, `ListBox.Item`, `Accordion.Item`, `RadioGroup.Item`) и плоские имена, элементы разметкой и данными (`items`). Лифт коллекций — слой значений: сборка берёт `useElevator()`, детям слой отдаёт `Elevate`. Ломающее: экспорт `SolidElevatorFactory` снят, а `TSolidElevator` работает только поверх слоёв `useElevator()`.
- bf6a08c: Плагин объявляется один раз, константой: `XPluginDescriptor` — определение, а не фабрика. Вызовы `XPluginDescriptor()` заменить на `XPluginDescriptor`, опции установки — `XPluginDescriptor.with(options)`; у `definePlugin` поля `options` больше нет. У дескриптора снят `getSlots()` — слоты читаются полем `slots`; декларации дескриптора `readonly` и заморожены.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- 7cea82e: Из типов пропсов компонентов снят `plugins`: такого пропа нет, готовый бандл снаружи не принимается, доступ к плагинам даёт событие `bundle:create`. React, Solid и Svelte больше не поглощают `plugins`: переданный, он уходит в атрибуты корня, как любой необъявленный проп.
- 3c38d3d: Связывание компонента с фреймворком — одно на все шесть адаптеров.
  
  Публичная поверхность компонента в именах фреймворка — `surfaceOf(descriptor, profile)` из `@soxa-ui/setup`: экспортные имена пропов и событий, умолчания и типы для статического слоя, список съеденных пропсов. Считается один раз на пару «дескриптор × профиль» и заменяет `TDescriptorInspector`, который пересчитывал то же самое на каждом монтировании и в двух режимах. Профиль (`IAdapterProfile`) — стратегия имён и слот по умолчанию, одна константа на адаптер: `VueProfile`, `ReactProfile`, `SolidProfile`, `SvelteProfile`, `WebcProfile`, `AngularProfile`.
  
  На монтирование адаптер берёт связку `bindComponent(adapter, profile)`: стартовое состояние, подписки на триггеры, проброс событий с дедупликацией, чтение и запись пропсов с guard'ом, спред несъеденных пропсов. Своих циклов по аксессору у адаптеров больше нет — остаётся только то, куда писать значение и как отдать событие.
  
  Удалены: `TDescriptorInspector` из `@soxa-ui/accessor`; `createInspectorFactory`, `collectEventBindings`, `collectForwardProps` из `@soxa-ui/setup`; `createInspector`, `useSyncProps`, `useSyncEvents` и их опции из адаптеров, а также `bindOutput`/`bindInput`/`buildInitialState`/`bindEvents` из Angular. Как обновиться: вместо `createInspector(descriptor).getExportEvents()` — `surfaceOf(descriptor, VueProfile).exportEvents`, вместо `getExportProps()` — `.exportProps`.
- f7b4492: Spinner удалён: компонент Vue и React, класс ядра `TSpinner` с типами `ISpinner`, `ISpinnerProps` и `TSpinnerEvents`, плагин `TSpinnerLayoutPlugin`, дескрипторы `SpinnerDescriptor` и `SpinnerLayoutPluginDescriptor` и стили Spinner в теме oren. Замена — ProgressSpinner с `indeterminate`: строчное кольцо той же шкалы размеров, которое бежит по кругу, пока доля неизвестна. Как обновиться: `<Spinner />` → `<ProgressSpinner indeterminate />`, имя — тем же `aria_label`. Отличия: роль кольца — `progressbar` без `aria-valuenow`, а не живая область `status`; содержимого у кольца нет — текст ставят рядом и связывают через `aria_labelledBy`; толщину кольца задаёт тема долей диаметра, пропа `borderWidth` и переменной толщины кольца больше нет. В React ProgressSpinner пока нет — его перенос идёт отдельно.
- 496dc31: `ref` потребителя получает корень компонента — узел, на который ложатся его класс и атрибуты, — у всех компонентов React, Solid и Svelte, у полей тоже: у Input, CheckBox, Switch и RadioGroup.Item это корень, а не `<input>` (до поля — `ref.querySelector('input')`), у таблицы React — её окно `div.so-table__viewport`. React: `ref` — проп компонентов (`Ref<Element>`), его отдают так же, как узлу: функции — узлом, при снятии — её очисткой или `null`, объекту — в `current`; сменившийся между рендерами `ref` корень к `TElementPlugin` не перепривязывает. Ломающее для Solid: `ref` поля раньше получал `<input>`, теперь — корень поля; тип `TFieldRef` и второй аргумент `fieldText` удалены. Svelte: новый связываемый проп `ref` — `<Button bind:ref={button} />` (`bind:this` у компонента даёт экземпляр, а не узел), при снятии — `null`; setup-функции компонентов принимают третьим аргументом приёмник корня.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
- 3205414: Solid: подпись Label и поля Input, CheckBox и Switch — по разметке Vue, с тестами один к одному с React. Label рисует корень по `tag` (по умолчанию `label`): контрол — содержимым, текст — слотом `content` или пропом `text`; пустой текст не рисуется, и обёртку прячет `:empty` темы. У поля атрибуты потребителя делятся, как во Vue и React: класс и стиль — корню, всё остальное — `<input>` поверх его `aria`, туда же и `ref` потребителя (`toRootForward`, `toControlAttrs`). Тип атрибутов поля — `TFieldAttributes`: атрибуты `<input>` без того, что поле ведёт само (`checked`, `prop:indeterminate`, `readOnly`); `UseDomProps` и `TDomAttributes` принимают тип атрибутов последним параметром. Отметку Solid пишет свойством узла, «выбрано частично» — явно свойством (`prop:indeterminate`): его тип адаптер дописывает в `JSX.ExplicitProperties` Solid. Текст поля — свой `ref` поля `fieldText`: в узел, только когда текст разошёлся с узлом, поэтому набор не переписывает поле и браузер не перестаёт проверять `minlength`; на сервере текст уходит атрибутом `value`. Отметка CheckBox без слота — `<svg>` иконки по роли (`roleIcon`). Кнопка очистки Input берёт имя из локали поддерева: у Solid это первый компонент со строками.
- 5efeeb0: React, Solid и Svelte: перерисовка родителя больше не откатывает состояние компонента к разметке. Раньше в ядро заново писались все переданные пропсы, и смена любого из них возвращала к значению из разметки то, что с тех пор поменяли сам компонент или код через инстанс: текст, выставленный через инстанс, пропадал от смены `disabled`. Теперь пишется только проп, сменившийся с прошлого рендера, — как во Vue, Angular и Web Components.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 5d2d8a9: Слой setup собирает компонент по одному составу. Состав монтирования (плагины дескриптора плюс регистрации приложения) считается один раз, и по нему строятся набор плагинов, units аксессора и начальные значения плагинных пропсов — раньше каждый выяснял состав сам, и плагины реестра доходили только до набора.
  
  Дескриптор стал описанием типа и только им: методы `createBundle` и `createAccessor` с него сняты (их звала одна сборка), а сам он строится один раз на тип — `defineDescriptor` кэширует фабрику, и монтирование больше не пересобирает всю цепочку до `EntityContribution`.
  
  Расширения `TPluginsBindingExtension` и `TPluginPropsExtension` удалены вместе с `resolveDefaultExtensions` и полем `defaultExtensions` в конфиге контекста. Начальные значения плагинных пропсов пишет сборка, а корневой узел привязывается методом контекста `adapter.bindElement(el)` — у компонента без `TElementPlugin` он ничего не делает. Как обновиться: `adapter.get(TPluginsBindingExtension)?.bindElement(el)` заменить на `adapter.bindElement(el)`, `{ defaultExtensions: [] }` из вызовов `createAdapterContext` убрать.
  
  `IAdapterContextOptions` и `IAdapterContextConfig` теперь экспортируются из `@soxa-ui/setup`.
- a18ffd0: Пакет Solid отдаёт исходник компонентов с JSX под условием `solid` в `exports`: плагин Solid приложения (`vite-plugin-solid`, SolidStart) компилирует их сам — под сервер, браузер и гидратацию. Раньше пакет уезжал собранным только под браузер, и серверный рендер приложения падал на первом же компоненте. Сборщик без плагина Solid по-прежнему получает бандл под браузер — условие `default`.
- c37e233: Кнопки, которые компоненты рисуют сами, — очистка полей, крестики окна, панели, поповера, табов и тегов, листание календаря и ленты, кнопки DatePicker, строка таба, заголовок секции Accordion, сортировка колонки таблицы — получили `type="button"`. У `<button>` без `type` тип `submit`: в форме клик по очистке поля отправлял форму, а Enter в поле нажимал первую такую кнопку, и поле очищалось вместо отправки. Button, который ставит приложение, остаётся кнопкой отправки, как нативная `<button>`. В React, Solid и Svelte пропсы Button несут атрибуты кнопки: `type`, `form`, `name` и `value` типизированы.
- 5659d22: Инициализация компонента одинакова во всех адаптерах и идёт теми же путями, что и изменения.
  
  Пропсы применяет сборка компонента. Внешний `ctrl` и плагины получают через сеттер всё, что отличается от объявленного умолчания; свой инстанс получает пропсы ядра конструктором, и второй раз они не пишутся. Адаптеры стартовых значений больше не пишут, поэтому коллекция с пропом `items` во Vue при монтировании больше не очищается и не заполняется повторно. Проп, равный умолчанию, внешний `ctrl` не трогает. Пересборка контекста в React (StrictMode, `<Activity>`) — такое же монтирование: разметка снова применяется к внешнему `ctrl`.
  
  Значения из ядра фреймворк получает подпиской на связку. `binding.subscribe(listener)` сразу отдаёт каждое свойство тем же вызовом, что и срабатывание триггера, дальше — изменения; `binding.getSnapshot()` отдаёт неизменяемый снимок (React рисует по нему через `useSyncExternalStore`). Порядок «подписка, потом чтение» держит связка, поэтому изменение ядра между рендером и подпиской больше не теряется в React и Svelte. `update:<prop>` для `v-model` объявляет профиль Vue (`IAdapterProfile.model`) и эмитит связка в `bindEvents`.
  
  Как обновиться, если вы пишете свой адаптер: `binding.state()` и `binding.bindOutput(write)` заменены на `binding.subscribe(write)` (он же отдаёт начальное состояние) и `binding.getSnapshot()`; у `bindComponent` больше нет третьего параметра `previous`.
- 9aa7f6f: Один файл на компонент: контракт объявляется прямо в дескрипторе. Отдельных файлов contribution больше нет — их читал только свой дескриптор, а компонент приходилось собирать по двум местам. Дескриптор теперь целиком описывает компонент: наследование, пропсы, события, слоты и плагины. Плагины устроены так же — `definePlugin({ ctor, namespace, contribution: { … } })`.
  
  Из `@soxa-ui/setup` удалены фабрики `*Contribution` (`ButtonContribution` и ещё 53) и `LIST_PROPS`. `defineType`, `TPropType` и `TEmptySlotScope` переехали в `define` и экспортируются оттуда.
  
  Служебные пропсы адаптера — `TAdapterProps` (`ctrl`, `embedded`), пропсы компонента из дескриптора — `DescriptorComponentProps`, колбэк-события — `DescriptorCallbackEvents`. Раньше то же было объявлено в каждом адаптере отдельно (`TBaseComponentProps` во Vue, `TReactComponentProps`, `TSolidComponentProps`, `TSvelteComponentProps` — удалены).
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- c9aaade: Адаптеры Vue, React, Solid и Web Components уезжают собранным ESM с декларациями в dist, а не исходниками
- 87a7a4d: Выходы плагинов — защищённые пропсы, которые плагин вычисляет, а разметка только читает (`dismiss_ownerAttribute`, `layout_styles`, `keyboard_highlightedUid`, `editable_query`, `listItem_highlighted`), — типизирует дескриптор. Тип выхода — четвёртый аргумент `definePlugin`, `Pick` геттера класса плагина; выходы плагинов дескриптора собирает `DescriptorPluginOutputs<typeof XDescriptor>`. Контекст адаптера несёт их вторым параметром, `IAdapterContext<TInstance, TOutputs>`: его выводит `createAdapterContext` из состава плагинов дескриптора. `state` у `useAdapter` React, Solid и Svelte теперь типа `TAdapterState<TInstance, TOutputs>` — свойства инстанса и выходы; во Vue выходы передаются третьим аргументом `useAdapter`, и шаблоны Select, Frame, Icon, Spinner и Skeleton читают их с типом геттера плагина. Удалён `TDismissPluginProps`: он описывал `dismiss_ownerAttribute` рукой и с плагином не сверялся. Как обновиться: вместо `TDismissPluginProps` взять `DescriptorPluginOutputs<typeof SelectDescriptor>` (или дескриптора, в состав которого входит `DismissPluginDescriptor`).
- b21cb75: Рантайм адаптера принимает собранный контекст — `adapter.attach()` при инициализации компонента (Angular — в `ngOnInit`, Web Components — в `connectedCallback`), парой к `destroy()`.
- 5a861b2: Solid: Icon, Frame, ProgressSpinner и Skeleton. Корень компонента рисуется по `tag`: имя элемента или компонент Solid — атрибуты корня, `ref` и содержимое он получает пропсами и кладёт на свой корень; иконка по роли — `roleIcon(role)`, `<svg>` иконки из пакета иконок. Frame уводит панель в цель `target` (`Teleport` адаптера — поверх `Portal` Solid, с контекстами места), на сервере её нет, с `contained` она на месте — и на сервере. `LocaleProvider` — локаль поддерева, смена пропа доходит до компонентов без перемонтирования. Id монтирования — от `createUniqueId()`: `id` частей совпадают на сервере и при гидратации. Атрибуты потребителя ложатся на корень поверх наборов ядра, как во Vue и React: `tabindex`, `role` и `dir` снаружи перекрывают поставленные ядром. Стиль корня ставится по свойствам и не стирает того, что плагины пишут в узел сами. Тип пропсов вычитает из атрибутов DOM ещё защищённые имена, слоты и события: слот `title` окна больше не сужается до строки атрибута.
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
