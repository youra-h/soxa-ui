# @soxa-ui/angular

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
- 8e68380: Add a theme-defined Alert view property with reactive classes and Angular bindings.
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
- 8e68380: Add a theme-defined Alert view property with reactive classes and Angular bindings.
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

- 93b818d: Add Angular Forms support for writable value components. Install @angular/forms alongside the Angular adapter; existing model and event bindings are unchanged.
- 7327698: Select: rename the tags_overflow prop to tagsOverflow. Update component props and collection facade access to the new name.
- 1d2d4a0: Restrict adapter entry points to application components, helpers and consumer types. Remove assembly, profile, binding, generated metadata and template exports; use supported component props, slots, refs and core models instead. Vue now exports all component Props types. No public internal entry point is provided.
- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- 94263ac: Angular: outputs shared by every visual component (the events of `ComponentViewDescriptor` — `soShow`, `soChangeVisible` and the rest) are declared once, by the new abstract directive `TViewSurface` that every visual `T<Name>Surface` extends. `<Name>OutputNames` of a visual component now lists only its own outputs; the full list is `[...ViewOutputNames, ...<Name>OutputNames]`. Template bindings and output types do not change.
- 28bcd83: Remove duplicate `input`, `input:value`, `show:after`, and `hide:after` component events. Subscribe to `change:value` for value changes and to `show` or `hide` after the corresponding lifecycle hook. Angular consumers must replace `soInput` and `soInputValue` with `soChangeValue`, and `soShowAfter`/`soHideAfter` with `soShow`/`soHide`. The `open`, `close`, `element:ready`, `element:removed`, and `ready` events remain available.
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
- 5d2df6e: Smaller production bundle: component outputs no longer ship a generated getter each; output names, types and the emitter created on first read are unchanged
- 31a6d13: Add native Angular two-way bindings through typed propertyChange outputs, including collection and plugin properties.
- 4dc0de8: Fix the generated Frame model output to use strategyChange after the strategy rename.
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 1eae72b: Fix the Popover and Dialog README examples to read `newValue` from property change event payloads.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- defba58: README: the theme stylesheet goes into `src/styles.css` (`@import '@soxa-ui/theme-oren';`): Angular CLI puts CSS imported from `main.ts` into a chunk the page never loads.
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

- 93b818d: Add Angular Forms support for writable value components. Install @angular/forms alongside the Angular adapter; existing model and event bindings are unchanged.
- 7327698: Select: rename the tags_overflow prop to tagsOverflow. Update component props and collection facade access to the new name.
- 1d2d4a0: Restrict adapter entry points to application components, helpers and consumer types. Remove assembly, profile, binding, generated metadata and template exports; use supported component props, slots, refs and core models instead. Vue now exports all component Props types. No public internal entry point is provided.
- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- 94263ac: Angular: outputs shared by every visual component (the events of `ComponentViewDescriptor` — `soShow`, `soChangeVisible` and the rest) are declared once, by the new abstract directive `TViewSurface` that every visual `T<Name>Surface` extends. `<Name>OutputNames` of a visual component now lists only its own outputs; the full list is `[...ViewOutputNames, ...<Name>OutputNames]`. Template bindings and output types do not change.
- 28bcd83: Remove duplicate `input`, `input:value`, `show:after`, and `hide:after` component events. Subscribe to `change:value` for value changes and to `show` or `hide` after the corresponding lifecycle hook. Angular consumers must replace `soInput` and `soInputValue` with `soChangeValue`, and `soShowAfter`/`soHideAfter` with `soShow`/`soHide`. The `open`, `close`, `element:ready`, `element:removed`, and `ready` events remain available.
- e682670: Publish only explicitly declared descriptor events. Internal property triggers no longer appear as component callbacks, Vue events, Angular outputs or Web Component events. Declare application notifications in contribution.events; property state refresh and two-way model updates remain driven by triggers.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- 0690162: Frame: rename position to strategy and TFramePosition to TFrameStrategy. Replace the prop, controller property and change:position event with strategy and change:strategy; Angular outputs use soChangeStrategy.

### Patch Changes

- a491c3f: README: the stylesheets of the theme per component, next to the whole one; Angular — the page of the six components fits the budget of a new project with them.
- 5d2df6e: Smaller production bundle: component outputs no longer ship a generated getter each; output names, types and the emitter created on first read are unchanged
- 31a6d13: Add native Angular two-way bindings through typed propertyChange outputs, including collection and plugin properties.
- 4dc0de8: Fix the generated Frame model output to use strategyChange after the strategy rename.
- 3cb5c3c: Document the explicit @soxa-ui/setup dependency required by application theme and icon registration.
- 1eae72b: Fix the Popover and Dialog README examples to read `newValue` from property change event payloads.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- defba58: README: the theme stylesheet goes into `src/styles.css` (`@import '@soxa-ui/theme-oren';`): Angular CLI puts CSS imported from `main.ts` into a chunk the page never loads.
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
- 2e2ff15: Calendar month picker places create their list on the first opening of their popover: `pickers[i].list` is now `{ ctrl, engine }`, `undefined` until then, and `pickers[i].engine` is gone — read `pickers[i].list?.ctrl` and `pickers[i].list?.engine`.
- 54f5b1d: Select builds options from `items` on the first opening of its panel (`contentRendered`), as Menu and DatePicker do; closing only hides them, and options written in markup are mounted as before. `Virtual` measures its window once the first drawn item enters the document.
  
  What broke and how to update: before the first opening, options from `items` are not in the document and have no `id` — open the panel (`open`) before reading them.

