# @soxa-ui/theme-base

## 0.5.0

### Minor Changes

- 64c0204: Add shared radius and spacing settings with component overrides and purpose-specific size multipliers. Breaking: spacing variables and CodeBlock radius are now optional final overrides instead of fixed root defaults. Custom themes reading these variables directly must add var() fallbacks or read computed CSS properties; explicit local length overrides continue to win. Alert now uses the compact Toasts spacing reference. See the theme-base README migration guide.

  Consumer upgrade instructions: docs/upgrade/0.5.0.md.

### Patch Changes

- e07c34d: Reduce repeated spacing calculations and size selectors without changing rendered geometry or local overrides.
- 1a52ea6: Add `Select.Separator` and `ListBox.Separator` to separate groups written in markup. A separator hides when filtering leaves no shown content on one of its sides, including adjacent separators and list edges.

  Record the manual separator emission sites in the existing theme class contract.
- Updated dependencies [dd6ea64]
- Updated dependencies [9688944]
- Updated dependencies [1a52ea6]
- Updated dependencies [2598c1b]
  - @soxa-ui/core@0.5.0
  - @soxa-ui/plugins@0.5.0

## 0.4.1

### Patch Changes

- 480231a: Preserve the anchor's local data-so-theme on teleported Frame panels across all adapters, including Menu, Select, Popover and Tooltip. Follow theme changes and anchor moves while respecting explicit panel themes and contained layout.
- Updated dependencies [480231a]
- Updated dependencies [859c3c6]
- Updated dependencies [dd5946d]
- Updated dependencies [b17d612]
  - @soxa-ui/plugins@0.4.1
  - @soxa-ui/core@0.4.1

## 0.4.0

### Minor Changes

- 12edeaf: Release the owner-approved 0.4.0 theme versions alongside the stable component release. Existing theme contracts remain unchanged.

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 03895c2: Center Alert status and close icons on the first text line across sizes and writing directions.
- 8e68380: Redesign Alert surfaces with outlined, soft and filled views. Use Toast signal colors and matching button tones on filled alerts; retain soft as the default. Arrange actions in a wrapping row.
- 274d746: Add horizontal and vertical Separator structure and Oren styling, including forced colors.
- Graduate the approved beta packages to stable versions.

## 0.3.1-beta.0

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 03895c2: Center Alert status and close icons on the first text line across sizes and writing directions.
- 8e68380: Redesign Alert surfaces with outlined, soft and filled views. Use Toast signal colors and matching button tones on filled alerts; retain soft as the default. Arrange actions in a wrapping row.
- 274d746: Add horizontal and vertical Separator structure and Oren styling, including forced colors.
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
  - @soxa-ui/core@0.4.0-beta.0
  - @soxa-ui/plugins@0.4.0-beta.0

## 0.3.0

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.
- bcd5555: Replace boolean and state CSS modifiers with data attributes, including readonly, required, clearable, editable, closable, indeterminate and Tabs geometry readiness. Select now exposes open state only through data-open. Prefix orientation, DatePicker mode and Tabs alignment modifiers with their prop names.
  
  Update custom themes: replace removed state modifiers with explicit selectors such as [data-required='true']; false remains the string "false". Replace --horizontal/--vertical with --orientation-horizontal/--orientation-vertical, --single/--range with --mode-single/--mode-range, and Tabs --center/--end/--stretch with --alignment-center/--alignment-end/--alignment-stretch. Replace the Tabs --ready-animation modifier with [data-ready-animation='true']. Native HTML attributes and component props retain their behavior.
- 203edd0: Rename the Tabs.Content root class from `so-tabs__panel` to `so-tabs-content`. Update custom theme selectors and DOM queries to use `.so-tabs-content`.
- a491c3f: Each part of the shared layer lives in its own sublayer of `so` (`so.button`), declared in order before any rule: a later part wins over an earlier one whatever the specificity, so a theme may cut the layer into stylesheets per component and an application may load them in any order.

### Patch Changes

