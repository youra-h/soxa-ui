# @soxa-ui/plugins

## 0.4.1

### Patch Changes

- 480231a: Preserve the anchor's local data-so-theme on teleported Frame panels across all adapters, including Menu, Select, Popover and Tooltip. Follow theme changes and anchor moves while respecting explicit panel themes and contained layout.
- b17d612: Fix Select and DatePicker aria-controls references when their popup panels are absent during server rendering and hydration.
- Updated dependencies [859c3c6]
- Updated dependencies [dd5946d]
  - @soxa-ui/core@0.4.1

## 0.4.0

### Patch Changes

- b38633b: CheckBox and Switch: handle native activation and enforce readonly before the first animation frame.
- 1bd5a03: CodeBlock: preserve keyboard focus while copying, prevent duplicate clipboard requests, and ignore stale clipboard feedback.
- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- 5ba63f4: Add a non-modal Dialog mode that preserves page interaction, keyboard navigation and focus without changing the default modal behavior.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- Graduate the approved beta packages to stable versions.
- Updated dependencies [1bd5a03]
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
- Updated dependencies
  - @soxa-ui/core@0.4.0

## 0.4.0-beta.0

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- 5ba63f4: Add a non-modal Dialog mode that preserves page interaction, keyboard navigation and focus without changing the default modal behavior.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
  - @soxa-ui/core@0.4.0-beta.0

## 0.3.0

### Minor Changes

- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- 0690162: Frame: rename position to strategy and TFramePosition to TFrameStrategy. Replace the prop, controller property and change:position event with strategy and change:strategy; Angular outputs use soChangeStrategy.

### Patch Changes

- 53fb45f: Add Badge for inline labels, capped numeric counters and dots, with accessible names, anchored placement and theme styling across all adapters.
- 21e6143: Announce toast text and descriptions through persistent polite and assertive regions, separately from interactive cards and controls.
- ab9735f: Add Breadcrumbs as a collection with external engines, composable Item parts and standard activation. Include localized accessible names, theme separators and native-link overflow menus that preserve breadcrumb membership. Expose root-level gap scales and separator geometry for theme and scoped customization.
- 0909342: Add built-in safe CodeBlock syntax highlighting, including server rendering. Use compact white layouts with a single tab toolbar, smaller copy actions and tighter line-number gutters. Clarify snippet selection and shorten copy labels.
- 8212af4: Prevent Select keyboard commands from selecting options or navigating the list during IME composition while preserving normal keyboard behavior after composition ends.
- c7b5a90: Open editable Select from touch on its arrow when WebKit retargets the compatibility click to the input.
- ba29be7: Keep overflowing disabled Tabs and Table content reachable and scrollable by keyboard without adding tab stops when content fits or contains an available tab stop. Preserve native disabled behavior when Web Components are re-enabled.
- 1ffabcd: Add ToggleButton and ToggleGroup with persistent pressed state, collection-backed selection and accessible keyboard navigation. Preserve explicit native form attributes while defaulting toggle controls to non-submitting buttons. Keep long ToggleGroup rows reachable in their own scroll viewport on narrow screens.
- 6dfea13: Fix focus for click-only screen reader activation in Select and Menu.
  
  Preserve the first typed characters when opening and highlighting an editable Select.
  
  Describe all selected tags from a multiple Select without replacing application hints.
- 1bb3ea8: Add CodeBlock with accessible code display, line numbers, highlighted lines, clipboard feedback and snippets powered by Tabs across all adapters.
- 2d81d06: Clarify component availability and DOM element readiness without changing lifecycle behavior.
- 7415726: Tags with `overflow: 'scroll'`: in Safari the tag that receives keyboard focus at the row's edge now scrolls fully into view, focus ring included.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [0909342]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [6dfea13]
- Updated dependencies [1bb3ea8]
- Updated dependencies [de65c13]
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [28bcd83]
- Updated dependencies [1c78107]
- Updated dependencies [bcd5555]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/core@0.3.0-beta.1

## 0.3.0-beta.0

### Minor Changes

- 7335dd6: Remove public plugin creation events. Replace namespace:create handlers with bundle:create and bundle.get(PluginClass); internal plugin lifecycle hooks remain unchanged.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- 0690162: Frame: rename position to strategy and TFramePosition to TFrameStrategy. Replace the prop, controller property and change:position event with strategy and change:strategy; Angular outputs use soChangeStrategy.

### Patch Changes

- 2d81d06: Clarify component availability and DOM element readiness without changing lifecycle behavior.
- 7415726: Tags with `overflow: 'scroll'`: in Safari the tag that receives keyboard focus at the row's edge now scrolls fully into view, focus ring included.
- 13101c7: Hide detached overlay panels when their owning component is hidden. Preserve the panel's open state while pausing overlay focus, dismissal and scroll behavior until the owner is shown again.
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [28bcd83]
- Updated dependencies [bcd5555]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0-beta.0

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [843f9ef]
  - @soxa-ui/core@0.3.0-alpha.7

## 0.3.0-alpha.6

### Minor Changes

- 101269c: Menu, its submenus and DatePicker build their panel content on the first opening (`contentRendered`): a menu nobody opened is its trigger and an empty panel, a date picker nobody opened is a field with a button. Closing still only hides the panel and keeps the content. In Angular, menu items written in markup are a projection — Angular creates them with the menu and only inserts them on the first opening; items from `items` and the calendar are created then.
  
  What broke and how to update: before the first opening, menu items and the DatePicker calendar are neither in the document nor in the menu's collection. Code that reads them earlier should open the panel first (`open`). Opening the menu by a key still highlights the edge item — a frame later, once the items are drawn.
- 54f5b1d: Select builds options from `items` on the first opening of its panel (`contentRendered`), as Menu and DatePicker do; closing only hides them, and options written in markup are mounted as before. `Virtual` measures its window once the first drawn item enters the document.
  
  What broke and how to update: before the first opening, options from `items` are not in the document and have no `id` — open the panel (`open`) before reading them.

### Patch Changes

- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- Updated dependencies [101269c]
- Updated dependencies [7ac5495]
- Updated dependencies [a6a77f8]
- Updated dependencies [765030a]
- Updated dependencies [2e2ff15]
- Updated dependencies [2dec183]
- Updated dependencies [54f5b1d]
- Updated dependencies [5429a39]
- Updated dependencies [604ae77]
  - @soxa-ui/core@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [6f96bae]
- Updated dependencies [1c703ad]
- Updated dependencies [8bb9bdc]
  - @soxa-ui/core@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- 11e25c7: Tabs: слоты `leading` и `trailing` стоят не в списке табов, а рядом с ним, в новом ряду `.so-tabs__bar`, — выравнивание `center`, `end` и `stretch` работает со слотами, а в `[role=tablist]` остались только табы. Обновление: классы слотов — `.so-tabs__leading` и `.so-tabs__trailing` вместо `.so-tabs__list--leading` и `.so-tabs__list--trailing`; `.so-tabs > .so-tabs__list` пишите через ряд: `.so-tabs > .so-tabs__bar > .so-tabs__list`. Своя тема: `--so-tabs-active-*` и `--so-tabs-gap-*` плагин раскладки пишет на ряд, место таба отсчитывается от него — линию и отметку рисуйте на ряду; поле `listEl` у `TActiveTabOffset` переименовано в `barEl`.
- fc30695: ListBox объявляет скринридеру элемент под стрелками: у элементов `id`, узел списка ссылается на подсвеченный через `aria-activedescendant`. `TSelectItemIdsPlugin` → `TOptionIdsPlugin`, `SelectItemIdsPluginDescriptor` → `OptionIdsPluginDescriptor`: замените импорт. `onHighlightChanged(null)` наследника `TListNavigationPlugin` приходит и от `trackHighlight`, гасящего отметку. `bundle:unregistered` реестра наборов (`TCollectionBundlesPlugin`) приходит и тогда, когда элемент ушёл из коллекции, а не только когда снято его монтирование.
- 64be9ca: Прокрутка списков одна на ListBox, Select и Menu: за установкой value и за подсветкой, откуда бы они ни пришли. Подсветка докручивает элемент ближайшим краем; value двигает только сам список — частично видный элемент ближайшим краем, невидимый в центр. `change:highlight` навигации списка сообщает о видимой подсветке, позиция без отметки его не шлёт. `TMenuNavigationPlugin.highlightItem` и `unhighlight` больше не принимают `FocusOptions`: фокус меню не прокручивает. `TListScrollPlugin` слушает подсветку навигации, которую называет опция `navigation` (`ListScrollPluginDescriptor.with({ navigation: TListKeyboardPlugin })`); без опции он идёт только за значением.
- 7a86466: `id`, который задаёт приложение, держит новый `TIdPlugin` (проп `id`) — у полей и у элементов ListBox, Select, Tabs, Accordion и пунктов меню со своей панелью: ссылки ARIA ведут на этот `id`, а в Angular он больше не теряется. Сломалось: свойства `id` и события `change:id` у `TInputControl` (Input, NumberInput, Textarea, CheckBox, Switch, Rating, Select, DateInput, DatePicker) больше нет — задавайте `id` пропом компонента, читайте из состояния; `id` в данных `items` не поддерживается — ссылайтесь на элемент по `value`. `IFieldInputControl` и `TFieldControl` удалены — связка поля видит контрол как `IFieldControl`. В Web Components `el.ctrl.id` больше нет: `el.id = …` и `setAttribute('id', …)` у элемента с полем уходят на поле (пустой — снят), прочесть — `el.state.id`. Тип состояния адаптера (`TAdapterState`) называет и входы плагинов; новый тип `DescriptorPluginProps`.

### Patch Changes

- a14dfe5: Select: нажатие по стрелке и другим немым частям поля оставляет фокус в поле, как у нативного `<select>`, — стрелки после открытия кликом по стрелке больше не прокручивают страницу
- 0ab715a: Tabs: таб, закрытый крестиком, отдаёт фокус табу-остановке — соседу, который стал активным, или активному табу; после последнего таба фокус уходит к следующему контролу за списком — так же и при `Delete`
- 28470f6: Tags без выбора: строка тега больше не берёт фокус от клика (у неё нет `tabindex`), а `focused = true` тега ставит фокус на его крестик; строку рисует новый `TItemRow` — кнопка, чью роль и остановку Tab пишет владелец
- 0471962: Tabs: свой `id` на `Tabs.Content` — проп `id` (`TIdPlugin`): он стоит на панели вместо формулы таба, и `aria-controls` таба ведёт на него, а в Angular `id` панели больше не теряется. Ссылку таб получает со входа панели: в разметке сервера Vue, React, Svelte и Solid таб до гидратации ведёт на формулу, а `id` панели уже свой. `TTabsItemIdsPlugin` получил `bindPanel` и `unbindPanel`, `TCollectionExtension` опускает детям реестр наборов коллекции. В Web Components пустой `id` у панели, поля даты и DatePicker снимает проп, как у полей.
- fcd14b4: ListBox в `multiple`: выбор больше не уводит подсветку и прокрутку к первому выбранному
- a09886b: ListBox: стрелка подсвечивает единственный доступный элемент, даже выбранный или после клика по нему, и скринридер его называет
- 241082a: Tags: тег, закрытый крестиком, отдаёт фокус соседнему тегу, последний — следующему контролу; в поле Select фокус после последнего тега остаётся в поле
- 734ff59: Select, снятый при подсвеченной опции, убирает с поля `aria-activedescendant`: смонтированный заново со своим `ctrl`, он не ссылается на опцию, которой нет
- b6d9450: Select: нажатие по тегу в поле оставляет фокус в поле — стрелки после этого ходят по опциям, а не прокручивают страницу
- b5a5d78: Окно Virtual не сползает к началу списка, пока список скрыт: нарисованные элементы без коробок плагин не мерит
- ad1de00: Список, показанный после скрытия (панель Select, ListBox в закрытом поповере или вкладке), открывается на первом выбранном — с `Virtual` и без, при каждом показе. Новое у `TListHeightPlugin`: `measured` и `change:measured`.
- 53a3fe6: ListBox: клавиша со строки, на которой стоит фокус после клика, возвращает фокус узлу списка и действует от этой строки — кольцо фокуса не застревает на строке, Shift+Tab выводит из списка одним нажатием
- Updated dependencies [8110fc3]
- Updated dependencies [582d3a6]
- Updated dependencies [28470f6]
- Updated dependencies [0471962]
- Updated dependencies [fc30695]
- Updated dependencies [7a86466]
  - @soxa-ui/core@0.3.0-alpha.3