### Patch Changes

- e7df36a: Tabs.Content accepts its content as `<ng-template slot="default">`: an inactive panel then creates nothing, and leaving the tab removes it.
- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 0576069: Angular and Svelte adapters keep less memory per mounted component: fewer signals, computeds and effects in the adapter wiring. In Angular, `state()`, `instance()`, `facade()` and `rootElement()` of the component base are methods now, called the same way, and only components that read slots query slot templates.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- c0260ec: Menu and Menu.Submenu accept their items as `<ng-template slot="default">`: the menu creates the template with the first opening of its panel, while items written as a projection Angular creates together with the menu.
- 1829a75: Popover and Menu.PopoverItem accept panel content as `<ng-template slot="default">`: with `lazyMount`, its components are created on first open instead of right away. Calendar creates its month and year picker on first open.
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

### Minor Changes

- 6f96bae: Table: `resizable` и `reorderable` таблицы — значение колонок без своего, своё значение колонки сильнее. Ломающее: по умолчанию `resizable` и `reorderable` колонки — `undefined` («как у таблицы»), а не `false`, и геттер колонки отдаёт итог, а `change:resizable` и `change:reorderable` колонки приходят и от смены у таблицы. Обновиться: разметку менять не нужно — у таблицы по умолчанию их тоже нет; своё значение колонки читается из `getProps()`.

### Patch Changes

- f890f7b: Table на Angular держит память вровень с Vue: запросы узлов шаблона объявляет поверхность только на ссылки своего шаблона, ветка th/td — над петлёй ячеек (пайп soRuns), раскладчик атрибутов — без Map и модульного WeakMap
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
- 64be9ca: Прокрутка списков одна на ListBox, Select и Menu: за установкой value и за подсветкой, откуда бы они ни пришли. Подсветка докручивает элемент ближайшим краем; value двигает только сам список — частично видный элемент ближайшим краем, невидимый в центр. `change:highlight` навигации списка сообщает о видимой подсветке, позиция без отметки его не шлёт. `TMenuNavigationPlugin.highlightItem` и `unhighlight` больше не принимают `FocusOptions`: фокус меню не прокручивает. `TListScrollPlugin` слушает подсветку навигации, которую называет опция `navigation` (`ListScrollPluginDescriptor.with({ navigation: TListKeyboardPlugin })`); без опции он идёт только за значением.
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