- 53fb45f: Add Badge for inline labels, capped numeric counters and dots, with accessible names, anchored placement and theme styling across all adapters.
- ab9735f: Add Breadcrumbs as a collection with external engines, composable Item parts and standard activation. Include localized accessible names, theme separators and native-link overflow menus that preserve breadcrumb membership. Expose root-level gap scales and separator geometry for theme and scoped customization.
- a15bae2: Prevent CodeBlock copy actions from covering source text, including horizontally scrolled lines. Show the copy icon by default and add the copy slot for custom button content across all adapters. Register the new copy role in both icon packs; update your icon pack or provide the copy slot when upgrading CodeBlock.
- 0909342: Add built-in safe CodeBlock syntax highlighting, including server rendering. Use compact white layouts with a single tab toolbar, smaller copy actions and tighter line-number gutters. Clarify snippet selection and shorten copy labels.
- ba29be7: Keep overflowing disabled Tabs and Table content reachable and scrollable by keyboard without adding tab stops when content fits or contains an available tab stop. Preserve native disabled behavior when Web Components are re-enabled.
- 1ffabcd: Add ToggleButton and ToggleGroup with persistent pressed state, collection-backed selection and accessible keyboard navigation. Preserve explicit native form attributes while defaulting toggle controls to non-submitting buttons. Keep long ToggleGroup rows reachable in their own scroll viewport on narrow screens.
- c7b5a90: Keep long horizontal tab rows reachable within their own scroll viewport on narrow screens.
- ba672e1: Hide the Select text caret when editable is false while preserving keyboard focus and navigation.
- 14a7c49: Expose Badge size scales as root CSS variables so themes can customize each size while preserving existing per-instance variables and default dimensions.
- 1bb3ea8: Add CodeBlock with accessible code display, line numbers, highlighted lines, clipboard feedback and snippets powered by Tabs across all adapters.
- b67988b: Keep disabled Tabs panel content readable while dimming only the tab bar. Disabled interaction remains unchanged.
- c3e42b9: Document the toast announcement region attribute in the published theme contract.
- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- fc65f24: Table in Safari and iOS: the head stays above row checkboxes, a column without a width keeps its minimum before the first measure, and rows no longer show through the rounded corners of the sticky head. A theme that draws a line under the sticky head names its thickness in `--so-table-head-border`, and the backing under the headers stops above it.
- c95d6c4: Translate theme variable descriptions into English and publish a complete class and data-attribute reference for theme authors.
- 85e280b: Table: rows no longer show through the sticky head while a column is carried — one backing under the whole head replaces the squares under each header. Its height is the head height `TTableHeadPlugin` writes (`--so-table-head-height`): a theme that does not install the plugin gets a backing one head row high.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- defba58: README, Make your own theme: the declarations of `./setup` reference the theme's `index.d.ts`, so its values reach the types wherever the stylesheet is plugged in.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [0909342]
- Updated dependencies [8212af4]
- Updated dependencies [c7b5a90]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [6dfea13]
- Updated dependencies [1bb3ea8]
- Updated dependencies [de65c13]
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [7415726]
- Updated dependencies [7335dd6]
- Updated dependencies [13101c7]
- Updated dependencies [28bcd83]
- Updated dependencies [1c78107]
- Updated dependencies [bcd5555]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0
  - @soxa-ui/plugins@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/core@0.3.0-beta.1
  - @soxa-ui/plugins@0.3.0-beta.1

## 0.3.0-beta.0

### Minor Changes

- bcd5555: Replace boolean and state CSS modifiers with data attributes, including readonly, required, clearable, editable, closable, indeterminate and Tabs geometry readiness. Select now exposes open state only through data-open. Prefix orientation, DatePicker mode and Tabs alignment modifiers with their prop names.

  Update custom themes: replace removed state modifiers with explicit selectors such as [data-required='true']; false remains the string "false". Replace --horizontal/--vertical with --orientation-horizontal/--orientation-vertical, --single/--range with --mode-single/--mode-range, and Tabs --center/--end/--stretch with --alignment-center/--alignment-end/--alignment-stretch. Replace the Tabs --ready-animation modifier with [data-ready-animation='true']. Native HTML attributes and component props retain their behavior.
- 203edd0: Rename the Tabs.Content root class from `so-tabs__panel` to `so-tabs-content`. Update custom theme selectors and DOM queries to use `.so-tabs-content`.
- a491c3f: Each part of the shared layer lives in its own sublayer of `so` (`so.button`), declared in order before any rule: a later part wins over an earlier one whatever the specificity, so a theme may cut the layer into stylesheets per component and an application may load them in any order.

### Patch Changes

- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- fc65f24: Table in Safari and iOS: the head stays above row checkboxes, a column without a width keeps its minimum before the first measure, and rows no longer show through the rounded corners of the sticky head. A theme that draws a line under the sticky head names its thickness in `--so-table-head-border`, and the backing under the headers stops above it.
- c95d6c4: Translate theme variable descriptions into English and publish a complete class and data-attribute reference for theme authors.
- 85e280b: Table: rows no longer show through the sticky head while a column is carried — one backing under the whole head replaces the squares under each header. Its height is the head height `TTableHeadPlugin` writes (`--so-table-head-height`): a theme that does not install the plugin gets a backing one head row high.
- cfffb4b: Standardize property change notifications to { newValue, oldValue }. Update bare-value handlers to read payload.newValue. Object values keep their references without deep cloning; collections and markup sets use shallow container snapshots. Cancelable before events, model bindings, collection operations, and invalidation signals retain their contracts.
- defba58: README, Make your own theme: the declarations of `./setup` reference the theme's `index.d.ts`, so its values reach the types wherever the stylesheet is plugged in.
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [7415726]
- Updated dependencies [7335dd6]
- Updated dependencies [13101c7]
- Updated dependencies [28bcd83]
- Updated dependencies [bcd5555]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0-beta.0
  - @soxa-ui/plugins@0.3.0-beta.0

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [843f9ef]
  - @soxa-ui/core@0.3.0-alpha.7
  - @soxa-ui/plugins@0.3.0-alpha.7