## 0.3.0-alpha.2

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- 4fc4efa: DragAndDrop сообщает о перестановке перетаскиванием: `move:before` (отменить — `preventDefault()`) и `move` с `engine`, `item`, `oldIndex`, `newIndex`. Выключенный элемент не перетаскивается, коллекции внутри элементов другой коллекции перестановку не наследуют. Ломающее: `TDragPlugin.activate` принимает вторым аргументом обёртку, `DRAG_CONTEXT_ELEVATOR` перестановку больше не включает — коллекции оборачивают в `DragAndDrop`.
- 0091f1d: Пакет иконок подключается через `useIcons` вместо `setIcons` — в ряд с `useTheme`, `usePlugins`, `useExtensions` и `useMotion`. Как обновиться: `setIcons(…)` → `useIcons(…)`, аргументы и поведение те же.

### Patch Changes

- 5c4558e: Подсказка, открытая разметкой или из кода, больше не закрывается уходом курсора, прихода которого не было: панель, вставшая на место из-под неподвижного курсора, остаётся открытой
- 0179add: `focused = true` (проп или `ctrl.focused`) ставит фокус туда, где он у компонента живёт: в поле — у Input, NumberInput, Textarea, CheckBox, Switch, Rating, Slider, Select и радио, в узел списка — у ListBox, на таб-остановку — у Tabs; раньше запись меняла только свойство. У плагина действия — опция `focusTarget`, правило узла фокуса (`fieldOf`, `listOf`, `tabStopOf`).
- b74ddc6: Calendar больше не падает при серверном рендере в Node
- e7d4c96: Плагины полей находят поле одним правилом (`fieldOf`); поведение не меняется.
- 434d622: DragAndDrop пальцем: элемент берёт долгое нажатие (450 мс), сдвиг раньше — прокрутка. На телефонах перетаскивание раньше не начиналось.
- 9d181a3: Меню: пункт с панелью открывается наведением мыши или пера, фокус остаётся на строке; стрелка к концу строки ведёт фокус в уже открытую панель.
- 0da817b: `focused = true` ставит фокус и у DateInput, DatePicker, Calendar, RadioGroup, Accordion, Tags, Pagination, Scroller и у элементов коллекций — табов, секций, пунктов ListBox, Tags и Menu; раньше у них запись меняла только свойство.
- 132cffc: Запись `focused = true` в одном такте со сменой остановки — листание Calendar, страница Pagination за окном, новый таб или тег — ставит фокус, как только узел новой остановки нарисован; раньше фокус не вставал, а `focused` оставался `true`.
- 8d55e75: Textarea: скринридер читает счётчик символов вместе с полем
- Updated dependencies [ad16bef]
- Updated dependencies [7e375e6]
- Updated dependencies [89db4ae]
- Updated dependencies [88078c4]
- Updated dependencies [ba30620]
- Updated dependencies [4fc4efa]
- Updated dependencies [7137eaa]
- Updated dependencies [9d181a3]
- Updated dependencies [d7ee0bc]
- Updated dependencies [fba7c84]
- Updated dependencies [d495df8]
- Updated dependencies [8d4064e]
- Updated dependencies [b3cb2f3]
- Updated dependencies [2b5f080]
- Updated dependencies [8d55e75]
- Updated dependencies [2036526]
  - @soxa-ui/core@0.3.0-alpha.1

## 0.3.0-alpha.0

### Minor Changes

- dca2a76: Панель DatePicker при закрытии возвращает фокус в поле: на часть, с которой её открыли Alt+↓, а если открыли кнопкой календаря — на первую часть поля (у диапазона — поля начала). Раньше фокус возвращался на кнопку календаря: тесты и код, которые ждали его там, теперь должны ждать его на части поля.
- 8bbb7d8: Плагины и проводка коллекций находят соседние расширения охранниками контракта, а не чтением движка без типа; у ListBox для этого появился охранник `listOf`. Поведение не меняется. Ломающее для наследников `TListNavigationPlugin`: `shown()` отдаёт массив только для чтения — копию для правки снимайте сами (`[...this.shown()]`); элемент своего списка наследник называет вторым параметром типа базы (по умолчанию `IControl`).
- 0ad9f22: Соседа по коллекции находят по контракту, а не приведением типа: новые охранники `activationOf`, `filterOf`, `plainOf`, `selectionOf`, у Select — `selectOf` и `tagsOf`, и контракт `IPlainExtension`. Ломающее: в `ISelectTagsExtension` объявлены обязательные `hasTags` и `syncTags()` — своё расширение `tags` для движка Select должно их реализовать, иначе Select его не найдёт.
- 8e2e31e: ListBox и Select: группы пунктов из данных, как у Menu (`_: { group }`, `groupBy`, `groups`), части `ListBox.Group` и `Select.Group`. `TMenuGroupIdsPlugin` заменён общим плагином имени группы `TItemGroupIdsPlugin` (описание — `ItemGroupIdsPluginDescriptor` вместо `MenuGroupIdsPluginDescriptor`), типы `IMenuGroup`, `IMenuGroupProps`, `TMenuGroupEvents` — общими `IItemGroup`, `IItemGroupProps`, `TItemGroupEvents` — замените импорт. Рисование отдаёт разметке ListBox и Select секции: в поверхности компонента `drawnSections` вместо `drawn` (событие `change:drawnSections`). Список с группами окно `Virtual` не рисует.
- 1411d88: Тост: вид сообщения `type` (`info`, `success`, `warning`, `error`) со значком вида и `loading` — кольцо на месте значка; ожидающий тост сам не закрывается. `variant` и `size` у тоста сняты: вместо `show({ variant: 'negative' })` пишите `show({ type: 'error' })`. Новые роли иконок `notification`, `info`, `success`, `warning` — свой пакет иконок должен их закрыть.
- ce9316e: NumberInput (Vue): поле числа в формате локали — шаг и границы, ↑/↓, PageUp/PageDown, Home/End, кнопки «−» и «+» с удержанием, `formatOptions` (процент, валюта, единица), событие `commit`; `createScale` принимает открытые границы, а `shift` шкалы со значения вне сетки шагает к соседнему узлу со стороны сдвига (с 2,5 при шаге 1 — на 3 и на 2). Ломающее: роли иконок `minus` и `plus` — дополните ими свой пакет иконок; раздел локали `numberInput` — дополните им свой `TLocale` (`extendLocale` возьмёт из основы).
- 04fb073: Select: набор по первым буквам — как у Menu, по правилам APG: повтор буквы ведёт к следующей опции на неё, а не снимает подсветку, без совпадения подсветка остаётся на месте, а закрытие панели начинает набор заново. `TSelectKeyboardPlugin.highlightByText` ищет только подстроку: параметр `mode` снят, и вызов с одним текстом теперь ищет подстроку в любом месте, а не начало текста, — вместо `highlightByText(text, 'includes')` пишите `highlightByText(text)`.
- 958c866: ListBox: список — свой узел `.so-list-box__list` внутри корня, шапка и подвал — вне его. Роль, имя и остановка Tab — на этом узле, и прокручивается тоже он: в пределе `maxRows` ровно строки, а шапка и подвал при прокрутке стоят на месте. Стили фокуса и прокрутки и селекторы по `role` и `tabindex` корня ListBox переносите на него. `focused = true` из кода фокус в список пока не ставит — как у Input и Tabs, корень которых фокус не держит.

### Patch Changes

- bc530a2: Tabs: снятие табов на сервере больше не печатает `requestAnimationFrame is not defined`
- a67b85a: Тип `TPoint` (проп `point` плагина якоря) отдаётся из пакета: без него не собирались декларации компонентов с якорем
- 5f4c58a: Menu: контекстное меню — режим `openOn: 'contextmenu'` (`open-on="contextmenu"` во Vue). Меню открывают правая кнопка, долгое касание, клавиша контекстного меню и Shift+F10 над областью в слоте `trigger`, и панель встаёт у точки вызова (`point`); у области нет связки кнопки — `triggerAria` пуст. У Frame новый вход `anchor_point`: точка в координатах окна вместо якоря, главнее него, пока задана.
- 7002663: Смахивание пальцем у Drawer, Popover, панелей Select и DatePicker и тостов больше не обрывается сразу после начала, а с `swipe: 'panel'` слой смахивается пальцем и из прокручиваемого содержимого.
- 7f54086: Колонку таблицы можно переставить пальцем: жест больше не отменяется сразу после начала.
- 88a6ccf: Панель у поля и триггера — Select, Popover, Menu, Tooltip, DatePicker — больше не перескакивает на другую сторону при прокрутке страницы: открытая панель держит сторону, пока на ней влезает, и переходит на противоположную, только если влезает там. Сторону заново выбирает следующее открытие.
- f06e5f9: Меню: пункт с панелью `Menu.PopoverItem` (`MenuPopoverItem`) — строка открывает сбоку панель с любым содержимым, например календарём: нажатием, Enter, пробелом или → (в RTL ←); Escape возвращает к пункту, Tab из панели закрывает меню. Открыта одна панель на меню — подменю или пункта с панелью, — и связку строки с панелью у обоих пишет один плагин `TMenuPopupIdsPlugin`.
- 51ce716: Закрытые Select, Tooltip, Menu, Popover и DatePicker больше не пересчитывают место панели на прокрутке страницы — только пока панель показана или гаснет.
- 47e560d: Textarea: новый компонент (Vue) — многострочное поле с контрактом Input и подписью от `Field`: `rows`, авторост `autoresize` до `maxRows`, счётчик символов `counter` с пределом `maxlength`. Новая строка локали `textarea.counter`: свою полную `TLocale` дополните ею или соберите через `extendLocale`.
- e977046: Меню: подменю — `Menu.Submenu` (`MenuSubmenu`). Пункт открывает сбоку своё меню наведением, стрелкой к концу строки, Enter и пробелом; путь указателя наискосок к открытой панели её не закрывает; стрелка к началу строки и Escape закрывают один уровень, а выбор пункта и Tab — всё меню, и `choose` приходит каждому меню над пунктом. Наведение в панели меню — теперь плагин `TMenuHoverPlugin`: `TMenuPointerPlugin` только открывает меню.
- fb85110: Привязка панели к якорю (`anchor_placement` у Frame) умеет стороны строки — `start-*` и `end-*`: панель сбоку от якоря переходит на другую сторону у края окна и не уходит за экран; `start` и `end` логические, в RTL меняются местами.
- 76329be: Панель у поля и триггера — Select, Popover, Menu, Tooltip, DatePicker — больше не дрожит при прокрутке страницы на телефоне: на странице она стоит absolute в документе и прокручивается вместе с полем, а у поля в fixed-шапке остаётся fixed. Фокус в открытую панель окно не прокручивает.
- Updated dependencies [8bbb7d8]
- Updated dependencies [7731c71]
- Updated dependencies [7872e77]
- Updated dependencies [f4676b7]
- Updated dependencies [5f4c58a]
- Updated dependencies [f06e5f9]
- Updated dependencies [d4c3583]
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
- Updated dependencies [76329be]
- Updated dependencies [958c866]
- Updated dependencies [b810fa0]
- Updated dependencies [4429cbc]
- Updated dependencies [f256e0f]
  - @soxa-ui/core@0.3.0-alpha.0

