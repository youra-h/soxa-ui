# @soxa-ui/webc

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

- a0e548f: Process large Web Components connection queues reliably while preserving FIFO order and error recovery.
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

- af9fa53: Element classes no longer have `is()`: `el instanceof TButtonElement` now narrows the node to the element with its props (TypeScript 5.3 or later). Replace `TButtonElement.is(el)` with `el instanceof TButtonElement`.
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

- af9fa53: Element classes no longer have `is()`: `el instanceof TButtonElement` now narrows the node to the element with its props (TypeScript 5.3 or later). Replace `TButtonElement.is(el)` with `el instanceof TButtonElement`.
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

- 26cc7e3: Same events on every platform, found by the new parity run. Angular: an output of an event with several arguments now emits their tuple, like `detail` in Web Components — `(soChangeActivation)` gives `[item, previous]`, `(soChangeSelection)` gives `[selected, changed]`; read the first element where you used `$event` directly. Vue: the consumer no longer hears a component's teardown (`v-model:items` of a `v-if`-ed owner is no longer emptied), and Icon with a glyph component in `tag` hands its node to the plugins. Web Components: a removed element sends no events. Svelte: the markup items joining while mounting reach `onItemAdded` and the other handlers. React: typing after a choice in Select goes after the chosen text. Markup groups (`Menu.Group`, `ListBox.Group`, `Select.Group`) have their label from their first item on React.
- a20cdd5: A component's own assembly no longer sends events: on Vue, Svelte, Solid and Web Components a context listens to its events after it is accepted, and a collection binds its facades before the component, as React and Angular do. What the facade writes into the component while mounting is the starting state: Calendar no longer sends `change:months` (and Vue `update:months`) with the months it shows on mount, Table no longer sends `change:dataset`; read the starting value from the instance (`ctrl.months`) instead of waiting for the first event. Svelte and Solid adapter API: `useCollectionAdapter` no longer takes the rest of the attributes — `joinBindings` chains them from the component's rest.
- d278f0f: The adapter context has a fourth phase, detach: the first moment of the teardown, before the children go. The context only reports it; every adapter stops the consumer on it, and a collection reports it to its items and Tabs panels, so in Svelte, Solid and Angular an item no longer hears its siblings leave when the whole collection goes. An Angular component taken out of the document sends nothing (its owner heard its items leave one by one), and a React item no longer hears its own entry into the collection: what the acceptance writes is the starting state, as in the other adapters. Breaking: TCollectionItemExtension and TTabsContentBindingExtension take the own context of the item or the panel instead of its instance, and take the instance from it: { adapter, elevator } instead of { item: adapter.instance, elevator } and { content: adapter.instance, elevator }. IAdapterContext has detach() and the detach event.

### Patch Changes

- 88e4f4f: Calendar: weeks are keyed by their place in the grid, so switching to a language with another first day of the week keeps six days of seven in their row instead of rebuilding the month.
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

- 23f8f70: Web Components: the polyfill of customized built-ins (Safari) runs before the first element is defined, from the package root and from every entry — in 0.3.0-alpha.5 the built package ran it after every registration.
- 23f8f70: Web Components: an entry point per component — `import '@soxa-ui/webc/button'` defines just the button (with the locale provider and the elements its markup draws), so a page ships only what it uses; `import '@soxa-ui/webc'` still defines every element.
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

- 229de1a: Таблица на Web Components держит на 11% меньше памяти: раскладка атрибутов на узле хранит записанное объектами вместо Map, а сведённое состояние элемента коллекции — один Proxy вместо геттера на каждое имя.
- 80f7f2d: Таблица на Web Components больше не падает с переполнением стека на тысячах строк: очередь ожидания подключения разбирается одним циклом, а не вложенно на каждый ждущий элемент.
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
- 53a3fe6: ListBox: клавиша со строки, на которой стоит фокус после клика, возвращает фокус узлу списка и действует от этой строки — кольцо фокуса не застревает на строке, Shift+Tab выводит из списка одним нажатием
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

