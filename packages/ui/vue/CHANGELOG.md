# @soxa-ui/vue

## 0.6.0

### Patch Changes

- 815c2c6: Add shared modal backdrops with theme-defined views. Oren supports transparent, dimmed, and blurred backdrops for Dialog, AlertDialog, and Drawer.
  
  Custom themes must replace .so-dialog__backdrop, .so-alert-dialog__backdrop, and .so-drawer__backdrop with .so-backdrop. For panel-specific styles, match the following panel with :has(+ .so-dialog), :has(+ .so-alert-dialog), or :has(+ .so-drawer). See [upgrading to 0.6.0](https://github.com/youra-h/soxa-ui/blob/v0.6.0/docs/upgrade/0.6.0.md).
- Updated dependencies [815c2c6]
- Updated dependencies [2e8653a]
  - @soxa-ui/core@0.6.0
  - @soxa-ui/setup@0.6.0
  - @soxa-ui/plugins@0.6.0

## 0.5.0

### Patch Changes

- dd6ea64: Prepared (`initial`) Tabs and Tags keep their mount-local ARIA only until the framework accepts the mount, then write tab links and close button names into the item models as an ordinary mount does. On the client, Vue, Solid, Svelte, Angular and Web Components read the state directly: 1000 prepared tabs now hold 0.3–0.4 MiB more than the `items` path instead of 1.2–1.9 MiB (React: 1.1 MiB instead of 1.6 MiB). Every component with localized button names also stops keeping an unused listener set per mount.

  Breaking for code that wires prepared mounts by hand (components, props, events, classes and `data-*` are unchanged):

  - `getSnapshot()` and `subscribe()` are removed from `TNamesPlugin` and its subclasses, from `TTabsItemIdsPlugin` and from `TTabsContentBindingExtension`; `TTabsItemIdsPlugin.initial` and `TCollectionInitialPartPlugin.aria` are removed too. Before acceptance these values are in the mount's patches: read `TPluginMount.patches` (new, with `TPluginMount.patch()`); after acceptance read the item model (`aria`, `closeAria`).
  - `TCollectionAriaState` now takes `(state, mount)` instead of an options object, and the `ICollectionAriaLink` and `ICollectionAriaStateOptions` types are removed. Use `collectionInitialState(context, state)`, which returns the plain state once the mount is accepted.

  Consumer upgrade instructions: docs/upgrade/0.5.0.md.

  Also update custom collection integrations: replace preparation owner accept/release and transactions.rollbackOwner with the returned transaction handle; call prepare(options) and transactions.begin(options) without item/owner, use ICollectionTransactionOptions instead of removed IPreparationOptions, drop the ICollectionTransactions type parameter, and provide readonly revision in custom drivers. Replace removed IPluginMountOptions with the relevant context type; TPluginMount.defer now returns void. collectionInitialOwnerOptions no longer takes a descriptor, and custom TItemGroupPart implementations must provide visible.
- 9688944: Faster Tabs and Tags on large collections, especially declarative items: mounting 1000 markup items is 2–4 times faster in every adapter and on the server.

  - A collection item's `change:order` is emitted only when its own position changed; appending an item no longer notifies every sibling. Item order is memoized per storage write instead of copying the collection on every read.
  - Activation and selection update `data-selected` only on the items whose state changed.
  - The active tab indicator is measured at most once a frame. Unmounting 1000 declarative tabs in Solid took over 20 seconds and now takes about 0.2 seconds.
  - Angular detaches every binding when the application starts tearing down, so server requests no longer pay for items leaving their collection one by one. Angular, Solid, Svelte and Web Components stop listening to the state on `detach`.
  - Prepared (`initial`) mounts share one acceptance gate per bundle instead of copying every plugin definition per item.
- 1a52ea6: Add `Select.Separator` and `ListBox.Separator` to separate groups written in markup. A separator hides when filtering leaves no shown content on one of its sides, including adjacent separators and list edges.

  Record the manual separator emission sites in the existing theme class contract.
- Updated dependencies [dd6ea64]
- Updated dependencies [9688944]
- Updated dependencies [1a52ea6]
- Updated dependencies [2598c1b]
- Updated dependencies [5b88716]
  - @soxa-ui/core@0.5.0
  - @soxa-ui/plugins@0.5.0
  - @soxa-ui/setup@0.5.0

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

- 8b9487f: Refresh data and ARIA attributes after Vue hydration so statically generated Calendar pages mark the current day in the configured time zone without replacing server-rendered nodes.
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
- 6dfea13: Fix focus for click-only screen reader activation in Select and Menu.
  
  Preserve the first typed characters when opening and highlighting an editable Select.
  
  Describe all selected tags from a multiple Select without replacing application hints.
- 1bb3ea8: Add CodeBlock with accessible code display, line numbers, highlighted lines, clipboard feedback and snippets powered by Tabs across all adapters.
- de65c13: Preserve valid list semantics for urgent toast notifications while retaining the alert role on the existing card and separate text-only announcements across all framework adapters.
- a491c3f: README: the stylesheets of the theme per component, next to the whole one; Angular — the page of the six components fits the budget of a new project with them.
- 85e6e95: Vue: the props of the components are type-checked in the templates of a Nuxt application too. The closed instance kept `$props` only while the application had no global with a pattern key, and Nuxt types a plugin that provides nothing with `$${string}`.
- dbb1a08: Document named Vue v-model bindings.
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
- 85e6e95: Vue: the props of the components are type-checked in the templates of a Nuxt application too. The closed instance kept `$props` only while the application had no global with a pattern key, and Nuxt types a plugin that provides nothing with `$${string}`.
- dbb1a08: Document named Vue v-model bindings.
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

- 26cc7e3: Same events on every platform, found by the new parity run. Angular: an output of an event with several arguments now emits their tuple, like `detail` in Web Components — `(soChangeActivation)` gives `[item, previous]`, `(soChangeSelection)` gives `[selected, changed]`; read the first element where you used `$event` directly. Vue: the consumer no longer hears a component's teardown (`v-model:items` of a `v-if`-ed owner is no longer emptied), and Icon with a glyph component in `tag` hands its node to the plugins. Web Components: a removed element sends no events. Svelte: the markup items joining while mounting reach `onItemAdded` and the other handlers. React: typing after a choice in Select goes after the chosen text. Markup groups (`Menu.Group`, `ListBox.Group`, `Select.Group`) have their label from their first item on React.
- a20cdd5: A component's own assembly no longer sends events: on Vue, Svelte, Solid and Web Components a context listens to its events after it is accepted, and a collection binds its facades before the component, as React and Angular do. What the facade writes into the component while mounting is the starting state: Calendar no longer sends `change:months` (and Vue `update:months`) with the months it shows on mount, Table no longer sends `change:dataset`; read the starting value from the instance (`ctrl.months`) instead of waiting for the first event. Svelte and Solid adapter API: `useCollectionAdapter` no longer takes the rest of the attributes — `joinBindings` chains them from the component's rest.
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

- 9343ca3: Vue: state no longer keeps a `shallowRef` per property — Vue tracks only what the markup reads, and collection facades no longer create an unbound root ref. Breaking for custom components on `useAdapter`: the binding is a live view, spreading it copies the values once. Return it from `setup()` as is, join a component with its facades via `joinBindings(owner, ...facades)`, add own values with `extendBinding(binding, values)`.
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
- a69e58d: Switch во Vue меняет содержимое ручки (слоты `on`/`off`) сразу, как в остальных адаптерах
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

- 84f4ad3: Select.Item: выбор опции — клик по строке, как у ListBox, Menu и Tabs: клик потребителя по опции приходит после выбора (раньше — до него), и stopPropagation в нём выбор больше не отменяет. Кто читал в обработчике прежнее значение — берите его из события смены значения (oldValue); отменить выбор — подпиской на item:select:before.

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.
- 0091f1d: Иконка по роли — `roleIcon` вместо `useIcon`, как в React, Solid, Svelte и Web Components: это не composable, его зовут где угодно. Как обновиться: `useIcon('close')` → `roleIcon('close')`.
- 4fc4efa: DragAndDrop сообщает о перестановке перетаскиванием: `move:before` (отменить — `preventDefault()`) и `move` с `engine`, `item`, `oldIndex`, `newIndex`. Выключенный элемент не перетаскивается, коллекции внутри элементов другой коллекции перестановку не наследуют. Ломающее: `TDragPlugin.activate` принимает вторым аргументом обёртку, `DRAG_CONTEXT_ELEVATOR` перестановку больше не включает — коллекции оборачивают в `DragAndDrop`.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.
- 7137eaa: Группы из разметки (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`) входят в группировку коллекции, и `sections` описывают их с подписью. Элемент без группы больше не уходит в конец, а остаётся на своём месте среди незаявленных групп; чтобы вернуть прежний порядок, заявите группы в `groups`.
- fba7c84: Подменю без своего варианта берёт вариант меню над ним; `IMenuOwner.variant` заменён на `panelVariant`.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- 89db4ae: Menu: переключатели — `Menu.RadioGroup` со своим значением (`v-model:value`) и `Menu.RadioItem` внутри неё. В группе отмечен один переключатель: нажатие отмечает его и меню не закрывает, значение группы и отметка связаны в обе стороны, а группу переключатель берёт по месту в разметке. В ядре — `TMenuRadioGroup`, `TMenuRadioItem` и нажатие `checkItem` у расширения меню.
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- b3cb2f3: Menu: пункт `items` с вложенным `items` становится подменю на любом уровне; новые слоты `item-header`, `item-arrow-icon`, `item-content`
- 8d55e75: Textarea: скринридер читает счётчик символов вместе с полем
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
- 7872e77: Slider в поле формы `Field` связан с подписью, подсказкой и ошибкой. С одной ручкой подпись называет её поле (`for`): клик по подписи ставит на него фокус, справка и `aria-invalid` — на нём же. С несколькими ручками корень ползунка — группа (`role="group"`): её называют подпись поля и `aria_label`, к ней ведёт справка, а на каждой ручке — своё имя из `thumbLabels` и `aria-invalid`. Что сломалось: у ползунка с несколькими ручками `aria_label` называет группу, а не каждую ручку, — и в поле, и вне его. Как обновиться: имена ручкам задавайте `thumbLabels`. В ядре набор поля ручки отдаётся целиком: своя разметка поверх `TSlider` кладёт на поле только `thumb.aria` (без `aria` ползунка), а на корень — новый `rootAria`. `TSlider.labelable` с несколькими ручками — `false`; новое событие `change:labelable` у контролов — элемент с `aria` стал или перестал быть labelable.
- 2e3950e: ListBox и Tabs: атрибуты, которые приложение пишет на компонент, кроме класса и стиля, — `aria-*`, `id`, `tabindex`, `data-*`, в Vue, React, Solid и Svelte и обработчики — теперь на узле списка (`[role=listbox]`, `[role=tablist]`), а не на корне; `ref` — по-прежнему корень. Angular: `<so-list-box>` и `<so-tabs>` вместо `<div so-list-box>` и `<div so-tabs>`.
- 8e2e31e: ListBox и Select: группы пунктов из данных, как у Menu (`_: { group }`, `groupBy`, `groups`), части `ListBox.Group` и `Select.Group`. `TMenuGroupIdsPlugin` заменён общим плагином имени группы `TItemGroupIdsPlugin` (описание — `ItemGroupIdsPluginDescriptor` вместо `MenuGroupIdsPluginDescriptor`), типы `IMenuGroup`, `IMenuGroupProps`, `TMenuGroupEvents` — общими `IItemGroup`, `IItemGroupProps`, `TItemGroupEvents` — замените импорт. Рисование отдаёт разметке ListBox и Select секции: в поверхности компонента `drawnSections` вместо `drawn` (событие `change:drawnSections`). Список с группами окно `Virtual` не рисует.
- 1411d88: Тост: вид сообщения `type` (`info`, `success`, `warning`, `error`) со значком вида и `loading` — кольцо на месте значка; ожидающий тост сам не закрывается. `variant` и `size` у тоста сняты: вместо `show({ variant: 'negative' })` пишите `show({ type: 'error' })`. Новые роли иконок `notification`, `info`, `success`, `warning` — свой пакет иконок должен их закрыть.
- ce9316e: NumberInput (Vue): поле числа в формате локали — шаг и границы, ↑/↓, PageUp/PageDown, Home/End, кнопки «−» и «+» с удержанием, `formatOptions` (процент, валюта, единица), событие `commit`; `createScale` принимает открытые границы, а `shift` шкалы со значения вне сетки шагает к соседнему узлу со стороны сдвига (с 2,5 при шаге 1 — на 3 и на 2). Ломающее: роли иконок `minus` и `plus` — дополните ими свой пакет иконок; раздел локали `numberInput` — дополните им свой `TLocale` (`extendLocale` возьмёт из основы).
- a61b6a5: Ячейка таблицы отдаёт готовый текст значения (`cell.text`) — одним правилом во всех адаптерах. Удалён помощник `toText` адаптеров: вместо `toText(cell.value)` читайте `cell.text`, а в своём слоте `cell` — `toText(value)` из `@soxa-ui/core` (в шаблоне Angular — пайп `soText`, он теперь зовёт её).
- 6408875: ListBox объявляет себя списком для скринридера: корень — `role="listbox"` (в `mode="multiple"` — ещё `aria-multiselectable="true"`), пункт — `role="option"` вместо `role="button"`, плитка панели выбора месяца и года Calendar — тоже. Обновление: эти пункты ищите по роли `option`, а не `button`.
- 958c866: ListBox: список — свой узел `.so-list-box__list` внутри корня, шапка и подвал — вне его. Роль, имя и остановка Tab — на этом узле, и прокручивается тоже он: в пределе `maxRows` ровно строки, а шапка и подвал при прокрутке стоят на месте. Стили фокуса и прокрутки и селекторы по `role` и `tabindex` корня ListBox переносите на него. `focused = true` из кода фокус в список пока не ставит — как у Input и Tabs, корень которых фокус не держит.

### Patch Changes

- b6881dd: README: несколько приложений Vue на одной странице — каждому свой `app.config.idPrefix`.
- 7731c71: Menu: группы пунктов из данных — ключ группы в метке `_: { group }` или функцией `groupBy`, порядок и подписи — `groups`; меню рисует группы с подписью и разделителем, и стрелки ходят в том же порядке. Расширение коллекции `group` отдаёт секции — `engine.extensions.group.sections`
- 5f4c58a: Menu: контекстное меню — режим `openOn: 'contextmenu'` (`open-on="contextmenu"` во Vue). Меню открывают правая кнопка, долгое касание, клавиша контекстного меню и Shift+F10 над областью в слоте `trigger`, и панель встаёт у точки вызова (`point`); у области нет связки кнопки — `triggerAria` пуст. У Frame новый вход `anchor_point`: точка в координатах окна вместо якоря, главнее него, пока задана.
- f06e5f9: Меню: пункт с панелью `Menu.PopoverItem` (`MenuPopoverItem`) — строка открывает сбоку панель с любым содержимым, например календарём: нажатием, Enter, пробелом или → (в RTL ←); Escape возвращает к пункту, Tab из панели закрывает меню. Открыта одна панель на меню — подменю или пункта с панелью, — и связку строки с панелью у обоих пишет один плагин `TMenuPopupIdsPlugin`.
- 4206633: Tabs: корень набора несёт `data-disabled`, как ListBox и Table: по нему тема гасит выключенный набор вместе с панелями.
- 47e560d: Textarea: новый компонент (Vue) — многострочное поле с контрактом Input и подписью от `Field`: `rows`, авторост `autoresize` до `maxRows`, счётчик символов `counter` с пределом `maxlength`. Новая строка локали `textarea.counter`: свою полную `TLocale` дополните ею или соберите через `extendLocale`.
- e888c8f: Минимальные версии фреймворков ниже: Vue 3.5.21 вместо 3.5.32, Solid 1.9.10 вместо 1.9.17, Angular 21.1 вместо 22.1.5.
- e977046: Меню: подменю — `Menu.Submenu` (`MenuSubmenu`). Пункт открывает сбоку своё меню наведением, стрелкой к концу строки, Enter и пробелом; путь указателя наискосок к открытой панели её не закрывает; стрелка к началу строки и Escape закрывают один уровень, а выбор пункта и Tab — всё меню, и `choose` приходит каждому меню над пунктом. Наведение в панели меню — теперь плагин `TMenuHoverPlugin`: `TMenuPointerPlugin` только открывает меню.
- 4429cbc: DatePicker: проп `validate` — проверка набора в полях, как у DateInput: «00» у дня и месяца не записывается, часть ждёт следующей цифры. DatePicker отдаёт его полю одной даты и обоим концам диапазона; по умолчанию выключен
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

- f535f0d: Table: ширины колонок без своей ширины раскладывает ядро — в границах колонки (`minWidth`, `maxWidth`) и сразу, с монтирования, а не только когда колонку тронет ручка. Колонка с границами 120–360 больше не встаёт на широком экране в 480, и первое действие ручки двигает ширину на шаг, без рывка к границе. Новый проп таблицы `columnFit`: `auto` (по умолчанию) — гибкие колонки растут до `maxWidth` во всю ширину места, `none` — стоят в ширине по умолчанию (160 px в своих границах), `contain` — ровно заполняют место, сжимаясь до `minWidth`. Место — ширину окна таблицы без колонки выбора — мерит новый плагин `TTableLayoutPlugin` (`notifySpace` у расширения `columns`); колонки не влезли — таблица прокручивается вбок в своём окне по `data-overflow`, а с закреплённой шапкой — в контейнере потребителя. Ломающее: во Vue таблица рисуется в окне `div.so-table__viewport`, и атрибуты потребителя (`class`, `style`, `data-*`) достаются окну, а не `table` — роль, классы ядра и наборы по-прежнему у `table`; у колонки нет `notifyWidth` — ширину гибкой колонки пишет раскладка (`layoutWidth`), `grab()` берёт ширину из итога колонки и аргумента не принимает; `data-sized` значит «ширина известна» — своя или раскладки. Контекст сдвига закреплённой шапки в теле Dialog, Drawer и содержимом Popover в oren — на окне таблицы.
- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
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
- eae46e4: Table во Vue: таблица по паттернам APG Table и Sortable Table — колонки данными (`columns`), сортировка кнопкой в заголовке колонки, выбор строк колонкой чекбоксов, слоты `header`, `cell` и `empty`, стили темы oren. Колонке — `rowHeader` (её ячейки называют строки, `th scope="row"`) и `widthStyle`, строке — набор `headerAria`, таблице — `selectAllLabel`. Чекбоксы колонки выбора держит таблица: `selectAll` фасада и `checkBoxOf(row)` расширения `table`; их отметку она пишет от выбора, а клик по ним выполняет командой выбора. Ломающее: режим выбора строк таблицы по умолчанию — `none`, колонки выбора нет, пока режим не задан; у `TTableShownSelection` новое значение `empty` — выбирать нечего (строк нет, все выключены или выключена таблица), раньше на его месте было `none`; новая роль иконки `arrowUpward` — свой пакет иконок дополните ею. CheckBox и Switch возвращают поле к модели, когда запись отметки отменили в `change:value:before`.
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 19d58ac: Slider: подсказка со значением у ручки — проп `tooltip`: `none` (по умолчанию) — подсказки нет, `auto` — видна, пока ручку наводят, держат, тянут или её поле в фокусе с клавиатуры, `always` — видна всегда. Подсказка едет за ручкой: у горизонтального ползунка стоит над ней, у вертикального — со стороны начала строки, и в `always` горизонтальный держит под неё место. Содержимое — слот `thumb`, по умолчанию значение ручки; от скринридера подсказка скрыта — значение объявляет поле. Ломающее: слот `thumb` теперь — содержимое подсказки и без `tooltip` не рисуется; кто клал в него своё, задаёт `tooltip`. Тема oren рисует подсказку плашкой Tooltip (`.so-slider__tooltip`, режим — модификатором `--tooltip-<режим>`); вид Tooltip не изменился.
- 268439c: id в разметке строят плагины от id монтирования, ядро их не строит. Удалены IComponentView.idBase, опция конструктора idBase и второй аргумент конструктора компонентов ядра (IComponentOptions), TFactoryExtension.bindIdBase. Адаптер передаёт useId опцией контекста mountId, плагины строят id через ctx.createId(part). Части без экземпляра — живые наборы ядра: triggerAria (Popover, Tooltip), titleAria, bodyAria, listAria у Select вместо list_aria фасада, contentAria у Accordion.Item вместо content_aria. Поле Input, CheckBox, Switch без своего id — без атрибута.
- 6015ad1: Vue: `ref` на компонент отдаёт корень — `$el` — и только свойства Vue. У Frame, Dialog и Drawer `$el` был якорем телепорта, узлом-комментарием, и при `contained` тоже; теперь это панель, а пока она не отрисована — `null`. Ломающее: экземпляр из `ref` закрыт у всех компонентов и у `LocaleProvider` — привязки шаблона (`ctrl`, состояние, выходы плагинов) и пропсы через него не видны ни в рантайме (`undefined`), ни в типе (`InstanceType<typeof Button>['ctrl']` — ошибка). Как обновиться: экземпляр ядра создайте сами и передайте пропом `ctrl` — он и есть поверхность управления; значения пропсов — `$props`, узел корня — `$el`. В адаптере новые `useExpose()` (опция `expose` компонента), `exposeRoot()` (корень компонента, у которого корень шаблона — телепорт) и тип `TClosedComponent` (тип компонента с закрытым экземпляром).
- e376e9c: Кнопка очистки — часть поля. Input и DateInput получили `clearable`, `clearLabel`, имя кнопки `clearAria`, команду `clear` и слот `clear` — общая база ядра `TField` и дескриптор `FieldDescriptor`. Кнопка стоит первой в слоте у конца поля, а в теме oren она квадрат со стороной в строку слота, как кнопка календаря DatePicker, а не низкая и широкая. Select свою кнопку больше не рисует: `clearable` и `clearLabel` он отдаёт полю, а выбор снимает по событию `clear` поля. Ломает: у Select сняты `clearAria` (имя кнопки — `select.field.clearAria`) и модификатор `so-select--clearable` (теперь `so-input--clearable` у поля), у `TSelectCollectionFacade` — `clear`: очищайте поле, `select.field.clear()`. Класс кнопки `.so-select__clear` стал `.so-input__clear`, признак детали `embedded` — `input.clear` вместо `select.clear`.
- bf6a08c: Плагин объявляется один раз, константой: `XPluginDescriptor` — определение, а не фабрика. Вызовы `XPluginDescriptor()` заменить на `XPluginDescriptor`, опции установки — `XPluginDescriptor.with(options)`; у `definePlugin` поля `options` больше нет. У дескриптора снят `getSlots()` — слоты читаются полем `slots`; декларации дескриптора `readonly` и заморожены.
- 4785689: Таблица: сортирует маленькая кнопка рядом с подписью в заголовке колонки `sortable`, а не весь заголовок — нажатие по ячейке шапки больше не сортирует. Своё действие по заголовку (меню, триггер Popover) ставят контролом в подпись — слот `header`. Имя кнопке даёт локаль: новая строка `table.sort` с подписью колонки на месте `{name}` («Sort by Имя»); локаль, написанную целиком своим объектом `TLocale`, дополните ею, `extendLocale` возьмёт её из основы. Колонка ядра: `toggleSort()` — просьба отсортировать (`sort:request`, её выполняет расширение сортировки коллекции строк), набор `contentAria` переименован в `textAria`, новый набор кнопки — `sortAria`. Разметка заголовка: `.so-table-column__content` — ряд из подписи `.so-table-column__text` (у всех колонок, на неё ссылается `aria-labelledby` заголовка) и кнопки `.so-table-column__sort` со стрелкой `.so-table-column__sort-icon` в её области текста; кнопку рисует `Table.Column`, а не таблица. Тема oren: кнопка — квадрат вокруг стрелки в кегль заголовка, стрелка неотсортированной колонки проступает при наведении на заголовок и фокусе кнопки, сортируемый заголовок больше не подсвечивается.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- 7cea82e: Из типов пропсов компонентов снят `plugins`: такого пропа нет, готовый бандл снаружи не принимается, доступ к плагинам даёт событие `bundle:create`. React, Solid и Svelte больше не поглощают `plugins`: переданный, он уходит в атрибуты корня, как любой необъявленный проп.
- b37a7a1: Значения оформления объявляет тема. `variant`, `view` у Button, Tabs, ListBox, Accordion, Tags и CheckBox, `shape` и `animation` у Skeleton больше не union-типы ядра: тип значения — ключи пустого реестра (`IComponentVariants`, `IButtonViews`, `ITabsViews`, `ICheckBoxViews`, `ISkeletonShapes`, `ISkeletonAnimations`), который дополняет тема. Умолчаний у этих свойств нет: без значения модификатора нет, и блок выглядит видом темы по умолчанию. Модификаторы получили префиксы: `so-button--view-plain`, `so-button--variant-accent`, `so-skeleton--shape-circle`, `so-skeleton--animation-wave`. Флаг `plain` у CheckBox заменён свойством `view`. Разметка компонентов больше не передаёт вложенным частям значения темы: крестики, строка таба и строки списков красятся темой по контексту. Как обновиться: подключить тему (`import "@soxa-ui/theme-oren"`), чтобы её `index.d.ts` дополнил реестры; своя тема объявляет значения через `declare module "@soxa-ui/core"`; стили по старым модификаторам (`--a-*`, `--accent`, `--rounded`) переписать на префиксные; вместо `plain` у CheckBox задать `view="plain"`.
- b3dccfc: Жест «смахнуть, чтобы закрыть» стал общей возможностью слоёв: кроме выезжающей панели, его получил Popover (проп `swipe`: `none` по умолчанию, `handle`, `panel`). Панель у триггера смахивают от него — вниз под ним и вверх над ним, панель внутри контейнера — вниз; полоса жеста стоит у края со стороны триггера. Контракт ядра — `ISwipeable` (`swipe`, `swipeSide`, `swiping`, `beginSwipe`, `endSwipe`) и тип-гард `isSwipeable`. Ломающее: тип `TDrawerSwipe` заменён общим `TSwipe`, плагин `TDrawerSwipePlugin` — `TSwipePlugin` (`@soxa-ui/plugins`), определение `DrawerSwipePluginDescriptor` — `SwipePluginDescriptor` (`@soxa-ui/setup`), а сдвиг жеста плагин пишет переменной `--so-swipe-offset`: обновите импорты и свой CSS, если читали сдвиг.
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
- 0f36216: Корень CheckBox и Switch — `span` вместо `div` (`tag` по умолчанию), и разметка внутри — тоже `span`: контрол кладут в подпись `Label`, а внутри `label` HTML разрешает только строчную разметку. Корень теперь рисуется по `tag`, раньше проп ничего не менял. Своей теме нужно задать корню CheckBox и дорожке Switch `display`, иначе у строчного `span` их размер схлопнется. Коробка CheckBox и дорожка Switch скрыты от скринридера (`aria-hidden`): текст слотов иконок и `on`/`off` больше не входит в имя поля.
- de9a974: Таблица: ширину колонки меняет ручка у края заголовка — мышью, касанием, клавишами и жестом скринридера (`resizable` у колонки, в границах `minWidth` и `maxWidth`); итог приходит событием таблицы `column:resize` с колонкой и шириной, по нему приложение сохраняет настройку. `disabled` таблицы выключает ручки колонок. Разметка заголовка колонки сменилась: содержимое — в обёртке `.so-table-column__content`, рядом — полоса ручки `.so-table-column__resizer` с полем `input type="range"`, а заголовок назван обёрткой (`aria-labelledby`) и объявлен `scope="col"`. Стили по `.so-table-column > .so-table-column__sort` и `.so-table-column > .so-table-column__text` ведут теперь через обёртку. Ширина задана у всех показанных колонок — таблица шириной в их сумму, а не во всю ширину места.
- 5e219b7: Окно для длинных списков — обёртка `Virtual`: `<Virtual><ListBox :items /></Virtual>`, так же Table. Коллекции внутри рисуют только видимые элементы, на месте остальных — распорки той же высоты; код окна попадает в сборку приложения только вместе с обёрткой, выключатель — `enabled`. Ломающее: у Table убраны проп `virtual` и выход `bodyRows` — окно ставит обёртка `Virtual`, а тело рисуется по `drawn` (`entry.item` вместо `entry.row`); расширение `virtual` коллекции строк разделено на общее рисование коллекций `draw` (стратегия окна `TWindowStrategy`) и табличное `window` (`aria-rowcount`, `aria-rowindex`, `headRowAria`); `TTableVirtualPlugin` заменён общим `TVirtualPlugin`, переменная распорки — `--so-filler-height`. ListBox в окне: нарисованным — `aria-setsize` и `aria-posinset`, подсвеченный клавиатурой элемент окно держит в документе, предел `maxRows` считается по показанным элементам.
- 080cf7a: Поле формы Field (во Vue): подпись, подсказка и ошибка, связанные с контролом сами — `<Field label="Почта" helper="…" error="…" invalid position="start"><Input /></Field>`. Текст части — проп `label`, `helper`, `error`, своя разметка — слот `label-content`, `helper-content`, `error-content`; ошибка видна при `invalid` и встаёт на место подсказки. Подпись называет Input, Select, CheckBox, Switch и Rating своим `for` (без своего `id` контрол получает `id` поля), DateInput, DatePicker и RadioGroup — ссылкой `aria-labelledby`; справка — `aria-describedby` контрола, ошибка — `aria-invalid` и `data-invalid`. У `TValueControl` появилось свойство инстанса `invalid` (не проп): `data-invalid` и `aria-invalid` — только у невалидного; у DateInput итог — своё или вне границ, и `data-invalid="false"` у валидного поля даты больше не ставится. У `TControl` — `labelable`, у `TAriaPlugin` — второй вход `links`. Select кладёт свой набор `aria` на `<input>` комбобокса — `aria_label` Select теперь называет поле; корни Input, CheckBox и Switch во Vue несут `dataset`. Новая роль иконки `error` (в `@soxa-ui/icons-material` она есть): своему пакету иконок её нужно закрыть. Тема oren: стили Field — подпись сверху, в начале или в конце строки, общая колонка подписей формы через `--so-field-columns`, — вид ошибки контролов по их `data-invalid` и одна шкала подписи у Label, Field и текста радио. Ломающее: база кнопки очистки переименована — `TField` → `TClearable`, `IField`/`IFieldProps`/`TFieldEvents` → `IClearable`/`IClearableProps`/`TClearableEvents`, `FieldDescriptor` → `ClearableDescriptor`, `TFieldNamesPlugin` → `TClearableNamesPlugin`, `FieldNamesPluginDescriptor` → `ClearableNamesPluginDescriptor`; имя `TField` и `FieldDescriptor` теперь у поля формы. Раздел локали `field` прежний.
- b2288b1: Тип значения пропа задаёт только интерфейс пропсов ядра. `defineType<T>(ctor)` остаётся для scope слотов, а `type` пропа в дескрипторах теперь голый конструктор (`type: String`): так объявлены строковые пропы ListBox, Select, их частей и `anchor_placement` у Frame. `T` из обёртки у пропа не читал никто, и она могла молча разойтись с ядром.
  
  `useProps` (`@soxa-ui/vue`) больше не разворачивает `defineType` в `type` пропа: тип декларации уходит во Vue как есть. Как обновиться: в своём дескрипторе замените у пропа `type: defineType<X>(String)` на `type: String`, иначе Vue проверит обёртку как `Object` и будет предупреждать на каждое значение. Scope слотов не меняется: `scope: { text: defineType<string>(String) }`.
- b2d21dd: Tags с выбором (mode не none) — клавиатура по паттерну APG Listbox на roving tabindex: весь набор — одна остановка Tab (вход — на тег, где последним был фокус, иначе на первый выбранный, иначе на первый), ←/→ (в RTL наоборот) и ↑/↓ ведут по тегам по кругу, Home/End — к крайним, Delete и Backspace закрывают тег и переводят фокус к соседу. Клавиатуру даёт новый TTagsKeyboardPlugin, остановку Tab пишет TTagsExtension (tabStop, isEnabledTag, notifyFocus). Набор объявляет aria-orientation="horizontal", в multiple — aria-multiselectable. Кнопка закрытия с выбором выведена из порядка Tab. Без выбора строки тегов Tab больше не ловят (в том числе теги в поле Select), а крестик остаётся остановкой. Ломающее: TTagsItem.closeAria — теперь живой набор TAria, а не объект атрибутов; снимок — closeAria.valueOf(), об изменении сообщает событие change:closeAria.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- 85bcbed: Tooltip: новый компонент (Vue) — подсказка у элемента, паттерн Tooltip APG. Триггер кладут в слот `trigger`: ссылку на панель (`aria-describedby`) он получает в scope набором `triggerAria`, и стоит она всегда — закрытая панель только прячется. У панели `role="tooltip"`, фокус в неё не уходит. Пропсы: `open` (v-model), `placement` — сторона и выравнивание у триггера (по умолчанию `top` — по центру над ним), `openDelay` и `closeDelay` — задержка показа при наведении и скрытия после ухода курсора (400 и 150 мс). Показывают подсказку наведение (касание — нет) и фокус с клавиатуры — он сразу; курсор на самой подсказке её держит. Прячут уход курсора и фокуса, нажатие на триггер, нажатие мимо и Escape; Escape гасится `preventDefault`, и поповер под подсказкой остаётся открытым. На странице одна подсказка: открывшаяся закрывает прежнюю, а следующая за только что закрытой показывается без задержки. Поведение — новый `TTooltipTriggerPlugin`. Тема oren рисует подсказку плашкой в обратных цветах (`.so-tooltip`, `.so-tooltip__panel`, `.so-tooltip__content`).
- 45fce47: Слоты элементов коллекций пробрасываются целиком: владелец, который рисует элементы из `items`, отдаёт каждый слот элемента как `item-<слот>`, и scope проброса — scope слота элемента плюс сам элемент. `item` у ListBox, Select, Tags и Accordion получает `{ item, text, selected }`, у Tabs — `{ item, text, active }`, у RadioGroup — `{ item, active }`, у Calendar и DatePicker — `{ item, text }`; `header` у Table — `{ column, text, sortable }`. Новые слоты — `item-indicator-icon` у ListBox и Select, `item-close-icon` у Tabs и Tags, `item-leading-icon` и `item-trailing-icon` у Accordion: иконку подменяют одному элементу условием по `item.value`. У ListBox появился слот `empty` — пока элементов нет, как у Select. Подпись `RadioGroup.Item` получает `{ active }`. Стрелку Accordion, подменённую слотом, тема oren поворачивает так же, как стрелку по умолчанию: класс `so-accordion-item__arrow` переехал с иконки на обёртку слота, а пустую обёртку тема прячет. В React владелец отдаёт элементу функцию слота (`relaySlot`), а не готовый узел.
- dd5c935: Dialog появляется и исчезает плавно, вместе с подложкой: тема oren проявляет окно и подложку из прозрачных за 200 мс и гасит за 150 мс, а `display: none` откладывает до конца перехода. Переходит только прозрачность: окно не выезжает, разворот и размер меняются сразу, и при `prefers-reduced-motion` переход тот же. Открытость для темы — `data-open` у панели и у подложки (`backdropDataset`) — теперь пишет модальный слой (`TModalLayer`): у окна она появилась, у выезжающей панели осталась прежней.
- 9e0c6e7: Dialog: новый компонент (Vue) — модальное окно, паттерн Dialog (Modal) APG. Открытость — `visible` (`v-model:visible`); имя окну даёт слот `title` (`aria-labelledby`), содержимое — слот по умолчанию, ряд действий — `footer`. Место — `placement`: `center` (по умолчанию), `start`, `end`, `top`, `bottom`, стороны логические; размер — `width` и `height` (число — px, строка — CSS-значение, не заданы — размер темы); `maximized` разворачивает окно на весь экран, `maximizable` показывает кнопку разворота (имя `maximizeLabel`, состояние — `aria-pressed`). Крестик (`closable`, `closeLabel`), Escape и нажатие по подложке просят окно закрыться: событие `close:before` с причиной (`button`, `outside`, `escape`) отменяется `preventDefault()`, а `dismissible: false` оставляет только крестик; запись `visible` из кода и `v-model` события не шлют. `alert` делает окно предупреждением (`role="alertdialog"`, описание — содержимое). Фокус уходит в окно и возвращается при любом закрытии, Tab ходит по кругу, страница под окном спрятана от скринридера и не прокручивается, нажатие по подложке фокус не уносит. Иконки кнопки разворота — роли `arrowsOutward` и `arrowsInward` (`@soxa-ui/icons-material`); тема oren рисует окно и подложку (`.so-dialog`, `.so-dialog__backdrop`, `--placement-*`, `data-maximized`, переменные `--so-dialog-width` и `--so-dialog-height`).
  
  Ломающее. Слой выделен в общую базу `TLayer` (`@soxa-ui/core`): Frame и окно делят один стек z-index, и его базу задают у `TLayer` — `TLayer.baseZIndex = 5000`; запись в `TFrame.baseZIndex` больше не действует. В `@soxa-ui/plugins` правило «после нажатия мимо фокус не возвращать» переехало из базы `TOverlayFocusPlugin` в `TPopoverFocusPlugin`: `TModalFocusPlugin` возвращает фокус при любом закрытии и гасит `mousedown` нажатия мимо. Своя стратегия на базе `TOverlayFocusPlugin`, которой нужно прежнее правило, подписывается на `dismiss` у `TDismissPlugin` сама. Нажатие мимо и Escape плагины слоя передают владельцу, который принимает запрос закрытия (`requestClose`, тип-гард `isCloseRequestable`), с причиной; остальных закрывают записью открытости, как раньше.
- ed00f0c: Calendar: шапка как в календаре Android — заголовок месяца у начала ряда, «назад» и «вперёд» вплотную у конца, над двумя последними колонками; в DOM пара идёт сразу за заголовком первого месяца, и Tab проходит заголовок, «назад», «вперёд», сетку. Шапка панели выбора месяца и года — так же: год у начала, стрелки у конца. Новый слот `footer` — подвал под сетками, ряд действий у конца строки; ряд месяцев теперь в своём узле `.so-calendar__months`. DatePicker: проп `confirmable` — выбор в календаре становится черновиком, в подвале панели «Отмена» и «OK»: «OK» (`confirm()`) делает его значением и закрывает панель, любое другое закрытие черновик сбрасывает, а `closeOnSelect` не действует. Пока диапазон выбран наполовину, «OK» выключена (`confirmDisabled`). Текст кнопок — строки локали `datePicker.confirm` и `datePicker.cancel` во всех шести готовых локалях.
- 8b89d9e: Drawer: новый компонент (Vue) — выезжающая панель у края экрана, модальная, как окно. Край — `placement`: `end` (по умолчанию), `start`, `top`, `bottom`, стороны логические; размер — `width` у боковой и `height` у верхней и нижней (переменные темы `--so-drawer-width` и `--so-drawer-height`). `swipe` включает жест: `handle` — смахнуть за полосу у края, `panel` — за любое место, кроме контролов и прокручиваемых областей; отпустили дальше четверти размера или быстро к краю — закрытие с новой причиной `swipe` (`TCloseReason`) через отменяемое `close:before`, иначе панель возвращается на место. `contained` оставляет панель в ближайшем позиционированном предке — например, в модальном окне — и не запирает прокрутку документа. Крестик, Escape, подложка, `dismissible`, `close:before`, фокус и немой для скринридера фон — как у Dialog: общее вынесено в базу `TModalLayer` (`@soxa-ui/core`), дескриптор `ModalLayerDescriptor` (`@soxa-ui/setup`) и расчёт раскладки `TModalLayoutPlugin` (`@soxa-ui/plugins`), у Dialog поведение и CSS прежние. Тема oren рисует панель и подложку (`.so-drawer`, `.so-drawer__backdrop`, `--placement-*`, `data-open`, `data-swiping`, `data-contained`), въезд и выезд — переходом.
- b4243ba: Slider: щелчок к меткам — проп `snap`: `none` (по умолчанию), `magnet` — в радиусе метки ручка стоит на ней, `plateau` — метка занимает два радиуса хода, а промежутки между метками сжаты, `settle` — отпущенная рядом с меткой ручка доезжает до неё, `hold` — ручка стоит на пересечённой метке и потом догоняет указатель. Радиус — `snapRadius` в px (8). Опорные точки — метки (`marks`), клавиатура ходит по шагу при любом режиме. Контракт `ISlidable` дополнен долями ручек и меток (`fractions`, `snapPoints`), режимом и радиусом щелчка, подпиской на смену режима и командой `settle` — доводка ручки уже без перетаскивания, с одним `commit`. `TSlidePointerPlugin` выбирает стратегию щелчка по режиму владельца; время стоянки в `hold` — опция установки `holdDelay` (250 мс).
- 3a72379: Tags и Select: у ряда тегов два режима переполнения — `wrap` и `scroll`, оба — раскладка темы, без замера ряда и панели. Свою раскладку тегов собирают слотами: `default` у Tags отдаёт показанные теги (`shown`) — их кладут в `Scroller` или делят на ряд и `Popover` за кнопкой, — а новый слот `tags` у Select подменяет ряд тегов в поле и получает инстанс тегов и его коллекцию (`tags`, `engine`) — то, что встроенный `Tags` берёт `:ctrl` и `:engine`. Тема oren красит видом и вариантом набора тег на любой глубине внутри набора, поэтому своя раскладка в слоте выглядит так же, как ряд. Ряд `scroll` в поле Select занимает место по своим тегам, но не больше половины поля: ввод стоит сразу за последним тегом, а тесный ряд прокручивается в своей половине.
- 2e53a0f: ProgressLinear: новый компонент (Vue) — индикатор выполнения линией, роль `progressbar`. `value` — сколько готово на шкале от `min` до `max` (по умолчанию 0 на шкале 0–100). `indeterminate` — доля неизвестна: полоса бежит, `aria-valuenow` у неё нет, а `value` хранится и возвращается на полосу, когда флаг снимают. Значение хранится как задано, а доля на полосе и `aria-valuenow` прижаты к шкале — полоса и скринридер показывают одно и то же. Имя — `aria_label` или `aria_labelledBy`. Текста и слотов у полосы нет: содержимое роли `progressbar` скринридер не читает, подпись и число ставят рядом. Размер и цвет — `size` и `variant`. Тема oren рисует дорожку и заливку (`.so-progress-linear`, `.so-progress-linear__range`): доля плавно едет к новому значению, а пока полоса бежит, по дорожке идёт отрезок — от начала строки, в RTL справа. При `prefers-reduced-motion` доля встаёт сразу, а бег тот же. Без варианта полоса `accent`, как Spinner.
- 4f0151a: Slider: подписи меток скрыты от скринридера (`aria-hidden`) — в подписи `Label` их текст больше не входит в имя поля, шкалу объявляет само поле.
- e982bdf: Slider: новый компонент (Vue) — ползунок, паттерны Slider и Multi-Thumb Slider APG. Значение — число (одна ручка) или массив (по ручке на элемент), и форма сохраняется в `v-model`. Ручка — нативный `input[type=range]`: мобильный скринридер двигает её своим жестом, `name` и `disabled` уходят в форму сами. Пропсы: `min`, `max`, `step` — числом или списком допустимых значений (неравный шаг), `largeStep` — шагов у Shift со стрелкой, PageUp и PageDown, `orientation`, `inverted`, `origin` — откуда растёт заливка одной ручки (середина хода — заливка от центра), `marks` — точки шкалы или свой список с подписями, `minStepsBetweenThumbs` — наименьший зазор между ручками в шагах, `thumbLabels` — имена ручек для скринридера. Слоты: `mark` — подпись метки, `thumb` — место под подсказку со значением. Событие `commit` — одно на действие: конец перетаскивания, сменившего значение, или шаг клавишей. Механизм «тянем — меняем значение» отделён от ползунка: шкала `createScale` (`IScale`) в ядре, контракт `ISlidable` и плагины `TSlidePointerPlugin` и `TSlideKeyboardPlugin` — их возьмёт следующий компонент с перетаскиванием. `TStateUnit` принимает правило «то же самое» (опция `same`): составное значение сверяется им, а не по ссылке. Тема oren рисует ползунок (`.so-slider` и его части).
- dd268c6: Menu — меню действий у кнопки (APG Menu Button): пункты, флажки, группы с подписью и разделители, клавиатура с набором по первым буквам, наведение и модель фокуса; во Vue — `Menu` с частями `Menu.Item`, `Menu.CheckboxItem`, `Menu.Group`, `Menu.Separator`, в теме oren — его стили.
- fb7dff2: Отметка CheckBox — svg иконки по роли без компонента Icon: смена отметки больше не собирает контекст и плагины иконки. Размер отметке даёт тема флажка (so-check-box\_\_mark). Во Vue компонент иконки роли (`useIcon`) один на роль
- b0938c0: Открытость слоя для темы — `data-open` у панели любого Frame: слой (`TLayer`) пишет его сам, проекцией `visible`, и проводки в разметке не нужно. Тема oren проявляет и гасит по нему панели Select и DatePicker на месте, как Popover у триггера без жеста: одна прозрачность его временем, а закрытая панель, пока гаснет, нажатий не ловит. У Popover `data-open` панели теперь пишет её Frame, а из набора `panelDataset` он ушёл; у Dialog и Drawer атрибут прежний.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 4fa09bc: Toasts: раскладка стопкой — новый проп `layout` (`list` по умолчанию и `cascade`, модификатор `so-toasts--layout-*`). В стопке тосты перекрывают друг друга: передний — первый по порядку коллекции, задние уже и выглядывают из-под него на ступень, высота стопки — по переднему. Вывести задний тост вперёд — перестановка в коллекции: колесо над регионом листает стопку на шаг за жест (вниз — передний уходит назад, вверх — задний выходит вперёд), и страница под стопкой не едет; стрелки ↓ и ↑ при фокусе на тосте — то же, и фокус переходит на новый передний. Это новый плагин `TToastsCascadePlugin`; без стопки колесо и стрелки остаются странице. Фокус на заднем тосте выводит его вперёд темой, без перестановки: Tab идёт по тостам по порядку и уходит из стопки. Глубину тоста разметка отдаёт теме переменной `--so-toasts-depth`. Тема oren рисует стопку, а высоту переднего, по которой задние меняют свою переходом, пишет её поведение — новый `TToastsFrontPlugin` (`useTheme`). Во Vue крестик тоста — `type="button"`: в форме он её не отправляет.
- b45d550: Calendar: в панели выбора месяца подпись плитки переносится между словами — у месяцев так же, как у лет. Имя месяца в несколько слов (`vi-VN` — «Tháng 10») уходит на две строки, а не режется многоточием: у `vi-VN` на самом крупном размере «Tháng 10»–«Tháng 12» больше не сливаются в три одинаковых «Tháng …». Многоточием у края плитки режется только слово шире самой плитки. Список панели календарь создаёт с `contentFit: 'wrap'` на обоих уровнях.
- a58f169: Pagination — постраничная навигация: стрелки по краям, первая и последняя страницы видны всегда, между ними — `middleCount` страниц вокруг текущей (по умолчанию 3), на месте пропущенных — многоточие: `‹ 1 … 4 5 6 … 10 ›`. Страницы числовые — `⌈total / pageSize⌉`, номер в цифрах локали («12 345»), — или текстовые — список `pages` из `{ text, value? }`. Значение (`value`, `v-model`) — ключ текущей страницы, к страницам не прижимается. Корень — `nav`, имя ему даёт приложение (`aria_label`); у текущей — `aria-current="page"`, имена стрелок — из локали, новый раздел `pagination`. В ядре — `TPagination` и коллекция страниц окна (`createEnginePagination`, выход `cells`): в коллекции только видимые страницы, и страница, оставшаяся на экране, — тот же узел. Новый плагин имён `TPaginationNamesPlugin`. Во Vue — компонент `Pagination`, в теме oren — его стили.
- e76d680: Toasts — всплывающие уведомления: менеджер `<Toasts>` оборачивает приложение, а `useToasts().show(текст | опции)` показывает тост из кода и отдаёт его экземпляр. Очередь — коллекция с пределом видимых (`max`), автозакрытие с паузой на указатель, фокус и скрытую вкладку (`duration`, `0` — пока не закроют), срочные тосты (`alert`), своё содержимое (`render`), смахивание, F8 к тостам и Escape; тема oren рисует регион у шести краёв окна и тосты. Слой (`TLayer`) получил публичный `raise()`, жест (`TSwipePlugin`) начинается в слое своей панели.
- ccd7713: Tags: кнопка закрытия тега стоит рядом со строкой тега, а не внутри неё. В режиме выбора строка — `role="option"`, и вложенная кнопка скринридеру кнопкой не была, а её подпись он читал в названии тега: «Настройки Close Настройки». Теперь в `.so-tags-item` два соседа — строка и `.so-tags-item__close`; кнопка сама получает размер и выключенность тега. Пилюлю тега — фон, рамку и состояния вида набора — рисует сам `.so-tags-item`: строка стала `view="none"`, `data-selected` стоит только на элементе. Тема oren держит прежний вид: матрица видов Button вынесена в миксины, ими же красится пилюля, CSS самого Button по декларациям не изменился.
- 17bc937: Calendar — компонент поверх календаря ядра: во Vue `<Calendar>` с частью `Calendar.Item`, в setup — дескрипторы `CalendarDescriptor`, `CalendarItemDescriptor` и их коллекционные части, в теме oren — стили. Сетка — по APG (Date Picker Dialog): месяц — `table` с `role="grid"`, его заголовок называет сетку и сам объявляет смену месяца (`aria-live="polite"`), фокус и наборы — на ячейке дня, одна остановка Tab на все сетки, шапка дней недели скрыта от скринридера. Клавиши — `TCalendarKeyboardPlugin`: стрелки, Home/End, PageUp/PageDown (с Shift — год), Enter и пробел выбирают день, Escape отменяет начатый диапазон; DOM-фокус идёт за фокусом коллекции и в новый месяц. Нажатия и наведение для предпросмотра диапазона — `TCalendarPointerPlugin`. Кнопки листания — одна пара на все сетки; их имена — новые пропсы `prevLabel` и `nextLabel` у `TCalendar` (по умолчанию английские), кнопка, погасшая у границы под фокусом, отдаёт фокус дню. Содержимое дня — слот `item` со scope `{ item }`. В ядре: выходы `prevAria` и `nextAria`, событие вида `change:paging` — перечитать `prevDisabled` и `nextDisabled`, а ячейка заполнителя в `grids` — только дата и `aria-hidden`, без текста и `data-outside-month`.
- a91b783: Tags: свойство overflow (wrap | scroll) — теги, которым не хватило ширины ряда, переносятся на новую строку или ряд стоит в одну строку и прокручивается. Select передаёт режим тегам поля пропом tags_overflow. Поле Select больше не расширяется под теги средствами CSS.
- bd02d06: Popover: новый компонент (Vue) — панель с произвольным содержимым у триггера, паттерн немодального диалога APG. Триггер кладут в слот `trigger`: связку с панелью (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`) и вид «нажат» (`data-selected`) он получает в scope — наборами `triggerAria` и `triggerDataset`. У панели `role="dialog"`, имя — `aria_label` или `aria_labelledBy`. Пропсы: `open` (v-model), `closable` и `closeLabel` — кнопка закрытия в углу панели, `lazyMount` — не монтировать содержимое до первого открытия, `placement` — сторона и выравнивание у триггера. При открытии фокус уходит в панель; закрытие крестиком, Escape или самим содержимым возвращает его на триггер, нажатие и фокус мимо закрывают без возврата; Tab ходит так, будто панель стоит в документе сразу за триггером. Тема oren рисует панель, область содержимого и крестик (`.so-popover`, `.so-popover__panel`, `.so-popover__content`, `.so-popover__close`). Frame пишет номер своего слоя в `data-layer` — тот же, что `zIndex`, — и получает слой сразу, если создан видимым: раньше такой Frame стоял с `z-index: 0`.
- 5d2d8a9: Слой setup собирает компонент по одному составу. Состав монтирования (плагины дескриптора плюс регистрации приложения) считается один раз, и по нему строятся набор плагинов, units аксессора и начальные значения плагинных пропсов — раньше каждый выяснял состав сам, и плагины реестра доходили только до набора.
  
  Дескриптор стал описанием типа и только им: методы `createBundle` и `createAccessor` с него сняты (их звала одна сборка), а сам он строится один раз на тип — `defineDescriptor` кэширует фабрику, и монтирование больше не пересобирает всю цепочку до `EntityContribution`.
  
  Расширения `TPluginsBindingExtension` и `TPluginPropsExtension` удалены вместе с `resolveDefaultExtensions` и полем `defaultExtensions` в конфиге контекста. Начальные значения плагинных пропсов пишет сборка, а корневой узел привязывается методом контекста `adapter.bindElement(el)` — у компонента без `TElementPlugin` он ничего не делает. Как обновиться: `adapter.get(TPluginsBindingExtension)?.bindElement(el)` заменить на `adapter.bindElement(el)`, `{ defaultExtensions: [] }` из вызовов `createAdapterContext` убрать.
  
  `IAdapterContextOptions` и `IAdapterContextConfig` теперь экспортируются из `@soxa-ui/setup`.
- 95c608b: RadioGroup: новый компонент «один из N» — `RadioGroup` и `RadioGroup.Item` (Vue). Радио — нативные `input[type=radio]` в корне-`label`: общий `name` раздаёт группа (без своего имени — от `uid`), одну остановку Tab, стрелки с пропуском выключенных и пробел даёт браузер, `aria-checked` и `aria-disabled` ядро не пишет. Значение группы — `v-model:value`, связанное с отмеченным радио; удаление отмеченного радио значение не стирает. `view`, `size` и `variant` задаются группе и раздаются каждому радио; тема oren рисует виды `dot` (точка в кольце, по умолчанию) и `ring` (утолщённое кольцо) по `data-selected` и `data-disabled` корня радио, у контейнера группы стилей нет. Текста у радио нет — подпись кладут слотом. В ядре появились базы фасадов под активацию — `TActivationCollectionFacade` и `TActivationItemFacade`; фасады Tabs переехали на них без изменения API.
- 60f8114: Table: режим сетки `grid` (APG Data Grid) — одна остановка Tab, стрелки, Home/End, Ctrl+Home/End и PageUp/PageDown по ячейкам, выбор строки нажатием и пробелом, Ctrl/Cmd+A, Enter на сортируемом заголовке, Enter и F2 — внутрь ячейки, Escape — обратно; строка под указателем и под фокусом подсвечена
- 0fc492f: Автоматические id в разметке (поле, панели, связки табов и секций, список Select, name группы радио, data-owner) строятся от основы экземпляра idBase, а не от счётчика uid: адаптеры Vue и React дают её из useId, и при серверном рендере id на сервере и в браузере совпадают. Новая опция конструктора idBase; элементы коллекции из items получают основу владельца с номером. В React фабрика useAdapterContext получает функцию сборки create — компонентам собирать контекст ею.
- 021af92: ProgressLinear: ось `orientation` — `horizontal` (по умолчанию) или `vertical`, снизу вверх; на корне модификатор `--horizontal` или `--vertical`. `aria-orientation` полоса не пишет: у роли `progressbar` его нет. Тема oren рисует вертикальную полосу строчным блоком высотой 10rem (класс или стиль потребителя её перекрывает) и той же толщины по `size`, что горизонтальную; заливка растёт снизу, бег идёт снизу вверх при любом направлении письма; при `prefers-reduced-motion` доля встаёт сразу, а бег тот же.
- 0c6f41d: Select в окне: `<Virtual><Select :items /></Virtual>` — список панели рисует только видимые опции, на месте остальных — распорки той же высоты (`.so-select__filler`). Фасад коллекции Select отдаёт `drawn`, разметка рисует опции по нему. Клавиши ходят по всем показанным опциям: подсвеченную вне окна окно держит в документе, а `aria-activedescendant` ссылается на опцию, только пока она в документе, — ссылку и прокрутку к ней клавиатура ставит, когда окно её нарисовало (хук `onHighlightedMounted` у `TListNavigationPlugin`). Прокрутка к подсвеченной опции — в следующем кадре: панель, открытую той же клавишей, и дорисованную опцию адаптер рисует после обработчика. Место опции в наборе (`aria-setsize`, `aria-posinset`) в окне пишет общее расширение коллекции `positionInSet` (`TPositionInSetExtension`) — у ListBox и Select одно.
- a8e75d7: Table во Vue: выбор строки больше не перерисовывает её ячейки. Ячейки строки рисует свой внутренний компонент, и слот `cell` доходит до них стабильным пробросом: «выделить все» на 5000 строк — 1,3 с вместо 1,9 с, снятие — 0,8 с вместо 1,3 с, сортировка — 1,0 с вместо 1,6 с. Скомпилированный слот `cell` таблицы ячейки тоже не перерисовывает — ни выбор, ни смена пропсов таблицы; перерисовывают их новая запись строки и состояние, которое читает слот. Слот `cell` у `Table.Row` получил в scope строку `row` — тот же scope, что у слота `cell` таблицы.
- ff6b7a2: Панели Select и DatePicker можно смахнуть, чтобы закрыть: новый проп `swipe` (`none` по умолчанию, `handle` — за полосу у края со стороны поля, `panel` — за любое место, кроме контролов и прокручиваемых областей). Оба компонента — смахиваемые слои (`ISwipeable`) с общим `TSwipePlugin`: панель уходит от поля — вниз под ним, вверх над ним, — и жест закрывает её записью `open`, как Escape. Признак «тянут» — `data-swiping` из нового набора `panelDataset`, полосу разметка рисует по выходу `handleRendered`. У DatePicker календарь в панели завёрнут в `.so-date-picker__content`, и прокручивается теперь он, а не панель: иначе пальцем длинную панель с жестом не прокрутить. Тема oren: вид панели у якоря — проявление, жест и уход смахнутой — один миксин на Popover, Select и DatePicker; Popover выглядит как прежде.
- a1d81be: DateInput на сенсорных устройствах: касание пальцем или пером делает части даты редактируемыми — дату вводят с экранной клавиатуры, а нажатие мышью возвращает протяжку для выделения всей даты. Ввод экранной клавиатуры и композиция IME становятся командами ядра, текст частей по-прежнему пишет ядро. На iPhone и iPad части — текстовые поля, и имя поля входит в имя каждой части. Новое: плагины TDateInputTouchPlugin и TDateInputIdsPlugin, наборы частей segmentSets у TDateInput, у части в segments — attrs и name.
- dcee2e2: Новый компонент Scroller: лента произвольного содержимого в одну строку, которую двигают две кнопки. Прокрутка нативная, полосы не видно, шаг — видимая ширина; на краю кнопка гаснет, когда листать нечего — кнопок нет вовсе. Роль ряда лента принимает от потребителя пропом viewportAria.
- 0f36216: Новый компонент `Label` — подпись контрола: текст (проп `text` или слот `content`) рядом с CheckBox, Switch или радио в слоте `default`, сторона текста — `position` (`start`, `end`, `top`, `bottom`). Связь — вложением, без `for` и `id`: клик по тексту переключает контрол, а текст становится его доступным именем. Радио внутри подписи рисуется с `tag="span"` — его корень тоже `label`; вложенный `label` ловит `TLabelNestedWarnPlugin` предупреждением в консоль. Тема oren рисует стороны, размер текста и выключенную подпись.
- f7769b8: Calendar: подписи колонок — узкие имена дней недели (`weekday: 'narrow'`), как в шапках календарей CLDR. Короткие имена у `ar`, `ml` и ещё ряда локалей — целые слова шире колонки, и колонка срезала их посреди буквы. Ломающее: у `TCalendarWeekday` (выход `weekdays` календаря) поле `short` заменено на `narrow` — своя разметка шапки читает `weekday.narrow`. Панель выбора месяца и года: имя месяца шире плитки режется многоточием у её края, а не заходит в зазор между плитками; подпись года по-прежнему переносится между словами. Как поступать с подписью, списку по уровню задаёт календарь (`contentFit`), разметка его больше не передаёт.
- 7fd538d: Tooltip: проп `type` — чем подсказка служит триггеру. `description` (по умолчанию, как раньше) — описанием: `triggerAria` отдаёт `aria-describedby` на панель. `label` — именем: `triggerAria` отдаёт `aria-labelledby` на ту же панель, `aria-describedby` не ставится. Это режим кнопки-иконки без текста: `aria_label` ей не нужен, и скринридер не читает один текст дважды — как имя и как описание. Панель от режима не зависит: `role="tooltip"`, всегда в документе. Смена `type` на лету шлёт `change:type` (во Vue — и `update:type`) и переключает ссылку триггера.
- eaffd69: DatePicker получил кнопку очистки — `clearable`, как у Input и DateInput: DatePicker теперь сам поле (база ядра `TField`, дескриптор `FieldDescriptor`) с набором кнопки `clearAria`, командой и событием `clear` и слотом `clear`. У одной даты кнопка стоит в поле перед кнопкой календаря, у диапазона — одна на период, после поля конца, и очищает оба конца, в том числе набранные не до конца. Имя кнопки — строка локали `field.clear` с `name` DatePicker. Плагин имён поля `TFieldNamesPlugin` теперь ставят дескрипторы Input и DateInput, а не `FieldDescriptor`: у DatePicker имя кнопки пишет `TDatePickerNamesPlugin` — наследник плагина имён поля. В теме oren коробка диапазона — сетка из пяти колонок, а сторону кнопок DatePicker задаёт переменная `--so-date-picker-button`.
- 4100cf5: React: слот, ставший пустым (`{cond && <Icon />}` при ложном условии, `null`), больше не глушит `text` и прочее запасное содержимое компонента. Vue: только комментарий.
- dcb1c8b: Pagination: ряд постоянной ширины — мест в нём на любой текущей странице одно число, и стрелки при листании не сдвигаются. У края место многоточия занимает страница (`‹ 1 2 3 4 5 … 10 ›` вместо `‹ 1 2 3 4 … 10 ›`), многоточие стоит только на месте двух пропущенных страниц и больше, а `middleCount` по-прежнему задаёт, сколько страниц стоит вокруг текущей
- 251e29a: Slider: правило имён ручек в подписи `Label`. Одной ручке имя даёт подпись или `aria_label`, у нескольких ручек имя каждой, первой тоже, задаёт `thumbLabels` — полностью, текст подписи и `aria_label` в него не входят. Подпись называет первое поле своим содержимым, и значение второго поля внутри неё вошло бы в имя первого («80 Цена»). Поведение не изменилось: поправлено описание `thumbLabels`, правило сторожит браузерный тест.
- 0abcc93: DateInput — поле даты по частям в формате локали: дату вводят с клавиатуры по частям, а целиком выделяют протяжкой мышью или Ctrl/Cmd+A, копируют, вырезают и вставляют, как текст. У ядра третья лицензия — Apache-2.0: подсказки пустых частей (`дд.мм.гггг`) взяты из таблицы React Spectrum.
- 7bee975: DatePicker: новый компонент (Vue) — поле даты и календарь в панели, паттерн Date Picker Dialog APG. Режим `mode`: `single` (по умолчанию) — поле DateInput с кнопкой календаря в его конце, `range` — поля начала и конца в одной коробке и одна кнопка. Значение — дата `YYYY-MM-DD` или пара `[начало, конец]` (`v-model:value`); его меняют и набор в поле, и выбор в календаре, а недонабранный конец значения не даёт, но и не стирается. Панель открывают кнопка календаря и Alt+↓ на поле (`open`, `v-model:open`, события `open` и `close`): фокус уходит на день сетки — выбранную дату или сегодня, Tab ходит по кругу в панели, Escape закрывает и возвращает фокус, нажатие мимо закрывает панель и оставляет фокус там, куда нажали. Выбор дня закрывает панель (`closeOnSelect`), в диапазоне — второй день; первый Escape посреди диапазона снимает начатый выбор. Полям и календарю DatePicker раздаёт `disabled`, `size`, `variant`, `locale`, `min`, `max`, полям — `readonly` и `required`, календарю — `unavailable`, `weekStart` и `timeZone`. Имена: `triggerLabel` — кнопка и панель, `startLabel` и `endLabel` — концы диапазона, имя поля — `aria_label`. Слоты `trigger-icon` и `item` (содержимое дня), экземпляры — `ctrl.field`, `ctrl.start`, `ctrl.end`, `ctrl.calendar` и `ctrl.engine`. Calendar принимает движок снаружи (`engine`), выбор календаря сообщает выбор пользователя событием `choose`, у фокуса календаря — команда `resetFocus`. Плагины `TDatePickerFocusPlugin`, `TDatePickerTriggerPlugin` и `TDatePickerIdsPlugin`, ловушка Tab модального оверлея — общая утилита `trapTab`, место первого фокуса у `TOverlayFocusPlugin` — точка `_focusCandidates`. Значок кнопки — роль `calendar` (`@soxa-ui/icons-material`, Material Symbols «Calendar Month»); тема oren рисует кнопку, коробку диапазона и панель (`.so-date-picker`, `--single`, `--range`), из темы Select ушло мёртвое правило `.so-select--disabled`.
- cd29b8f: Calendar: заголовок месяца — кнопка, открывающая панель выбора месяца и года. Панель накрывает календарь целиком, её шапка встаёт на место ряда заголовков; в ней список месяцев — ровная сетка 4×3 с подписями по центру, год в шапке переключает на годы по 12, стрелки листают год и страницу лет. Имена стрелок — новые пропсы prevYearLabel, nextYearLabel, prevYearsLabel, nextYearsLabel. Frame и Popover получили проп contained: панель не телепортируется, а встаёт в ближайшем позиционированном предке (Popover — накрывает его целиком). ListBox сообщает о выборе пользователя событием choose расширения списка.
- 3bfa716: Rating: новый компонент (Vue) — оценка звёздами, паттерн Rating Slider APG: ползунок с одной ручкой на нативном `input[type="range"]`, звёзды — его зрительная шкала. `value` — оценка от 0 до `max` (сколько звёзд, по умолчанию 5), `step` — шаг (по умолчанию 1, `0.5` — половинки), `v-model:value`; событие `commit` — одно на действие. Нажатие ставит звезду под указателем целиком, на левой половине при шаге 0,5 — половину; протяжка ведёт оценку; стрелки — шаг, PageUp и PageDown — звезда, Home — «оценки нет», End — наибольшая; в RTL ряд растёт справа. Наведение показывает оценку, которую поставит нажатие (`preview`, событие `change:preview`); касание — не наведение. `readonly` — оценка только для показа: не меняется и не подсвечивает наведение, у поля `aria-readonly`. Как звучит значение («4 из 5») — `aria-valuetext` из нового раздела локали `rating` во всех шести готовых локалях, числа — по тегу локали; своя полная локаль (`TLocale`) дописывает строку `rating.value` с местами `{value}` и `{max}` или собирается поверх готовой через `extendLocale`. Значок — новая роль иконки `star` (`@soxa-ui/icons-material`, Material Symbols «Star»), слот `icon` со scope `{ value, filled }` рисуется и в пустом, и в залитом слое звезды. Плагины `TRatingHoverPlugin` и `TRatingNamesPlugin`; нажатие и клавиши ведут плагины Slider: `TRating` реализует контракт `ISlidable`. Тема oren рисует звёзды (`.so-rating`, `__track`, `__star`, `__star-fill`): залитая часть — доля `--so-rating-fraction`, цвет без варианта — `caution`.
- c37e233: Кнопки, которые компоненты рисуют сами, — очистка полей, крестики окна, панели, поповера, табов и тегов, листание календаря и ленты, кнопки DatePicker, строка таба, заголовок секции Accordion, сортировка колонки таблицы — получили `type="button"`. У `<button>` без `type` тип `submit`: в форме клик по очистке поля отправлял форму, а Enter в поле нажимал первую такую кнопку, и поле очищалось вместо отправки. Button, который ставит приложение, остаётся кнопкой отправки, как нативная `<button>`. В React, Solid и Svelte пропсы Button несут атрибуты кнопки: `type`, `form`, `name` и `value` типизированы.
- fafbf5f: В React появились Input, CheckBox и Switch — с той же разметкой и тем же поведением, что во Vue. Значение полей ведёт ядро: текст, отметку и «выбрано частично» проводит новое поле адаптера `NativeInput` — умолчание атрибутом (так значение попадает и в серверную разметку), свойство — в узел, если разошлось с ним. Контролируемого поля React нет: значение задаёт проп `value` или `ctrl`, смену сообщает `onChangeValue`. Атрибуты потребителя поля делит, как Vue: `className` и `style` — корню, остальное — `<input>` (`toControlAttrs`). Новый `roleIcon(role)` даёт `Icon` тег иконки из зарегистрированного пакета. `UseDomProps` вычитает из атрибутов DOM и имена событий дескриптора — `onInput` у полей теперь колбэк события `input`, а не обработчик DOM, — и принимает тип атрибутов параметром (`TFieldAttributes` у полей). Во Vue корень Input рисуется по `tag`, а не всегда `div`.
- 5659d22: Инициализация компонента одинакова во всех адаптерах и идёт теми же путями, что и изменения.
  
  Пропсы применяет сборка компонента. Внешний `ctrl` и плагины получают через сеттер всё, что отличается от объявленного умолчания; свой инстанс получает пропсы ядра конструктором, и второй раз они не пишутся. Адаптеры стартовых значений больше не пишут, поэтому коллекция с пропом `items` во Vue при монтировании больше не очищается и не заполняется повторно. Проп, равный умолчанию, внешний `ctrl` не трогает. Пересборка контекста в React (StrictMode, `<Activity>`) — такое же монтирование: разметка снова применяется к внешнему `ctrl`.
  
  Значения из ядра фреймворк получает подпиской на связку. `binding.subscribe(listener)` сразу отдаёт каждое свойство тем же вызовом, что и срабатывание триггера, дальше — изменения; `binding.getSnapshot()` отдаёт неизменяемый снимок (React рисует по нему через `useSyncExternalStore`). Порядок «подписка, потом чтение» держит связка, поэтому изменение ядра между рендером и подпиской больше не теряется в React и Svelte. `update:<prop>` для `v-model` объявляет профиль Vue (`IAdapterProfile.model`) и эмитит связка в `bindEvents`.
  
  Как обновиться, если вы пишете свой адаптер: `binding.state()` и `binding.bindOutput(write)` заменены на `binding.subscribe(write)` (он же отдаёт начальное состояние) и `binding.getSnapshot()`; у `bindComponent` больше нет третьего параметра `previous`.
- b1fad65: Table: колонки переставляются пользователем — перетаскиванием заголовка колонки `reorderable` и Ctrl+Shift+←/→ на нём. Тащится только заголовок, колонка встаёт на место одной перестановкой на отпускании; таблица отдаёт `column:move` с колонкой и новым порядком полей
- 2c76370: Tabs: клавиатура по паттерну APG Tabs. Стрелки по оси ориентации и Home/End переносят фокус и сразу активируют таб, Delete закрывает таб, который можно закрыть. Весь список — одна остановка Tab: tabindex="0" у активного таба, следующая остановка — панель, кнопка закрытия из порядка Tab выведена. Список табов объявляет aria-orientation и получает имя из aria_label.
- 29ccac8: TAnchorPlugin: `anchor_placement` принимает `top` и `bottom` — панель по центру якоря, сверху или снизу. Flip меняет только сторону и центр сохраняет, shift у края окна сдвигает панель, как и прежде, а направление письма центр не разворачивает. В `data-placement` у центра — сторона без суффикса (`top`, `bottom`). Те же значения принимает `placement` у Tooltip, и по умолчанию подсказка стоит по центру над триггером (`top`), как у Radix и Zag.
- 6fe38c8: Tabs: кнопка закрытия таба стоит рядом со строкой таба, а не внутри неё. Строка — это `<button role="tab">`, и вложенная кнопка скринридеру кнопкой не была, а её подпись он читал в названии вкладки: «Настройки Close Настройки». Теперь в `.so-tabs-item` два соседа — строка и `.so-tabs-item__close`; кнопка сама получает размер и выключенность таба. В теме oren наведение, кольцо фокуса и карточка активного таба `contained` — на обёртке, кнопка закрытия стоит вплотную за строкой, без зазора.
- 9aa7f6f: Один файл на компонент: контракт объявляется прямо в дескрипторе. Отдельных файлов contribution больше нет — их читал только свой дескриптор, а компонент приходилось собирать по двум местам. Дескриптор теперь целиком описывает компонент: наследование, пропсы, события, слоты и плагины. Плагины устроены так же — `definePlugin({ ctor, namespace, contribution: { … } })`.
  
  Из `@soxa-ui/setup` удалены фабрики `*Contribution` (`ButtonContribution` и ещё 53) и `LIST_PROPS`. `defineType`, `TPropType` и `TEmptySlotScope` переехали в `define` и экспортируются оттуда.
  
  Служебные пропсы адаптера — `TAdapterProps` (`ctrl`, `embedded`), пропсы компонента из дескриптора — `DescriptorComponentProps`, колбэк-события — `DescriptorCallbackEvents`. Раньше то же было объявлено в каждом адаптере отдельно (`TBaseComponentProps` во Vue, `TReactComponentProps`, `TSolidComponentProps`, `TSvelteComponentProps` — удалены).
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- bd11ef1: Tags: тег выбирается с клавиатуры — Enter и пробел на строке; выключенный тег кликом не выбирается
- 3daf6b0: Пакеты отдают собранный ESM и описания типов из dist, а не исходники
- 84ab767: DateInput: точность времени `timePrecision` — `minute` (по умолчанию, значение `YYYY-MM-DDTHH:mm`) или `second`: у поля даты и времени за минутой появляется секунда, значение — `YYYY-MM-DDTHH:mm:ss`. Секунду набирают цифрами, ↑/↓ ведут её по кругу, вставка принимает ISO и текст поля с секундами. Значение другой точности поле принимает: время до минуты оставляет секунду пустой, а секунда значения до секунды у поля до минуты скрыта в частях и вернётся со сменой точности; `min` и `max` сравниваются с точностью грубейшего. У поля даты точность ничего не меняет. Тема oren держит минимальную ширину ряда и у поля с секундами.
- e182825: Calendar: подпись колонки дня недели — короткое имя («пн», «Mon», «lun.», «周一»), если у всех семи коротких имён локали не больше трёх букв, иначе узкое у всех семи (`ar`, `ml`, `ta`, `te`, `th`). Одна буква была неоднозначной там, где короткое имя помещается: у `ru` понедельник и пятница — «П», вторник и воскресенье — «В». Форма одна на всю неделю, решает её ядро по локали. Ломающее: у `TCalendarWeekday` (выход `weekdays` календаря) подпись колонки — поле `label` (было `narrow`, до него — `short`); своя разметка шапки читает `weekday.label`.
- c9aaade: Адаптеры Vue, React, Solid и Web Components уезжают собранным ESM с декларациями в dist, а не исходниками
- 3c5eba3: Popover: в разработке корень компонента — снова сам элемент, а не фрагмент «комментарий + элемент»
- c3032e2: Table: режим окна (virtual) — тело рисует только видимые строки, остальные заменяют распорки той же высоты. Расширение virtual коллекции строк, плагин замера TTableVirtualPlugin, aria-rowcount и aria-rowindex по APG. Реестр bundles отпускает запись элемента из данных при размонтировании
- cd197a5: ProgressSpinner: новый компонент (Vue) — индикатор выполнения кольцом, роль `progressbar`. Модель та же, что у ProgressLinear: `value` — сколько готово на шкале от `min` до `max` (по умолчанию 0 на шкале 0–100), `indeterminate` — доля неизвестна: кольцо бежит, `aria-valuenow` у него нет, а `value` хранится и возвращается, когда флаг снимают. Имя — `aria_label` или `aria_labelledBy`, текста и слотов у кольца нет. Размер и цвет — `size` и `variant`; оси и пропа толщины нет. Общая модель линии и кольца поднята в базу ядра `TProgress` с дескриптором `ProgressDescriptor`: `TProgressLinear` теперь её наследник, API линии прежний. Тема oren рисует кольцо SVG (`.so-progress-spinner`, `__ring`, `__track`, `__range`, `__runner`): диаметр — по шкале Spinner, доля — дуга от двенадцати часов по часовой (переменная `--so-progress-spinner-fraction`, число от 0 до 1), плавно едет к новому значению, а пока кольцо бежит, по дорожке крутится четверть кольца; в RTL кольцо не зеркалится. При `prefers-reduced-motion` доля встаёт сразу, а бег тот же. В режиме принудительных цветов штрихи — системными цветами. Без варианта кольцо `accent`, как Spinner и линия.
- f28f64b: Строка таблицы и любой компонент Vue легче по памяти: состояние ядра — в мелких рефах (shallowRef), входы — одним watch на компонент, ячейка таблицы — без обёрток цикла и слота
- 87a7a4d: Выходы плагинов — защищённые пропсы, которые плагин вычисляет, а разметка только читает (`dismiss_ownerAttribute`, `layout_styles`, `keyboard_highlightedUid`, `editable_query`, `listItem_highlighted`), — типизирует дескриптор. Тип выхода — четвёртый аргумент `definePlugin`, `Pick` геттера класса плагина; выходы плагинов дескриптора собирает `DescriptorPluginOutputs<typeof XDescriptor>`. Контекст адаптера несёт их вторым параметром, `IAdapterContext<TInstance, TOutputs>`: его выводит `createAdapterContext` из состава плагинов дескриптора. `state` у `useAdapter` React, Solid и Svelte теперь типа `TAdapterState<TInstance, TOutputs>` — свойства инстанса и выходы; во Vue выходы передаются третьим аргументом `useAdapter`, и шаблоны Select, Frame, Icon, Spinner и Skeleton читают их с типом геттера плагина. Удалён `TDismissPluginProps`: он описывал `dismiss_ownerAttribute` рукой и с плагином не сверялся. Как обновиться: вместо `TDismissPluginProps` взять `DescriptorPluginOutputs<typeof SelectDescriptor>` (или дескриптора, в состав которого входит `DismissPluginDescriptor`).
- 884a39d: ListBox: выключенный элемент не выбирается ни кликом по строке, ни Enter и пробелом — выключен ли он сам или весь список. Раньше строка и клавиатура списка переключали выбор напрямую через `selection.toggle`, мимо выключенности: в теме oren мышь до такой строки не доходила, но клик от скринридера или скрипта выбирал элемент. Выбор пользователя теперь идёт через расширение списка — `chooseItem` у `TListBoxExtension`, `choose` у его item-адаптера. Выбрать выключенный элемент из кода (`selection.select`, `toggle`) по-прежнему можно.
- 505d400: RadioGroup и RadioGroup.Item в режиме разработки рендерят корнем один элемент, как в продакшене. Раньше комментарий над корнем шаблона делал корнем фрагмент «комментарий + элемент»: `$el` компонента был текстовым якорем фрагмента, а `wrapper.element` в `@vue/test-utils` смотрел на родителя.
- b50cc61: `aria-selected` элементов ListBox пишет ядро (`TListBoxExtension`) в набор `aria`: у всех элементов, `false` — у невыбранных, как у Select и Tags. Шаблон Vue его больше не считает. Контекст Vue принимается (`attach()`) в `setup()` рантаймом `useAdapter` — там элементы коллекций и входят в неё; сами компоненты элементов этого шага не делают.
- 01b6fbc: Popover: панель проявляется и гаснет переходом темы, как окно Dialog, — по `data-open` в наборе панели (`panelDataset`). Панель со своей стороной ещё и движется, как Drawer: в контейнере въезжает от своего края и уезжает к нему, со смахиванием у триггера уезжает от него, — и смахнутая панель уходит дальше от места, где её отпустили, а не исчезает разом. Закрытая жестом панель сохраняет сдвиг до следующего показа, и тема сама решает, увозить её к стороне или гасить на месте.
  
  Popover: новый проп `edge` — край контейнера (`top`, `bottom` по умолчанию, `start`, `end`), к которому прижата панель внутри него (`contained`). Он же задаёт, куда панель смахивают (к этому краю), и где полоса жеста (у противоположного края). Раньше панель в контейнере накрывала его целиком и смахивалась только вниз.
  
  Calendar: панель выбора месяца и года выезжает сверху и при закрытии гаснет на месте вместе с подложкой, без вспышки — карточка от верхнего края календаря во всю его ширину, высотой по содержимому, под ней подложка. Панель закрывается нажатием по подложке и жестом вверх за полосу у низа карточки, фокус возвращается на заголовок месяца. Подписи плиток месяцев переносятся только между словами. В режиме принудительных цветов видны выбранная строка ListBox без отметки и штрих полосы жеста у Drawer и Popover.
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