## 0.2.0

### Minor Changes

- f535f0d: Table: ширины колонок без своей ширины раскладывает ядро — в границах колонки (`minWidth`, `maxWidth`) и сразу, с монтирования, а не только когда колонку тронет ручка. Колонка с границами 120–360 больше не встаёт на широком экране в 480, и первое действие ручки двигает ширину на шаг, без рывка к границе. Новый проп таблицы `columnFit`: `auto` (по умолчанию) — гибкие колонки растут до `maxWidth` во всю ширину места, `none` — стоят в ширине по умолчанию (160 px в своих границах), `contain` — ровно заполняют место, сжимаясь до `minWidth`. Место — ширину окна таблицы без колонки выбора — мерит новый плагин `TTableLayoutPlugin` (`notifySpace` у расширения `columns`); колонки не влезли — таблица прокручивается вбок в своём окне по `data-overflow`, а с закреплённой шапкой — в контейнере потребителя. Ломающее: во Vue таблица рисуется в окне `div.so-table__viewport`, и атрибуты потребителя (`class`, `style`, `data-*`) достаются окну, а не `table` — роль, классы ядра и наборы по-прежнему у `table`; у колонки нет `notifyWidth` — ширину гибкой колонки пишет раскладка (`layoutWidth`), `grab()` берёт ширину из итога колонки и аргумента не принимает; `data-sized` значит «ширина известна» — своя или раскладки. Контекст сдвига закреплённой шапки в теле Dialog, Drawer и содержимом Popover в oren — на окне таблицы.
- fe0551e: Плагины и расширения коллекций подключаются снаружи. Одному компоненту — из `bundle:create` / `engine:create`: плагин, поставленный в `bundle:create`, объявляется вместе с плагинами компонента. Всем компонентам типа — `usePlugins(TButton, [TTimerPlugin])` и `useExtensions(TTags, [(owner) => new TExt()])` из `@soxa-ui/setup`; по умолчанию только компонентам пользователя, `{ scope: 'all' }` — и деталям разметки других компонентов (строка и крестик тега), которые библиотека помечает пропом `embedded`. Контракт компонента — пропсы, события и слоты — объявляет только дескриптор: внешний плагин его не расширяет. `usePlugins` принимает класс или класс с опциями (`{ ctor, options }`), настраивается плагин опциями регистрации, а обращаются к нему через его собственный API — из `bundle:create` или по ссылке, которую он сам о себе оставил.
  
  Плагины уничтожаются при размонтировании: `destroy()` плагинов раньше не вызывался ни в одном адаптере. У `IPluginBundle` появились `created()` и `destroy()`, у `IAdapterContext` — `embedded`.
  
  Тема объявляет своё поведение: `defineTheme` / `useTheme` в `@soxa-ui/setup`, объект темы oren — `@soxa-ui/theme-oren/setup`. `TTabsViewPlugin` переехал из `@soxa-ui/plugins` в тему и снят с Tabs, событие `view:create` у Tabs пропало. Как обновиться: в точке входа приложения рядом с `import "@soxa-ui/theme-oren"` подключить `useTheme(oren)` из `@soxa-ui/theme-oren/setup`, иначе полосы под активным табом нет; импорт `TTabsViewPlugin` брать из `@soxa-ui/theme-oren/setup`.
- eae46e4: Table во Vue: таблица по паттернам APG Table и Sortable Table — колонки данными (`columns`), сортировка кнопкой в заголовке колонки, выбор строк колонкой чекбоксов, слоты `header`, `cell` и `empty`, стили темы oren. Колонке — `rowHeader` (её ячейки называют строки, `th scope="row"`) и `widthStyle`, строке — набор `headerAria`, таблице — `selectAllLabel`. Чекбоксы колонки выбора держит таблица: `selectAll` фасада и `checkBoxOf(row)` расширения `table`; их отметку она пишет от выбора, а клик по ним выполняет командой выбора. Ломающее: режим выбора строк таблицы по умолчанию — `none`, колонки выбора нет, пока режим не задан; у `TTableShownSelection` новое значение `empty` — выбирать нечего (строк нет, все выключены или выключена таблица), раньше на его месте было `none`; новая роль иконки `arrowUpward` — свой пакет иконок дополните ею. CheckBox и Switch возвращают поле к модели, когда запись отметки отменили в `change:value:before`.
- 9e0c6e7: Dialog: новый компонент (Vue) — модальное окно, паттерн Dialog (Modal) APG. Открытость — `visible` (`v-model:visible`); имя окну даёт слот `title` (`aria-labelledby`), содержимое — слот по умолчанию, ряд действий — `footer`. Место — `placement`: `center` (по умолчанию), `start`, `end`, `top`, `bottom`, стороны логические; размер — `width` и `height` (число — px, строка — CSS-значение, не заданы — размер темы); `maximized` разворачивает окно на весь экран, `maximizable` показывает кнопку разворота (имя `maximizeLabel`, состояние — `aria-pressed`). Крестик (`closable`, `closeLabel`), Escape и нажатие по подложке просят окно закрыться: событие `close:before` с причиной (`button`, `outside`, `escape`) отменяется `preventDefault()`, а `dismissible: false` оставляет только крестик; запись `visible` из кода и `v-model` события не шлют. `alert` делает окно предупреждением (`role="alertdialog"`, описание — содержимое). Фокус уходит в окно и возвращается при любом закрытии, Tab ходит по кругу, страница под окном спрятана от скринридера и не прокручивается, нажатие по подложке фокус не уносит. Иконки кнопки разворота — роли `arrowsOutward` и `arrowsInward` (`@soxa-ui/icons-material`); тема oren рисует окно и подложку (`.so-dialog`, `.so-dialog__backdrop`, `--placement-*`, `data-maximized`, переменные `--so-dialog-width` и `--so-dialog-height`).
  
  Ломающее. Слой выделен в общую базу `TLayer` (`@soxa-ui/core`): Frame и окно делят один стек z-index, и его базу задают у `TLayer` — `TLayer.baseZIndex = 5000`; запись в `TFrame.baseZIndex` больше не действует. В `@soxa-ui/plugins` правило «после нажатия мимо фокус не возвращать» переехало из базы `TOverlayFocusPlugin` в `TPopoverFocusPlugin`: `TModalFocusPlugin` возвращает фокус при любом закрытии и гасит `mousedown` нажатия мимо. Своя стратегия на базе `TOverlayFocusPlugin`, которой нужно прежнее правило, подписывается на `dismiss` у `TDismissPlugin` сама. Нажатие мимо и Escape плагины слоя передают владельцу, который принимает запрос закрытия (`requestClose`, тип-гард `isCloseRequestable`), с причиной; остальных закрывают записью открытости, как раньше.