- 73fc447: Web Components: уборка адаптерного слоя. Ломающее: база элемента переименована — SoxaElement → ElementBase, ISoxaElement → IElementBase, ISoxaElementSpec → IElementSpec, TSoxaElementClass → TElementClass, TSoxaElementProps → TElementProps. Описание корня — стратегией: { strategy: 'host', … } вместо флагов, { strategy: 'wrapped' } вместо { wrapped: true, control: true }, { strategy: 'wrapped', teleport } вместо { wrapped: true, teleport }. ITemplate.create(root, ctx) — без параметра hasSlot, он есть в ctx.hasSlot. У TBinding больше нет поля plugins. Удалены useAttributes (берите ключи buildAttributeMap) и тип TSlotGiven.
- 84f4ad3: Select.Item: выбор опции — клик по строке, как у ListBox, Menu и Tabs: клик потребителя по опции приходит после выбора (раньше — до него), и stopPropagation в нём выбор больше не отменяет. Кто читал в обработчике прежнее значение — берите его из события смены значения (oldValue); отменить выбор — подпиской на item:select:before.
- 0ff415a: Web Components: уборка компонентов. Ломающее: в описании элемента descriptor, facade и ownerFacade — функции дескрипторов (descriptor: ButtonDescriptor), а не их результат. createDetail(owner, TButtonElement, { embedded, attributes }) и createItem(owner, TTabsItemElement) принимают класс элемента вместо тега, имени is и защиты: имя и тег класс получает при defineElement. Новое: у класса элемента — проверка с полным типом TButtonElement.is(node), типы TElementClassOf, TElementOf и TElementType (тип элемента класса), помощник patch(el, { size, disabled }) — запись только сменившихся свойств.

### Patch Changes