## 0.3.0-alpha.6

### Patch Changes

- d20904b: Every size of the font scales now steps from the font of the place, which `normal` takes as is, instead of numbers fitted to a 16px page. Button, Pagination, fields and captions: `sm` is 2px smaller, `lg`, `xl` and `2xl` 2px, 4px and 8px larger (`calc(1em - 0.125rem)` … `calc(1em + 0.5rem)`). Table cells and header labels, Calendar day numbers and picker tiles, control notes (Field helper and error, Textarea counter, Slider mark labels) and tags are the same ladder a step down: 4px and 2px smaller at `sm` and `normal`, the font of the place at `lg`, 2px and 4px larger at `xl` and `2xl`; the group labels of `sm` rows are 6px smaller. At a 16px place nothing changes; at 14px a `sm` Button is now 12px instead of 14px (as large as `normal`), a `lg` one 16px instead of 18px, and a `normal` table 12px. The gap cell of Pagination takes the font of its size on its own node rather than inheriting it from the root.
- 69f263b: The group labels of ListBox, Select and Menu now take the note of the size of their rows (Field helper), a step smaller than the rows, instead of the note one size below: 14px at a 16px place for `normal` rows, 12px at 14px. The variables `--so-group-label-font-size-sm` and `--so-group-label-line-height-sm` are gone: `sm` rows read the `sm` note.
- e9aaab9: Calendar: weekdays, days and the month and year picker tiles take the font of the place at the normal size
- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- 3b50b69: Calendar: columns widen on large sizes so weekday labels fit; picker tiles wrap into taller rows instead of overflowing
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
  - @soxa-ui/plugins@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.5
  - @soxa-ui/plugins@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [6f96bae]
- Updated dependencies [1c703ad]
- Updated dependencies [8bb9bdc]
  - @soxa-ui/core@0.3.0-alpha.4
  - @soxa-ui/plugins@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- 11e25c7: Tabs: слоты `leading` и `trailing` стоят не в списке табов, а рядом с ним, в новом ряду `.so-tabs__bar`, — выравнивание `center`, `end` и `stretch` работает со слотами, а в `[role=tablist]` остались только табы. Обновление: классы слотов — `.so-tabs__leading` и `.so-tabs__trailing` вместо `.so-tabs__list--leading` и `.so-tabs__list--trailing`; `.so-tabs > .so-tabs__list` пишите через ряд: `.so-tabs > .so-tabs__bar > .so-tabs__list`. Своя тема: `--so-tabs-active-*` и `--so-tabs-gap-*` плагин раскладки пишет на ряд, место таба отсчитывается от него — линию и отметку рисуйте на ряду; поле `listEl` у `TActiveTabOffset` переименовано в `barEl`.
- 328644b: Плагины раскладки `TTabsViewPlugin`, `TTableHeadPlugin` и `TToastsFrontPlugin` — в `@soxa-ui/theme-base/setup`. `useTheme(oren)` ставит их, как раньше; прямой импорт классов — из `@soxa-ui/theme-base/setup`
- fff8870: Жест слоёв и взятый заголовок Table идут за указателем без темы: `translate` из `--so-swipe-offset` (панели Popover, Select и DatePicker, Drawer, тост, карточка выбора месяца Calendar) и из `--so-table-column-drag` ставит общий слой тем, а тема ведёт переходом только возврат, уход и приземление. Ломающее: `theme-variables.json` — два раздела: `base-reads` (что читает общий слой, прежний список) и `theme-reads` (что тема вправе читать, но не задаёт: знак направления, ступень размера блока, переменные плагинов). Как обновиться: прежние ключи читать из `base-reads`; своя тема больше не кладёт `--so-swipe-offset` в `translate` и не регистрирует его `@property`: сдвиг ставит общий слой, и у каждого слоя с жестом там свой ноль — вложенный слой сдвиг внешнего не наследует, и во всех браузерах, Firefox до 128 тоже.

### Patch Changes

- 6020322: Структура Scroller, Slider, Rating, ProgressLinear, ProgressSpinner, Skeleton и Pagination — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- ac51425: Структура ListBox, Menu, Select, Popover, Tooltip, Dialog и Drawer — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- e0beaf3: Tabs: в RTL слот `trailing` списка стоит у конца строки, а не вплотную к табам
- fd0bfec: Структура Calendar, DateInput, DatePicker, Toasts и DragAndDrop — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- 93fdf15: Структура Label, Field, Icon, Switch, CheckBox, RadioGroup и Button — в общем слое `@soxa-ui/theme-base`, числа — его переменными; облик oren не меняется
- e8395eb: Структура Input, Textarea, NumberInput, Tabs, Tags и Accordion — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- 8aaaae8: Новый пакет `@soxa-ui/theme-base` — общий слой тем: сброс частей soxa и знак направления письма. Тема oren включает его в свой CSS, облик не меняется.
- 382e887: Структура Table — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
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