- 0b61b6a: Slider: ручка, взятая не за середину, доходит до края шкалы. Раньше, если увести указатель за край ползунка, она останавливалась, не дойдя до `min` или `max` на смещение захвата — одно-два значения, в любом режиме щелчка. Доля хода больше не прижимается к 0 и 1: `fractionAt` за краями дорожки отдаёт долю за ними, и `TSlidePointerPlugin` передаёт её командам `ISlidable` (`grab`, `press`, `drag`) как есть. Как обновиться: свой владелец `ISlidable` прижимает итог сам — `TSlider` делает это шкалой (`IScale.valueAt`).
- bd02d06: TDismissPlugin: нажатие в панель слоя выше своей больше не закрывает владельца — слой берётся из `data-layer` у Frame. Список Select в поповере и вложенный поповер внешний слой не закрывают, а нажатие во внешнюю панель закрывает вложенный. Новая опция `focusOutside` (по умолчанию выключена) закрывает и уходом фокуса мимо — по тому же правилу. Владельца плагин закрывает после подписчиков `dismiss`, а не до них: подписчик застаёт его открытым. Панель владельца отдаёт `findPanel()`. Как обновиться: аргумент события `dismiss` теперь `MouseEvent | FocusEvent` — обработчик с параметром `MouseEvent` объявите с `MouseEvent | FocusEvent`. Без `focusOutside`, как у Select, по-прежнему приходит только `MouseEvent`.
- d88ab2e: У плагина, поставленного снаружи, появились пропсы и события — одинаково во всех адаптерах.
  
  Контракт плагина описывает `definePlugin` один раз, рядом с классом. Значения его пропсов компонент принимает одним пропом `pluginProps` (`{ timer_ms: 500 }`), события отдаёт одним конвертом `plugin:event` (`{ name: 'timer:tick', args }`): `:plugin-props` и `@plugin:event` во Vue, `pluginProps` и `onPluginEvent` в React, Solid и Svelte, `[pluginProps]` и `(soPluginEvent)` в Angular, свойство `pluginProps` и событие `so:plugin:event` у Web Components. Работает для плагина из `usePlugins` и для поставленного позже через `bundle.use` — значения, пришедшие раньше плагина, ждут его. Правила те же, что у пропсов компонента: пишется только значение, отличное от умолчания, пропавший ключ возвращает умолчание. Типы ключей — дополнением интерфейса `IExternalPluginProps` из `@soxa-ui/setup`.
  
  У `TPluginBundle` появилась шина `events` с событиями `use` и `remove`. В ядре — тип `TPluginEvent` и событие `plugin:event` в `TComponentEvents`.
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 268439c: id в разметке строят плагины от id монтирования, ядро их не строит. Удалены IComponentView.idBase, опция конструктора idBase и второй аргумент конструктора компонентов ядра (IComponentOptions), TFactoryExtension.bindIdBase. Адаптер передаёт useId опцией контекста mountId, плагины строят id через ctx.createId(part). Части без экземпляра — живые наборы ядра: triggerAria (Popover, Tooltip), titleAria, bodyAria, listAria у Select вместо list_aria фасада, contentAria у Accordion.Item вместо content_aria. Поле Input, CheckBox, Switch без своего id — без атрибута.
- 4785689: Таблица: сортирует маленькая кнопка рядом с подписью в заголовке колонки `sortable`, а не весь заголовок — нажатие по ячейке шапки больше не сортирует. Своё действие по заголовку (меню, триггер Popover) ставят контролом в подпись — слот `header`. Имя кнопке даёт локаль: новая строка `table.sort` с подписью колонки на месте `{name}` («Sort by Имя»); локаль, написанную целиком своим объектом `TLocale`, дополните ею, `extendLocale` возьмёт её из основы. Колонка ядра: `toggleSort()` — просьба отсортировать (`sort:request`, её выполняет расширение сортировки коллекции строк), набор `contentAria` переименован в `textAria`, новый набор кнопки — `sortAria`. Разметка заголовка: `.so-table-column__content` — ряд из подписи `.so-table-column__text` (у всех колонок, на неё ссылается `aria-labelledby` заголовка) и кнопки `.so-table-column__sort` со стрелкой `.so-table-column__sort-icon` в её области текста; кнопку рисует `Table.Column`, а не таблица. Тема oren: кнопка — квадрат вокруг стрелки в кегль заголовка, стрелка неотсортированной колонки проступает при наведении на заголовок и фокусе кнопки, сортируемый заголовок больше не подсвечивается.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- b3dccfc: Жест «смахнуть, чтобы закрыть» стал общей возможностью слоёв: кроме выезжающей панели, его получил Popover (проп `swipe`: `none` по умолчанию, `handle`, `panel`). Панель у триггера смахивают от него — вниз под ним и вверх над ним, панель внутри контейнера — вниз; полоса жеста стоит у края со стороны триггера. Контракт ядра — `ISwipeable` (`swipe`, `swipeSide`, `swiping`, `beginSwipe`, `endSwipe`) и тип-гард `isSwipeable`. Ломающее: тип `TDrawerSwipe` заменён общим `TSwipe`, плагин `TDrawerSwipePlugin` — `TSwipePlugin` (`@soxa-ui/plugins`), определение `DrawerSwipePluginDescriptor` — `SwipePluginDescriptor` (`@soxa-ui/setup`), а сдвиг жеста плагин пишет переменной `--so-swipe-offset`: обновите импорты и свой CSS, если читали сдвиг.
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
- de9a974: Таблица: ширину колонки меняет ручка у края заголовка — мышью, касанием, клавишами и жестом скринридера (`resizable` у колонки, в границах `minWidth` и `maxWidth`); итог приходит событием таблицы `column:resize` с колонкой и шириной, по нему приложение сохраняет настройку. `disabled` таблицы выключает ручки колонок. Разметка заголовка колонки сменилась: содержимое — в обёртке `.so-table-column__content`, рядом — полоса ручки `.so-table-column__resizer` с полем `input type="range"`, а заголовок назван обёрткой (`aria-labelledby`) и объявлен `scope="col"`. Стили по `.so-table-column > .so-table-column__sort` и `.so-table-column > .so-table-column__text` ведут теперь через обёртку. Ширина задана у всех показанных колонок — таблица шириной в их сумму, а не во всю ширину места.
- 5e219b7: Окно для длинных списков — обёртка `Virtual`: `<Virtual><ListBox :items /></Virtual>`, так же Table. Коллекции внутри рисуют только видимые элементы, на месте остальных — распорки той же высоты; код окна попадает в сборку приложения только вместе с обёрткой, выключатель — `enabled`. Ломающее: у Table убраны проп `virtual` и выход `bodyRows` — окно ставит обёртка `Virtual`, а тело рисуется по `drawn` (`entry.item` вместо `entry.row`); расширение `virtual` коллекции строк разделено на общее рисование коллекций `draw` (стратегия окна `TWindowStrategy`) и табличное `window` (`aria-rowcount`, `aria-rowindex`, `headRowAria`); `TTableVirtualPlugin` заменён общим `TVirtualPlugin`, переменная распорки — `--so-filler-height`. ListBox в окне: нарисованным — `aria-setsize` и `aria-posinset`, подсвеченный клавиатурой элемент окно держит в документе, предел `maxRows` считается по показанным элементам.
- 080cf7a: Поле формы Field (во Vue): подпись, подсказка и ошибка, связанные с контролом сами — `<Field label="Почта" helper="…" error="…" invalid position="start"><Input /></Field>`. Текст части — проп `label`, `helper`, `error`, своя разметка — слот `label-content`, `helper-content`, `error-content`; ошибка видна при `invalid` и встаёт на место подсказки. Подпись называет Input, Select, CheckBox, Switch и Rating своим `for` (без своего `id` контрол получает `id` поля), DateInput, DatePicker и RadioGroup — ссылкой `aria-labelledby`; справка — `aria-describedby` контрола, ошибка — `aria-invalid` и `data-invalid`. У `TValueControl` появилось свойство инстанса `invalid` (не проп): `data-invalid` и `aria-invalid` — только у невалидного; у DateInput итог — своё или вне границ, и `data-invalid="false"` у валидного поля даты больше не ставится. У `TControl` — `labelable`, у `TAriaPlugin` — второй вход `links`. Select кладёт свой набор `aria` на `<input>` комбобокса — `aria_label` Select теперь называет поле; корни Input, CheckBox и Switch во Vue несут `dataset`. Новая роль иконки `error` (в `@soxa-ui/icons-material` она есть): своему пакету иконок её нужно закрыть. Тема oren: стили Field — подпись сверху, в начале или в конце строки, общая колонка подписей формы через `--so-field-columns`, — вид ошибки контролов по их `data-invalid` и одна шкала подписи у Label, Field и текста радио. Ломающее: база кнопки очистки переименована — `TField` → `TClearable`, `IField`/`IFieldProps`/`TFieldEvents` → `IClearable`/`IClearableProps`/`TClearableEvents`, `FieldDescriptor` → `ClearableDescriptor`, `TFieldNamesPlugin` → `TClearableNamesPlugin`, `FieldNamesPluginDescriptor` → `ClearableNamesPluginDescriptor`; имя `TField` и `FieldDescriptor` теперь у поля формы. Раздел локали `field` прежний.
- b2d21dd: Tags с выбором (mode не none) — клавиатура по паттерну APG Listbox на roving tabindex: весь набор — одна остановка Tab (вход — на тег, где последним был фокус, иначе на первый выбранный, иначе на первый), ←/→ (в RTL наоборот) и ↑/↓ ведут по тегам по кругу, Home/End — к крайним, Delete и Backspace закрывают тег и переводят фокус к соседу. Клавиатуру даёт новый TTagsKeyboardPlugin, остановку Tab пишет TTagsExtension (tabStop, isEnabledTag, notifyFocus). Набор объявляет aria-orientation="horizontal", в multiple — aria-multiselectable. Кнопка закрытия с выбором выведена из порядка Tab. Без выбора строки тегов Tab больше не ловят (в том числе теги в поле Select), а крестик остаётся остановкой. Ломающее: TTagsItem.closeAria — теперь живой набор TAria, а не объект атрибутов; снимок — closeAria.valueOf(), об изменении сообщает событие change:closeAria.
- 6cddad0: Движение — один режим на библиотеку. По умолчанию всё движение компонентов следует настройке системы `prefers-reduced-motion`: при просьбе системы его нет у полосы Tabs `line`, выезда Drawer, бега ProgressLinear и ProgressSpinner, раскрытия Accordion, стрелки Select, ручки Switch, точки RadioGroup и волны Skeleton — так же, как раньше у карточки Tabs `contained`, ручек Slider и ленты Scroller. Приложение задаёт режим в точке входа — `useMotion('full')` (движение всегда) или `useMotion('reduce')` (никогда) из `@soxa-ui/plugins`; режим — атрибут `data-so-motion` на корне документа. Ломающее: без движения Drawer проявляется и гаснет на месте, а неизвестная доля индикаторов — медленное мерцание всей дорожки и всего кольца вместо бега; `scrollBehavior: 'smooth'` у ListBox и Select прокручивает сразу, когда движение убрано. Тема oren пишет движение одним миксином (`motion.allowed`); своя тема читает тот же атрибут.
- 4100cf5: Кнопка на не-нативном теге (`div`) делает клик из Enter (на keydown) и пробела (на keyup), как браузер у `<button>`: на клавишу приходит `click`, а `action:press` — из него; `preventDefault` у keydown на любом обработчике по пути нажатие отменяет.
  
  Web Components: элементы soxa — нативные элементы своего тега (customized built-in). Вместо `<so-button>` пишется `<button is="so-button">`, вместо `<so-component-view>` — `<div is="so-component-view">`; из JS — `document.createElement('button', { is: 'so-button' })`. Кнопка — настоящая `<button>`: форму, `submitter`, `new FormData(form, submitter)`, Enter в поле, `form*`-атрибуты, `<fieldset disabled>`, `<label for>`, фокус и клавиатуру ведёт браузер. Для Safari пакет подключает полифил `@ungap/custom-elements`. Классы элементов собирает фабрика `SoxaElement(HTMLButtonElement, { descriptor, template, setup })` вместо наследования `TSoxaElement`; `defineProps`, реакции шаблона (`on`, `formAction`) и `TEventListener` убраны; `defineElement` принимает тег, который расширяется. Пробелы и комментарии вокруг слотов больше не глушат `text`; разметка со скриптом в `<head>` раскладывает слоты правильно.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.
- 55eccf2: Типы setup едут одним контрактом: `IComponentDescriptor<C>`, `IPluginDefinition<C>` и `IAdapterContext<C>` вместо позиционных параметров. `defineComponent` и `definePlugin` выводят контракт сами — явные аргументы типа у `definePlugin` убрать. Сняты `TPluginEventsFrom`, `TPluginPropsFrom`, `TPluginOutputsFrom`, `DescriptorPlugins`, `TDescriptorInstance`, `NamespacedEvents`; `TAdapterState` и `toInstanceState` принимают контракт. `useAdapter` и `useCollectionAdapter` адаптеров дженериков не требуют: `useAdapter(adapter, props)`.

### Patch Changes