- 7359ae0: Web Components: комментарии компонентов и шаблонов сокращены до шапок со ссылкой на docs/architecture.md (Layer 8d) и AGENTS.md (Web Components); код не менялся.
- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.
- 8d0c58c: События частей, которые рисует сам компонент, — страниц Pagination, групп ListBox, колонок Table и элементов из данных (`items`, `engine`) у ListBox, Tabs, Accordion, RadioGroup и Table — больше не всплывают до владельца и выше, как и события его деталей; `embedded` на всплытие больше не влияет. Как обновиться: слушать такое событие на самом элементе или брать событие владельца (`so:change:value`, `so:item:activated`, `so:item:close`). `useCollectionAdapter` больше не принимает контекст владельца: `useCollectionAdapter(adapter, host, onUpdate)`.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.
- 7137eaa: Группы из разметки (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`) входят в группировку коллекции, и `sections` описывают их с подписью. Элемент без группы больше не уходит в конец, а остаётся на своём месте среди незаявленных групп; чтобы вернуть прежний порядок, заявите группы в `groups`.
- 8d4064e: `onChangeSelected` элемента коллекции (`ListBox.Item`, `Select.Item`, `Tags.Item`, `Accordion.Item`, `Table.Row`, флажки и переключатели `Menu`) и `onChangeActive` (`Tabs.Item`, `Tabs.Content`, `RadioGroup.Item`) приходят только элементу, чьё состояние сменилось, и несут новое значение: `onChangeSelected={(selected) => …}`. `change:selection` владельца вторым аргументом отдаёт элементы, чья отметка сменилась, `change:activation` — прежний активный; в Web Components `detail` этих двух событий — пара: где читали `detail`, читайте `detail[0]`.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- f0b92e4: Событие «до» (`so:show:before`, `so:hide:before`, …) отменяется `preventDefault()` самого события, как событие DOM; `detail.preventDefault()` работает как прежде
- 62a690a: Web Components: Popover и Tooltip — `<span is="so-popover">` и `<span is="so-tooltip">`; триггер — элемент в слоте `trigger`, связь с панелью (`aria-expanded`, `aria-controls`, `aria-describedby`) он получает сам.
- 082df04: Web Components: `rendered = false` у элемента и неактивная панель таба прячут и открытые панели вложенных слоёв — подменю, поповера в поповере, окна в панели, — как у остальных адаптеров.
- a8010a5: Web Components: панель идёт за своим местом и при перестановке одной операцией — меню снова ведёт стрелками и наведением по своим пунктам, а панели Frame, поповера, подсказки и регион тостов собираются заново под провайдером и владельцем нового места
- 309ce24: DragAndDrop во всех адаптерах: перестановка элементов Tabs, ListBox и Accordion перетаскиванием, события `move:before` и `move` (`onMoveBefore`/`onMove`, `(soMoveBefore)`/`(soMove)`, `so:move:before`/`so:move`); в Angular — `<ng-container so-drag-and-drop>`, в Web Components — `<so-drag-and-drop>`
- a45ad99: Web Components: Frame, окно и выезжающая панель, переставленные одной операцией, собирают заново и всё в своей панели — кнопки и поля внутри берут локаль и окружение нового места
- 9b3a3f5: NumberInput в React, Solid, Svelte и Web Components (`<div is="so-number-input">`) — поле числа в формате языка: шаг и границы, клавиши, кнопки «−» и «+» с удержанием, число уходит в форму скрытым полем, как во Vue
- 743c56c: Textarea в React, Solid, Svelte, Angular и Web Components — многострочное поле с авторостом и счётчиком символов, как во Vue
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- 5047ccc: Web Components: Dialog, Drawer и Toasts — `<div is="so-dialog">` и `<div is="so-drawer">` с подложкой в слое и `<so-toasts>` вокруг приложения; тост из кода — `toastsOf(element).show(…)`, своё содержимое — функция `render(toast)`, которая отдаёт узел.
- 1f288ea: Web Components: значение, которое слушатель события пишет обратно в свойство элемента, пока тот собирается (`months` календаря на `so:change:months` при вставке), теперь сразу доходит до компонента и не затеняет значение ядра; перестановка элемента больше не откатывает к нему.
- 52a3b15: Web Components: элемент, снятый `rendered=false` (своим, у предка или как неактивная панель таба), отдаёт плагинам узел `null`, как у Vue. Открытое окно и выезжающая панель отпускают прокрутку страницы и `aria-hidden` фона, а снова показанный элемент получает узел и `so:element:ready` заново.
- 01e886b: Web Components: ProgressLinear, Slider, Rating, Pagination и Scroller — `<span is="so-progress-linear">`, `<span is="so-slider">`, `<span is="so-rating">`, `<nav is="so-pagination">`, `<div is="so-scroller">`; слои `setupInteractive`, `setupValueControl`, `setupInputControl`. Слоты со scope — образцы (`<template slot="mark">`): копию получает каждая метка, ручка, звезда и страница.
- 443f125: Web Components: DateInput, Calendar и DatePicker — `so-date-input`, `so-calendar` с днями `<td is="so-calendar-item">` и `so-date-picker`; Popover на `div` — `<div is="so-popover-div">`.
- 691cdfb: Web Components: `rendered=false` у Popover и Tooltip прячет и открытую панель
- 1bbe88a: Web Components: Menu — `<span is="so-menu">` с пунктами, группами, разделителями, подменю, флажками, переключателями и пунктами с панелью; по кнопке в слоте `trigger` и контекстное; пункты разметкой или данными (`el.items`).
- 7be38ad: Web Components: разметка страницы, ожившая при подключении пакета, собирается в порядке документа во всех браузерах, включая Safari с полифилом. Пункты меню разных видов стоят по порядку, стрелки и набор по буквам ходят порядком экрана, группа внутри подменю даёт ключ своим пунктам. Сборка больше не зависит от порядка регистрации элементов
- f4bc615: Web Components: Tags и Select — `<div is="so-tags">` с `<div is="so-tags-item">`, `<div is="so-select">` с `<div is="so-select-item">` и `<div is="so-select-group">`; опции и теги задаются разметкой или данными, слоты `item-*` — образцы; Button на `span` — `<span is="so-button-span">`.
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
- 09e1b89: Table и Virtual в Web Components: `<div is="so-table">` с частями `<th is="so-table-column">` и `<tr is="so-table-row">` — колонки и строки данными или движком снаружи (`el.engine`), сортировка, выбор строк с «выбрать все», ручка ширины и перестановка колонок, сетка, закреплённая шапка, образцы `header` и `cell`, слот `empty`; окно — `<so-virtual>` вокруг таблицы и списка. Атрибуты потребителя и скрытие — окну таблицы.
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
- 25ef801: Web Components: у компонентов нет обёртки — `<so-button>` сам и есть кнопка и корень компонента, внутреннего `<button>` больше нет; `<so-component-view>` так же держит содержимое в себе. Класс, стиль, атрибуты и слушатели на элементе действуют сразу, а атрибут потребителя главнее того, что пишет компонент (`tabindex="-1"`, `role="link"` остаются). `<so-button>` связан с формой: внутри формы или с атрибутом `form` нажатие её отправляет, `type="reset"` сбрасывает, `type="button"` ничего не делает; `disabled` выключает его по-настоящему — без фокуса и кликов. Атрибута и свойства `tag` больше нет: тег — всегда сам элемент, кнопок-ссылок нет. `rendered=false` прячет элемент (`display: none` поверх инлайнового `display`), а не удаляет корень. Элемент, переставленный в DOM, остаётся рабочим: инстанс (`el.ctrl`) и содержимое те же. Из экспорта удалены `ariaBinding`, `datasetBinding`, `createAttributesBinding` и `applyAttributeSet` — наборы ядра раскладывает база `TSoxaElement`; у `ITemplate` нет `tag` и появились `reactions` (`on`, `formAction`), а `useAdapter` и setup-функции принимают колбэк событий `onEvent`.
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 9dfdb31: Angular и Web Components: теги компонентов сменили префикс `soxa-` на `so-` — `<so-button>`, `<so-component-view>`, в Angular ещё `<so-component>`. Переименуйте теги в шаблонах и разметке, а также строки в `querySelector`, `createElement` и ключах `HTMLElementTagNameMap`: старые имена не зарегистрированы, и `<soxa-button>` больше не кнопка. CSS-классы (`s-*`) и имена пакетов (`@soxa-ui/*`) не меняются.
- 88db640: Префикс `so` — у каждого события, которое адаптер отдаёт туда, где его слышит и DOM: у событий Web Components и у выходов Angular, без исключений. Префикс говорит, чьё это событие, поэтому стоит у всей категории, а не у имён, что совпали бы с событием браузера: угадывать, у каких событий он есть, не нужно. Разделитель — тот, что в схеме имён адаптера: `:` у Web Components, camelCase у Angular.
  
  Web Components: событие элемента — `so:` и полное имя ядра: `so:show`, `so:hide`, `so:ready`, `so:show:before`, `so:element:ready`, `so:action:press`, `so:change:disabled`, `so:bundle:create`, `so:plugin:event`, а с портом полей, Select и коллекций — `so:input`, `so:open`, `so:close`, `so:reset`. Ломающее: слушатели на элементах soxa переименуйте — `addEventListener('action:press', …)` → `addEventListener('so:action:press', …)`, `show` → `so:show`; под прежним именем событие больше не приходит, и ошибки об этом нет.
  
  Angular: выход — `so` и полное имя ядра в camelCase: `input` → `soInput`, `show` → `soShow`, `hide` → `soHide`, `ready` → `soReady`, `elementReady` → `soElementReady`, `actionPress` → `soActionPress`, `changeValue` → `soChangeValue`, `inputValue` → `soInputValue`, `showBefore` → `soShowBefore`, `bundleCreate` → `soBundleCreate`, `pluginEvent` → `soPluginEvent`. На `(x)` у элемента Angular слушает и выход `x`, и событие DOM `x`, поэтому `(input)` на поле получал два вызова на нажатие — событие ядра и всплывшее событие браузера. Теперь `(input)` на `<so-input>`, `<so-check-box>` и `<so-switch>` — только событие браузера, как на нативном `<input>`, а событие ядра — `(soInput)` (или `(soInputValue)`, `(soChangeValue)`). Ломающее: привязки переименуйте — `(actionPress)` → `(soActionPress)`, `(changeValue)` → `(soChangeValue)`, `(show)` → `(soShow)` и т. д. Старую привязку шаблон не отвергнет: Angular примет её за событие DOM, и обработчик молча перестанет вызываться; подписка из кода (`button.actionPress.subscribe(…)`) перестанет компилироваться.
- bf6a08c: Плагин объявляется один раз, константой: `XPluginDescriptor` — определение, а не фабрика. Вызовы `XPluginDescriptor()` заменить на `XPluginDescriptor`, опции установки — `XPluginDescriptor.with(options)`; у `definePlugin` поля `options` больше нет. У дескриптора снят `getSlots()` — слоты читаются полем `slots`; декларации дескриптора `readonly` и заморожены.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- 3c38d3d: Связывание компонента с фреймворком — одно на все шесть адаптеров.
  
  Публичная поверхность компонента в именах фреймворка — `surfaceOf(descriptor, profile)` из `@soxa-ui/setup`: экспортные имена пропов и событий, умолчания и типы для статического слоя, список съеденных пропсов. Считается один раз на пару «дескриптор × профиль» и заменяет `TDescriptorInspector`, который пересчитывал то же самое на каждом монтировании и в двух режимах. Профиль (`IAdapterProfile`) — стратегия имён и слот по умолчанию, одна константа на адаптер: `VueProfile`, `ReactProfile`, `SolidProfile`, `SvelteProfile`, `WebcProfile`, `AngularProfile`.
  
  На монтирование адаптер берёт связку `bindComponent(adapter, profile)`: стартовое состояние, подписки на триггеры, проброс событий с дедупликацией, чтение и запись пропсов с guard'ом, спред несъеденных пропсов. Своих циклов по аксессору у адаптеров больше нет — остаётся только то, куда писать значение и как отдать событие.
  
  Удалены: `TDescriptorInspector` из `@soxa-ui/accessor`; `createInspectorFactory`, `collectEventBindings`, `collectForwardProps` из `@soxa-ui/setup`; `createInspector`, `useSyncProps`, `useSyncEvents` и их опции из адаптеров, а также `bindOutput`/`bindInput`/`buildInitialState`/`bindEvents` из Angular. Как обновиться: вместо `createInspector(descriptor).getExportEvents()` — `surfaceOf(descriptor, VueProfile).exportEvents`, вместо `getExportProps()` — `.exportProps`.
- f7b4492: Spinner удалён: компонент Vue и React, класс ядра `TSpinner` с типами `ISpinner`, `ISpinnerProps` и `TSpinnerEvents`, плагин `TSpinnerLayoutPlugin`, дескрипторы `SpinnerDescriptor` и `SpinnerLayoutPluginDescriptor` и стили Spinner в теме oren. Замена — ProgressSpinner с `indeterminate`: строчное кольцо той же шкалы размеров, которое бежит по кругу, пока доля неизвестна. Как обновиться: `<Spinner />` → `<ProgressSpinner indeterminate />`, имя — тем же `aria_label`. Отличия: роль кольца — `progressbar` без `aria-valuenow`, а не живая область `status`; содержимого у кольца нет — текст ставят рядом и связывают через `aria_labelledBy`; толщину кольца задаёт тема долей диаметра, пропа `borderWidth` и переменной толщины кольца больше нет. В React ProgressSpinner пока нет — его перенос идёт отдельно.
- 4100cf5: Кнопка на не-нативном теге (`div`) делает клик из Enter (на keydown) и пробела (на keyup), как браузер у `<button>`: на клавишу приходит `click`, а `action:press` — из него; `preventDefault` у keydown на любом обработчике по пути нажатие отменяет.
  
  Web Components: элементы soxa — нативные элементы своего тега (customized built-in). Вместо `<so-button>` пишется `<button is="so-button">`, вместо `<so-component-view>` — `<div is="so-component-view">`; из JS — `document.createElement('button', { is: 'so-button' })`. Кнопка — настоящая `<button>`: форму, `submitter`, `new FormData(form, submitter)`, Enter в поле, `form*`-атрибуты, `<fieldset disabled>`, `<label for>`, фокус и клавиатуру ведёт браузер. Для Safari пакет подключает полифил `@ungap/custom-elements`. Классы элементов собирает фабрика `SoxaElement(HTMLButtonElement, { descriptor, template, setup })` вместо наследования `TSoxaElement`; `defineProps`, реакции шаблона (`on`, `formAction`) и `TEventListener` убраны; `defineElement` принимает тег, который расширяется. Пробелы и комментарии вокруг слотов больше не глушат `text`; разметка со скриптом в `<head>` раскладывает слоты правильно.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
- b97ee10: Снятый проп возвращается к умолчанию декларации во всех адаптерах. Раньше `undefined` из фреймворка не доезжал до ядра, и трёхзначный проп — `closable` у элементов Tabs и Tags, `contentFit` у элемента ListBox — нельзя было вернуть из разметки к «как у владельца»: компонент оставался с последним заданным значением. Проп, который ни разу не задавали, по-прежнему не пишется, и внешний `ctrl` не затирается. У связки новый метод `writeChanged` для фреймворков, отдающих только изменившиеся пропсы: через него пишут Angular и Web Components. В Web Components снятый атрибут и свойство, выставленное в `undefined`, сбрасывают проп; Angular пишет входы, заданные при монтировании, и во внешний `ctrl`.
- a2e3e21: Web Components: иконка — `<span is="so-icon" icon="close">`. Роль — свой атрибут элемента `icon` (свойство `el.icon`), а не проп: по ней элемент рисует внутри себя `<svg>` иконки роли из подключённого пакета, растянутый на корень, и при смене роли перерисовывает тот же узел. Корень — сам `span`: размер (`size`, `width`, `height`), классы и доступное имя (`aria_label`; без него иконка скрыта от скринридера) — на нём, как у любого элемента. Голый `<svg>` с рисунком роли для своей разметки даёт `roleIcon(role)`, рисунок на готовом `<svg>` — `drawRoleIcon(svg, role)`. База элементов (`SoxaElement`) принимает свои атрибуты элемента сверх пропов — `attributes` в описании элемента. Тема oren делает корень иконки любого тега блоком, как `svg`: иконка не на `svg` — `<Icon>` без тега в любом адаптере — теперь берёт размер ступени.
- d620707: Web Components: Label, Input, CheckBox и Switch — `<label is="so-label">`, `<div is="so-input">`, `<span is="so-check-box">` и `<span is="so-switch">`. Поле — настоящий `<input>` внутри элемента, который написал потребитель, и форма видит его сама: `FormData`, `<label>`, `<fieldset disabled>` и валидация достаются нативному полю. Статические атрибуты разметки поля (`autocomplete`, `aria-label`, `tabindex`, `data-*`) при построении переезжают на `<input>`, а `class`, `style` и атрибуты пропов остаются на элементе, как и всё, что код запишет на него потом. `id` поля — проп, а не атрибут элемента: `id` из разметки стоит только на `<input>`, из кода — `el.ctrl.id`. Текст, отметку и «выбрано частично» элемент пишет в `<input>`, только когда они разошлись с ним, — каретка остаётся на месте. Имя кнопки очистки Input — из локали `<so-locale-provider>` и меняется на лету. События деталей разметки — кнопки очистки и иконки в ней — не всплывают: слушатели поля и делегирование на форме слышат только события самого поля. Набор, который разметка компонента кладёт на вложенный элемент soxa, главнее того, что элемент пишет себе сам, при любом порядке записи.
  
  Свой шаблон элемента (`ITemplate`) — по новому контракту: `create(root, hasSlot)` отдаёт `{ slots, control }` вместо одних точек слотов, а контекст привязок отдаёт ещё инстанс текущей связки (`ctrl`) и вывод слота по состоянию (`showSlot`).
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 5d2d8a9: Слой setup собирает компонент по одному составу. Состав монтирования (плагины дескриптора плюс регистрации приложения) считается один раз, и по нему строятся набор плагинов, units аксессора и начальные значения плагинных пропсов — раньше каждый выяснял состав сам, и плагины реестра доходили только до набора.
  
  Дескриптор стал описанием типа и только им: методы `createBundle` и `createAccessor` с него сняты (их звала одна сборка), а сам он строится один раз на тип — `defineDescriptor` кэширует фабрику, и монтирование больше не пересобирает всю цепочку до `EntityContribution`.
  
  Расширения `TPluginsBindingExtension` и `TPluginPropsExtension` удалены вместе с `resolveDefaultExtensions` и полем `defaultExtensions` в конфиге контекста. Начальные значения плагинных пропсов пишет сборка, а корневой узел привязывается методом контекста `adapter.bindElement(el)` — у компонента без `TElementPlugin` он ничего не делает. Как обновиться: `adapter.get(TPluginsBindingExtension)?.bindElement(el)` заменить на `adapter.bindElement(el)`, `{ defaultExtensions: [] }` из вызовов `createAdapterContext` убрать.
  
  `IAdapterContextOptions` и `IAdapterContextConfig` теперь экспортируются из `@soxa-ui/setup`.
- c3de8b0: Web Components: тип элемента (`TButtonElementProps` и соседи) выводится из контракта дескриптора, как пропсы React, Solid и Svelte. В нём появились свойства пропов плагинов дескриптора — `el.aria_label`, `aria_labelledBy`, `aria_describedBy`, у Frame `anchor_anchor`, `anchor_placement` и остальные пропсы якоря — и пропсы связки `pluginProps` и `embedded`. В браузере они работали и раньше, а в TypeScript запись `button.aria_label = 'Сохранить'` не компилировалась, и приходилось писать атрибут строкой; якорь атрибутом не задать вовсе. Общий тип свойств элемента — `TSoxaElementProps<typeof XDescriptor, HTMLXElement>`: пропсы дескриптора без свойств, которые у элемента есть по тегу, без `HOST_PROPS` и без `ctrl`.
- e0251d2: Web Components: Frame — `<div is="so-frame">`, слой поверх страницы. В цель `target` (по умолчанию `body`) уезжает сам элемент — с классом, атрибутами и слушателями, которые написал потребитель, — а на его месте остаётся комментарий-якорь. `contained` оставляет панель на месте, а без цели она стоит на месте скрытой. Содержимое панели остаётся в контексте места: кнопка в панели берёт локаль провайдера вокруг Frame, а не вокруг цели. Перенос, `contained` и смена цели не пересобирают ни Frame, ни элементы в панели; перестановка, которую делает потребитель, пересобирает, как раньше. Контейнер, снятый со страницы, уносит панель с собой, а вставленный снова — возвращает её в цель. Содержимое любого элемента теперь раскладывается по слотам, не покидая страницы, и элемент soxa внутри собирается один раз, на своём месте. Раньше несобранный собирался сперва вне документа, на английском, а уже собранный — ещё раз, когда его контейнер собирался позже него (сборку контейнера отложила регистрация).
- c37e233: Кнопки, которые компоненты рисуют сами, — очистка полей, крестики окна, панели, поповера, табов и тегов, листание календаря и ленты, кнопки DatePicker, строка таба, заголовок секции Accordion, сортировка колонки таблицы — получили `type="button"`. У `<button>` без `type` тип `submit`: в форме клик по очистке поля отправлял форму, а Enter в поле нажимал первую такую кнопку, и поле очищалось вместо отправки. Button, который ставит приложение, остаётся кнопкой отправки, как нативная `<button>`. В React, Solid и Svelte пропсы Button несут атрибуты кнопки: `type`, `form`, `name` и `value` типизированы.
- b39d9be: Web Components: коллекции RadioGroup, Tabs (с Tabs.Content) и Accordion — элементы владельца и частей, вход элемента в коллекцию при подключении, элементы из данных и образцы слотов item-*
- 5659d22: Инициализация компонента одинакова во всех адаптерах и идёт теми же путями, что и изменения.
  
  Пропсы применяет сборка компонента. Внешний `ctrl` и плагины получают через сеттер всё, что отличается от объявленного умолчания; свой инстанс получает пропсы ядра конструктором, и второй раз они не пишутся. Адаптеры стартовых значений больше не пишут, поэтому коллекция с пропом `items` во Vue при монтировании больше не очищается и не заполняется повторно. Проп, равный умолчанию, внешний `ctrl` не трогает. Пересборка контекста в React (StrictMode, `<Activity>`) — такое же монтирование: разметка снова применяется к внешнему `ctrl`.
  
  Значения из ядра фреймворк получает подпиской на связку. `binding.subscribe(listener)` сразу отдаёт каждое свойство тем же вызовом, что и срабатывание триггера, дальше — изменения; `binding.getSnapshot()` отдаёт неизменяемый снимок (React рисует по нему через `useSyncExternalStore`). Порядок «подписка, потом чтение» держит связка, поэтому изменение ядра между рендером и подпиской больше не теряется в React и Svelte. `update:<prop>` для `v-model` объявляет профиль Vue (`IAdapterProfile.model`) и эмитит связка в `bindEvents`.
  
  Как обновиться, если вы пишете свой адаптер: `binding.state()` и `binding.bindOutput(write)` заменены на `binding.subscribe(write)` (он же отдаёт начальное состояние) и `binding.getSnapshot()`; у `bindComponent` больше нет третьего параметра `previous`.
- 054a24f: Web Components: ListBox — `<div is="so-list-box">` с элементами `<div is="so-list-box-item">`, элементы из данных с распорками окна и образцы слотов `item-*`. Строка элемента — Button на `div`, `<div is="so-button-div">`: одно имя элемента расширяет один тег, и кнопку на другом теге регистрирует фабрика `registerButtonTag(tag)` под именем `so-button-<тег>` — с тем же описанием элемента, что у `<button is="so-button">`; тип такой кнопки — `TButtonElementProps<HTMLDivElement>`. Выключенный пункт списка остаётся фокусируемым и объявляется через `aria-disabled`.
- 5875ed2: Атрибут пропа с несколькими типами приводится по порядку типов: value="abc" остаётся строкой, width="50%" — строкой
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- 5c91838: Web Components: элемент, который уже стоит в разметке страницы, когда пакет регистрирует элементы, собирается микрозадачей позже импорта — после строк точки входа, где приложение подключает тему, иконки и плагины (`useTheme`, `setIcons`, `usePlugins`), и получает их во всех браузерах. Раньше в Chrome и Firefox он собирался ещё при импорте и оставался без них. `el.ctrl` у такого элемента появляется микрозадачей позже импорта, как уже было в Safari; элемент, созданный кодом, по-прежнему собран сразу после вставки.
- c9aaade: Адаптеры Vue, React, Solid и Web Components уезжают собранным ESM с декларациями в dist, а не исходниками
- b21cb75: Рантайм адаптера принимает собранный контекст — `adapter.attach()` при инициализации компонента (Angular — в `ngOnInit`, Web Components — в `connectedCallback`), парой к `destroy()`.
- c876282: Web Components: ProgressSpinner и Skeleton — `<span is="so-progress-spinner">` и `<div is="so-skeleton">`; у Skeleton `visible` и `rendered` убирают только заглушку, а корень с содержимым остаётся на виду. `<so-locale-provider>` даёт поддереву язык и строки библиотеки: свойство `locale` (локаль — объект, атрибута нет) пишется в источник провайдера, элементы собираются через `createWebcAdapterContext` и берут локаль ближайшего провайдера вверх по документу — смена доходит до них без пересборки, а элемент, переставленный под другой провайдер, берёт его локаль. Стиль корня база элемента раскладывает по свойствам — размер от плагина раскладки и стиль-выход компонента (доля кольца; имя выхода называет описание корня `TRootSpec`), — а `style` потребителя и свойства, которые плагины пишут в узел сами, не трогает. Содержимое слота, которого у компонента нет, больше не выводится (раньше оно ложилось в корень) — как в остальных адаптерах.
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