- 7e8e605: Angular: компонент отдаёт базе setup-функцию в конструкторе — super(setupButton, { strategy: 'host' }); абстрактного createBinding больше нет, имена входов подставляет сгенерированная T<Имя>Surface. Сломалось: свой компонент на TComponentBase или T<Имя>Surface вместо createBinding передаёт setup-функцию конструктору (владелец коллекции — стрелкой с this.engine); generated/*.metadata.ts отдаёт XInputNames и XOutputNames напрямую, файлов base.component.ts нет. Методы-пересылки шаблонов (choose, toggle, check, openPanel, confirm, toggleSort, toggleMaximized, close у Dialog, Drawer и тоста) заменены вызовом в шаблоне. standalone: true убран как умолчание.
- c08493e: Адаптер Angular: корень компонента разобран на стратегии (runtime/root/), раскладка и перенос атрибутов — общими помощниками, комментарии сокращены. Сломалось: у TBinding нет поля plugins — Angular его не читал; если код потребителя брал binding.plugins, берите набор у контекста (adapter.bundle). Тип TToastRender по-прежнему экспортируется, модуль toasts/types удалён.

### Patch Changes

- 935b215: Angular: комментарии компонентов и шаблонов сокращены до шапок со ссылкой на AGENTS.md (Angular); код не менялся.
- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- 8b3e23f: `<so-virtual>` → `<ng-container so-virtual>`, так же `so-drag-and-drop` и `so-component`
- f29f5d2: Angular: Toasts — `<div so-toasts>` вокруг приложения, написанное на нём уходит региону; тост из кода — `useToasts().show()`. `TRootSpec.order` — имя свойства стиля: `order: true` → `order: 'order'`.
- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.
- 5401574: Angular: поля, ListBox, Tabs, их элементы, элемент Accordion и Table пишутся атрибутом на обычном теге, как Button: CheckBox и Switch — на `span` (`<span so-check-box>`), остальные — на `div` (`<so-input>` → `<div so-input>`). Привязки и слушатели на компоненте (`[attr.x]`, `[title]`, `(focus)`) доходят до внутреннего узла, как у Vue и React. Как обновиться: заменить теги (`<so-input …/>` → `<div so-input …></div>`) и добавить `provideAttrs()` в `providers` `appConfig` — на сервере и в браузере; без него эти компоненты бросают ошибку. Компонент на элементе, в который его шаблон не отрисуется (`<input so-input>`, `<textarea so-textarea>`), — тоже ошибка. Новая peer-зависимость — `@angular/platform-browser`.
- 1173b40: Минимальная версия Angular — 22.2.0 (была 22.1.6): спеки адаптера берут `TestBed.createDirective` и `ɵgetDirectiveDef`, которых до 22.2 нет, и на 22.1 не собираются — поддержка 22.1 не проверена. Обновите `@angular/*` до 22.2.0 или новее.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.
- 9284597: Angular: Tags и Select — `<div so-tags>`, `<div so-select>`, части `so-tags-item`, `so-select-item`, `so-select-group`. `[so-attributes]` на поле, элементе коллекции, ListBox и Tabs кладёт набор туда же, куда остальное, написанное на компоненте: на `<input>`, строку или узел списка, а не на корень. Стили корня, завязанные на этот набор, перенесите на этот узел.
- 7137eaa: Группы из разметки (`Menu.Group`, `Menu.RadioGroup`, `ListBox.Group`, `Select.Group`) входят в группировку коллекции, и `sections` описывают их с подписью. Элемент без группы больше не уходит в конец, а остаётся на своём месте среди незаявленных групп; чтобы вернуть прежний порядок, заявите группы в `groups`.
- 8d4064e: `onChangeSelected` элемента коллекции (`ListBox.Item`, `Select.Item`, `Tags.Item`, `Accordion.Item`, `Table.Row`, флажки и переключатели `Menu`) и `onChangeActive` (`Tabs.Item`, `Tabs.Content`, `RadioGroup.Item`) приходят только элементу, чьё состояние сменилось, и несут новое значение: `onChangeSelected={(selected) => …}`. `change:selection` владельца вторым аргументом отдаёт элементы, чья отметка сменилась, `change:activation` — прежний активный; в Web Components `detail` этих двух событий — пара: где читали `detail`, читайте `detail[0]`.
- eb1522f: Минимальная версия Angular — 22.1.6 (была 21.1): ниже группы и подменю в шаблоне `item-content` у Menu не отдавали слой своим пунктам. Обновите `@angular/*` до ^22.1.6.
- 15277f5: Удалена директива `SlotOutletDirective` (`[so-slot-outlet]`): шаблон с зависимостями места вывода — встроенный `ngTemplateOutlet` с `ngTemplateOutletInjector: 'outlet'`.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- 096940f: Angular: DateInput, Calendar и DatePicker — `<div so-date-input>`, `<div so-calendar>` (день — `<td so-calendar-item>`), `<div so-date-picker>`. Слоты — шаблоны `<ng-template slot>`: у календаря `item` (`let-item`, `let-text`), `prev-icon`, `next-icon`, `footer`; у поля даты `leading`, `clear`, `trailing`; у DatePicker `clear`, `trigger-icon`, `item`. `id` поля даты и DatePicker — на корне.
- bee7536: Angular: у Frame нет гидратации (`ngSkipHydration` на хосте) — всё, что написано в панели, браузер строит сам. Текст, спроецированный в панель компонента с Frame в шаблоне (подсказка Tooltip), после гидратации больше не пропадает.
- fd58d95: Angular: ProgressLinear, Slider, Rating, Pagination и Scroller — по разметке Vue, атрибутом на теге ядра: `<span so-progress-linear>`, `<span so-slider>`, `<span so-rating>`, `<nav so-pagination>`, `<div so-scroller>`. Ползунок и оценка — нативные поля `range` в ручках; значение приходит выходом `(soChangeValue)` в той форме, в какой его задали, `(soCommit)` — одно на действие. В поле формы `Field` подпись называет оценку и ползунок с одной ручкой своим `for`, а ползунок с несколькими ручками — группу ссылкой. Пагинация — коллекция страниц окна с пропусками: страница — внутренняя часть и наружу не выходит, слоты — шаблоны `item`, `prev-icon` и `next-icon`, имена стрелок и цифры номеров — от локали поддерева, окно и текущая страница — уже в серверной разметке. У ленты кнопки — вне вьюпорта, роль ряда — `viewportAria`. Атрибуты потребителя у всех пяти остаются на корне. Слои без разметки — `setupInteractive`, `setupValueControl` и `setupInputControl` с поверхностями `TInteractiveSurface`, `TValueControlSurface`, `TInputControlSurface`; описание корня `TRootSpec` получило `aria` — выход, из которого база берёт слой `aria` корня.
- 309ce24: DragAndDrop во всех адаптерах: перестановка элементов Tabs, ListBox и Accordion перетаскиванием, события `move:before` и `move` (`onMoveBefore`/`onMove`, `(soMoveBefore)`/`(soMove)`, `so:move:before`/`so:move`); в Angular — `<ng-container so-drag-and-drop>`, в Web Components — `<so-drag-and-drop>`
- 743c56c: Textarea в React, Solid, Svelte, Angular и Web Components — многострочное поле с авторостом и счётчиком символов, как во Vue
- bee7536: Angular: Popover и Tooltip — `<span so-popover>` и `<span so-tooltip>`; триггер — шаблон слота `<ng-template slot="trigger">`, связку с панелью на свой элемент кладёт `[so-attributes]`.
- 514f6d0: Angular: `rendered=false` у компонента и неактивная панель таба прячут и открытые панели вложенных слоёв — подменю, поповера в поповере, окна в панели, — как у остальных адаптеров, где такой компонент снимается целиком.
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- b97bc5c: Angular: Menu — `<span so-menu>` с частями `so-menu-item`, `so-menu-checkbox-item`, `so-menu-radio-group` и `so-menu-radio-item`, `so-menu-group`, `so-menu-separator`, `so-menu-submenu`, `so-menu-popover-item`; триггер — шаблон слота `<ng-template slot="trigger">`, контекстное меню — `openOn="contextmenu"`.
- c68b9d1: Angular: компонент, снятый `rendered=false` (своим, у предка или как неактивная панель таба), отдаёт плагинам узел `null`, как у Vue. Открытое окно и выезжающая панель отпускают прокрутку страницы и `aria-hidden` фона, а снова показанный компонент получает узел и `element:ready` заново.
- 8ee9333: Angular: Dialog и Drawer — `<div so-dialog>` и `<div so-drawer>`; подложку адаптер ставит перед панелью сам, открытость — `[visible]` и `(soChangeVisible)`.
- c7c8d12: Angular: слот `item-content` у Menu — пункты подменю из данных разметкой.
- 542da8d: Angular: DatePicker больше не передаёт rendered своей панели — её прячет признак поддерева, как у Select, поповера и меню. Поведение то же.
- 3167c92: NumberInput в Angular (`<div so-number-input>`) — поле числа в формате языка: шаг и границы, клавиши, кнопки «−» и «+» с удержанием, как во Vue
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

- 5f4c58a: Menu: контекстное меню — режим `openOn: 'contextmenu'` (`open-on="contextmenu"` во Vue). Меню открывают правая кнопка, долгое касание, клавиша контекстного меню и Shift+F10 над областью в слоте `trigger`, и панель встаёт у точки вызова (`point`); у области нет связки кнопки — `triggerAria` пуст. У Frame новый вход `anchor_point`: точка в координатах окна вместо якоря, главнее него, пока задана.
- 4206633: Tabs: корень набора несёт `data-disabled`, как ListBox и Table: по нему тема гасит выключенный набор вместе с панелями.
- dd15cd3: Поле формы Field в React, Solid, Svelte, Angular (`<div so-field>`) и Web Components (`<div is="so-field">`): подпись, подсказка и ошибка связаны с Input, CheckBox, Switch и RadioGroup внутри — `for` подписи или ссылка `aria-labelledby` у группы, справка в `aria-describedby`, ошибка — `aria-invalid` и `data-invalid` контрола. На корне Input, CheckBox и Switch теперь и `dataset` (`data-disabled`, `data-invalid`): по ним тема красит поле и подпись поля формы.
- e888c8f: Минимальные версии фреймворков ниже: Vue 3.5.21 вместо 3.5.32, Solid 1.9.10 вместо 1.9.17, Angular 21.1 вместо 22.1.5.
- 865d328: Table и Virtual в Angular: `<div so-table>` с частями `th[so-table-column]` и `tr[so-table-row]` — колонки и строки данными или движком снаружи, сортировка, выбор строк с «выбрать все», ручка ширины и перестановка колонок, сетка, закреплённая шапка, шаблоны `header` и `cell`, проекция `empty`; окно — `<so-virtual>` вокруг таблицы и списка. Атрибуты потребителя и скрытие — окну таблицы.
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
- 9dfdb31: Angular и Web Components: теги компонентов сменили префикс `soxa-` на `so-` — `<so-button>`, `<so-component-view>`, в Angular ещё `<so-component>`. Переименуйте теги в шаблонах и разметке, а также строки в `querySelector`, `createElement` и ключах `HTMLElementTagNameMap`: старые имена не зарегистрированы, и `<soxa-button>` больше не кнопка. CSS-классы (`s-*`) и имена пакетов (`@soxa-ui/*`) не меняются.
- 88db640: Префикс `so` — у каждого события, которое адаптер отдаёт туда, где его слышит и DOM: у событий Web Components и у выходов Angular, без исключений. Префикс говорит, чьё это событие, поэтому стоит у всей категории, а не у имён, что совпали бы с событием браузера: угадывать, у каких событий он есть, не нужно. Разделитель — тот, что в схеме имён адаптера: `:` у Web Components, camelCase у Angular.
  
  Web Components: событие элемента — `so:` и полное имя ядра: `so:show`, `so:hide`, `so:ready`, `so:show:before`, `so:element:ready`, `so:action:press`, `so:change:disabled`, `so:bundle:create`, `so:plugin:event`, а с портом полей, Select и коллекций — `so:input`, `so:open`, `so:close`, `so:reset`. Ломающее: слушатели на элементах soxa переименуйте — `addEventListener('action:press', …)` → `addEventListener('so:action:press', …)`, `show` → `so:show`; под прежним именем событие больше не приходит, и ошибки об этом нет.
  
  Angular: выход — `so` и полное имя ядра в camelCase: `input` → `soInput`, `show` → `soShow`, `hide` → `soHide`, `ready` → `soReady`, `elementReady` → `soElementReady`, `actionPress` → `soActionPress`, `changeValue` → `soChangeValue`, `inputValue` → `soInputValue`, `showBefore` → `soShowBefore`, `bundleCreate` → `soBundleCreate`, `pluginEvent` → `soPluginEvent`. На `(x)` у элемента Angular слушает и выход `x`, и событие DOM `x`, поэтому `(input)` на поле получал два вызова на нажатие — событие ядра и всплывшее событие браузера. Теперь `(input)` на `<so-input>`, `<so-check-box>` и `<so-switch>` — только событие браузера, как на нативном `<input>`, а событие ядра — `(soInput)` (или `(soInputValue)`, `(soChangeValue)`). Ломающее: привязки переименуйте — `(actionPress)` → `(soActionPress)`, `(changeValue)` → `(soChangeValue)`, `(show)` → `(soShow)` и т. д. Старую привязку шаблон не отвергнет: Angular примет её за событие DOM, и обработчик молча перестанет вызываться; подписка из кода (`button.actionPress.subscribe(…)`) перестанет компилироваться.
- 089c372: Angular: Icon, ProgressSpinner и Skeleton. Корень у них, как у Button, — сам элемент потребителя: `<i so-icon>`, `<span so-progress-spinner>`, `<div so-skeleton>`; у Skeleton `visible` и `rendered` убирают только заглушку, а корень с содержимым остаётся на виду. Иконка из пакета иконок — `<svg so-icon so-role-icon="close">`: рисунок роли кладёт директива `RoleIconDirective`, мимо санитайзера, — отсюда `@angular/platform-browser` в `peerDependencies`. `LocaleProviderDirective` (`[so-locale-provider]`, ставится и на `<ng-container>`) даёт поддереву язык и строки библиотеки: компоненты собираются через `createAngularAdapterContext` и берут локаль ближайшего провайдера из DI, смена входа `locale` доходит до них без пересборки. Стиль корня база раскладывает по свойствам — размер от плагина раскладки и стиль-выход компонента (доля кольца), — а `style` и `[style.x]` потребителя и свойства, которые плагины пишут в узел сами, не трогает. Ломающее для своих компонентов на `TComponentBase`: второй параметр конструктора — описание корня (`TRootSpec`), вместо `super(ButtonInputNames, 'host')` пишите `super(ButtonInputNames, { strategy: 'host' })`; свою сборку переведите на `createAngularAdapterContext`, иначе компонент не получит локаль поддерева.
- 4e9f889: Angular: всё, что называет ядро на корне-хосте, — атрибут набора, класс, свойство стиля, — база компонента считает своим всегда, как привязку хоста `[attr.x]` или `[class.x]`, и пишет поверх того, что стоит на элементе. Поэтому после гидратации компонент обновляет классы, атрибуты и стиль, которые напечатал сервер: смена `size` меняет модификатор, а не добавляет второй, включение кнопки снимает `aria-disabled`, доля кольца идёт за значением. Ломающее: значение потребителя под именем, которое называет ядро, больше не главнее набора — `tabindex="-1"` на `<div so-button>` ядро перепишет своим `0`, `role="link"` на `<a so-button>` — ролью кнопки, `[style.width]` на иконке с `width` — размером ядра, а класс с именем модификатора ядро снимет вместе со своим. Атрибуты, классы и стиль под другими именами остаются за потребителем. Frame, как оверлей CDK, есть только в браузере: на сервере, до первой отрисовки и без цели от панели остаётся пустой скрытый элемент потребителя — без содержимого, классов, наборов и раскладки ядра, и с `contained` тоже.
- 3aa2913: Angular: эмиттер выхода заводится при первом чтении выхода — привязкой в шаблоне или подпиской из кода, — а не на каждый выход заранее в конструкторе: компонент, на чьи выходы никто не подписан, больше не держит по эмиттеру на выход (у кнопки их 36). Выход в `T<Имя>Surface` теперь геттер прежнего типа `TOutputEmitter`, события ядра уходят только в заведённые эмиттеры, а `outputToObservable` по выходу по-прежнему завершается вместе с компонентом. Ломающее для своих компонентов на `TComponentBase`: конструктор принимает `(inputNames, rootStrategy?)` без имён выходов — вместо `super(ButtonInputNames, ButtonOutputNames)` пишите `super(ButtonInputNames)`, вместо `super(ComponentViewInputNames, ComponentViewOutputNames, 'host')` — `super(ComponentViewInputNames, 'host')`; `TBinding.syncEvents` принимает поиск эмиттера по имени выхода `(name) => EventEmitter | undefined` вместо записи эмиттеров.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- 3c38d3d: Связывание компонента с фреймворком — одно на все шесть адаптеров.
  
  Публичная поверхность компонента в именах фреймворка — `surfaceOf(descriptor, profile)` из `@soxa-ui/setup`: экспортные имена пропов и событий, умолчания и типы для статического слоя, список съеденных пропсов. Считается один раз на пару «дескриптор × профиль» и заменяет `TDescriptorInspector`, который пересчитывал то же самое на каждом монтировании и в двух режимах. Профиль (`IAdapterProfile`) — стратегия имён и слот по умолчанию, одна константа на адаптер: `VueProfile`, `ReactProfile`, `SolidProfile`, `SvelteProfile`, `WebcProfile`, `AngularProfile`.
  
  На монтирование адаптер берёт связку `bindComponent(adapter, profile)`: стартовое состояние, подписки на триггеры, проброс событий с дедупликацией, чтение и запись пропсов с guard'ом, спред несъеденных пропсов. Своих циклов по аксессору у адаптеров больше нет — остаётся только то, куда писать значение и как отдать событие.
  
  Удалены: `TDescriptorInspector` из `@soxa-ui/accessor`; `createInspectorFactory`, `collectEventBindings`, `collectForwardProps` из `@soxa-ui/setup`; `createInspector`, `useSyncProps`, `useSyncEvents` и их опции из адаптеров, а также `bindOutput`/`bindInput`/`buildInitialState`/`bindEvents` из Angular. Как обновиться: вместо `createInspector(descriptor).getExportEvents()` — `surfaceOf(descriptor, VueProfile).exportEvents`, вместо `getExportProps()` — `.exportProps`.
- c5cc05d: Angular: у компонентов нет обёртки — селектор стал атрибутом, и корень компонента — элемент, который написал потребитель: `<button so-button>`, `<a so-button href>`, `<div so-button>`; у ComponentView — `[so-component-view]`. Замените `<so-button …>` на `<button so-button …></button>` (или другой тег — какой написан, так элемент себя и ведёт), а `<so-component-view>` — на элемент с атрибутом `so-component-view`. Класс, стиль, атрибуты и события на этом элементе работают без проброса, а атрибут потребителя главнее того, что пишет компонент (`tabindex="-1"`, `role="link"` остаются). Входа `tag` больше нет: тег берётся у элемента. `rendered=false` прячет корень, а не удаляет его, и инлайновый `display` потребителя главнее скрытия. Без компонента в `imports` `<button so-button>` — обычная кнопка, Angular об этом молчит. Директива `AriaDirective` удалена из экспорта. `<so-component>` больше не выводит содержимое — как и в остальных адаптерах.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
- b97ee10: Снятый проп возвращается к умолчанию декларации во всех адаптерах. Раньше `undefined` из фреймворка не доезжал до ядра, и трёхзначный проп — `closable` у элементов Tabs и Tags, `contentFit` у элемента ListBox — нельзя было вернуть из разметки к «как у владельца»: компонент оставался с последним заданным значением. Проп, который ни разу не задавали, по-прежнему не пишется, и внешний `ctrl` не затирается. У связки новый метод `writeChanged` для фреймворков, отдающих только изменившиеся пропсы: через него пишут Angular и Web Components. В Web Components снятый атрибут и свойство, выставленное в `undefined`, сбрасывают проп; Angular пишет входы, заданные при монтировании, и во внешний `ctrl`.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 5d2d8a9: Слой setup собирает компонент по одному составу. Состав монтирования (плагины дескриптора плюс регистрации приложения) считается один раз, и по нему строятся набор плагинов, units аксессора и начальные значения плагинных пропсов — раньше каждый выяснял состав сам, и плагины реестра доходили только до набора.
  
  Дескриптор стал описанием типа и только им: методы `createBundle` и `createAccessor` с него сняты (их звала одна сборка), а сам он строится один раз на тип — `defineDescriptor` кэширует фабрику, и монтирование больше не пересобирает всю цепочку до `EntityContribution`.
  
  Расширения `TPluginsBindingExtension` и `TPluginPropsExtension` удалены вместе с `resolveDefaultExtensions` и полем `defaultExtensions` в конфиге контекста. Начальные значения плагинных пропсов пишет сборка, а корневой узел привязывается методом контекста `adapter.bindElement(el)` — у компонента без `TElementPlugin` он ничего не делает. Как обновиться: `adapter.get(TPluginsBindingExtension)?.bindElement(el)` заменить на `adapter.bindElement(el)`, `{ defaultExtensions: [] }` из вызовов `createAdapterContext` убрать.
  
  `IAdapterContextOptions` и `IAdapterContextConfig` теперь экспортируются из `@soxa-ui/setup`.
- d6f5273: Angular: значение входа в строгом шаблоне приложения сверяется с типом пропа. Раньше входы компонентов были объявлены только именами, и шаблон со `strictTemplates` пропускал любое значение: число в `[text]`, размер, которого нет, вид, которого тема не объявила. Теперь это ошибки компиляции шаблона. Входы и выходы объявляет сгенерированная директива `T<Имя>Surface` (`TButtonSurface`, `TComponentViewSurface`, `TComponentSurface`; для своего компонента на дескрипторах Stylable, Control и Textable — `TStylableSurface`, `TControlSurface`, `TTextableSurface`), а `@Component` компонентов их больше не перечисляет. Тип входа — `TInputValue`: тип пропа дескриптора по имени входа.
- e5ba991: Angular: id монтирования — номер сборки компонента в его приложении с префиксом `APP_ID` (`ng-1`, `ng-2`, …). Id места в дереве Angular не даёт, но гидратация собирает компоненты в том же порядке, что и сервер, поэтому `id`, которые плагины строят от id монтирования, у серверного рендера и браузера сходятся; id, заданный опцией сборки (`mountId`), остаётся за тем, кто его задал. Иконка по роли рисуется и на сервере: `RoleIconDirective` кладёт рисунок эффектом через `insertAdjacentHTML`, а не привязкой `[innerHTML]` — DOM-эмуляция серверного рендера Angular не умеет `innerHTML` у SVG, и ошибка обрывала отрисовку всей страницы на сервере. Санитайзер Angular директиве больше не нужен, и `@angular/platform-browser` из peer-зависимостей убран: адаптер его не импортирует.
- c37e233: Кнопки, которые компоненты рисуют сами, — очистка полей, крестики окна, панели, поповера, табов и тегов, листание календаря и ленты, кнопки DatePicker, строка таба, заголовок секции Accordion, сортировка колонки таблицы — получили `type="button"`. У `<button>` без `type` тип `submit`: в форме клик по очистке поля отправлял форму, а Enter в поле нажимал первую такую кнопку, и поле очищалось вместо отправки. Button, который ставит приложение, остаётся кнопкой отправки, как нативная `<button>`. В React, Solid и Svelte пропсы Button несут атрибуты кнопки: `type`, `form`, `name` и `value` типизированы.
- 5c4b041: Angular: булев вход принимает атрибут без значения — `<so-button disabled>` выключает кнопку, как в остальных адаптерах. Раньше атрибут отдавал входу пустую строку, и кнопка оставалась включённой. Значение по-прежнему сверяется с типом: `disabled="yes"` и `[disabled]="'yes'"` — ошибки шаблона.
- 5659d22: Инициализация компонента одинакова во всех адаптерах и идёт теми же путями, что и изменения.
  
  Пропсы применяет сборка компонента. Внешний `ctrl` и плагины получают через сеттер всё, что отличается от объявленного умолчания; свой инстанс получает пропсы ядра конструктором, и второй раз они не пишутся. Адаптеры стартовых значений больше не пишут, поэтому коллекция с пропом `items` во Vue при монтировании больше не очищается и не заполняется повторно. Проп, равный умолчанию, внешний `ctrl` не трогает. Пересборка контекста в React (StrictMode, `<Activity>`) — такое же монтирование: разметка снова применяется к внешнему `ctrl`.
  
  Значения из ядра фреймворк получает подпиской на связку. `binding.subscribe(listener)` сразу отдаёт каждое свойство тем же вызовом, что и срабатывание триггера, дальше — изменения; `binding.getSnapshot()` отдаёт неизменяемый снимок (React рисует по нему через `useSyncExternalStore`). Порядок «подписка, потом чтение» держит связка, поэтому изменение ядра между рендером и подпиской больше не теряется в React и Svelte. `update:<prop>` для `v-model` объявляет профиль Vue (`IAdapterProfile.model`) и эмитит связка в `bindEvents`.
  
  Как обновиться, если вы пишете свой адаптер: `binding.state()` и `binding.bindOutput(write)` заменены на `binding.subscribe(write)` (он же отдаёт начальное состояние) и `binding.getSnapshot()`; у `bindComponent` больше нет третьего параметра `previous`.
- 37a3c30: Адаптер Angular выходит собранным. Пакет собирает `ng-packagr` в частичной форме по Angular Package Format — один FESM-модуль и декларации одним файлом, — и компилятор приложения дособирает его компоненты под свою версию Angular. Раньше пакет отдавал исходники (`src/index.ts`), и в чужом проекте он не собирался. Точки входа — `main` и `types`, поля `exports` у манифеста нет.
- f8b8ef4: Angular: коллекции RadioGroup, ListBox, Tabs и Accordion. Части — отдельные теги (`<so-list-box-item>`, `<so-tabs-item>`, `<div so-tabs-content>`, `<so-accordion-item>`, `<label so-radio-group-item>`), элементы разметки входят в коллекцию в порядке DOM и на сервере. Лифт коллекции — слой DI на владельца (`provideElevator()` в `providers`); поле `token` у `TAngularElevator`, которое ни к чему не было подключено, убрано. Узел плагинам компонент отдаёт только в браузере, после отрисовки.
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- 0078caf: Frame в Angular: панель идёт за местом. Место, которое Angular вынул из документа, не снимая компонента, — условный `<ng-content>` чужого компонента, отсоединённое представление, — уводит из цели и панель, а вернувшееся место возвращает её в цель тем же узлом. Узел вне документа — проекция, закрытая с самого начала, узел `createComponent` без хоста — в цель не уезжает, пока его не вставят.
- e9eed1c: Angular: у выходов компонентов появился тип. Привязка события в строгом шаблоне приложения (`strictTemplates`, умолчание новых проектов Angular) — например `(soActionPress)="onPress($event)"` у `so-button`, как в README, — раньше не компилировалась (TS7053: у класса компонента нет поля выхода). Теперь компилируется, а `$event` получает тип первого аргумента события ядра: `MouseEvent | KeyboardEvent` у `soActionPress`, `boolean` у `soChangeVisible`. Тип дают сгенерированные базовые классы `TButtonSurface`, `TComponentViewSurface`, `TComponentSurface` — компоненты наследуют их, а не `TComponentBase`; `TStylableSurface`, `TControlSurface` и `TTextableSurface` — для своего компонента на этих дескрипторах; тип выхода — `TOutputEmitter`. `useOutputs` отдаёт пары «выход, полное имя события ядра» вместо списка имён.
- 32bdc29: Frame в Angular: `<div so-frame>` — слой поверх страницы. Обёртки нет: в цель `target` (по умолчанию `body`) уезжает сам элемент, который написал потребитель, — с его классом, атрибутами и обработчиками, — а на месте остаётся якорь-комментарий. Переносит его база компонента в браузере после отрисовки, поэтому гидратация находит узел на месте; на сервере и без цели панель стоит на месте скрытой, `contained` оставляет её на месте и показанной. Смена `target` переносит тот же узел, снятие компонента убирает узел из цели и якорь. Раскладка (`position`, координаты, `z-index` слоя), `data-layer` и `data-open` — на панели; содержимое панели остаётся в контексте места — с локалью провайдера вокруг Frame. Ограничение переноса: Frame — первый узел представления `@for`, перед которым вставляют или которое переставляют, роняет Angular с NG05106 (обёртка-элемент это снимает).
- 7d3988c: Адаптер проходит AOT-компиляцию (`ngc`): запрос корня `#root` в `TComponentBase` объявлен полем базы. Вызов `viewChild` внутри метода компилятор Angular не распознавал и падал с NG8110, поэтому приложение с компонентами soxa не собиралось.
- 76f822e: Angular: подпись Label и поля Input, CheckBox и Switch — по разметке Vue, с тестами из React. Label (`<label so-label>`): контрол — содержимым, текст — слотом `content` (`<span slot="content">`) или пропом `text`. Поля — свои элементы `<so-input>`, `<so-check-box>`, `<so-switch>` с нативным `<input>` внутри: класс и стиль потребителя остаются на поле, а статические атрибуты, которые потребитель записал на нём в разметке (`autocomplete`, `data-*`), база переносит на `<input>`; привязки `[attr.x]` и слушатели остаются на поле. Новая директива `[so-attributes]` кладёт набор ядра на элемент шаблона (`aria` поля — на `<input>`, `clearAria` — на кнопку очистки), и на корне вложенного компонента набор владельца главнее того, что он пишет себе сам. Текст поля пишет директива `[so-field-text]` — только когда он разошёлся с узлом: набор не переписывает поле, и браузер не перестаёт проверять `minlength`; на сервере текст уходит атрибутом `value`. Отметка — привязки `[checked]` и `[indeterminate]`, без слота — `<svg>` иконки по роли. Кнопка очистки Input берёт имя из локали поддерева: у Angular это первый компонент со строками.
- 8aa17d2: Адаптер Angular объявляет `@angular/common` peer-зависимостью: код пакета его импортирует, а без объявления менеджеры пакетов со строгой изоляцией (Yarn PnP, pnpm без поднятия зависимостей) не давали адаптеру его найти. `@angular/compiler`, `@angular/platform-browser` и `rxjs` из peer-зависимостей убраны — адаптер их не импортирует
- b21cb75: Рантайм адаптера принимает собранный контекст — `adapter.attach()` при инициализации компонента (Angular — в `ngOnInit`, Web Components — в `connectedCallback`), парой к `destroy()`.
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