- 85bcbed: Tooltip: новый компонент (Vue) — подсказка у элемента, паттерн Tooltip APG. Триггер кладут в слот `trigger`: ссылку на панель (`aria-describedby`) он получает в scope набором `triggerAria`, и стоит она всегда — закрытая панель только прячется. У панели `role="tooltip"`, фокус в неё не уходит. Пропсы: `open` (v-model), `placement` — сторона и выравнивание у триггера (по умолчанию `top` — по центру над ним), `openDelay` и `closeDelay` — задержка показа при наведении и скрытия после ухода курсора (400 и 150 мс). Показывают подсказку наведение (касание — нет) и фокус с клавиатуры — он сразу; курсор на самой подсказке её держит. Прячут уход курсора и фокуса, нажатие на триггер, нажатие мимо и Escape; Escape гасится `preventDefault`, и поповер под подсказкой остаётся открытым. На странице одна подсказка: открывшаяся закрывает прежнюю, а следующая за только что закрытой показывается без задержки. Поведение — новый `TTooltipTriggerPlugin`. Тема oren рисует подсказку плашкой в обратных цветах (`.so-tooltip`, `.so-tooltip__panel`, `.so-tooltip__content`).
- 1ed86e6: Снятый из разметки проп возвращается к умолчанию и там, где умолчание — «не задано»: доступное имя (`aria_label`, `aria_labelledBy`, `aria_describedBy`), `width` и `height` у Icon, `trackBy` у коллекций и `anchor_anchor` у Frame. Имя пропадает, размер иконки снова даёт `size`, панель отвязывается от якоря. Раньше умолчание у этих пропсов не было объявлено, и во всех адаптерах компонент оставался с прежним значением. Во Vue отсутствующий `anchor_anchor` теперь `null`, а не `undefined`.
- c9d24bc: Dialog: отступ от краёв экрана — проп `offset`: число — px, строка — CSS-значение, проценты — от экрана по своей оси; не задан — отступ темы, `0` — вплотную. У центра окно держится на отступе со всех сторон, у стороны — от её края, и отступ всегда ограничивает размер окна. Стороны по отдельности правит подписчик события раскладки `layout:offset:before` (`TDialogOffsetEvent`: место окна `placement` и изменяемые `top`, `bottom`, `start`, `end`; `preventDefault()` возвращает всем сторонам отступ темы) — событие приходит на каждый пересчёт стилей, в том числе у окна, созданного видимым. Тема oren раскладывает отступ переменными `--so-dialog-offset-{top,bottom,start,end}`. Раскладка модального слоя (`TModalLayoutPlugin`, у окна и выезжающей панели) шлёт `change:styles`, только когда стили сменились.
- 8595512: Tags с выбором: стрелки, `Home`/`End` и переход фокуса к соседу закрытого тега больше не докручивают до тега страницу и внешние области прокрутки — `TTagsKeyboardPlugin` только переносит фокус, а прокрутку при фокусе делает сам браузер. Тег под фокусом в окно ряда `scroll` доводит один плагин ряда `TTagsScrollPlugin`, одинаково при входе в набор по Tab и после стрелки. Как ряд показывает тег под фокусом, не меняется.
- a7cf90d: Rating: `required` работает — обязательная оценка, которую не поставили (0), не даёт отправить форму. У `input[type=range]` нет ни `required`, ни состояния «пусто», поэтому ошибку полю ставит новый плагин `TRatingValidityPlugin` (определение `RatingValidityPluginDescriptor`, namespace `validity`, в составе Rating) — `setCustomValidity` со строкой локали, пока оценка обязательна, равна 0 и не только для показа (`readonly`); поставили оценку — ошибки нет. Не отправить форму, поставить фокус на поле и показать сообщение — дальше браузер. Сообщение — новая строка локали `rating.required` во всех шести готовых локалях («Поставьте оценку», «Please select a rating»); своя полная локаль (`TLocale`) дописывает строку `rating.required` или собирается поверх готовой через `extendLocale`. Тема oren после неудачной отправки красит пустые звёзды вуалью цвета ошибки — по `:user-invalid` поля, поэтому нетронутая оценка до первой отправки не горит. ARIA не меняется: `aria-required` у роли `slider` нет.
- ed00f0c: Calendar: шапка как в календаре Android — заголовок месяца у начала ряда, «назад» и «вперёд» вплотную у конца, над двумя последними колонками; в DOM пара идёт сразу за заголовком первого месяца, и Tab проходит заголовок, «назад», «вперёд», сетку. Шапка панели выбора месяца и года — так же: год у начала, стрелки у конца. Новый слот `footer` — подвал под сетками, ряд действий у конца строки; ряд месяцев теперь в своём узле `.so-calendar__months`. DatePicker: проп `confirmable` — выбор в календаре становится черновиком, в подвале панели «Отмена» и «OK»: «OK» (`confirm()`) делает его значением и закрывает панель, любое другое закрытие черновик сбрасывает, а `closeOnSelect` не действует. Пока диапазон выбран наполовину, «OK» выключена (`confirmDisabled`). Текст кнопок — строки локали `datePicker.confirm` и `datePicker.cancel` во всех шести готовых локалях.
- 8b89d9e: Drawer: новый компонент (Vue) — выезжающая панель у края экрана, модальная, как окно. Край — `placement`: `end` (по умолчанию), `start`, `top`, `bottom`, стороны логические; размер — `width` у боковой и `height` у верхней и нижней (переменные темы `--so-drawer-width` и `--so-drawer-height`). `swipe` включает жест: `handle` — смахнуть за полосу у края, `panel` — за любое место, кроме контролов и прокручиваемых областей; отпустили дальше четверти размера или быстро к краю — закрытие с новой причиной `swipe` (`TCloseReason`) через отменяемое `close:before`, иначе панель возвращается на место. `contained` оставляет панель в ближайшем позиционированном предке — например, в модальном окне — и не запирает прокрутку документа. Крестик, Escape, подложка, `dismissible`, `close:before`, фокус и немой для скринридера фон — как у Dialog: общее вынесено в базу `TModalLayer` (`@soxa-ui/core`), дескриптор `ModalLayerDescriptor` (`@soxa-ui/setup`) и расчёт раскладки `TModalLayoutPlugin` (`@soxa-ui/plugins`), у Dialog поведение и CSS прежние. Тема oren рисует панель и подложку (`.so-drawer`, `.so-drawer__backdrop`, `--placement-*`, `data-open`, `data-swiping`, `data-contained`), въезд и выезд — переходом.
- b4243ba: Slider: щелчок к меткам — проп `snap`: `none` (по умолчанию), `magnet` — в радиусе метки ручка стоит на ней, `plateau` — метка занимает два радиуса хода, а промежутки между метками сжаты, `settle` — отпущенная рядом с меткой ручка доезжает до неё, `hold` — ручка стоит на пересечённой метке и потом догоняет указатель. Радиус — `snapRadius` в px (8). Опорные точки — метки (`marks`), клавиатура ходит по шагу при любом режиме. Контракт `ISlidable` дополнен долями ручек и меток (`fractions`, `snapPoints`), режимом и радиусом щелчка, подпиской на смену режима и командой `settle` — доводка ручки уже без перетаскивания, с одним `commit`. `TSlidePointerPlugin` выбирает стратегию щелчка по режиму владельца; время стоянки в `hold` — опция установки `holdDelay` (250 мс).
- c037d5c: Панель у правого края окна больше не уезжает под вертикальную полосу прокрутки: границей для сдвига и flip служит видимая область (window.visualViewport), а не окно вместе с полосой
- 3a72379: Tags и Select: у ряда тегов два режима переполнения — `wrap` и `scroll`, оба — раскладка темы, без замера ряда и панели. Свою раскладку тегов собирают слотами: `default` у Tags отдаёт показанные теги (`shown`) — их кладут в `Scroller` или делят на ряд и `Popover` за кнопкой, — а новый слот `tags` у Select подменяет ряд тегов в поле и получает инстанс тегов и его коллекцию (`tags`, `engine`) — то, что встроенный `Tags` берёт `:ctrl` и `:engine`. Тема oren красит видом и вариантом набора тег на любой глубине внутри набора, поэтому своя раскладка в слоте выглядит так же, как ряд. Ряд `scroll` в поле Select занимает место по своим тегам, но не больше половины поля: ввод стоит сразу за последним тегом, а тесный ряд прокручивается в своей половине.
- 5c4c620: ListBox: поля и кнопки в шапке, подвале и слотах элемента получают свои клавиши — пробел печатается, Enter и пробел нажимают кнопку, стрелки из поля не двигают подсветку списка
- e982bdf: Slider: новый компонент (Vue) — ползунок, паттерны Slider и Multi-Thumb Slider APG. Значение — число (одна ручка) или массив (по ручке на элемент), и форма сохраняется в `v-model`. Ручка — нативный `input[type=range]`: мобильный скринридер двигает её своим жестом, `name` и `disabled` уходят в форму сами. Пропсы: `min`, `max`, `step` — числом или списком допустимых значений (неравный шаг), `largeStep` — шагов у Shift со стрелкой, PageUp и PageDown, `orientation`, `inverted`, `origin` — откуда растёт заливка одной ручки (середина хода — заливка от центра), `marks` — точки шкалы или свой список с подписями, `minStepsBetweenThumbs` — наименьший зазор между ручками в шагах, `thumbLabels` — имена ручек для скринридера. Слоты: `mark` — подпись метки, `thumb` — место под подсказку со значением. Событие `commit` — одно на действие: конец перетаскивания, сменившего значение, или шаг клавишей. Механизм «тянем — меняем значение» отделён от ползунка: шкала `createScale` (`IScale`) в ядре, контракт `ISlidable` и плагины `TSlidePointerPlugin` и `TSlideKeyboardPlugin` — их возьмёт следующий компонент с перетаскиванием. `TStateUnit` принимает правило «то же самое» (опция `same`): составное значение сверяется им, а не по ссылке. Тема oren рисует ползунок (`.so-slider` и его части).
- dd268c6: Menu — меню действий у кнопки (APG Menu Button): пункты, флажки, группы с подписью и разделители, клавиатура с набором по первым буквам, наведение и модель фокуса; во Vue — `Menu` с частями `Menu.Item`, `Menu.CheckboxItem`, `Menu.Group`, `Menu.Separator`, в теме oren — его стили.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- f2bc1f9: RadioGroup: выбор, отменённый в `item:activate:before`, больше не оставляет нажатое радио отмеченным, а соседа — без отметки: после каждого `change` поля группы возвращает к модели её плагин `TRadioGroupCheckedPlugin`. Повторный клик по радио, в выборе которого отказали, снова выбирает его.
- 4fa09bc: Toasts: раскладка стопкой — новый проп `layout` (`list` по умолчанию и `cascade`, модификатор `so-toasts--layout-*`). В стопке тосты перекрывают друг друга: передний — первый по порядку коллекции, задние уже и выглядывают из-под него на ступень, высота стопки — по переднему. Вывести задний тост вперёд — перестановка в коллекции: колесо над регионом листает стопку на шаг за жест (вниз — передний уходит назад, вверх — задний выходит вперёд), и страница под стопкой не едет; стрелки ↓ и ↑ при фокусе на тосте — то же, и фокус переходит на новый передний. Это новый плагин `TToastsCascadePlugin`; без стопки колесо и стрелки остаются странице. Фокус на заднем тосте выводит его вперёд темой, без перестановки: Tab идёт по тостам по порядку и уходит из стопки. Глубину тоста разметка отдаёт теме переменной `--so-toasts-depth`. Тема oren рисует стопку, а высоту переднего, по которой задние меняют свою переходом, пишет её поведение — новый `TToastsFrontPlugin` (`useTheme`). Во Vue крестик тоста — `type="button"`: в форме он её не отправляет.
- 1a1a8e9: THideOutsidePlugin (namespace hideOutside, определение HideOutsidePluginDescriptor): пока модальный слой открыт, фон под ним спрятан от скринридера пометкой aria-hidden. Доступными остаются панель и слои, открытые поверх неё, — например список Select из окна; набор пересчитывается по составу страницы и номерам слоёв, пометки со счётчиком не затирают друг друга у окна поверх окна. Правило «слой выше панели» у TDismissPlugin вынесено в общие утилиты, его поведение не меняется.
- b850687: Tabs `view="contained"`: карточка активного таба переезжает к новому табу переходом, как полоса у `line`. Ресайз, сдвиг соседей и первая отрисовка ставят её на место сразу, а при `prefers-reduced-motion: reduce` переезда нет. Без `useTheme` карточка, как и раньше, стоит на выбранном табе. Геометрию активного таба поведение темы пишет на список переменными `--so-tabs-active-pos` и `--so-tabs-active-size`.
- a58f169: Pagination — постраничная навигация: стрелки по краям, первая и последняя страницы видны всегда, между ними — `middleCount` страниц вокруг текущей (по умолчанию 3), на месте пропущенных — многоточие: `‹ 1 … 4 5 6 … 10 ›`. Страницы числовые — `⌈total / pageSize⌉`, номер в цифрах локали («12 345»), — или текстовые — список `pages` из `{ text, value? }`. Значение (`value`, `v-model`) — ключ текущей страницы, к страницам не прижимается. Корень — `nav`, имя ему даёт приложение (`aria_label`); у текущей — `aria-current="page"`, имена стрелок — из локали, новый раздел `pagination`. В ядре — `TPagination` и коллекция страниц окна (`createEnginePagination`, выход `cells`): в коллекции только видимые страницы, и страница, оставшаяся на экране, — тот же узел. Новый плагин имён `TPaginationNamesPlugin`. Во Vue — компонент `Pagination`, в теме oren — его стили.
- e76d680: Toasts — всплывающие уведомления: менеджер `<Toasts>` оборачивает приложение, а `useToasts().show(текст | опции)` показывает тост из кода и отдаёт его экземпляр. Очередь — коллекция с пределом видимых (`max`), автозакрытие с паузой на указатель, фокус и скрытую вкладку (`duration`, `0` — пока не закроют), срочные тосты (`alert`), своё содержимое (`render`), смахивание, F8 к тостам и Escape; тема oren рисует регион у шести краёв окна и тосты. Слой (`TLayer`) получил публичный `raise()`, жест (`TSwipePlugin`) начинается в слое своей панели.
- 6071ef5: DateInput: вид поля `kind` — `date` (дата, по умолчанию) или `datetime` (дата со временем): к частям даты добавляются час, минута и, у 12-часового цикла локали, период суток; значение — `YYYY-MM-DDTHH:mm`. Цикл часов берётся только из локали, период суток выбирают буквой или ↑/↓, `min` и `max` принимают и дату со временем. На касание части времени тоже редактируемые, у периода суток — экранная клавиатура букв.
- 17bc937: Calendar — компонент поверх календаря ядра: во Vue `<Calendar>` с частью `Calendar.Item`, в setup — дескрипторы `CalendarDescriptor`, `CalendarItemDescriptor` и их коллекционные части, в теме oren — стили. Сетка — по APG (Date Picker Dialog): месяц — `table` с `role="grid"`, его заголовок называет сетку и сам объявляет смену месяца (`aria-live="polite"`), фокус и наборы — на ячейке дня, одна остановка Tab на все сетки, шапка дней недели скрыта от скринридера. Клавиши — `TCalendarKeyboardPlugin`: стрелки, Home/End, PageUp/PageDown (с Shift — год), Enter и пробел выбирают день, Escape отменяет начатый диапазон; DOM-фокус идёт за фокусом коллекции и в новый месяц. Нажатия и наведение для предпросмотра диапазона — `TCalendarPointerPlugin`. Кнопки листания — одна пара на все сетки; их имена — новые пропсы `prevLabel` и `nextLabel` у `TCalendar` (по умолчанию английские), кнопка, погасшая у границы под фокусом, отдаёт фокус дню. Содержимое дня — слот `item` со scope `{ item }`. В ядре: выходы `prevAria` и `nextAria`, событие вида `change:paging` — перечитать `prevDisabled` и `nextDisabled`, а ячейка заполнителя в `grids` — только дата и `aria-hidden`, без текста и `data-outside-month`.
- a91b783: Tags: свойство overflow (wrap | scroll) — теги, которым не хватило ширины ряда, переносятся на новую строку или ряд стоит в одну строку и прокручивается. Select передаёт режим тегам поля пропом tags_overflow. Поле Select больше не расширяется под теги средствами CSS.
- bd02d06: Popover: новый компонент (Vue) — панель с произвольным содержимым у триггера, паттерн немодального диалога APG. Триггер кладут в слот `trigger`: связку с панелью (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`) и вид «нажат» (`data-selected`) он получает в scope — наборами `triggerAria` и `triggerDataset`. У панели `role="dialog"`, имя — `aria_label` или `aria_labelledBy`. Пропсы: `open` (v-model), `closable` и `closeLabel` — кнопка закрытия в углу панели, `lazyMount` — не монтировать содержимое до первого открытия, `placement` — сторона и выравнивание у триггера. При открытии фокус уходит в панель; закрытие крестиком, Escape или самим содержимым возвращает его на триггер, нажатие и фокус мимо закрывают без возврата; Tab ходит так, будто панель стоит в документе сразу за триггером. Тема oren рисует панель, область содержимого и крестик (`.so-popover`, `.so-popover__panel`, `.so-popover__content`, `.so-popover__close`). Frame пишет номер своего слоя в `data-layer` — тот же, что `zIndex`, — и получает слой сразу, если создан видимым: раньше такой Frame стоял с `z-index: 0`.
- 60f8114: Table: режим сетки `grid` (APG Data Grid) — одна остановка Tab, стрелки, Home/End, Ctrl+Home/End и PageUp/PageDown по ячейкам, выбор строки нажатием и пробелом, Ctrl/Cmd+A, Enter на сортируемом заголовке, Enter и F2 — внутрь ячейки, Escape — обратно; строка под указателем и под фокусом подсвечена
- e4cedbf: Spinner: толщина кольца (`borderWidth`), заданная в разметке или готовым `ctrl`, применяется с первой отрисовки. Раньше плагин раскладки следил только за сменой толщины, и кольцо рисовалось толщиной темы, пока значение не поменяют. Заработала и толщина по умолчанию, `'auto'`: её считает размер — 2px у `xl` и `2xl`, 1px у остальных, — и смена размера её пересчитывает. Раньше до стиля она не доходила: кольцо держало запасную толщину темы, а возврат к `'auto'` отдавал в переменную толщины само `auto` — недопустимую толщину рамки.
- 0fc492f: Автоматические id в разметке (поле, панели, связки табов и секций, список Select, name группы радио, data-owner) строятся от основы экземпляра idBase, а не от счётчика uid: адаптеры Vue и React дают её из useId, и при серверном рендере id на сервере и в браузере совпадают. Новая опция конструктора idBase; элементы коллекции из items получают основу владельца с номером. В React фабрика useAdapterContext получает функцию сборки create — компонентам собирать контекст ею.
- e0aa88f: Лента (`Scroller`) доводит в окно вместе с элементом под фокусом весь его элемент ленты, если тот не шире окна: кнопка внутри карточки встаёт в ленту вместе со всей карточкой, а не оставляет её край под подсказкой. Элемент ленты шире окна доводится как раньше.
- 0c6f41d: Select в окне: `<Virtual><Select :items /></Virtual>` — список панели рисует только видимые опции, на месте остальных — распорки той же высоты (`.so-select__filler`). Фасад коллекции Select отдаёт `drawn`, разметка рисует опции по нему. Клавиши ходят по всем показанным опциям: подсвеченную вне окна окно держит в документе, а `aria-activedescendant` ссылается на опцию, только пока она в документе, — ссылку и прокрутку к ней клавиатура ставит, когда окно её нарисовало (хук `onHighlightedMounted` у `TListNavigationPlugin`). Прокрутка к подсвеченной опции — в следующем кадре: панель, открытую той же клавишей, и дорисованную опцию адаптер рисует после обработчика. Место опции в наборе (`aria-setsize`, `aria-posinset`) в окне пишет общее расширение коллекции `positionInSet` (`TPositionInSetExtension`) — у ListBox и Select одно.
- 01e60e2: Общий слой оверлея: модель фокуса вынесена в базу TOverlayFocusPlugin, к ней добавлены TModalFocusPlugin (Tab замкнут в панели) и TScrollLockPlugin (страница под открытым оверлеем не прокручивается, замок со счётчиком слоёв). Поведение Popover не меняется.
- 05d9f0a: Тег под фокусом у края ряда тегов `scroll` виден целиком. Частично видимый элемент браузер при фокусе не докручивает, а целиком скрытый ставит по центру, поэтому у края ряда оставались срезанными крестик, подпись тега или сторона кольца фокуса. Теперь фокус с клавиатуры (Tab, Shift+Tab, стрелки, вход в набор) ряд докручивает до всего тега — новый плагин Tags `TTagsScrollPlugin`, он же и в ряду тегов поля Select, где тег встаёт между подсказками у краёв. Фокус от нажатия мышью ряд не двигает. Счёт доводки общий с лентой (`TScrollerViewportPlugin`), её поведение не меняется. Тема oren: в поле Select без подсказки у края (браузер без `animation-timeline`) тег под фокусом встаёт вплотную к краю ряда.
- e07fd63: Модальное окно и выезжающая панель больше не сдвигаются вбок, пока исчезают: прокрутка страницы возвращается после перехода закрытия
- f3e1083: ListBox открывается прокрученным к выбранному элементу. Начальная прокрутка ждёт и узел корня, и движок, а в окне (`Virtual`) — и узел выбранного: до первого замера окно рисует только первые элементы и дорисовывает выбранный после замера. Начальная прокрутка мгновенная и при `scrollBehavior: 'smooth'`, при `none` её нет; прокрутка за сменой выбора — как прежде, по `scrollBehavior` и режиму движения. Предел строк (`maxRows`) список получает сразу при объявлении корня, а не кадром позже.
- ff6b7a2: Панели Select и DatePicker можно смахнуть, чтобы закрыть: новый проп `swipe` (`none` по умолчанию, `handle` — за полосу у края со стороны поля, `panel` — за любое место, кроме контролов и прокручиваемых областей). Оба компонента — смахиваемые слои (`ISwipeable`) с общим `TSwipePlugin`: панель уходит от поля — вниз под ним, вверх над ним, — и жест закрывает её записью `open`, как Escape. Признак «тянут» — `data-swiping` из нового набора `panelDataset`, полосу разметка рисует по выходу `handleRendered`. У DatePicker календарь в панели завёрнут в `.so-date-picker__content`, и прокручивается теперь он, а не панель: иначе пальцем длинную панель с жестом не прокрутить. Тема oren: вид панели у якоря — проявление, жест и уход смахнутой — один миксин на Popover, Select и DatePicker; Popover выглядит как прежде.
- 01e6c91: Tags с выбором: когда стрелка, `Home` или `End` переводят фокус на тег, а `Delete` — на соседа закрытого тега, ряд докручивается до всего тега, вместе с крестиком и кольцом фокуса. Раньше тег у края ряда, видимый частично, ряд не докручивал вовсе: у конца ряда за краем оставались крестик и сторона кольца, у начала — начало строки тега и сторона кольца. В режиме `scroll` тег, докрученный до края, стоит от него на запас под кольцо — 0.25rem, это отступ прокрутки ряда.
- a1d81be: DateInput на сенсорных устройствах: касание пальцем или пером делает части даты редактируемыми — дату вводят с экранной клавиатуры, а нажатие мышью возвращает протяжку для выделения всей даты. Ввод экранной клавиатуры и композиция IME становятся командами ядра, текст частей по-прежнему пишет ядро. На iPhone и iPad части — текстовые поля, и имя поля входит в имя каждой части. Новое: плагины TDateInputTouchPlugin и TDateInputIdsPlugin, наборы частей segmentSets у TDateInput, у части в segments — attrs и name.
- dcee2e2: Новый компонент Scroller: лента произвольного содержимого в одну строку, которую двигают две кнопки. Прокрутка нативная, полосы не видно, шаг — видимая ширина; на краю кнопка гаснет, когда листать нечего — кнопок нет вовсе. Роль ряда лента принимает от потребителя пропом viewportAria.
- 0f36216: Новый компонент `Label` — подпись контрола: текст (проп `text` или слот `content`) рядом с CheckBox, Switch или радио в слоте `default`, сторона текста — `position` (`start`, `end`, `top`, `bottom`). Связь — вложением, без `for` и `id`: клик по тексту переключает контрол, а текст становится его доступным именем. Радио внутри подписи рисуется с `tag="span"` — его корень тоже `label`; вложенный `label` ловит `TLabelNestedWarnPlugin` предупреждением в консоль. Тема oren рисует стороны, размер текста и выключенную подпись.
- eaffd69: DatePicker получил кнопку очистки — `clearable`, как у Input и DateInput: DatePicker теперь сам поле (база ядра `TField`, дескриптор `FieldDescriptor`) с набором кнопки `clearAria`, командой и событием `clear` и слотом `clear`. У одной даты кнопка стоит в поле перед кнопкой календаря, у диапазона — одна на период, после поля конца, и очищает оба конца, в том числе набранные не до конца. Имя кнопки — строка локали `field.clear` с `name` DatePicker. Плагин имён поля `TFieldNamesPlugin` теперь ставят дескрипторы Input и DateInput, а не `FieldDescriptor`: у DatePicker имя кнопки пишет `TDatePickerNamesPlugin` — наследник плагина имён поля. В теме oren коробка диапазона — сетка из пяти колонок, а сторону кнопок DatePicker задаёт переменная `--so-date-picker-button`.
- 6476cb7: Лента со стрелками (`Scroller`): элемент под фокусом с клавиатуры больше не остаётся у края под подсказкой. Окно снапа вьюпорта в теме — чистая часть ленты между подсказками, и плагин ленты доводит в него элемент под фокусом, а фокус от нажатия мышью ленту не двигает. Страница после листания встаёт за подсказкой, а не под ней.
- 9972268: Select с отбором (`editable`, `editableMode: 'filter'`): закрытая панель гаснет с тем же отобранным списком. Набранное и текст поля по-прежнему меняются сразу — на выбор, второй Escape и уход фокуса, — а отбор `TEditablePlugin` снимает, когда панель доиграла переход исчезания. Раньше гаснущая панель на миг показывала весь список и вытягивалась до его высоты. Открыли панель, пока она гасла, — отбор снимается сразу; ввод и отбор, который сменил кто-то другой, ожидание отменяют. Смена `editable` и `editableMode` снимает отбор сразу, как прежде.
- 0abcc93: DateInput — поле даты по частям в формате локали: дату вводят с клавиатуры по частям, а целиком выделяют протяжкой мышью или Ctrl/Cmd+A, копируют, вырезают и вставляют, как текст. У ядра третья лицензия — Apache-2.0: подсказки пустых частей (`дд.мм.гггг`) взяты из таблицы React Spectrum.
- 7bee975: DatePicker: новый компонент (Vue) — поле даты и календарь в панели, паттерн Date Picker Dialog APG. Режим `mode`: `single` (по умолчанию) — поле DateInput с кнопкой календаря в его конце, `range` — поля начала и конца в одной коробке и одна кнопка. Значение — дата `YYYY-MM-DD` или пара `[начало, конец]` (`v-model:value`); его меняют и набор в поле, и выбор в календаре, а недонабранный конец значения не даёт, но и не стирается. Панель открывают кнопка календаря и Alt+↓ на поле (`open`, `v-model:open`, события `open` и `close`): фокус уходит на день сетки — выбранную дату или сегодня, Tab ходит по кругу в панели, Escape закрывает и возвращает фокус, нажатие мимо закрывает панель и оставляет фокус там, куда нажали. Выбор дня закрывает панель (`closeOnSelect`), в диапазоне — второй день; первый Escape посреди диапазона снимает начатый выбор. Полям и календарю DatePicker раздаёт `disabled`, `size`, `variant`, `locale`, `min`, `max`, полям — `readonly` и `required`, календарю — `unavailable`, `weekStart` и `timeZone`. Имена: `triggerLabel` — кнопка и панель, `startLabel` и `endLabel` — концы диапазона, имя поля — `aria_label`. Слоты `trigger-icon` и `item` (содержимое дня), экземпляры — `ctrl.field`, `ctrl.start`, `ctrl.end`, `ctrl.calendar` и `ctrl.engine`. Calendar принимает движок снаружи (`engine`), выбор календаря сообщает выбор пользователя событием `choose`, у фокуса календаря — команда `resetFocus`. Плагины `TDatePickerFocusPlugin`, `TDatePickerTriggerPlugin` и `TDatePickerIdsPlugin`, ловушка Tab модального оверлея — общая утилита `trapTab`, место первого фокуса у `TOverlayFocusPlugin` — точка `_focusCandidates`. Значок кнопки — роль `calendar` (`@soxa-ui/icons-material`, Material Symbols «Calendar Month»); тема oren рисует кнопку, коробку диапазона и панель (`.so-date-picker`, `--single`, `--range`), из темы Select ушло мёртвое правило `.so-select--disabled`.
- cd29b8f: Calendar: заголовок месяца — кнопка, открывающая панель выбора месяца и года. Панель накрывает календарь целиком, её шапка встаёт на место ряда заголовков; в ней список месяцев — ровная сетка 4×3 с подписями по центру, год в шапке переключает на годы по 12, стрелки листают год и страницу лет. Имена стрелок — новые пропсы prevYearLabel, nextYearLabel, prevYearsLabel, nextYearsLabel. Frame и Popover получили проп contained: панель не телепортируется, а встаёт в ближайшем позиционированном предке (Popover — накрывает его целиком). ListBox сообщает о выборе пользователя событием choose расширения списка.
- ceb0a8e: Лента (`Scroller`) и ряд тегов со стрелками: кнопка листания, выключившаяся у края под фокусом, отдаёт фокус кнопке напротив — он больше не падает на страницу.
- 251e7e2: ListBox и Select рисуются на сервере в Node, где нет `requestAnimationFrame`. Раньше их серверный рендер падал с `ReferenceError: requestAnimationFrame is not defined`: высота списка по `maxRows` и прокрутка к выбранному планировали кадр уже при сборке компонента. Теперь кадр они планируют, только когда у списка есть узел, а всё, что сменилось до узла, применяют, когда он появился: предел строк ставится сразу, список открывается на выбранном.
- 3bfa716: Rating: новый компонент (Vue) — оценка звёздами, паттерн Rating Slider APG: ползунок с одной ручкой на нативном `input[type="range"]`, звёзды — его зрительная шкала. `value` — оценка от 0 до `max` (сколько звёзд, по умолчанию 5), `step` — шаг (по умолчанию 1, `0.5` — половинки), `v-model:value`; событие `commit` — одно на действие. Нажатие ставит звезду под указателем целиком, на левой половине при шаге 0,5 — половину; протяжка ведёт оценку; стрелки — шаг, PageUp и PageDown — звезда, Home — «оценки нет», End — наибольшая; в RTL ряд растёт справа. Наведение показывает оценку, которую поставит нажатие (`preview`, событие `change:preview`); касание — не наведение. `readonly` — оценка только для показа: не меняется и не подсвечивает наведение, у поля `aria-readonly`. Как звучит значение («4 из 5») — `aria-valuetext` из нового раздела локали `rating` во всех шести готовых локалях, числа — по тегу локали; своя полная локаль (`TLocale`) дописывает строку `rating.value` с местами `{value}` и `{max}` или собирается поверх готовой через `extendLocale`. Значок — новая роль иконки `star` (`@soxa-ui/icons-material`, Material Symbols «Star»), слот `icon` со scope `{ value, filled }` рисуется и в пустом, и в залитом слое звезды. Плагины `TRatingHoverPlugin` и `TRatingNamesPlugin`; нажатие и клавиши ведут плагины Slider: `TRating` реализует контракт `ISlidable`. Тема oren рисует звёзды (`.so-rating`, `__track`, `__star`, `__star-fill`): залитая часть — доля `--so-rating-fraction`, цвет без варианта — `caution`.
- 20a45da: ListBox: стрелки пропускают недоступные элементы — выключенные (сами или вместе со списком), скрытые и не нарисованные, как у Select, Tabs и Tags. Стрелка с элемента, который выключили под подсветкой, или с выключенного выбранного ведёт к его соседу, а не на край списка — так же теперь и в Select. Клавиши со строки выключенного элемента остаются клавишами списка.
- 7336a0b: Плагины слоя оверлея — `TDismissPlugin`, `TOverlayFocusPlugin` с наследниками, `TScrollLockPlugin` и `THideOutsidePlugin` — снимают подписку на открытость владельца в `destroy()`: свой `ctrl`, переживший перемонтирование, больше не копит обработчики уничтоженных плагинов. У `IOverlayOpenState` появился `unbind()`.
- b1fad65: Table: колонки переставляются пользователем — перетаскиванием заголовка колонки `reorderable` и Ctrl+Shift+←/→ на нём. Тащится только заголовок, колонка встаёт на место одной перестановкой на отпускании; таблица отдаёт `column:move` с колонкой и новым порядком полей
- 2c76370: Tabs: клавиатура по паттерну APG Tabs. Стрелки по оси ориентации и Home/End переносят фокус и сразу активируют таб, Delete закрывает таб, который можно закрыть. Весь список — одна остановка Tab: tabindex="0" у активного таба, следующая остановка — панель, кнопка закрытия из порядка Tab выведена. Список табов объявляет aria-orientation и получает имя из aria_label.
- 29ccac8: TAnchorPlugin: `anchor_placement` принимает `top` и `bottom` — панель по центру якоря, сверху или снизу. Flip меняет только сторону и центр сохраняет, shift у края окна сдвигает панель, как и прежде, а направление письма центр не разворачивает. В `data-placement` у центра — сторона без суффикса (`top`, `bottom`). Те же значения принимает `placement` у Tooltip, и по умолчанию подсказка стоит по центру над триггером (`top`), как у Radix и Zag.
- 5f48561: Набор плагинов, уничтоженный раньше, чем его объявили наружу, больше не приходит в `bundle:create`. Объявление отложено на микрозадачу, и при синхронном размонтировании или в React под StrictMode со своим `ctrl` подписчик получал уже уничтоженный набор: плагин, поставленный в него, никто не уничтожал, и он продолжал реагировать на компонент. У `IPluginBundle` появился признак `destroyed`, а `created()` уничтоженного набора плагины не объявляет.
- 50f05bd: Select: Enter и пробел на кнопке очистки и на крестике тега выполняют их действие, а не открывают панель
- 3c56a74: TDismissPlugin ведёт открытость владельца той же привязкой, что и остальные плагины оверлея; поведение не изменилось. `IDismissPluginOptions` теперь наследует `IOverlayOpenOptions`: опции `property` и `event` объявлены там, состав опций прежний.
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- c0c7b0a: Плагин раскладки Spinner следит только за change:borderWidth: о смене толщины от размера сообщает ядро.
- 3daf6b0: Пакеты отдают собранный ESM и описания типов из dist, а не исходники
- 4a8dc74: Select: набранный в поле текст больше не стирается, когда меняется список опций. Раньше удаление любой опции, даже невыбранной, пересборка списка, смена `value` из кода, переименование выбранной опции и закрытие тега переписывали поле текстом выбранного, и при серверном поиске ввод пропадал на каждом ответе. Теперь поле всегда пишет только выбор пользователя — опция из списка или кнопка очистки, — а остальные изменения трогают его, пока в нём не печатают; возврат поля по Escape и уходу фокуса показывает уже свежий текст выбранного. Набранное и отбор `editableMode: 'filter'` тоже сбрасывает только выбор пользователя: у расширения `select` появилось событие `choose`, его и слушает `TEditablePlugin` вместо `change:selection`. Кнопка очистки стирает набранное и тогда, когда ничего не было выбрано.
- 63bb30a: Slider: нажатие мышью на ручку больше не включает кольцо фокуса и подсказку `auto` — поле ведомой ручки фокусируется без видимого фокуса (`focusVisible: false`). Раньше кольцо вставало, если прошлый фокус на странице пришёл не от мыши: на свежей странице или после Tab.
- 84ab767: DateInput: точность времени `timePrecision` — `minute` (по умолчанию, значение `YYYY-MM-DDTHH:mm`) или `second`: у поля даты и времени за минутой появляется секунда, значение — `YYYY-MM-DDTHH:mm:ss`. Секунду набирают цифрами, ↑/↓ ведут её по кругу, вставка принимает ISO и текст поля с секундами. Значение другой точности поле принимает: время до минуты оставляет секунду пустой, а секунда значения до секунды у поля до минуты скрыта в частях и вернётся со сменой точности; `min` и `max` сравниваются с точностью грубейшего. У поля даты точность ничего не меняет. Тема oren держит минимальную ширину ряда и у поля с секундами.
- b26c05f: Icon: `width` и `height`, заданные в разметке, применяются с первой отрисовки. Раньше плагин раскладки иконки следил только за сменой размера, а размер, с которым иконку собрали (пропом или готовым `ctrl`), до стилей не доходил: иконка рисовалась размером по умолчанию, пока значение не поменяют.
- c3032e2: Table: режим окна (virtual) — тело рисует только видимые строки, остальные заменяют распорки той же высоты. Расширение virtual коллекции строк, плагин замера TTableVirtualPlugin, aria-rowcount и aria-rowindex по APG. Реестр bundles отпускает запись элемента из данных при размонтировании
- 25ecd85: Enter и пробел во вложенных полях и кнопках контролов больше не глушатся: в `Input` и в `Select` с `editable` печатается пробел, `CheckBox` и `Switch` переключаются пробелом, секция `Accordion`, таб и крестик тега в `Tags` нажимаются с клавиатуры. `press` на Enter и пробел приходит, только когда фокус на самом корне контрола; вложенная кнопка даёт `press` своим кликом, как при нажатии мышью. Enter в `Input` внутри `<form>` теперь отправляет форму, как голый `<input>`.
- 312ec01: Плагины снимают подписки с шины владельца и расширений движка при уничтожении: свой `ctrl` и движок снаружи (`engine`), которые переживают перемонтирование, больше не копят обработчики уничтоженных плагинов. Для таких шин у `TBasePlugin` появился защищённый метод `_listenTo`: подписку он запоминает, а `destroy()` базы её снимает. Шину владельца, которого плагин знает по контракту, описывает новый тип `IListenable`.
- 884a39d: ListBox: выключенный элемент не выбирается ни кликом по строке, ни Enter и пробелом — выключен ли он сам или весь список. Раньше строка и клавиатура списка переключали выбор напрямую через `selection.toggle`, мимо выключенности: в теме oren мышь до такой строки не доходила, но клик от скринридера или скрипта выбирал элемент. Выбор пользователя теперь идёт через расширение списка — `chooseItem` у `TListBoxExtension`, `choose` у его item-адаптера. Выбрать выключенный элемент из кода (`selection.select`, `toggle`) по-прежнему можно.
- 130ecc5: `dismiss_enabled` у Select типизирован дескриптором: новый `IDismissPluginProps` передаётся третьим аргументом `definePlugin`, и шаблон проверяет значение пропа. Из `TDismissPluginProps` убран `dismiss_enabled`, в типе остался выход `dismiss_ownerAttribute`.
- e6213d6: Table: перестановка колонки стала живой. С движением соседи взятого заголовка расступаются на его ширину, а отпущенный заголовок доезжает до места — и только тогда колонка переставляется, одной перестановкой и одним `column:move`: около 200 мс после отпускания с движением и кадром позже без него. Линия места вставки осталась только без движения. Новый проп таблицы `reorderPreview`: `none` — за жестом идёт только взятый заголовок, соседи стоят, место показывает линия, и колонка встаёт на отпускании, как раньше (у взятого — `data-still`); `head` (по умолчанию) — за жестом идёт шапка, а тело стоит; `column` — и ячейки нарисованных строк, для таблиц в окне `Virtual`. Проп читает расширение колонок: в `column` оно ставит корню признак `data-reorder-preview` только на время жеста, и на покое таблица за режим не платит. У расширения `columns` — команда `dragDrop()` и метки колонок `data-shift` и `data-landing`; плагин перестановки пишет корню ширину взятого заголовка (`--so-table-column-shift`) и считает место по коробкам заголовков на старте жеста, поэтому сдвинутые соседи и прокрутка посреди жеста место не сбивают.
- 01b6fbc: Popover: панель проявляется и гаснет переходом темы, как окно Dialog, — по `data-open` в наборе панели (`panelDataset`). Панель со своей стороной ещё и движется, как Drawer: в контейнере въезжает от своего края и уезжает к нему, со смахиванием у триггера уезжает от него, — и смахнутая панель уходит дальше от места, где её отпустили, а не исчезает разом. Закрытая жестом панель сохраняет сдвиг до следующего показа, и тема сама решает, увозить её к стороне или гасить на месте.
  
  Popover: новый проп `edge` — край контейнера (`top`, `bottom` по умолчанию, `start`, `end`), к которому прижата панель внутри него (`contained`). Он же задаёт, куда панель смахивают (к этому краю), и где полоса жеста (у противоположного края). Раньше панель в контейнере накрывала его целиком и смахивалась только вниз.
  
  Calendar: панель выбора месяца и года выезжает сверху и при закрытии гаснет на месте вместе с подложкой, без вспышки — карточка от верхнего края календаря во всю его ширину, высотой по содержимому, под ней подложка. Панель закрывается нажатием по подложке и жестом вверх за полосу у низа карточки, фокус возвращается на заголовок месяца. Подписи плиток месяцев переносятся только между словами. В режиме принудительных цветов видны выбранная строка ListBox без отметки и штрих полосы жеста у Drawer и Popover.
- 1d4551c: Table: перестановка колонки в reorderPreview: 'head' на большой таблице без окна стоит столько же, сколько до живой перестановки. Плагин жеста пишет ширину взятого шапке, а не корню (в column — корню), и в обработчике указателя не читает стиль после записи; тема oren поднимает шапку над телом и без закрепления, и заголовок, ставший слоем, не сверяется с полем чекбокса каждой строки. Линия места без движения и в none больше не перекладывает таблицу на каждой смене места.
- daad2de: Pagination: стрелка, погасшая у края под фокусом, отдаёт фокус текущей странице
- Updated dependencies [85bcbed]
- Updated dependencies [1ed86e6]
- Updated dependencies [f535f0d]
- Updated dependencies [bb9cd8f]
- Updated dependencies [dd5c935]
- Updated dependencies [c9d24bc]
- Updated dependencies [eae46e4]
- Updated dependencies [9e0c6e7]
- Updated dependencies [a7cf90d]
- Updated dependencies [ed00f0c]
- Updated dependencies [8b89d9e]
- Updated dependencies [89815b8]
- Updated dependencies [b4243ba]
- Updated dependencies [0b61b6a]
- Updated dependencies [8b77053]
- Updated dependencies [3a72379]
- Updated dependencies [4df23ca]
- Updated dependencies [445c257]
- Updated dependencies [2e53a0f]
- Updated dependencies [0d1a6cb]
- Updated dependencies [e982bdf]
- Updated dependencies [dd268c6]
- Updated dependencies [b6b8274]
- Updated dependencies [b0938c0]
- Updated dependencies [7b387fb]
- Updated dependencies [d88ab2e]
- Updated dependencies [4fa09bc]
- Updated dependencies [b45d550]
- Updated dependencies [61bd37d]
- Updated dependencies [a58f169]
- Updated dependencies [e76d680]
- Updated dependencies [7c9d5c6]
- Updated dependencies [ccd7713]
- Updated dependencies [6071ef5]
- Updated dependencies [17bc937]
- Updated dependencies [72df2c0]
- Updated dependencies [19d58ac]
- Updated dependencies [a91b783]
- Updated dependencies [bd02d06]
- Updated dependencies [268439c]
- Updated dependencies [95c608b]
- Updated dependencies [60f8114]
- Updated dependencies [5514596]
- Updated dependencies [6cd5781]
- Updated dependencies [0fc492f]
- Updated dependencies [021af92]
- Updated dependencies [c5e3798]
- Updated dependencies [0ac7524]
- Updated dependencies [21ba816]
- Updated dependencies [0c6f41d]
- Updated dependencies [c0c7b0a]
- Updated dependencies [e376e9c]
- Updated dependencies [d23da50]
- Updated dependencies [ff6b7a2]
- Updated dependencies [186903f]
- Updated dependencies [a1d81be]
- Updated dependencies [dcee2e2]
- Updated dependencies [0f36216]
- Updated dependencies [f7769b8]
- Updated dependencies [8d5c70b]
- Updated dependencies [4785689]
- Updated dependencies [6103988]
- Updated dependencies [7fd538d]
- Updated dependencies [eaffd69]
- Updated dependencies [5c40d3d]
- Updated dependencies [dcb1c8b]
- Updated dependencies [7876446]
- Updated dependencies [251e29a]
- Updated dependencies [0abcc93]
- Updated dependencies [7bee975]
- Updated dependencies [b2d8b19]
- Updated dependencies [cd29b8f]
- Updated dependencies [3bfa716]
- Updated dependencies [43af3f3]
- Updated dependencies [4c7715f]
- Updated dependencies [260b56e]
- Updated dependencies [b37a7a1]
- Updated dependencies [b1fad65]
- Updated dependencies [b3dccfc]
- Updated dependencies [2c76370]
- Updated dependencies [f7b4492]
- Updated dependencies [29ccac8]
- Updated dependencies [268439c]
- Updated dependencies [792ab59]
- Updated dependencies [b16c0b3]
- Updated dependencies [2f920ac]
- Updated dependencies [1d68664]
- Updated dependencies [6bd5ac2]
- Updated dependencies [2788652]
- Updated dependencies [cab24c8]
- Updated dependencies [0f36216]
- Updated dependencies [3daf6b0]
- Updated dependencies [5c86dce]
- Updated dependencies [4a8dc74]
- Updated dependencies [5cdd861]
- Updated dependencies [dadfec8]
- Updated dependencies [de9a974]
- Updated dependencies [84ab767]
- Updated dependencies [e182825]
- Updated dependencies [5e219b7]
- Updated dependencies [883e44a]
- Updated dependencies [f8b8ef4]
- Updated dependencies [090daba]
- Updated dependencies [080cf7a]
- Updated dependencies [c3032e2]
- Updated dependencies [89ab825]
- Updated dependencies [81755d0]
- Updated dependencies [cd197a5]
- Updated dependencies [884a39d]
- Updated dependencies [593087a]
- Updated dependencies [e6213d6]
- Updated dependencies [b2d21dd]
- Updated dependencies [6cddad0]
- Updated dependencies [b50cc61]
- Updated dependencies [01b6fbc]
- Updated dependencies [72428d0]
- Updated dependencies [b89d322]
- Updated dependencies [1b8b606]
- Updated dependencies [0886ef3]
  - @soxa-ui/core@0.2.0
