# @soxa-ui/theme-oren

## 0.6.0

### Minor Changes

- 815c2c6: Add shared modal backdrops with theme-defined views. Oren supports transparent, dimmed, and blurred backdrops for Dialog, AlertDialog, and Drawer.
  
  Custom themes must replace .so-dialog__backdrop, .so-alert-dialog__backdrop, and .so-drawer__backdrop with .so-backdrop. For panel-specific styles, match the following panel with :has(+ .so-dialog), :has(+ .so-alert-dialog), or :has(+ .so-drawer). See [upgrading to 0.6.0](https://github.com/youra-h/soxa-ui/blob/v0.6.0/docs/upgrade/0.6.0.md).

### Patch Changes

- 1cc14fd: Expose the modal backdrop blur radius as the `--so-backdrop-blur` theme token and reduce the default to 3px.
- 2e8653a: Add outlined, filled and soft views to Toasts in Oren. Set the view on the manager and override it on individual notifications.
- Updated dependencies [815c2c6]
- Updated dependencies [2e8653a]
  - @soxa-ui/core@0.6.0
  - @soxa-ui/setup@0.6.0
  - @soxa-ui/theme-base@0.6.0

## 0.5.0

### Minor Changes

- 64c0204: Add shared radius and spacing settings with component overrides and purpose-specific size multipliers. Breaking: spacing variables and CodeBlock radius are now optional final overrides instead of fixed root defaults. Custom themes reading these variables directly must add var() fallbacks or read computed CSS properties; explicit local length overrides continue to win. Alert now uses the compact Toasts spacing reference. See the theme-base README migration guide.

  Consumer upgrade instructions: docs/upgrade/0.5.0.md.

### Patch Changes

- Updated dependencies [e07c34d]
- Updated dependencies [dd6ea64]
- Updated dependencies [9688944]
- Updated dependencies [1a52ea6]
- Updated dependencies [2598c1b]
- Updated dependencies [64c0204]
- Updated dependencies [5b88716]
  - @soxa-ui/theme-base@0.5.0
  - @soxa-ui/core@0.5.0
  - @soxa-ui/setup@0.5.0

## 0.4.1

### Patch Changes

- cf38e45: Preserve the local panel surface when an anchored overlay carries an explicit Oren light scheme, so sticky Table headers match the panel background.
- Updated dependencies [480231a]
- Updated dependencies [859c3c6]
- Updated dependencies [dd5946d]
- Updated dependencies [b17d612]
  - @soxa-ui/setup@0.4.1
  - @soxa-ui/theme-base@0.4.1
  - @soxa-ui/core@0.4.1

## 0.4.0

### Minor Changes

- 12edeaf: Release the owner-approved 0.4.0 theme versions alongside the stable component release. Existing theme contracts remain unchanged.

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 8e68380: Redesign Alert surfaces with outlined, soft and filled views. Use Toast signal colors and matching button tones on filled alerts; retain soft as the default. Arrange actions in a wrapping row.
- 9d397c3: Make Avatar variants color fallback backgrounds and text in the Oren theme while preserving image rendering and high-contrast styles.
- 274d746: Add horizontal and vertical Separator structure and Oren styling, including forced colors.
- Graduate the approved beta packages to stable versions.
- Updated dependencies [12edeaf]
- Updated dependencies [5f7f821]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [03895c2]
- Updated dependencies [8e68380]
- Updated dependencies [274d746]
- Updated dependencies
  - @soxa-ui/theme-base@0.4.0

## 0.3.1-beta.0

### Patch Changes

- 5f7f821: Add accessible AlertDialog confirmations with localized default actions and replaceable action slots.
- f6c476e: Add Avatar with image loading and initials or custom fallbacks, plus overlapping avatar groups with an overflow count.
- eec067c: Add an inline Alert component with themed variants, composable content, actions, and localized dismissal.
- 8e68380: Redesign Alert surfaces with outlined, soft and filled views. Use Toast signal colors and matching button tones on filled alerts; retain soft as the default. Arrange actions in a wrapping row.
- 9d397c3: Make Avatar variants color fallback backgrounds and text in the Oren theme while preserving image rendering and high-contrast styles.
- 274d746: Add horizontal and vertical Separator structure and Oren styling, including forced colors.
- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ea471b]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [03895c2]
- Updated dependencies [8e68380]
- Updated dependencies [274d746]
- Updated dependencies [274d746]
  - @soxa-ui/core@0.4.0-beta.0
  - @soxa-ui/setup@0.4.0-beta.0
  - @soxa-ui/theme-base@0.3.1-beta.0

## 0.3.0

### Minor Changes

- a491c3f: Stylesheets per component next to the whole one: `@soxa-ui/theme-oren/<component>.css` carries the shared part — tokens, schemes, the reset and the size scales — and the parts of its component, inner ones included, and the bundler of an application puts a shared file once. Every rule of the theme moves into a cascade layer (`components`), so the CSS of an application outside layers and the utilities of its Tailwind now override the theme — drop the specificity workarounds kept against it.
- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.
- bcd5555: Replace boolean and state CSS modifiers with data attributes, including readonly, required, clearable, editable, closable, indeterminate and Tabs geometry readiness. Select now exposes open state only through data-open. Prefix orientation, DatePicker mode and Tabs alignment modifiers with their prop names.
  
  Update custom themes: replace removed state modifiers with explicit selectors such as [data-required='true']; false remains the string "false". Replace --horizontal/--vertical with --orientation-horizontal/--orientation-vertical, --single/--range with --mode-single/--mode-range, and Tabs --center/--end/--stretch with --alignment-center/--alignment-end/--alignment-stretch. Replace the Tabs --ready-animation modifier with [data-ready-animation='true']. Native HTML attributes and component props retain their behavior.
- 203edd0: Rename the Tabs.Content root class from `so-tabs__panel` to `so-tabs-content`. Update custom theme selectors and DOM queries to use `.so-tabs-content`.

### Patch Changes

- 53fb45f: Add Badge for inline labels, capped numeric counters and dots, with accessible names, anchored placement and theme styling across all adapters.
- ab9735f: Add Breadcrumbs as a collection with external engines, composable Item parts and standard activation. Include localized accessible names, theme separators and native-link overflow menus that preserve breadcrumb membership. Expose root-level gap scales and separator geometry for theme and scoped customization.
- a15bae2: Prevent CodeBlock copy actions from covering source text, including horizontally scrolled lines. Show the copy icon by default and add the copy slot for custom button content across all adapters. Register the new copy role in both icon packs; update your icon pack or provide the copy slot when upgrading CodeBlock.
- 0909342: Add built-in safe CodeBlock syntax highlighting, including server rendering. Use compact white layouts with a single tab toolbar, smaller copy actions and tighter line-number gutters. Clarify snippet selection and shorten copy labels.
- 1ffabcd: Add ToggleButton and ToggleGroup with persistent pressed state, collection-backed selection and accessible keyboard navigation. Preserve explicit native form attributes while defaulting toggle controls to non-submitting buttons. Keep long ToggleGroup rows reachable in their own scroll viewport on narrow screens.
- 12be34d: Render ToggleGroup as joined segments with square internal corners, single dividers, and rounding only at the group edges. Keep a compact gap between outlined segments and draw keyboard focus rings inside each segment in both orientations.
- a603db9: Use a transparent plain overflow button in Breadcrumbs and apply the selected variant to navigable links and the overflow control. Keep the current location and separators neutral.
- 1bb3ea8: Add CodeBlock with accessible code display, line numbers, highlighted lines, clipboard feedback and snippets powered by Tabs across all adapters.
- ab7115e: Document Tailwind CSS 4 layer ordering to preserve component sizing and Select option spacing.
- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- fc65f24: Table in Safari and iOS: the head stays above row checkboxes, a column without a width keeps its minimum before the first measure, and rows no longer show through the rounded corners of the sticky head. A theme that draws a line under the sticky head names its thickness in `--so-table-head-border`, and the backing under the headers stops above it.
- defba58: The values of `variant`, `view`, `shape` and `animation` now reach the types through `@soxa-ui/theme-oren/setup`, so `variant="accent"` type-checks when the stylesheet comes from Angular CLI `styles` or Nuxt `css`. README: where the stylesheet goes in each build.
- 85e280b: Table: rows no longer show through the sticky head while a column is carried — one backing under the whole head replaces the squares under each header. Its height is the head height `TTableHeadPlugin` writes (`--so-table-head-height`): a theme that does not install the plugin gets a backing one head row high.
- 7415726: Slider: the thumb halo shows the pressed veil while the thumb is held or dragged, also in Safari, where the pointer keeps hovering the thumb.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [a15bae2]
- Updated dependencies [0909342]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [c7b5a90]
- Updated dependencies [6dfea13]
- Updated dependencies [ba672e1]
- Updated dependencies [14a7c49]
- Updated dependencies [1bb3ea8]
- Updated dependencies [b67988b]
- Updated dependencies [c3e42b9]
- Updated dependencies [de65c13]
- Updated dependencies [9c002f7]
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [d1d4764]
- Updated dependencies [fc65f24]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [1c78107]
- Updated dependencies [bcd5555]
- Updated dependencies [ac39aa9]
- Updated dependencies [c95d6c4]
- Updated dependencies [85e280b]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [defba58]
- Updated dependencies [a491c3f]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0
  - @soxa-ui/setup@0.3.0
  - @soxa-ui/theme-base@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/core@0.3.0-beta.1
  - @soxa-ui/setup@0.3.0-beta.1
  - @soxa-ui/theme-base@0.3.0-beta.1

## 0.3.0-beta.0

### Minor Changes

- a491c3f: Stylesheets per component next to the whole one: `@soxa-ui/theme-oren/<component>.css` carries the shared part — tokens, schemes, the reset and the size scales — and the parts of its component, inner ones included, and the bundler of an application puts a shared file once. Every rule of the theme moves into a cascade layer (`components`), so the CSS of an application outside layers and the utilities of its Tailwind now override the theme — drop the specificity workarounds kept against it.
- bcd5555: Replace boolean and state CSS modifiers with data attributes, including readonly, required, clearable, editable, closable, indeterminate and Tabs geometry readiness. Select now exposes open state only through data-open. Prefix orientation, DatePicker mode and Tabs alignment modifiers with their prop names.

  Update custom themes: replace removed state modifiers with explicit selectors such as [data-required='true']; false remains the string "false". Replace --horizontal/--vertical with --orientation-horizontal/--orientation-vertical, --single/--range with --mode-single/--mode-range, and Tabs --center/--end/--stretch with --alignment-center/--alignment-end/--alignment-stretch. Replace the Tabs --ready-animation modifier with [data-ready-animation='true']. Native HTML attributes and component props retain their behavior.
- 203edd0: Rename the Tabs.Content root class from `so-tabs__panel` to `so-tabs-content`. Update custom theme selectors and DOM queries to use `.so-tabs-content`.

### Patch Changes

- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- fc65f24: Table in Safari and iOS: the head stays above row checkboxes, a column without a width keeps its minimum before the first measure, and rows no longer show through the rounded corners of the sticky head. A theme that draws a line under the sticky head names its thickness in `--so-table-head-border`, and the backing under the headers stops above it.
- defba58: The values of `variant`, `view`, `shape` and `animation` now reach the types through `@soxa-ui/theme-oren/setup`, so `variant="accent"` type-checks when the stylesheet comes from Angular CLI `styles` or Nuxt `css`. README: where the stylesheet goes in each build.
- 85e280b: Table: rows no longer show through the sticky head while a column is carried — one backing under the whole head replaces the squares under each header. Its height is the head height `TTableHeadPlugin` writes (`--so-table-head-height`): a theme that does not install the plugin gets a backing one head row high.
- 7415726: Slider: the thumb halo shows the pressed veil while the thumb is held or dragged, also in Safari, where the pointer keeps hovering the thumb.
- Updated dependencies [2d81d06]
- Updated dependencies [7327698]
- Updated dependencies [d1d4764]
- Updated dependencies [fc65f24]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [bcd5555]
- Updated dependencies [ac39aa9]
- Updated dependencies [c95d6c4]
- Updated dependencies [85e280b]
- Updated dependencies [203edd0]
- Updated dependencies [cfffb4b]
- Updated dependencies [defba58]
- Updated dependencies [a491c3f]
- Updated dependencies [0690162]
  - @soxa-ui/core@0.3.0-beta.0
  - @soxa-ui/setup@0.3.0-beta.0
  - @soxa-ui/theme-base@0.3.0-beta.0

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [26cc7e3]
- Updated dependencies [5d8b7ca]
- Updated dependencies [d278f0f]
- Updated dependencies [1a322fe]
- Updated dependencies [843f9ef]
  - @soxa-ui/setup@0.3.0-alpha.7
  - @soxa-ui/core@0.3.0-alpha.7
  - @soxa-ui/theme-base@0.3.0-alpha.7

## 0.3.0-alpha.6

### Patch Changes

- d20904b: Every size of the font scales now steps from the font of the place, which `normal` takes as is, instead of numbers fitted to a 16px page. Button, Pagination, fields and captions: `sm` is 2px smaller, `lg`, `xl` and `2xl` 2px, 4px and 8px larger (`calc(1em - 0.125rem)` … `calc(1em + 0.5rem)`). Table cells and header labels, Calendar day numbers and picker tiles, control notes (Field helper and error, Textarea counter, Slider mark labels) and tags are the same ladder a step down: 4px and 2px smaller at `sm` and `normal`, the font of the place at `lg`, 2px and 4px larger at `xl` and `2xl`; the group labels of `sm` rows are 6px smaller. At a 16px place nothing changes; at 14px a `sm` Button is now 12px instead of 14px (as large as `normal`), a `lg` one 16px instead of 18px, and a `normal` table 12px. The gap cell of Pagination takes the font of its size on its own node rather than inheriting it from the root.
- 69f263b: The group labels of ListBox, Select and Menu now take the note of the size of their rows (Field helper), a step smaller than the rows, instead of the note one size below: 14px at a 16px place for `normal` rows, 12px at 14px. The variables `--so-group-label-font-size-sm` and `--so-group-label-line-height-sm` are gone: `sm` rows read the `sm` note.
- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- Updated dependencies [101269c]
- Updated dependencies [d20904b]
- Updated dependencies [a73c5bf]
- Updated dependencies [69f263b]
- Updated dependencies [7ac5495]
- Updated dependencies [e9aaab9]
- Updated dependencies [a6a77f8]
- Updated dependencies [765030a]
- Updated dependencies [2e2ff15]
- Updated dependencies [2dec183]
- Updated dependencies [54f5b1d]
- Updated dependencies [5429a39]
- Updated dependencies [3b50b69]
- Updated dependencies [604ae77]
  - @soxa-ui/core@0.3.0-alpha.6
  - @soxa-ui/setup@0.3.0-alpha.6
  - @soxa-ui/theme-base@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.5
  - @soxa-ui/setup@0.3.0-alpha.5
  - @soxa-ui/theme-base@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [6f96bae]
- Updated dependencies [8eb76c2]
- Updated dependencies [1c703ad]
- Updated dependencies [8bb9bdc]
  - @soxa-ui/core@0.3.0-alpha.4
  - @soxa-ui/setup@0.3.0-alpha.4
  - @soxa-ui/theme-base@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- 11e25c7: Tabs: слоты `leading` и `trailing` стоят не в списке табов, а рядом с ним, в новом ряду `.so-tabs__bar`, — выравнивание `center`, `end` и `stretch` работает со слотами, а в `[role=tablist]` остались только табы. Обновление: классы слотов — `.so-tabs__leading` и `.so-tabs__trailing` вместо `.so-tabs__list--leading` и `.so-tabs__list--trailing`; `.so-tabs > .so-tabs__list` пишите через ряд: `.so-tabs > .so-tabs__bar > .so-tabs__list`. Своя тема: `--so-tabs-active-*` и `--so-tabs-gap-*` плагин раскладки пишет на ряд, место таба отсчитывается от него — линию и отметку рисуйте на ряду; поле `listEl` у `TActiveTabOffset` переименовано в `barEl`.
- 328644b: Плагины раскладки `TTabsViewPlugin`, `TTableHeadPlugin` и `TToastsFrontPlugin` — в `@soxa-ui/theme-base/setup`. `useTheme(oren)` ставит их, как раньше; прямой импорт классов — из `@soxa-ui/theme-base/setup`
- 3edf482: Тема больше не сбрасывает стили страницы: preflight Tailwind убран, сброс — только у частей soxa. Приложению, которое на него опиралось, — подключить свой сброс и задать шрифт и высоту строки страницы. Вместе с preflight из сборки ушли переменные Tailwind, которые читал только он: `--font-sans`, `--font-mono`, `--default-font-family`, `--default-mono-font-family`.
- ac51425: Тема oren больше не объявляет токены `--so-text-2xs` и `--so-text-2xs--line-height`: кегль подписи группы у строк размера `sm` теперь задаёт общий слой тем — `--so-group-label-font-size-sm` и `--so-group-label-line-height-sm`, с теми же 10px и 14px. Приложению, которое читало эти токены, — читать переменные общего слоя.
- bb71433: Цвет иконки — лестница приоритетов, одна для обоих пакетов и любого способа рисования: правило темы для места сильнее цвета темы по умолчанию, а тот — цвета, с которым иконка загружена. Пакеты красят рисунок ссылкой на переменную `--so-icon-color` с цветом из SVG запасным значением (атрибутом SVG, а не `style`): без темы иконка Material — `#1f1f1f`, Lucide — цвета текста, а Lucide снова рисует линиями толщиной 1.5, звезда залита. Тема oren задаёт цвет переменной, а не `fill`. Что сломалось: тема больше не заливает `fill: currentColor` свой `<svg>` в слоте кнопки и в коробке значка тоста, а своя иконка роли (`useIcons`) без покраски рисуется умолчанием SVG — чёрной. Чтобы она брала цвет темы, покрасьте её так же: `<g fill="var(--so-icon-color, currentColor)">…</g>` (у иконки линиями — `stroke`).
- fff8870: Жест слоёв и взятый заголовок Table идут за указателем без темы: `translate` из `--so-swipe-offset` (панели Popover, Select и DatePicker, Drawer, тост, карточка выбора месяца Calendar) и из `--so-table-column-drag` ставит общий слой тем, а тема ведёт переходом только возврат, уход и приземление. Ломающее: `theme-variables.json` — два раздела: `base-reads` (что читает общий слой, прежний список) и `theme-reads` (что тема вправе читать, но не задаёт: знак направления, ступень размера блока, переменные плагинов). Как обновиться: прежние ключи читать из `base-reads`; своя тема больше не кладёт `--so-swipe-offset` в `translate` и не регистрирует его `@property`: сдвиг ставит общий слой, и у каждого слоя с жестом там свой ноль — вложенный слой сдвиг внешнего не наследует, и во всех браузерах, Firefox до 128 тоже.

### Patch Changes

- 6020322: Структура Scroller, Slider, Rating, ProgressLinear, ProgressSpinner, Skeleton и Pagination — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- ac51425: Структура ListBox, Menu, Select, Popover, Tooltip, Dialog и Drawer — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- e0beaf3: Tabs: в RTL слот `trailing` списка стоит у конца строки, а не вплотную к табам
- fd0bfec: Структура Calendar, DateInput, DatePicker, Toasts и DragAndDrop — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- 93fdf15: Структура Label, Field, Icon, Switch, CheckBox, RadioGroup и Button — в общем слое `@soxa-ui/theme-base`, числа — его переменными; облик oren не меняется
- a69e58d: Switch во Vue меняет содержимое ручки (слоты `on`/`off`) сразу, как в остальных адаптерах
- e8395eb: Структура Input, Textarea, NumberInput, Tabs, Tags и Accordion — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- 8aaaae8: Новый пакет `@soxa-ui/theme-base` — общий слой тем: сброс частей soxa и знак направления письма. Тема oren включает его в свой CSS, облик не меняется.
- 382e887: Структура Table — в общем слое `@soxa-ui/theme-base`; облик oren не меняется
- Updated dependencies [11e25c7]
- Updated dependencies [6020322]
- Updated dependencies [ac51425]
- Updated dependencies [e0beaf3]
- Updated dependencies [fd0bfec]
- Updated dependencies [8110fc3]
- Updated dependencies [582d3a6]
- Updated dependencies [328644b]
- Updated dependencies [28470f6]
- Updated dependencies [0471962]
- Updated dependencies [fc30695]
- Updated dependencies [93fdf15]
- Updated dependencies [64be9ca]
- Updated dependencies [fcd14b4]
- Updated dependencies [e8395eb]
- Updated dependencies [a09886b]
- Updated dependencies [8aaaae8]
- Updated dependencies [7a86466]
- Updated dependencies [ad1de00]
- Updated dependencies [382e887]
- Updated dependencies [53a3fe6]
- Updated dependencies [fff8870]
  - @soxa-ui/theme-base@0.3.0-alpha.3
  - @soxa-ui/core@0.3.0-alpha.3
  - @soxa-ui/setup@0.3.0-alpha.3

## 0.3.0-alpha.2

### Patch Changes

- @soxa-ui/core@0.3.0-alpha.2
  - @soxa-ui/plugins@0.3.0-alpha.2
  - @soxa-ui/setup@0.3.0-alpha.2

## 0.3.0-alpha.1

### Minor Changes

- ad16bef: Разделитель между секциями группировки включается свойством `groupSeparators` у ListBox, Select, Menu и `Menu.Submenu`. Ломающее: у ListBox и Select разделителя между группами по умолчанию больше нет — как вернуть: `groupSeparators` (`<ListBox group-separators>`, `groupSeparators={true}`). У Menu и подменю он по умолчанию есть, выключить — `groupSeparators: false`; ручной `Menu.Separator` свойство не трогает. Тема oren без разделителя оставляет его место пустым, и секции не слипаются.

### Patch Changes

- 90b3e60: Тема oren: заливка ProgressLinear и ProgressSpinner и полоса активного таба — та же ступень, что у Switch и Slider.
- d50ba46: Тема oren: у цветной плашки тоста нет серой кромки.
- ace4c2b: Тема oren: ручка Slider — с той же тенью, что ручка Switch.
- 6f03f25: Тема oren: подложка Tabs `contained` и заглушка Skeleton — полупрозрачной заливкой; в тёмной схеме на панели они больше не темнее панели.
- 01c91ee: Тема oren: блик волны Skeleton в тёмной схеме — цвета поверхности, а не белый.
- 3e998c6: Тема oren: откат правок контраста — насыщенная заливка под белым текстом (Button и Tags filled, Pagination, Calendar, CheckBox filled) снова прежней ступени, цветная графика и границы контролов — как до них.
- a45bdcb: CSS темы меньше примерно на 52 КБ: у `color-mix()` больше нет запасного значения для браузеров без этой функции — оно было неверным, первым цветом смеси. Тема рассчитана на браузеры с `color-mix()` и `oklch()`.
- 6abfad2: Тема oren: счётчик Textarea и описание тоста без типа — той же ступени, что остальные подсказки.
- e56bc11: Линия ручки ширины Table встаёт сразу и при нажатии во время задержки наведения
- aa1e8dc: Тема oren: кольцо фокуса в светлой схеме заметнее — ступень 400.
- 3d66e54: Тема oren: ореол ручки Slider — той же плотности, что подсветка остальных компонентов.
- 956d0c2: Подпись группы у Menu, ListBox и Select — заглавными, цветом и начертанием подсказки Field и на ступень мельче её кегля, отступ снизу — как сверху. Для размера `sm` в теме — ступень кегля мельче `text-xs`: токены `--so-text-2xs` и `--so-text-2xs--line-height` (10px и 14px)
- 83a21ad: React: поле даты DateInput, календарь Calendar (Calendar.Item) и DatePicker; тема oren находит панель выбора месяца и года календаря и в разметке React
- 2d7ca58: Тема oren: крестик тега — цвета подписи пилюли, на цветной пилюле белый.
- f0d7336: Тема oren: цветная плашка тоста — та же ступень, что у кнопки filled своего цвета (500), и в обеих схемах светлее прежней. Токены `--so-component-solid-{accent,positive,caution,negative}` удалены: вместо них — ступень 500 семейства, `var(--so-accent-500)` и соседи.
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
- 8e2e31e: ListBox и Select: группы пунктов из данных, как у Menu (`_: { group }`, `groupBy`, `groups`), части `ListBox.Group` и `Select.Group`. `TMenuGroupIdsPlugin` заменён общим плагином имени группы `TItemGroupIdsPlugin` (описание — `ItemGroupIdsPluginDescriptor` вместо `MenuGroupIdsPluginDescriptor`), типы `IMenuGroup`, `IMenuGroupProps`, `TMenuGroupEvents` — общими `IItemGroup`, `IItemGroupProps`, `TItemGroupEvents` — замените импорт. Рисование отдаёт разметке ListBox и Select секции: в поверхности компонента `drawnSections` вместо `drawn` (событие `change:drawnSections`). Список с группами окно `Virtual` не рисует.
- 1411d88: Тост: вид сообщения `type` (`info`, `success`, `warning`, `error`) со значком вида и `loading` — кольцо на месте значка; ожидающий тост сам не закрывается. `variant` и `size` у тоста сняты: вместо `show({ variant: 'negative' })` пишите `show({ type: 'error' })`. Новые роли иконок `notification`, `info`, `success`, `warning` — свой пакет иконок должен их закрыть.
- ce9316e: NumberInput (Vue): поле числа в формате локали — шаг и границы, ↑/↓, PageUp/PageDown, Home/End, кнопки «−» и «+» с удержанием, `formatOptions` (процент, валюта, единица), событие `commit`; `createScale` принимает открытые границы, а `shift` шкалы со значения вне сетки шагает к соседнему узлу со стороны сдвига (с 2,5 при шаге 1 — на 3 и на 2). Ломающее: роли иконок `minus` и `plus` — дополните ими свой пакет иконок; раздел локали `numberInput` — дополните им свой `TLocale` (`extendLocale` возьмёт из основы).
- 958c866: ListBox: список — свой узел `.so-list-box__list` внутри корня, шапка и подвал — вне его. Роль, имя и остановка Tab — на этом узле, и прокручивается тоже он: в пределе `maxRows` ровно строки, а шапка и подвал при прокрутке стоят на месте. Стили фокуса и прокрутки и селекторы по `role` и `tabindex` корня ListBox переносите на него. `focused = true` из кода фокус в список пока не ставит — как у Input и Tabs, корень которых фокус не держит.

### Patch Changes

- 4206633: Тема oren: выключенные поля, Select, ListBox, Tabs, Tags, Table, Calendar и Pagination гаснут целиком — рамка, поверхность, иконки и кнопки вместе с текстом, как CheckBox. Вложенное выключенное второй раз не гаснет. Выключенный Tabs снова гасит табы вместе с панелями.
- 63c882d: Точка обязательного поля у Input, Textarea, Select, DateInput, DatePicker, CheckBox и Switch больше не пропадает в режиме принудительных цветов (высокий контраст Windows): там она цветом текста системы, как точка у подписи Field.
- f06e5f9: Меню: пункт с панелью `Menu.PopoverItem` (`MenuPopoverItem`) — строка открывает сбоку панель с любым содержимым, например календарём: нажатием, Enter, пробелом или → (в RTL ←); Escape возвращает к пункту, Tab из панели закрывает меню. Открыта одна панель на меню — подменю или пункта с панелью, — и связку строки с панелью у обоих пишет один плагин `TMenuPopupIdsPlugin`.
- d4c3583: Тема oren: плашка тоста с видом (`type`) залита цветом вида, и всё на ней белое — заголовок, описание, значок, кольцо ожидания, крестик и подписи кнопок своего содержимого; фон кнопок на ней — тень, и подписи читаются в любом состоянии. Тост без вида — на белой плашке. Новые токены `--so-component-solid-{accent,positive,caution,negative}` — насыщенная заливка, на которой белый текст держит 4,5:1 в обеих схемах.
- 3d6129b: Пункт Menu отвечает на нажатие вуалью нажатия, как строка ListBox.
- 2cb76f6: Тема oren: белое на насыщенной заливке — подпись кнопок и тегов `filled` с вариантом, номер текущей страницы Pagination и выбранного дня Calendar, отметка CheckBox `filled` — держит контраст в обеих схемах и в каждом состоянии. Заливка — токен `--so-component-solid-*` (добавлен `--so-component-solid-neutral`), в светлой схеме она стала темнее; наведение, нажатие и выбор — её тень, темнее покоя. Крестик тега — цвета подписи тега.
- 47e560d: Textarea: новый компонент (Vue) — многострочное поле с контрактом Input и подписью от `Field`: `rows`, авторост `autoresize` до `maxRows`, счётчик символов `counter` с пределом `maxlength`. Новая строка локали `textarea.counter`: свою полную `TLocale` дополните ею или соберите через `extendLocale`.
- e977046: Меню: подменю — `Menu.Submenu` (`MenuSubmenu`). Пункт открывает сбоку своё меню наведением, стрелкой к концу строки, Enter и пробелом; путь указателя наискосок к открытой панели её не закрывает; стрелка к началу строки и Escape закрывают один уровень, а выбор пункта и Tab — всё меню, и `choose` приходит каждому меню над пунктом. Наведение в панели меню — теперь плагин `TMenuHoverPlugin`: `TMenuPointerPlugin` только открывает меню.
- b39b864: Кнопка календаря DatePicker и стрелка Select на `sm` — зона нажатия 24×24, вид прежний
- 51985f1: Кнопка очистки полей на размере sm принимает нажатие в квадрате 24×24 вокруг себя (WCAG 2.5.8); вид кнопки не меняется.
- 6c54bfa: Выключенная опция Select гаснет так же, как выключенный пункт ListBox: тема больше не гасит её второй раз прозрачностью обёртки, и текст опции не выходит вдвое бледнее.
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
- eae46e4: Table во Vue: таблица по паттернам APG Table и Sortable Table — колонки данными (`columns`), сортировка кнопкой в заголовке колонки, выбор строк колонкой чекбоксов, слоты `header`, `cell` и `empty`, стили темы oren. Колонке — `rowHeader` (её ячейки называют строки, `th scope="row"`) и `widthStyle`, строке — набор `headerAria`, таблице — `selectAllLabel`. Чекбоксы колонки выбора держит таблица: `selectAll` фасада и `checkBoxOf(row)` расширения `table`; их отметку она пишет от выбора, а клик по ним выполняет командой выбора. Ломающее: режим выбора строк таблицы по умолчанию — `none`, колонки выбора нет, пока режим не задан; у `TTableShownSelection` новое значение `empty` — выбирать нечего (строк нет, все выключены или выключена таблица), раньше на его месте было `none`; новая роль иконки `arrowUpward` — свой пакет иконок дополните ею. CheckBox и Switch возвращают поле к модели, когда запись отметки отменили в `change:value:before`.
- 7c9d5c6: Пакеты переехали в скоуп `@soxa-ui`: прежний скоуп занят в npm чужой учётной записью. Адаптеры названы по фреймворку, без повторения слова ui — `@soxa-ui/vue`, `@soxa-ui/react`, `@soxa-ui/angular`, `@soxa-ui/svelte`, `@soxa-ui/solid`, `@soxa-ui/webc`. Остальные пакеты сохранили прежние имена в новом скоупе: `@soxa-ui/core`, `@soxa-ui/setup`, `@soxa-ui/plugins`, `@soxa-ui/theme-oren`, `@soxa-ui/icons-material`. Как обновиться: сменить скоуп в импортах и в манифесте, у адаптеров дополнительно убрать из имени пакета префикс `ui-`.
- 19d58ac: Slider: подсказка со значением у ручки — проп `tooltip`: `none` (по умолчанию) — подсказки нет, `auto` — видна, пока ручку наводят, держат, тянут или её поле в фокусе с клавиатуры, `always` — видна всегда. Подсказка едет за ручкой: у горизонтального ползунка стоит над ней, у вертикального — со стороны начала строки, и в `always` горизонтальный держит под неё место. Содержимое — слот `thumb`, по умолчанию значение ручки; от скринридера подсказка скрыта — значение объявляет поле. Ломающее: слот `thumb` теперь — содержимое подсказки и без `tooltip` не рисуется; кто клал в него своё, задаёт `tooltip`. Тема oren рисует подсказку плашкой Tooltip (`.so-slider__tooltip`, режим — модификатором `--tooltip-<режим>`); вид Tooltip не изменился.
- e376e9c: Кнопка очистки — часть поля. Input и DateInput получили `clearable`, `clearLabel`, имя кнопки `clearAria`, команду `clear` и слот `clear` — общая база ядра `TField` и дескриптор `FieldDescriptor`. Кнопка стоит первой в слоте у конца поля, а в теме oren она квадрат со стороной в строку слота, как кнопка календаря DatePicker, а не низкая и широкая. Select свою кнопку больше не рисует: `clearable` и `clearLabel` он отдаёт полю, а выбор снимает по событию `clear` поля. Ломает: у Select сняты `clearAria` (имя кнопки — `select.field.clearAria`) и модификатор `so-select--clearable` (теперь `so-input--clearable` у поля), у `TSelectCollectionFacade` — `clear`: очищайте поле, `select.field.clear()`. Класс кнопки `.so-select__clear` стал `.so-input__clear`, признак детали `embedded` — `input.clear` вместо `select.clear`.
- 4785689: Таблица: сортирует маленькая кнопка рядом с подписью в заголовке колонки `sortable`, а не весь заголовок — нажатие по ячейке шапки больше не сортирует. Своё действие по заголовку (меню, триггер Popover) ставят контролом в подпись — слот `header`. Имя кнопке даёт локаль: новая строка `table.sort` с подписью колонки на месте `{name}` («Sort by Имя»); локаль, написанную целиком своим объектом `TLocale`, дополните ею, `extendLocale` возьмёт её из основы. Колонка ядра: `toggleSort()` — просьба отсортировать (`sort:request`, её выполняет расширение сортировки коллекции строк), набор `contentAria` переименован в `textAria`, новый набор кнопки — `sortAria`. Разметка заголовка: `.so-table-column__content` — ряд из подписи `.so-table-column__text` (у всех колонок, на неё ссылается `aria-labelledby` заголовка) и кнопки `.so-table-column__sort` со стрелкой `.so-table-column__sort-icon` в её области текста; кнопку рисует `Table.Column`, а не таблица. Тема oren: кнопка — квадрат вокруг стрелки в кегль заголовка, стрелка неотсортированной колонки проступает при наведении на заголовок и фокусе кнопки, сортируемый заголовок больше не подсвечивается.
- 7876446: CSS-классы — с префиксом `so-`, тем же, что у Custom Elements, селекторов Angular и событий: `class="so-button"`, `.so-tabs__list`, `.so-input--clearable`. Тот же префикс у кадров анимаций темы (`@keyframes so-progress-pulse`) и у запасного id монтирования, от которого набор плагинов строит id в разметке без адаптера (`so-<n>`).
- b37a7a1: Значения оформления объявляет тема. `variant`, `view` у Button, Tabs, ListBox, Accordion, Tags и CheckBox, `shape` и `animation` у Skeleton больше не union-типы ядра: тип значения — ключи пустого реестра (`IComponentVariants`, `IButtonViews`, `ITabsViews`, `ICheckBoxViews`, `ISkeletonShapes`, `ISkeletonAnimations`), который дополняет тема. Умолчаний у этих свойств нет: без значения модификатора нет, и блок выглядит видом темы по умолчанию. Модификаторы получили префиксы: `so-button--view-plain`, `so-button--variant-accent`, `so-skeleton--shape-circle`, `so-skeleton--animation-wave`. Флаг `plain` у CheckBox заменён свойством `view`. Разметка компонентов больше не передаёт вложенным частям значения темы: крестики, строка таба и строки списков красятся темой по контексту. Как обновиться: подключить тему (`import "@soxa-ui/theme-oren"`), чтобы её `index.d.ts` дополнил реестры; своя тема объявляет значения через `declare module "@soxa-ui/core"`; стили по старым модификаторам (`--a-*`, `--accent`, `--rounded`) переписать на префиксные; вместо `plain` у CheckBox задать `view="plain"`.
- b3dccfc: Жест «смахнуть, чтобы закрыть» стал общей возможностью слоёв: кроме выезжающей панели, его получил Popover (проп `swipe`: `none` по умолчанию, `handle`, `panel`). Панель у триггера смахивают от него — вниз под ним и вверх над ним, панель внутри контейнера — вниз; полоса жеста стоит у края со стороны триггера. Контракт ядра — `ISwipeable` (`swipe`, `swipeSide`, `swiping`, `beginSwipe`, `endSwipe`) и тип-гард `isSwipeable`. Ломающее: тип `TDrawerSwipe` заменён общим `TSwipe`, плагин `TDrawerSwipePlugin` — `TSwipePlugin` (`@soxa-ui/plugins`), определение `DrawerSwipePluginDescriptor` — `SwipePluginDescriptor` (`@soxa-ui/setup`), а сдвиг жеста плагин пишет переменной `--so-swipe-offset`: обновите импорты и свой CSS, если читали сдвиг.
- f7b4492: Spinner удалён: компонент Vue и React, класс ядра `TSpinner` с типами `ISpinner`, `ISpinnerProps` и `TSpinnerEvents`, плагин `TSpinnerLayoutPlugin`, дескрипторы `SpinnerDescriptor` и `SpinnerLayoutPluginDescriptor` и стили Spinner в теме oren. Замена — ProgressSpinner с `indeterminate`: строчное кольцо той же шкалы размеров, которое бежит по кругу, пока доля неизвестна. Как обновиться: `<Spinner />` → `<ProgressSpinner indeterminate />`, имя — тем же `aria_label`. Отличия: роль кольца — `progressbar` без `aria-valuenow`, а не живая область `status`; содержимого у кольца нет — текст ставят рядом и связывают через `aria_labelledBy`; толщину кольца задаёт тема долей диаметра, пропа `borderWidth` и переменной толщины кольца больше нет. В React ProgressSpinner пока нет — его перенос идёт отдельно.
- 268439c: Владелец коллекции — опция движка: engine.options.set({ owner }) / get / watch, а не аргумент конструкторов расширений. Движок переживает компонент и переходит к следующему владельцу; второй живой владелец на одном движке — ошибка. Фабрики расширений (tabsExtensions и соседи) без аргументов, createEngine\* — owner необязателен; resolveEngine заменён completeEngine. Активацию и выбор можно отменить: item:activate:before (TActivateEvent) и item:select:before (TSelectEvent), activate/select/toggle возвращают boolean; отменённое value откатывается к выбору. Тема oren: выключенный активный таб приглушён, как остальные.
- 8b58fa8: Тема oren называет свои глобальные имена той же схемой `so-`, что и библиотека, и одноимённые имена приложения с ними не сталкиваются. Переменные CSS — `--so-*`: токены (`--so-neutral-500`, `--so-component-surface`) и переменные, которые объявляет приложение (`--so-place-surface`, `--so-table-head-offset`). Кадры анимаций — `so-*` (`so-skeleton-pulse`, `so-skeleton-wave`). Схему включает атрибут `data-so-theme`: `<html data-so-theme="oren-dark">`.
- de9a974: Таблица: ширину колонки меняет ручка у края заголовка — мышью, касанием, клавишами и жестом скринридера (`resizable` у колонки, в границах `minWidth` и `maxWidth`); итог приходит событием таблицы `column:resize` с колонкой и шириной, по нему приложение сохраняет настройку. `disabled` таблицы выключает ручки колонок. Разметка заголовка колонки сменилась: содержимое — в обёртке `.so-table-column__content`, рядом — полоса ручки `.so-table-column__resizer` с полем `input type="range"`, а заголовок назван обёрткой (`aria-labelledby`) и объявлен `scope="col"`. Стили по `.so-table-column > .so-table-column__sort` и `.so-table-column > .so-table-column__text` ведут теперь через обёртку. Ширина задана у всех показанных колонок — таблица шириной в их сумму, а не во всю ширину места.
- 5e219b7: Окно для длинных списков — обёртка `Virtual`: `<Virtual><ListBox :items /></Virtual>`, так же Table. Коллекции внутри рисуют только видимые элементы, на месте остальных — распорки той же высоты; код окна попадает в сборку приложения только вместе с обёрткой, выключатель — `enabled`. Ломающее: у Table убраны проп `virtual` и выход `bodyRows` — окно ставит обёртка `Virtual`, а тело рисуется по `drawn` (`entry.item` вместо `entry.row`); расширение `virtual` коллекции строк разделено на общее рисование коллекций `draw` (стратегия окна `TWindowStrategy`) и табличное `window` (`aria-rowcount`, `aria-rowindex`, `headRowAria`); `TTableVirtualPlugin` заменён общим `TVirtualPlugin`, переменная распорки — `--so-filler-height`. ListBox в окне: нарисованным — `aria-setsize` и `aria-posinset`, подсвеченный клавиатурой элемент окно держит в документе, предел `maxRows` считается по показанным элементам.
- 080cf7a: Поле формы Field (во Vue): подпись, подсказка и ошибка, связанные с контролом сами — `<Field label="Почта" helper="…" error="…" invalid position="start"><Input /></Field>`. Текст части — проп `label`, `helper`, `error`, своя разметка — слот `label-content`, `helper-content`, `error-content`; ошибка видна при `invalid` и встаёт на место подсказки. Подпись называет Input, Select, CheckBox, Switch и Rating своим `for` (без своего `id` контрол получает `id` поля), DateInput, DatePicker и RadioGroup — ссылкой `aria-labelledby`; справка — `aria-describedby` контрола, ошибка — `aria-invalid` и `data-invalid`. У `TValueControl` появилось свойство инстанса `invalid` (не проп): `data-invalid` и `aria-invalid` — только у невалидного; у DateInput итог — своё или вне границ, и `data-invalid="false"` у валидного поля даты больше не ставится. У `TControl` — `labelable`, у `TAriaPlugin` — второй вход `links`. Select кладёт свой набор `aria` на `<input>` комбобокса — `aria_label` Select теперь называет поле; корни Input, CheckBox и Switch во Vue несут `dataset`. Новая роль иконки `error` (в `@soxa-ui/icons-material` она есть): своему пакету иконок её нужно закрыть. Тема oren: стили Field — подпись сверху, в начале или в конце строки, общая колонка подписей формы через `--so-field-columns`, — вид ошибки контролов по их `data-invalid` и одна шкала подписи у Label, Field и текста радио. Ломающее: база кнопки очистки переименована — `TField` → `TClearable`, `IField`/`IFieldProps`/`TFieldEvents` → `IClearable`/`IClearableProps`/`TClearableEvents`, `FieldDescriptor` → `ClearableDescriptor`, `TFieldNamesPlugin` → `TClearableNamesPlugin`, `FieldNamesPluginDescriptor` → `ClearableNamesPluginDescriptor`; имя `TField` и `FieldDescriptor` теперь у поля формы. Раздел локали `field` прежний.
- 6cddad0: Движение — один режим на библиотеку. По умолчанию всё движение компонентов следует настройке системы `prefers-reduced-motion`: при просьбе системы его нет у полосы Tabs `line`, выезда Drawer, бега ProgressLinear и ProgressSpinner, раскрытия Accordion, стрелки Select, ручки Switch, точки RadioGroup и волны Skeleton — так же, как раньше у карточки Tabs `contained`, ручек Slider и ленты Scroller. Приложение задаёт режим в точке входа — `useMotion('full')` (движение всегда) или `useMotion('reduce')` (никогда) из `@soxa-ui/plugins`; режим — атрибут `data-so-motion` на корне документа. Ломающее: без движения Drawer проявляется и гаснет на месте, а неизвестная доля индикаторов — медленное мерцание всей дорожки и всего кольца вместо бега; `scrollBehavior: 'smooth'` у ListBox и Select прокручивает сразу, когда движение убрано. Тема oren пишет движение одним миксином (`motion.allowed`); своя тема читает тот же атрибут.
- 1b8b606: Переменные CSS, которые пишут ядро и плагины, а читает тема, названы одной схемой `--so-…` — с префиксом классов, и одноимённая переменная приложения у предка их не подменяет: `--so-dialog-width`, `--so-dialog-height`, `--so-dialog-offset-{top,bottom,start,end}`, `--so-drawer-width`, `--so-drawer-height`, `--so-swipe-offset`, `--so-filler-height`, `--so-slider-position`, `--so-slider-range-start`, `--so-slider-range-end`, `--so-progress-linear-percent`, `--so-progress-spinner-fraction`, `--so-table-column-width`, `--so-table-column-drag`, `--so-table-column-shift`, `--so-table-column-ghost` и `--so-table-column-ghost-size`. Тема oren читает их под этими именами.

### Patch Changes

- 85bcbed: Tooltip: новый компонент (Vue) — подсказка у элемента, паттерн Tooltip APG. Триггер кладут в слот `trigger`: ссылку на панель (`aria-describedby`) он получает в scope набором `triggerAria`, и стоит она всегда — закрытая панель только прячется. У панели `role="tooltip"`, фокус в неё не уходит. Пропсы: `open` (v-model), `placement` — сторона и выравнивание у триггера (по умолчанию `top` — по центру над ним), `openDelay` и `closeDelay` — задержка показа при наведении и скрытия после ухода курсора (400 и 150 мс). Показывают подсказку наведение (касание — нет) и фокус с клавиатуры — он сразу; курсор на самой подсказке её держит. Прячут уход курсора и фокуса, нажатие на триггер, нажатие мимо и Escape; Escape гасится `preventDefault`, и поповер под подсказкой остаётся открытым. На странице одна подсказка: открывшаяся закрывает прежнюю, а следующая за только что закрытой показывается без задержки. Поведение — новый `TTooltipTriggerPlugin`. Тема oren рисует подсказку плашкой в обратных цветах (`.so-tooltip`, `.so-tooltip__panel`, `.so-tooltip__content`).
- 3f1cec1: DateInput: поле не меняет ширину, пока набирают год
- 3259882: Accordion, вложенный в содержимое раскрытой секции, больше не перенимает её вид: стрелки вложенных свёрнутых секций не повёрнуты, а свёрнутая вложенная секция схлопывается целиком. Раньше правила раскрытой секции задевали всё, что лежит внутри неё: стрелка любой вложенной секции стояла повёрнутой, как у раскрытой, а под заголовком свёрнутой оставалась пустая полоса высотой в отступ панели.
- 77c744a: Calendar: рамка «сегодня» тише — той же пары ступеней, что рамка Button `outlined` и коробки CheckBox: 300 в покое и 400 на вуали — под наведением и нажатием, на ленте диапазона и в предпросмотре. Раньше рамка была насыщенной ступенью 500 и горела ярче любой рамки рядом. Ступень на вуали сильнее, чтобы рамка не пропадала: в тёмной схеме на панели DatePicker лента почти цвета ступени 300. На выбранном дне рамка прежняя — полупрозрачная цвета текста на заливке.
- ef20df2: Tags: теги на ступень мельче кнопок того же размера. У тега своя шкала: тег `normal` ростом и кеглем — как Button `sm`, у `sm` своя ступень ниже, поля и зазоры на крупных размерах уже кнопочных. Крестик — квадрат вокруг значка в кегль подписи, по центру пилюли: на крупных размерах значок больше не выходит жирнее подписи. Теги в поле Select берут кегль и поля той же шкалы, высота у них — по-прежнему строка поля.
- 45fce47: Слоты элементов коллекций пробрасываются целиком: владелец, который рисует элементы из `items`, отдаёт каждый слот элемента как `item-<слот>`, и scope проброса — scope слота элемента плюс сам элемент. `item` у ListBox, Select, Tags и Accordion получает `{ item, text, selected }`, у Tabs — `{ item, text, active }`, у RadioGroup — `{ item, active }`, у Calendar и DatePicker — `{ item, text }`; `header` у Table — `{ column, text, sortable }`. Новые слоты — `item-indicator-icon` у ListBox и Select, `item-close-icon` у Tabs и Tags, `item-leading-icon` и `item-trailing-icon` у Accordion: иконку подменяют одному элементу условием по `item.value`. У ListBox появился слот `empty` — пока элементов нет, как у Select. Подпись `RadioGroup.Item` получает `{ active }`. Стрелку Accordion, подменённую слотом, тема oren поворачивает так же, как стрелку по умолчанию: класс `so-accordion-item__arrow` переехал с иконки на обёртку слота, а пустую обёртку тема прячет. В React владелец отдаёт элементу функцию слота (`relaySlot`), а не готовый узел.
- dd5c935: Dialog появляется и исчезает плавно, вместе с подложкой: тема oren проявляет окно и подложку из прозрачных за 200 мс и гасит за 150 мс, а `display: none` откладывает до конца перехода. Переходит только прозрачность: окно не выезжает, разворот и размер меняются сразу, и при `prefers-reduced-motion` переход тот же. Открытость для темы — `data-open` у панели и у подложки (`backdropDataset`) — теперь пишет модальный слой (`TModalLayer`): у окна она появилась, у выезжающей панели осталась прежней.
- c9d24bc: Dialog: отступ от краёв экрана — проп `offset`: число — px, строка — CSS-значение, проценты — от экрана по своей оси; не задан — отступ темы, `0` — вплотную. У центра окно держится на отступе со всех сторон, у стороны — от её края, и отступ всегда ограничивает размер окна. Стороны по отдельности правит подписчик события раскладки `layout:offset:before` (`TDialogOffsetEvent`: место окна `placement` и изменяемые `top`, `bottom`, `start`, `end`; `preventDefault()` возвращает всем сторонам отступ темы) — событие приходит на каждый пересчёт стилей, в том числе у окна, созданного видимым. Тема oren раскладывает отступ переменными `--so-dialog-offset-{top,bottom,start,end}`. Раскладка модального слоя (`TModalLayoutPlugin`, у окна и выезжающей панели) шлёт `change:styles`, только когда стили сменились.
- ab15a38: Ряд тегов в поле Select в режиме `tags_overflow: 'scroll'` больше не показывает полосу прокрутки: классическая полоса (Windows, Linux) торчала на 11px ниже нижней рамки поля. Ряд по-прежнему листают пальцем, трекпадом и колесом с Shift, а где ещё есть теги, подсказывает маска у края, как у ленты со стрелками; крестик под фокусом браузер докручивает из-под подсказки. Подсказка есть в браузерах с анимациями по прокрутке (`animation-timeline`), полоса спрятана во всех.
- 8595512: Tags с выбором: стрелки, `Home`/`End` и переход фокуса к соседу закрытого тега больше не докручивают до тега страницу и внешние области прокрутки — `TTagsKeyboardPlugin` только переносит фокус, а прокрутку при фокусе делает сам браузер. Тег под фокусом в окно ряда `scroll` доводит один плагин ряда `TTagsScrollPlugin`, одинаково при входе в набор по Tab и после стрелки. Как ряд показывает тег под фокусом, не меняется.
- 9e0c6e7: Dialog: новый компонент (Vue) — модальное окно, паттерн Dialog (Modal) APG. Открытость — `visible` (`v-model:visible`); имя окну даёт слот `title` (`aria-labelledby`), содержимое — слот по умолчанию, ряд действий — `footer`. Место — `placement`: `center` (по умолчанию), `start`, `end`, `top`, `bottom`, стороны логические; размер — `width` и `height` (число — px, строка — CSS-значение, не заданы — размер темы); `maximized` разворачивает окно на весь экран, `maximizable` показывает кнопку разворота (имя `maximizeLabel`, состояние — `aria-pressed`). Крестик (`closable`, `closeLabel`), Escape и нажатие по подложке просят окно закрыться: событие `close:before` с причиной (`button`, `outside`, `escape`) отменяется `preventDefault()`, а `dismissible: false` оставляет только крестик; запись `visible` из кода и `v-model` события не шлют. `alert` делает окно предупреждением (`role="alertdialog"`, описание — содержимое). Фокус уходит в окно и возвращается при любом закрытии, Tab ходит по кругу, страница под окном спрятана от скринридера и не прокручивается, нажатие по подложке фокус не уносит. Иконки кнопки разворота — роли `arrowsOutward` и `arrowsInward` (`@soxa-ui/icons-material`); тема oren рисует окно и подложку (`.so-dialog`, `.so-dialog__backdrop`, `--placement-*`, `data-maximized`, переменные `--so-dialog-width` и `--so-dialog-height`).
  
  Ломающее. Слой выделен в общую базу `TLayer` (`@soxa-ui/core`): Frame и окно делят один стек z-index, и его базу задают у `TLayer` — `TLayer.baseZIndex = 5000`; запись в `TFrame.baseZIndex` больше не действует. В `@soxa-ui/plugins` правило «после нажатия мимо фокус не возвращать» переехало из базы `TOverlayFocusPlugin` в `TPopoverFocusPlugin`: `TModalFocusPlugin` возвращает фокус при любом закрытии и гасит `mousedown` нажатия мимо. Своя стратегия на базе `TOverlayFocusPlugin`, которой нужно прежнее правило, подписывается на `dismiss` у `TDismissPlugin` сама. Нажатие мимо и Escape плагины слоя передают владельцу, который принимает запрос закрытия (`requestClose`, тип-гард `isCloseRequestable`), с причиной; остальных закрывают записью открытости, как раньше.
- a7cf90d: Rating: `required` работает — обязательная оценка, которую не поставили (0), не даёт отправить форму. У `input[type=range]` нет ни `required`, ни состояния «пусто», поэтому ошибку полю ставит новый плагин `TRatingValidityPlugin` (определение `RatingValidityPluginDescriptor`, namespace `validity`, в составе Rating) — `setCustomValidity` со строкой локали, пока оценка обязательна, равна 0 и не только для показа (`readonly`); поставили оценку — ошибки нет. Не отправить форму, поставить фокус на поле и показать сообщение — дальше браузер. Сообщение — новая строка локали `rating.required` во всех шести готовых локалях («Поставьте оценку», «Please select a rating»); своя полная локаль (`TLocale`) дописывает строку `rating.required` или собирается поверх готовой через `extendLocale`. Тема oren после неудачной отправки красит пустые звёзды вуалью цвета ошибки — по `:user-invalid` поля, поэтому нетронутая оценка до первой отправки не горит. ARIA не меняется: `aria-required` у роли `slider` нет.
- ed00f0c: Calendar: шапка как в календаре Android — заголовок месяца у начала ряда, «назад» и «вперёд» вплотную у конца, над двумя последними колонками; в DOM пара идёт сразу за заголовком первого месяца, и Tab проходит заголовок, «назад», «вперёд», сетку. Шапка панели выбора месяца и года — так же: год у начала, стрелки у конца. Новый слот `footer` — подвал под сетками, ряд действий у конца строки; ряд месяцев теперь в своём узле `.so-calendar__months`. DatePicker: проп `confirmable` — выбор в календаре становится черновиком, в подвале панели «Отмена» и «OK»: «OK» (`confirm()`) делает его значением и закрывает панель, любое другое закрытие черновик сбрасывает, а `closeOnSelect` не действует. Пока диапазон выбран наполовину, «OK» выключена (`confirmDisabled`). Текст кнопок — строки локали `datePicker.confirm` и `datePicker.cancel` во всех шести готовых локалях.
- 8b89d9e: Drawer: новый компонент (Vue) — выезжающая панель у края экрана, модальная, как окно. Край — `placement`: `end` (по умолчанию), `start`, `top`, `bottom`, стороны логические; размер — `width` у боковой и `height` у верхней и нижней (переменные темы `--so-drawer-width` и `--so-drawer-height`). `swipe` включает жест: `handle` — смахнуть за полосу у края, `panel` — за любое место, кроме контролов и прокручиваемых областей; отпустили дальше четверти размера или быстро к краю — закрытие с новой причиной `swipe` (`TCloseReason`) через отменяемое `close:before`, иначе панель возвращается на место. `contained` оставляет панель в ближайшем позиционированном предке — например, в модальном окне — и не запирает прокрутку документа. Крестик, Escape, подложка, `dismissible`, `close:before`, фокус и немой для скринридера фон — как у Dialog: общее вынесено в базу `TModalLayer` (`@soxa-ui/core`), дескриптор `ModalLayerDescriptor` (`@soxa-ui/setup`) и расчёт раскладки `TModalLayoutPlugin` (`@soxa-ui/plugins`), у Dialog поведение и CSS прежние. Тема oren рисует панель и подложку (`.so-drawer`, `.so-drawer__backdrop`, `--placement-*`, `data-open`, `data-swiping`, `data-contained`), въезд и выезд — переходом.
- b37a7a1: Tabs: `TTabsViewPlugin` пишет переменные полосы и разрыва линии под активным табом и ставит `--ready-animation` при любом виде табов, а не только у `line` и `outline`: имена видов объявляет тема, и у табов без `view` модификатора нет вовсе.
- 6745c1e: Тема oren узнаёт направление письма по ближайшему `dir`, а не по любому предку. Компонент с `direction="ltr"` или внутри `<div dir="ltr">` на RTL-странице больше не зеркалится: стрелки Scroller и Calendar, бег ProgressLinear, выезд Drawer и маска ряда тегов в поле Select смотрят в свою сторону. Знак направления тема держит в переменной `--so-dir-sign` (1 или -1), её задают атрибуты `dir`.
- bf71267: Table: призрак отложенной протяжки у последней колонки — ровно на линии ручки, а не на несколько px раньше
- a2e3e21: Web Components: иконка — `<span is="so-icon" icon="close">`. Роль — свой атрибут элемента `icon` (свойство `el.icon`), а не проп: по ней элемент рисует внутри себя `<svg>` иконки роли из подключённого пакета, растянутый на корень, и при смене роли перерисовывает тот же узел. Корень — сам `span`: размер (`size`, `width`, `height`), классы и доступное имя (`aria_label`; без него иконка скрыта от скринридера) — на нём, как у любого элемента. Голый `<svg>` с рисунком роли для своей разметки даёт `roleIcon(role)`, рисунок на готовом `<svg>` — `drawRoleIcon(svg, role)`. База элементов (`SoxaElement`) принимает свои атрибуты элемента сверх пропов — `attributes` в описании элемента. Тема oren делает корень иконки любого тега блоком, как `svg`: иконка не на `svg` — `<Icon>` без тега в любом адаптере — теперь берёт размер ступени.
- 5a54d8f: CheckBox: новый вид `filled` — коробка залита цветом варианта, отмеченная и частично выбранная — насыщенным цветом с белой отметкой. Вид по умолчанию получил имя `outlined` (рамка, отметка цветом варианта): его можно задать явно, `view="outlined"` выглядит так же, как чекбокс без вида. Выключенный `plain` теперь без фона: раньше у него проступала коробка вида по умолчанию.
- 3a72379: Tags и Select: у ряда тегов два режима переполнения — `wrap` и `scroll`, оба — раскладка темы, без замера ряда и панели. Свою раскладку тегов собирают слотами: `default` у Tags отдаёт показанные теги (`shown`) — их кладут в `Scroller` или делят на ряд и `Popover` за кнопкой, — а новый слот `tags` у Select подменяет ряд тегов в поле и получает инстанс тегов и его коллекцию (`tags`, `engine`) — то, что встроенный `Tags` берёт `:ctrl` и `:engine`. Тема oren красит видом и вариантом набора тег на любой глубине внутри набора, поэтому своя раскладка в слоте выглядит так же, как ряд. Ряд `scroll` в поле Select занимает место по своим тегам, но не больше половины поля: ввод стоит сразу за последним тегом, а тесный ряд прокручивается в своей половине.
- 6d658b2: Tabs: полоса под активным табом у вида по умолчанию (`line`) переезжает к новому табу так же, как карточка `contained`: место и длина едут вместе, а у вертикальных табов длина — высота, и табы разной высоты полоса проходит без скачка длины. Едет полоса только при смене активного таба: первая отрисовка, первый выбранный таб, ресайз и сдвиг соседей ставят её на место сразу — она не отстаёт от таба и не выезжает из угла.
- 648a7a3: Switch в RTL зеркалится: выключенная ручка стоит у начала строки — справа, включённая уходит влево, как ползунок Slider и полоса ProgressLinear. Раньше ручка в любом направлении стояла слева и уезжала вправо. Направление берётся у самого переключателя: с `direction="ltr"` внутри RTL-предка он остаётся LTR. Место ручки (`.so-switch__track--thumb`) теперь задаёт `inset-inline-start`, и переход идёт по нему, а не по `transform`: стили приложения, которые правили сдвиг или переход ручки, переводятся на `inset-inline-start`.
- 9c0f735: Кнопка, положенная в слот строки ListBox и опции Select или в содержимое секции Accordion, выглядит как обычная кнопка: текст и иконка у неё по центру, курсор — указатель. Раньше правила строки задевали любую кнопку внутри элемента: выравнивали её содержимое к началу строки, а в ListBox и Select ещё и гасили курсор и снимали многоточие при переносе строк (`contentFit: 'wrap'`).
- 2e53a0f: ProgressLinear: новый компонент (Vue) — индикатор выполнения линией, роль `progressbar`. `value` — сколько готово на шкале от `min` до `max` (по умолчанию 0 на шкале 0–100). `indeterminate` — доля неизвестна: полоса бежит, `aria-valuenow` у неё нет, а `value` хранится и возвращается на полосу, когда флаг снимают. Значение хранится как задано, а доля на полосе и `aria-valuenow` прижаты к шкале — полоса и скринридер показывают одно и то же. Имя — `aria_label` или `aria_labelledBy`. Текста и слотов у полосы нет: содержимое роли `progressbar` скринридер не читает, подпись и число ставят рядом. Размер и цвет — `size` и `variant`. Тема oren рисует дорожку и заливку (`.so-progress-linear`, `.so-progress-linear__range`): доля плавно едет к новому значению, а пока полоса бежит, по дорожке идёт отрезок — от начала строки, в RTL справа. При `prefers-reduced-motion` доля встаёт сразу, а бег тот же. Без варианта полоса `accent`, как Spinner.
- edf1af1: DateInput: ряд частей держит минимальную ширину по самой широкой дате — поле не меняет ширину ни на первой цифре части, чья подсказка шире цифр («мм» и «01»), ни при наборе года; у разделителей небольшие поля.
- e982bdf: Slider: новый компонент (Vue) — ползунок, паттерны Slider и Multi-Thumb Slider APG. Значение — число (одна ручка) или массив (по ручке на элемент), и форма сохраняется в `v-model`. Ручка — нативный `input[type=range]`: мобильный скринридер двигает её своим жестом, `name` и `disabled` уходят в форму сами. Пропсы: `min`, `max`, `step` — числом или списком допустимых значений (неравный шаг), `largeStep` — шагов у Shift со стрелкой, PageUp и PageDown, `orientation`, `inverted`, `origin` — откуда растёт заливка одной ручки (середина хода — заливка от центра), `marks` — точки шкалы или свой список с подписями, `minStepsBetweenThumbs` — наименьший зазор между ручками в шагах, `thumbLabels` — имена ручек для скринридера. Слоты: `mark` — подпись метки, `thumb` — место под подсказку со значением. Событие `commit` — одно на действие: конец перетаскивания, сменившего значение, или шаг клавишей. Механизм «тянем — меняем значение» отделён от ползунка: шкала `createScale` (`IScale`) в ядре, контракт `ISlidable` и плагины `TSlidePointerPlugin` и `TSlideKeyboardPlugin` — их возьмёт следующий компонент с перетаскиванием. `TStateUnit` принимает правило «то же самое» (опция `same`): составное значение сверяется им, а не по ссылке. Тема oren рисует ползунок (`.so-slider` и его части).
- dd268c6: Menu — меню действий у кнопки (APG Menu Button): пункты, флажки, группы с подписью и разделители, клавиатура с набором по первым буквам, наведение и модель фокуса; во Vue — `Menu` с частями `Menu.Item`, `Menu.CheckboxItem`, `Menu.Group`, `Menu.Separator`, в теме oren — его стили.
- fb7dff2: Отметка CheckBox — svg иконки по роли без компонента Icon: смена отметки больше не собирает контекст и плагины иконки. Размер отметке даёт тема флажка (so-check-box\_\_mark). Во Vue компонент иконки роли (`useIcon`) один на роль
- b0938c0: Открытость слоя для темы — `data-open` у панели любого Frame: слой (`TLayer`) пишет его сам, проекцией `visible`, и проводки в разметке не нужно. Тема oren проявляет и гасит по нему панели Select и DatePicker на месте, как Popover у триггера без жеста: одна прозрачность его временем, а закрытая панель, пока гаснет, нажатий не ловит. У Popover `data-open` панели теперь пишет её Frame, а из набора `panelDataset` он ушёл; у Dialog и Drawer атрибут прежний.
- 556be3f: oren: состояния вида plain отходят от той поверхности, на которой стоит кнопка, — полупрозрачной вуалью ступени 500 вместо ступеней 100/200. В тёмной схеме выбранная опция Select больше не сливается с панелью, а наведение на кнопку в панели светлеет, а не темнеет. Панель Select получила такую же кромку, как панель Popover.
- 7b387fb: Пакеты soxa зависят друг от друга точной версией: набор у потребителя всегда собран из одного выпуска.
- 4fa09bc: Toasts: раскладка стопкой — новый проп `layout` (`list` по умолчанию и `cascade`, модификатор `so-toasts--layout-*`). В стопке тосты перекрывают друг друга: передний — первый по порядку коллекции, задние уже и выглядывают из-под него на ступень, высота стопки — по переднему. Вывести задний тост вперёд — перестановка в коллекции: колесо над регионом листает стопку на шаг за жест (вниз — передний уходит назад, вверх — задний выходит вперёд), и страница под стопкой не едет; стрелки ↓ и ↑ при фокусе на тосте — то же, и фокус переходит на новый передний. Это новый плагин `TToastsCascadePlugin`; без стопки колесо и стрелки остаются странице. Фокус на заднем тосте выводит его вперёд темой, без перестановки: Tab идёт по тостам по порядку и уходит из стопки. Глубину тоста разметка отдаёт теме переменной `--so-toasts-depth`. Тема oren рисует стопку, а высоту переднего, по которой задние меняют свою переходом, пишет её поведение — новый `TToastsFrontPlugin` (`useTheme`). Во Vue крестик тоста — `type="button"`: в форме он её не отправляет.
- b45d550: Calendar: в панели выбора месяца подпись плитки переносится между словами — у месяцев так же, как у лет. Имя месяца в несколько слов (`vi-VN` — «Tháng 10») уходит на две строки, а не режется многоточием: у `vi-VN` на самом крупном размере «Tháng 10»–«Tháng 12» больше не сливаются в три одинаковых «Tháng …». Многоточием у края плитки режется только слово шире самой плитки. Список панели календарь создаёт с `contentFit: 'wrap'` на обоих уровнях.
- 1db461f: ProgressLinear: в режиме принудительных цветов (высокий контраст Windows) бегущий отрезок неопределённой полосы берёт системный цвет `Highlight`, как заливка. Раньше правило режима проигрывало правилу бега, и отрезок оставался цвета темы, чужого палитре пользователя.
- b850687: Tabs `view="contained"`: карточка активного таба переезжает к новому табу переходом, как полоса у `line`. Ресайз, сдвиг соседей и первая отрисовка ставят её на место сразу, а при `prefers-reduced-motion: reduce` переезда нет. Без `useTheme` карточка, как и раньше, стоит на выбранном табе. Геометрию активного таба поведение темы пишет на список переменными `--so-tabs-active-pos` и `--so-tabs-active-size`.
- a58f169: Pagination — постраничная навигация: стрелки по краям, первая и последняя страницы видны всегда, между ними — `middleCount` страниц вокруг текущей (по умолчанию 3), на месте пропущенных — многоточие: `‹ 1 … 4 5 6 … 10 ›`. Страницы числовые — `⌈total / pageSize⌉`, номер в цифрах локали («12 345»), — или текстовые — список `pages` из `{ text, value? }`. Значение (`value`, `v-model`) — ключ текущей страницы, к страницам не прижимается. Корень — `nav`, имя ему даёт приложение (`aria_label`); у текущей — `aria-current="page"`, имена стрелок — из локали, новый раздел `pagination`. В ядре — `TPagination` и коллекция страниц окна (`createEnginePagination`, выход `cells`): в коллекции только видимые страницы, и страница, оставшаяся на экране, — тот же узел. Новый плагин имён `TPaginationNamesPlugin`. Во Vue — компонент `Pagination`, в теме oren — его стили.
- 2ffbb83: Теги в поле Select: в `tags_overflow: 'scroll'` тег больше не сжимается до крестика — ряд прокручивается тегами натуральной ширины, как у самостоятельного Tags.
- e76d680: Toasts — всплывающие уведомления: менеджер `<Toasts>` оборачивает приложение, а `useToasts().show(текст | опции)` показывает тост из кода и отдаёт его экземпляр. Очередь — коллекция с пределом видимых (`max`), автозакрытие с паузой на указатель, фокус и скрытую вкладку (`duration`, `0` — пока не закроют), срочные тосты (`alert`), своё содержимое (`render`), смахивание, F8 к тостам и Escape; тема oren рисует регион у шести краёв окна и тосты. Слой (`TLayer`) получил публичный `raise()`, жест (`TSwipePlugin`) начинается в слое своей панели.
- ccd7713: Tags: кнопка закрытия тега стоит рядом со строкой тега, а не внутри неё. В режиме выбора строка — `role="option"`, и вложенная кнопка скринридеру кнопкой не была, а её подпись он читал в названии тега: «Настройки Close Настройки». Теперь в `.so-tags-item` два соседа — строка и `.so-tags-item__close`; кнопка сама получает размер и выключенность тега. Пилюлю тега — фон, рамку и состояния вида набора — рисует сам `.so-tags-item`: строка стала `view="none"`, `data-selected` стоит только на элементе. Тема oren держит прежний вид: матрица видов Button вынесена в миксины, ими же красится пилюля, CSS самого Button по декларациям не изменился.
- 3e32274: В режиме принудительных цветов (высокий контраст Windows) активный таб Tabs снова виден у каждого вида: полоса под ним у вида по умолчанию — системной подсветкой `Highlight` поверх линии под списком, у `outline` рамка активного таба — `Highlight`, а линии списка по обе стороны от него — системным цветом текста, как рамки табов, у `contained` карточка обведена контуром `Highlight`. Раньше браузер заменял полосу, карточку и линии цветом страницы, и активный таб отличался от соседей только непрозрачностью текста. Вне этого режима вид прежний.
- 17bc937: Calendar — компонент поверх календаря ядра: во Vue `<Calendar>` с частью `Calendar.Item`, в setup — дескрипторы `CalendarDescriptor`, `CalendarItemDescriptor` и их коллекционные части, в теме oren — стили. Сетка — по APG (Date Picker Dialog): месяц — `table` с `role="grid"`, его заголовок называет сетку и сам объявляет смену месяца (`aria-live="polite"`), фокус и наборы — на ячейке дня, одна остановка Tab на все сетки, шапка дней недели скрыта от скринридера. Клавиши — `TCalendarKeyboardPlugin`: стрелки, Home/End, PageUp/PageDown (с Shift — год), Enter и пробел выбирают день, Escape отменяет начатый диапазон; DOM-фокус идёт за фокусом коллекции и в новый месяц. Нажатия и наведение для предпросмотра диапазона — `TCalendarPointerPlugin`. Кнопки листания — одна пара на все сетки; их имена — новые пропсы `prevLabel` и `nextLabel` у `TCalendar` (по умолчанию английские), кнопка, погасшая у границы под фокусом, отдаёт фокус дню. Содержимое дня — слот `item` со scope `{ item }`. В ядре: выходы `prevAria` и `nextAria`, событие вида `change:paging` — перечитать `prevDisabled` и `nextDisabled`, а ячейка заполнителя в `grids` — только дата и `aria-hidden`, без текста и `data-outside-month`.
- 63563ff: Тема oren: закрытая панель Popover, Select и DatePicker пропадает из раскладки, когда догасла (105 мс), а не через 200 мс — время ухода смахнутой панели. Раньше догасшая панель ещё около десятой доли секунды висела прозрачной: глазу её не видно, но скринридер видел закрытый список, а сброс отбора Select после закрытия срабатывал позже. Уход смахнутой панели и панели в контейнере идёт с прежней скоростью; без движения панель с полосой жеста тоже пропадает, когда догасла.
- a91b783: Tags: свойство overflow (wrap | scroll) — теги, которым не хватило ширины ряда, переносятся на новую строку или ряд стоит в одну строку и прокручивается. Select передаёт режим тегам поля пропом tags_overflow. Поле Select больше не расширяется под теги средствами CSS.
- bd02d06: Popover: новый компонент (Vue) — панель с произвольным содержимым у триггера, паттерн немодального диалога APG. Триггер кладут в слот `trigger`: связку с панелью (`aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`) и вид «нажат» (`data-selected`) он получает в scope — наборами `triggerAria` и `triggerDataset`. У панели `role="dialog"`, имя — `aria_label` или `aria_labelledBy`. Пропсы: `open` (v-model), `closable` и `closeLabel` — кнопка закрытия в углу панели, `lazyMount` — не монтировать содержимое до первого открытия, `placement` — сторона и выравнивание у триггера. При открытии фокус уходит в панель; закрытие крестиком, Escape или самим содержимым возвращает его на триггер, нажатие и фокус мимо закрывают без возврата; Tab ходит так, будто панель стоит в документе сразу за триггером. Тема oren рисует панель, область содержимого и крестик (`.so-popover`, `.so-popover__panel`, `.so-popover__content`, `.so-popover__close`). Frame пишет номер своего слоя в `data-layer` — тот же, что `zIndex`, — и получает слой сразу, если создан видимым: раньше такой Frame стоял с `z-index: 0`.
- c4a0f1d: Tags: у крестика тега невидимая зона нажатия 24×24 по его центру — минимум цели указателя по WCAG 2.5.8 (AA); вид крестика, его наведение и кольцо фокуса прежние. За пилюлю зона не выходит: в поле Select на `sm` она 24×20. Нажатие в концевом паддинге строки тега рядом с крестиком (на `sm` — во всех его 4px) теперь закрывает тег. Высоту пилюли тема задаёт переменной `--so-tags-item-height`: по ней зона держит себя в пилюле.
- fb429b1: Select: минимальная ширина поля теперь зависит от размера, а в режиме `multiple` рассчитана ещё и на тег в поле. На крупных размерах очистка и стрелка больше не выходят за правый край поля, а крестик сжатого тега — за пилюлю. Минимум вместо прежних 160px: в `single` — 168px на `2xl`, в `multiple` — 176px на `normal`, 208px на `lg`, 220px на `xl` и 240px на `2xl`.
- 95c608b: RadioGroup: новый компонент «один из N» — `RadioGroup` и `RadioGroup.Item` (Vue). Радио — нативные `input[type=radio]` в корне-`label`: общий `name` раздаёт группа (без своего имени — от `uid`), одну остановку Tab, стрелки с пропуском выключенных и пробел даёт браузер, `aria-checked` и `aria-disabled` ядро не пишет. Значение группы — `v-model:value`, связанное с отмеченным радио; удаление отмеченного радио значение не стирает. `view`, `size` и `variant` задаются группе и раздаются каждому радио; тема oren рисует виды `dot` (точка в кольце, по умолчанию) и `ring` (утолщённое кольцо) по `data-selected` и `data-disabled` корня радио, у контейнера группы стилей нет. Текста у радио нет — подпись кладут слотом. В ядре появились базы фасадов под активацию — `TActivationCollectionFacade` и `TActivationItemFacade`; фасады Tabs переехали на них без изменения API.
- 9706b17: Виды кнопки больше не сливаются с поверхностью, на которой стоят: нейтральная заливка filled отходит от неё вуалью, рамка outlined взята со ступеней границы (300, под наведением 400), состояния outlined — вуалью, как у plain
- 60f8114: Table: режим сетки `grid` (APG Data Grid) — одна остановка Tab, стрелки, Home/End, Ctrl+Home/End и PageUp/PageDown по ячейкам, выбор строки нажатием и пробелом, Ctrl/Cmd+A, Enter на сортируемом заголовке, Enter и F2 — внутрь ячейки, Escape — обратно; строка под указателем и под фокусом подсвечена
- 959be4c: Иконка: размеры `xl` и `2xl` получили размер в теме — 1.4em и 1.45em от кегля, продолжение шкалы `sm` → `normal` → `lg`. Раньше правило было только у трёх меньших, и на крупных размерах иконка без размера пропадала или растягивалась: у Tabs и Tags не было крестика закрытия, у Select — очистки, стрелки и крестиков тегов, стрелка Accordion растягивалась на всю ширину заголовка, а галочка CheckBox — на всю коробку.
- 021af92: ProgressLinear: ось `orientation` — `horizontal` (по умолчанию) или `vertical`, снизу вверх; на корне модификатор `--horizontal` или `--vertical`. `aria-orientation` полоса не пишет: у роли `progressbar` его нет. Тема oren рисует вертикальную полосу строчным блоком высотой 10rem (класс или стиль потребителя её перекрывает) и той же толщины по `size`, что горизонтальную; заливка растёт снизу, бег идёт снизу вверх при любом направлении письма; при `prefers-reduced-motion` доля встаёт сразу, а бег тот же.
- de3e346: Tabs: вертикальные табы line и outline в языках справа налево рисуют линию, полосу под активным табом и открытую сторону вкладок у края списка со стороны панели, а не снаружи. В режиме принудительных цветов табы line внутри панели табов outline снова отмечают активный таб системной подсветкой. Тема больше не красит класс `so-tabs__content`: его не выпускает ни один адаптер (панель таба — `so-tabs__panel`); если класс стоял в вашей разметке, отступ и растяжку задайте сами.
- 0c6f41d: Select в окне: `<Virtual><Select :items /></Virtual>` — список панели рисует только видимые опции, на месте остальных — распорки той же высоты (`.so-select__filler`). Фасад коллекции Select отдаёт `drawn`, разметка рисует опции по нему. Клавиши ходят по всем показанным опциям: подсвеченную вне окна окно держит в документе, а `aria-activedescendant` ссылается на опцию, только пока она в документе, — ссылку и прокрутку к ней клавиатура ставит, когда окно её нарисовало (хук `onHighlightedMounted` у `TListNavigationPlugin`). Прокрутка к подсвеченной опции — в следующем кадре: панель, открытую той же клавишей, и дорисованную опцию адаптер рисует после обработчика. Место опции в наборе (`aria-setsize`, `aria-posinset`) в окне пишет общее расширение коллекции `positionInSet` (`TPositionInSetExtension`) — у ListBox и Select одно.
- 05d9f0a: Тег под фокусом у края ряда тегов `scroll` виден целиком. Частично видимый элемент браузер при фокусе не докручивает, а целиком скрытый ставит по центру, поэтому у края ряда оставались срезанными крестик, подпись тега или сторона кольца фокуса. Теперь фокус с клавиатуры (Tab, Shift+Tab, стрелки, вход в набор) ряд докручивает до всего тега — новый плагин Tags `TTagsScrollPlugin`, он же и в ряду тегов поля Select, где тег встаёт между подсказками у краёв. Фокус от нажатия мышью ряд не двигает. Счёт доводки общий с лентой (`TScrollerViewportPlugin`), её поведение не меняется. Тема oren: в поле Select без подсказки у края (браузер без `animation-timeline`) тег под фокусом встаёт вплотную к краю ряда.
- e8202c3: oren: схемы объявляют `color-scheme` — `light` у светлой, `dark` у тёмной. В тёмной схеме браузер больше не рисует светлыми то, что рисует сам: полосы прокрутки (список Select, содержимое Popover, ListBox), нативные поля и системные цвета — в том числе фон страницы и цвет текста, которых приложение не задало. Светлая схема не изменилась.
- 59122a5: Table в `reorderPreview: 'column'`: после перестановки колонки ячейки соседей больше не выезжают ещё раз от прежнего сдвига. Так было, когда колонку несли последней в начало или через две вперёд: перерисовка переносила взятый заголовок вместе с кнопкой сортировки под фокусом, браузер пересчитывал стиль посреди неё, и переход ячеек, объявленный под признаком таблицы, вёл ячейки соседей от сдвига к нулю. Теперь переход ячеек держится на взятом заголовке — так же, как переход соседей в шапке.
- ff6b7a2: Панели Select и DatePicker можно смахнуть, чтобы закрыть: новый проп `swipe` (`none` по умолчанию, `handle` — за полосу у края со стороны поля, `panel` — за любое место, кроме контролов и прокручиваемых областей). Оба компонента — смахиваемые слои (`ISwipeable`) с общим `TSwipePlugin`: панель уходит от поля — вниз под ним, вверх над ним, — и жест закрывает её записью `open`, как Escape. Признак «тянут» — `data-swiping` из нового набора `panelDataset`, полосу разметка рисует по выходу `handleRendered`. У DatePicker календарь в панели завёрнут в `.so-date-picker__content`, и прокручивается теперь он, а не панель: иначе пальцем длинную панель с жестом не прокрутить. Тема oren: вид панели у якоря — проявление, жест и уход смахнутой — один миксин на Popover, Select и DatePicker; Popover выглядит как прежде.
- 01e6c91: Tags с выбором: когда стрелка, `Home` или `End` переводят фокус на тег, а `Delete` — на соседа закрытого тега, ряд докручивается до всего тега, вместе с крестиком и кольцом фокуса. Раньше тег у края ряда, видимый частично, ряд не докручивал вовсе: у конца ряда за краем оставались крестик и сторона кольца, у начала — начало строки тега и сторона кольца. В режиме `scroll` тег, докрученный до края, стоит от него на запас под кольцо — 0.25rem, это отступ прокрутки ряда.
- 98c23e0: Поведение темы (`@soxa-ui/theme-oren/setup`) уезжает собранным ESM с декларациями, как остальные пакеты: экспорт ведёт в `dist/setup`, исходники наружу не отдаются. Поверхность прежняя. Пакет собирает `npm run build` из корня; отдельный скрипт `build:css` собирает только CSS — он нужен там, где соседи ещё не собраны (первый шаг CI, `npm run test:layout`).
- 80acf1c: CSS темы стал вдвое меньше: 530 → 236 KB (gzip 34.8 → 23.4 KB). Вариант Button и пилюли тега теперь задаёт только переменные цвета (--so-tone-\*), а вид и его состояния объявлены один раз на все цвета. Попутно исправлено: строки ListBox и Select, заголовки Accordion и кнопки plain/outlined с вариантом в состоянии «выбрано под клавиатурной подсветкой» больше не получают лишний светлый (в тёмной схеме — тёмный) слой от заливки filled, а кнопка с position: absolute в этом состоянии не теряет своё место; в режиме принудительных цветов подсвеченная кнопка с вариантом под фокусом отмечена кольцом фокуса, как нейтральная, а выбор у кнопок и строк в этом режиме встаёт сразу, без перехода через цвета темы, а у кнопки filled (и пилюли тега этого вида) появилась рамка цвета ButtonText — без неё залитая кнопка оставалась одним текстом. Switch в этом режиме больше не пропадает: он рисуется системными цветами, как переключатель системы, и включается без мелькания цвета варианта. Выбранный день Calendar в этом режиме выбирается без мелькания и остаётся подсветкой под указателем (раньше под курсором он стоял цветом темы). У ProgressLinear дорожка теперь пустая в контуре, у ProgressSpinner — тонкое кольцо цвета текста: доля различима, а раньше дорожка GrayText почти сливалась с заливкой Highlight. Skeleton в этом режиме виден — заглушка GrayText.
- d2f95c9: Input: рамка выключенного поля под курсором больше не темнеет — раньше наведение красило её, как у включённого, в том числе у поля Select. В RTL отступы слотов Input стоят у краёв поля, а маркер обязательного поля Input, CheckBox и Switch — в углу начала поля, справа: раньше отступ `leading` был слева, `trailing` — справа, а маркер стоял в левом углу при любом направлении. В режиме принудительных цветов (высокий контраст Windows) кольцо фокуса Input и DateInput горит только у поля под фокусом — сплошное, системного цвета фокуса `Highlight`; раньше прозрачное кольцо в покое браузер перекрашивал, и рамка стояла у каждого поля.
- 186903f: Table: ручка ширины не двигает ширину против действия. Колонку без своей ширины тема раскладывает, не глядя на `minWidth` и `maxWidth`, и у колонки, разложенной шире `maxWidth`, рост — протяжка к концу строки, стрелка, PageUp и End — ставил её в `maxWidth`, то есть сужал, а колонку уже `minWidth` так же расширяло сужение. Теперь ручка пишет только ширину в границах колонки: действие к границам ставит колонку в них — ширину, ближайшую к цели, — действие от границ ничего не делает и `commit` не шлёт, а в жесте указатель на точке нажатия или дальше неё от границ возвращает колонке своё значение ширины, каким оно было при нажатии. Поле ручки по-прежнему показывает ширину колонки. Закреплённая шапка (`stickyHead`) в oren: подложку — поверхность места и линию — рисует тень шапки, а не её фон, и строки не проступают ни в скруглённых углах заголовков, ни под заголовком, который поменялся посреди перехода своего цвета (проп включили под указателем, потянули край колонки, переставили колонку).
- 2dbf370: Pagination: отметка текущей страницы встаёт и сходит без перехода цвета — при листании из середины средняя клетка больше не мигает; наведение на страницы гаснет плавно, как прежде
- 58467ef: Наведение на текст подписи Label подсвечивает CheckBox, Switch и радио в любом браузере, а не только там, где браузер сам отдаёт наведение подписи полю
- dcee2e2: Новый компонент Scroller: лента произвольного содержимого в одну строку, которую двигают две кнопки. Прокрутка нативная, полосы не видно, шаг — видимая ширина; на краю кнопка гаснет, когда листать нечего — кнопок нет вовсе. Роль ряда лента принимает от потребителя пропом viewportAria.
- 67cc7a2: Table: линии тише. Линия под шапкой — ступенью 300, как рамка Button `outlined` и коробка CheckBox, а не 400: раньше она горела ярче любой рамки рядом. Линии между строками — тише линии шапки: цвета заливки нейтрального `filled` (вуаль нейтрали), а не ступенью 300. Вуаль считается от того, на чём таблица стоит, и линия видна и на странице, и на панели тёмной схемы, где ступень тише 300 совпала бы с панелью. В режиме принудительных цветов линии по-прежнему цветом текста системы.
- 0f36216: Новый компонент `Label` — подпись контрола: текст (проп `text` или слот `content`) рядом с CheckBox, Switch или радио в слоте `default`, сторона текста — `position` (`start`, `end`, `top`, `bottom`). Связь — вложением, без `for` и `id`: клик по тексту переключает контрол, а текст становится его доступным именем. Радио внутри подписи рисуется с `tag="span"` — его корень тоже `label`; вложенный `label` ловит `TLabelNestedWarnPlugin` предупреждением в консоль. Тема oren рисует стороны, размер текста и выключенную подпись.
- 948ad80: Описание пакета называет проект Soxa UI вместо soxa.
- f7769b8: Calendar: подписи колонок — узкие имена дней недели (`weekday: 'narrow'`), как в шапках календарей CLDR. Короткие имена у `ar`, `ml` и ещё ряда локалей — целые слова шире колонки, и колонка срезала их посреди буквы. Ломающее: у `TCalendarWeekday` (выход `weekdays` календаря) поле `short` заменено на `narrow` — своя разметка шапки читает `weekday.narrow`. Панель выбора месяца и года: имя месяца шире плитки режется многоточием у её края, а не заходит в зазор между плитками; подпись года по-прежнему переносится между словами. Как поступать с подписью, списку по уровню задаёт календарь (`contentFit`), разметка его больше не передаёт.
- d45a021: Slider: заливка идёт за ручкой без задержки при протяжке и при prefers-reduced-motion: reduce
- 6103988: Тегам одного набора можно задавать разный вариант (цвет): `variant` у `Tags.Item` — вход разметки, его задают и данные (`items`, `batch.patch`), и код. Размер тегу по-прежнему диктует набор. Ломающее: набор больше не пишет тегу `variant` — ни при добавлении, ни на смену у набора, — и у тега без своего варианта `tag.variant` теперь `undefined`, а не вариант набора. Тег без своего варианта тема oren красит вариантом набора по классу набора (`so-tags--variant-<v>`), свой модификатор тега (`so-tags-item--variant-<v>`) его перекрывает, а свой `normal` — нейтраль и в цветном наборе. Как обновиться: вариант набора читайте у набора (`tags.variant`), а не у тега; своя тема красит тег без модификатора варианта по классу набора.
- eaffd69: DatePicker получил кнопку очистки — `clearable`, как у Input и DateInput: DatePicker теперь сам поле (база ядра `TField`, дескриптор `FieldDescriptor`) с набором кнопки `clearAria`, командой и событием `clear` и слотом `clear`. У одной даты кнопка стоит в поле перед кнопкой календаря, у диапазона — одна на период, после поля конца, и очищает оба конца, в том числе набранные не до конца. Имя кнопки — строка локали `field.clear` с `name` DatePicker. Плагин имён поля `TFieldNamesPlugin` теперь ставят дескрипторы Input и DateInput, а не `FieldDescriptor`: у DatePicker имя кнопки пишет `TDatePickerNamesPlugin` — наследник плагина имён поля. В теме oren коробка диапазона — сетка из пяти колонок, а сторону кнопок DatePicker задаёт переменная `--so-date-picker-button`.
- 315be6f: Линии Tabs больше не пропадают на тёмной поверхности: рамка таба и линия под списком у вида `outline` и линия под списком у вида по умолчанию берут ступень границы 300 вместо ступени поверхности 200, которая в тёмной схеме равна поверхности контрола. Полоса под активным табом прежняя: теперь у неё своя ступень, а не арифметика от рамки.
- 6476cb7: Лента со стрелками (`Scroller`): элемент под фокусом с клавиатуры больше не остаётся у края под подсказкой. Окно снапа вьюпорта в теме — чистая часть ленты между подсказками, и плагин ленты доводит в него элемент под фокусом, а фокус от нажатия мышью ленту не двигает. Страница после листания встаёт за подсказкой, а не под ней.
- fe0d7cc: Модальное окно Dialog больше не сливается со страницей в режиме принудительных цветов (высокий контраст Windows): кромку окна, как у выезжающей панели Drawer, теперь держит прозрачный контур, который браузер в этом режиме рисует системным цветом. В обычном режиме вид прежний, раскладка не меняется; у развёрнутого окна рамки нет — она за краем экрана.
- 92c14c7: Readonly CheckBox и Switch больше не откликаются на наведение: подсветки нет ни с самого контрола, ни с текста подписи Label, а курсор там обычный, а не рука
- 24b5174: Select с множественным выбором: поле растёт вместе со строками тегов — перенесённые теги больше не рисуются под полем, поверх того, что ниже. Растёт оно только в `tags_overflow="wrap"` (умолчание), где ряд и переносится: в `scroll` ряд стоит одной строкой, и поле остаётся высоты размера. Ввод, очистка и стрелка остаются на первой строке, поле с одной строкой тегов — той же высоты, что без выбора. Высоту поля Input теперь задаёт свойство `--so-input-height` модификатора размера, высоту слотов и тегов в них — выведенная из неё строка слота `--so-input-slot-row`.
- 0abcc93: DateInput — поле даты по частям в формате локали: дату вводят с клавиатуры по частям, а целиком выделяют протяжкой мышью или Ctrl/Cmd+A, копируют, вырезают и вставляют, как текст. У ядра третья лицензия — Apache-2.0: подсказки пустых частей (`дд.мм.гггг`) взяты из таблицы React Spectrum.
- 7bee975: DatePicker: новый компонент (Vue) — поле даты и календарь в панели, паттерн Date Picker Dialog APG. Режим `mode`: `single` (по умолчанию) — поле DateInput с кнопкой календаря в его конце, `range` — поля начала и конца в одной коробке и одна кнопка. Значение — дата `YYYY-MM-DD` или пара `[начало, конец]` (`v-model:value`); его меняют и набор в поле, и выбор в календаре, а недонабранный конец значения не даёт, но и не стирается. Панель открывают кнопка календаря и Alt+↓ на поле (`open`, `v-model:open`, события `open` и `close`): фокус уходит на день сетки — выбранную дату или сегодня, Tab ходит по кругу в панели, Escape закрывает и возвращает фокус, нажатие мимо закрывает панель и оставляет фокус там, куда нажали. Выбор дня закрывает панель (`closeOnSelect`), в диапазоне — второй день; первый Escape посреди диапазона снимает начатый выбор. Полям и календарю DatePicker раздаёт `disabled`, `size`, `variant`, `locale`, `min`, `max`, полям — `readonly` и `required`, календарю — `unavailable`, `weekStart` и `timeZone`. Имена: `triggerLabel` — кнопка и панель, `startLabel` и `endLabel` — концы диапазона, имя поля — `aria_label`. Слоты `trigger-icon` и `item` (содержимое дня), экземпляры — `ctrl.field`, `ctrl.start`, `ctrl.end`, `ctrl.calendar` и `ctrl.engine`. Calendar принимает движок снаружи (`engine`), выбор календаря сообщает выбор пользователя событием `choose`, у фокуса календаря — команда `resetFocus`. Плагины `TDatePickerFocusPlugin`, `TDatePickerTriggerPlugin` и `TDatePickerIdsPlugin`, ловушка Tab модального оверлея — общая утилита `trapTab`, место первого фокуса у `TOverlayFocusPlugin` — точка `_focusCandidates`. Значок кнопки — роль `calendar` (`@soxa-ui/icons-material`, Material Symbols «Calendar Month»); тема oren рисует кнопку, коробку диапазона и панель (`.so-date-picker`, `--single`, `--range`), из темы Select ушло мёртвое правило `.so-select--disabled`.
- 98b9078: Select: тег, которому в поле множественного выбора не хватает места, больше не вылезает за левый край поля. Он сжимается до ширины слота: текст обрезается многоточием, крестик не сжимается. Раньше слот с тегами сжимался уже тега, и тег, переполнив его, уходил половиной за рамку поля — на `lg` при минимальной ширине поля на 48px.
- cd29b8f: Calendar: заголовок месяца — кнопка, открывающая панель выбора месяца и года. Панель накрывает календарь целиком, её шапка встаёт на место ряда заголовков; в ней список месяцев — ровная сетка 4×3 с подписями по центру, год в шапке переключает на годы по 12, стрелки листают год и страницу лет. Имена стрелок — новые пропсы prevYearLabel, nextYearLabel, prevYearsLabel, nextYearsLabel. Frame и Popover получили проп contained: панель не телепортируется, а встаёт в ближайшем позиционированном предке (Popover — накрывает его целиком). ListBox сообщает о выборе пользователя событием choose расширения списка.
- 3bfa716: Rating: новый компонент (Vue) — оценка звёздами, паттерн Rating Slider APG: ползунок с одной ручкой на нативном `input[type="range"]`, звёзды — его зрительная шкала. `value` — оценка от 0 до `max` (сколько звёзд, по умолчанию 5), `step` — шаг (по умолчанию 1, `0.5` — половинки), `v-model:value`; событие `commit` — одно на действие. Нажатие ставит звезду под указателем целиком, на левой половине при шаге 0,5 — половину; протяжка ведёт оценку; стрелки — шаг, PageUp и PageDown — звезда, Home — «оценки нет», End — наибольшая; в RTL ряд растёт справа. Наведение показывает оценку, которую поставит нажатие (`preview`, событие `change:preview`); касание — не наведение. `readonly` — оценка только для показа: не меняется и не подсвечивает наведение, у поля `aria-readonly`. Как звучит значение («4 из 5») — `aria-valuetext` из нового раздела локали `rating` во всех шести готовых локалях, числа — по тегу локали; своя полная локаль (`TLocale`) дописывает строку `rating.value` с местами `{value}` и `{max}` или собирается поверх готовой через `extendLocale`. Значок — новая роль иконки `star` (`@soxa-ui/icons-material`, Material Symbols «Star»), слот `icon` со scope `{ value, filled }` рисуется и в пустом, и в залитом слое звезды. Плагины `TRatingHoverPlugin` и `TRatingNamesPlugin`; нажатие и клавиши ведут плагины Slider: `TRating` реализует контракт `ISlidable`. Тема oren рисует звёзды (`.so-rating`, `__track`, `__star`, `__star-fill`): залитая часть — доля `--so-rating-fraction`, цвет без варианта — `caution`.
- 260b56e: Table: курсор жеста на всей таблице — по признакам корня `data-resizing` и `data-dragging`. Пока тянут ручку ширины или переносят колонку, тема oren ставила курсор и запрет выделения текста условием `:has()` по заголовкам у корня. Теперь эти признаки `table` ставит расширение колонок, и только на время жеста: `data-resizing` — пока тянут ручку хоть у одной показанной колонки, с нажатия, а не с первого сдвига; `data-dragging` — на весь жест перестановки при любом `reorderPreview`, вместе с приземлением. На покое их нет вовсе. У колонки (`TTableColumn`) — `resizing`, идёт ли жест ручки, и событие его смены `change:resizing`; метка заголовка `data-resizing` прежняя.
- 4e9df2a: Панель Select задаёт себе цвет текста темы, как панель Popover. Раньше она брала цвет текста страницы, и всё, что лежит в панели помимо опций, — в первую очередь слот `empty` — выходило не цвета темы: на странице без своего цвета текста чёрным в светлой схеме и белым в тёмной, а на странице со своим — её цветом, даже если на панели его почти не видно. Цвет опций прежний.
- 0ddf8ec: Индикатор в кнопке — Spinner, ProgressSpinner и ProgressLinear без варианта — красится цветом текста кнопки: дуга и заливка доли — сам цвет, дорожка — его вуаль. Раньше он брал свой `accent` и в залитой кнопке почти пропадал: у `accent` его дуга была почти того же цвета, что кнопка, а на заливке другого варианта спорила с ней цветом. Правило одно на все виды кнопки. Заданный индикатору вариант кнопка не перекрывает, в том числе `accent`.
- b1fad65: Table: колонки переставляются пользователем — перетаскиванием заголовка колонки `reorderable` и Ctrl+Shift+←/→ на нём. Тащится только заголовок, колонка встаёт на место одной перестановкой на отпускании; таблица отдаёт `column:move` с колонкой и новым порядком полей
- cc064d1: Table: заголовок колонки с кнопкой сортировки или ручкой ширины подсвечивается под указателем во всю ячейку, кнопка сортировки — во всю ячейку со стрелкой сразу за подписью, полоса ручки — над кнопкой, линия ручки — 3 px посередине высоты заголовка, длиной в его высоту без десятой части сверху и снизу; строка шапки на 2 px ниже строки тела, верхние углы заголовка скруглены вполовину кнопки; полоса ручки — 14 px, линия под наведением появляется с задержкой и не моргает, когда указатель проходит мимо
- f862d5b: CheckBox: вид filled больше не красит неотмеченную коробку — её рисует вид по умолчанию, как у outlined. Светлая заливка совпадала со ступенью выключенной коробки, и неотмеченный filled выглядел задисейбленным.
- ed5693d: В режиме принудительных цветов (высокий контраст Windows) выбор у кнопок больше не пропадает: «нажато» у кнопки, открывшей панель (триггер Popover, заголовок Calendar, кнопка DatePicker), выбранная опция Select, выбранный тег и строка ListBox — с отметкой тоже — красятся системной подсветкой: фон `Highlight`, текст `HighlightText`, у вида `outlined` и рамка. Раньше браузер заменял фон выбора цветом страницы. У вида `none` подсветки нет — фона выбора у него нет и в обычном режиме. Вне этого режима вид прежний.
- a3e4599: Тема oren больше не выпускает в `dist/index.css` глобальные утилиты, которые сканер Tailwind находил в текстах пакета — типах, документации и тестах: `.relative`, `.block`, `.inline`, `.rounded`, `.border-s`, `.border-e`, `.bg-neutral-400`, `.bg-rose-500`, `.bg-so-component-surface`, `.bg-so-neutral-100`, `.bg-white`, `.text-white`, `.shadow-sm/md`, `.ring`, `.outline`, `.outline-none`. Такой класс в разметке приложения получал стили темы. Поиск классов Tailwind в теме выключен, стили компонентов не изменились.
- 3167426: Calendar: концы выбора не мигают в закрывающейся панели
- 52ca663: Иконка в слоте по умолчанию у Button стоит по центру кнопки, а не у её начала: так прижимался к краю крестик Popover. Строки ListBox и Select держат содержимое у начала строки, заголовок Accordion — тоже, и в RTL он теперь у правого края.
- 63eb51e: Иконка вне кнопки рисуется цветом текста места, а не чёрным: `fill: currentColor` теперь у базы иконки, а не только у иконок в кнопке. Стрелка Select была чёрной в обеих схемах и в тёмной едва виднелась на поле рядом со светлой кнопкой очистки; так же — одиночная иконка вне кнопки. Цвет такой иконке задаёт `color` места или `fill` самой иконки: `fill`, заданный предку, до неё больше не доходит.
- 533781a: Tabs: табы в панели других табов больше не перенимают их оформление. Вид, вариант, ориентацию, край и выравнивание тема рисует от корня своего набора — у его списка, его табов и его панели, — поэтому вложенные табы выглядят так же, как вне других: горизонтальные под вертикальными не выстраиваются столбиком, `contained` и `outline` под `line` не получают линию под списком, `line` под `outline` — рамки вкладок, а цвета берутся от своего варианта. Вид невложенных табов прежний. Правила опираются на разметку набора: табы — прямые дети списка, панели — прямые дети корня; таб или панель, обёрнутые в свой элемент внутри набора, его оформление не получают.
- 6fe38c8: Tabs: кнопка закрытия таба стоит рядом со строкой таба, а не внутри неё. Строка — это `<button role="tab">`, и вложенная кнопка скринридеру кнопкой не была, а её подпись он читал в названии вкладки: «Настройки Close Настройки». Теперь в `.so-tabs-item` два соседа — строка и `.so-tabs-item__close`; кнопка сама получает размер и выключенность таба. В теме oren наведение, кольцо фокуса и карточка активного таба `contained` — на обёртке, кнопка закрытия стоит вплотную за строкой, без зазора.
- 0b89a16: Drawer: плавный въезд и выезд, подложка темнеет вместе с панелью, при любых настройках движения в системе
- 56f79a4: Select: область нажатия стрелки — квадрат в строку слота поля, как кнопка очистки рядом, и растёт вместе с полем. Раньше областью был сам значок, и на крупных размерах в него было трудно попасть, а в `editable` панель открывает только стрелка: на `2xl` область была 23 px в поле высотой 44 px, теперь 36 px. Значок стрелки на каждом размере — того же размера, что значок очистки; на `sm` он стал меньше, 12 px вместо 14.
- 2788652: Пакеты открыты к публикации: сняты private, добавлены publishConfig, files, README и LICENSE. Фреймворк адаптера стал peer-зависимостью, тема и иконки — devDependency: приложение выбирает их само, и второй копии Vue, React или Angular в нём больше не появится. Соседи по скоупу объявлены диапазоном ^0.1.0 вместо "любая версия".
- cab24c8: Table: сумма ширин колонок — по признаку корня `data-sized`. Ширину таблицы в сумму колонок, когда ширина известна у каждой показанной колонки, тема oren ставила условием `:has()` по заголовкам у корня, а такое условие браузер проверяет обходом всего тела на каждом пересчёте стиля корня (~2,3 мс у таблицы на 5000 строк по 20 колонок). Теперь признак `data-sized` у `table` пишет расширение колонок вместе с `data-overflow`: есть, когда показанные колонки есть и у каждой известна ширина — своя или раскладки; в `none` — и до замера места. Тема берёт его вместо условия у корня.
- 4ef1fc1: Панели Popover и Select больше не сливаются со страницей в режиме принудительных цветов (высокий контраст Windows): браузер там убирает кольцо кромки вместе с тенью, и кромку теперь держит прозрачный контур, который он в этом режиме рисует системным цветом — тот же приём, что у панели Tooltip. В обычном режиме вид прежний, раскладка не меняется.
- 84ab767: DateInput: точность времени `timePrecision` — `minute` (по умолчанию, значение `YYYY-MM-DDTHH:mm`) или `second`: у поля даты и времени за минутой появляется секунда, значение — `YYYY-MM-DDTHH:mm:ss`. Секунду набирают цифрами, ↑/↓ ведут её по кругу, вставка принимает ISO и текст поля с секундами. Значение другой точности поле принимает: время до минуты оставляет секунду пустой, а секунда значения до секунды у поля до минуты скрыта в частях и вернётся со сменой точности; `min` и `max` сравниваются с точностью грубейшего. У поля даты точность ничего не меняет. Тема oren держит минимальную ширину ряда и у поля с секундами.
- e182825: Calendar: подпись колонки дня недели — короткое имя («пн», «Mon», «lun.», «周一»), если у всех семи коротких имён локали не больше трёх букв, иначе узкое у всех семи (`ar`, `ml`, `ta`, `te`, `th`). Одна буква была неоднозначной там, где короткое имя помещается: у `ru` понедельник и пятница — «П», вторник и воскресенье — «В». Форма одна на всю неделю, решает её ядро по локали. Ломающее: у `TCalendarWeekday` (выход `weekdays` календаря) подпись колонки — поле `label` (было `narrow`, до него — `short`); своя разметка шапки читает `weekday.label`.
- ba96868: Toasts: в стопке новый тост въезжает от края окна на свою высоту, а прежний передний тем же временем и той же кривой (400 мс) уменьшается и отходит на ступень и больше не схлопывается по высоте, пока новый въезжает. Въезжает только тост, который встаёт впереди: переставленный колесом назад проявляется на своём месте, выведенный вперёд въезжает, как новый. Без движения новый тост, как и раньше, только проявляется.
- 024c427: Выключенная дорожка Switch берёт цвет от того, что реально под ней, а не ступенью от страницы: в тёмной схеме она больше не совпадает с панелью Select и Popover, где от переключателя оставалась одна ручка.
- 090daba: Table: закреплённая шапка — проп `stickyHead` (по умолчанию выключен): шапка стоит у верхнего края прокрутки — контейнера или страницы, — а строки уходят под неё. Ядро отдаёт его теме `data-sticky-head`. Тема oren закрепляет шапку целиком, красит её поверхностью места — новый токен `--so-place-surface`: панели темы объявляют его сами, а карточку своего цвета объявляет приложение рядом с её фоном, — рисует линию под шапкой и держит фокус в теле ниже шапки; высоту шапки для этого пишет плагин темы `TTableHeadPlugin`, его ставит `useTheme(oren)`. Сдвиг шапки под закреплённую полосу приложения — `--so-table-head-offset` у таблицы или её обёртки.
- a56d573: Полоса жеста «смахнуть, чтобы закрыть» у Drawer и Popover стала тоньше: зона захвата — 24px вместо 44px, минимум цели указателя по WCAG 2.5.8. Содержимое панели с полосой стоит ближе к её краю.
- c3032e2: Table: режим окна (virtual) — тело рисует только видимые строки, остальные заменяют распорки той же высоты. Расширение virtual коллекции строк, плагин замера TTableVirtualPlugin, aria-rowcount и aria-rowindex по APG. Реестр bundles отпускает запись элемента из данных при размонтировании
- cd197a5: ProgressSpinner: новый компонент (Vue) — индикатор выполнения кольцом, роль `progressbar`. Модель та же, что у ProgressLinear: `value` — сколько готово на шкале от `min` до `max` (по умолчанию 0 на шкале 0–100), `indeterminate` — доля неизвестна: кольцо бежит, `aria-valuenow` у него нет, а `value` хранится и возвращается, когда флаг снимают. Имя — `aria_label` или `aria_labelledBy`, текста и слотов у кольца нет. Размер и цвет — `size` и `variant`; оси и пропа толщины нет. Общая модель линии и кольца поднята в базу ядра `TProgress` с дескриптором `ProgressDescriptor`: `TProgressLinear` теперь её наследник, API линии прежний. Тема oren рисует кольцо SVG (`.so-progress-spinner`, `__ring`, `__track`, `__range`, `__runner`): диаметр — по шкале Spinner, доля — дуга от двенадцати часов по часовой (переменная `--so-progress-spinner-fraction`, число от 0 до 1), плавно едет к новому значению, а пока кольцо бежит, по дорожке крутится четверть кольца; в RTL кольцо не зеркалится. При `prefers-reduced-motion` доля встаёт сразу, а бег тот же. В режиме принудительных цветов штрихи — системными цветами. Без варианта кольцо `accent`, как Spinner и линия.
- e6213d6: Table: перестановка колонки стала живой. С движением соседи взятого заголовка расступаются на его ширину, а отпущенный заголовок доезжает до места — и только тогда колонка переставляется, одной перестановкой и одним `column:move`: около 200 мс после отпускания с движением и кадром позже без него. Линия места вставки осталась только без движения. Новый проп таблицы `reorderPreview`: `none` — за жестом идёт только взятый заголовок, соседи стоят, место показывает линия, и колонка встаёт на отпускании, как раньше (у взятого — `data-still`); `head` (по умолчанию) — за жестом идёт шапка, а тело стоит; `column` — и ячейки нарисованных строк, для таблиц в окне `Virtual`. Проп читает расширение колонок: в `column` оно ставит корню признак `data-reorder-preview` только на время жеста, и на покое таблица за режим не платит. У расширения `columns` — команда `dragDrop()` и метки колонок `data-shift` и `data-landing`; плагин перестановки пишет корню ширину взятого заголовка (`--so-table-column-shift`) и считает место по коробкам заголовков на старте жеста, поэтому сдвинутые соседи и прокрутка посреди жеста место не сбивают.
- 76dda62: В режиме принудительных цветов (высокий контраст Windows) видно строку под клавиатурной подсветкой: строка ListBox и опция Select под стрелками — и плитка панели выбора месяца в Calendar — обводятся изнутри сплошным контуром `Highlight`, а выбранная под подсветкой — контуром `HighlightText` на системной подсветке, так что видно и выбор, и подсветку. Раньше браузер заменял фон подсветки цветом страницы, и строку под стрелкой ничем не было видно. У вида `none` контура нет. Вне этого режима вид прежний.
- 01b6fbc: Popover: панель проявляется и гаснет переходом темы, как окно Dialog, — по `data-open` в наборе панели (`panelDataset`). Панель со своей стороной ещё и движется, как Drawer: в контейнере въезжает от своего края и уезжает к нему, со смахиванием у триггера уезжает от него, — и смахнутая панель уходит дальше от места, где её отпустили, а не исчезает разом. Закрытая жестом панель сохраняет сдвиг до следующего показа, и тема сама решает, увозить её к стороне или гасить на месте.
  
  Popover: новый проп `edge` — край контейнера (`top`, `bottom` по умолчанию, `start`, `end`), к которому прижата панель внутри него (`contained`). Он же задаёт, куда панель смахивают (к этому краю), и где полоса жеста (у противоположного края). Раньше панель в контейнере накрывала его целиком и смахивалась только вниз.
  
  Calendar: панель выбора месяца и года выезжает сверху и при закрытии гаснет на месте вместе с подложкой, без вспышки — карточка от верхнего края календаря во всю его ширину, высотой по содержимому, под ней подложка. Панель закрывается нажатием по подложке и жестом вверх за полосу у низа карточки, фокус возвращается на заголовок месяца. Подписи плиток месяцев переносятся только между словами. В режиме принудительных цветов видны выбранная строка ListBox без отметки и штрих полосы жеста у Drawer и Popover.
- ba7d8e5: Ряд тегов в режиме `scroll` больше не срезает кольцо фокуса сверху и снизу: у самостоятельного Tags с выбором пропадали верх и низ кольца пилюли, у крестика в поле Select (`tags_overflow: 'scroll'`) оставались одни боковые дуги. Запас под кольцо ряд держит паддингом, а прежнее место тегам возвращает отрицательным полем: теги не сдвинулись, поле Select не выросло, самостоятельный ряд стал выше на 4px — место кольца под тегами, над полосой прокрутки.
- 699788a: Из пакета убран пустой файл `dist/theme-oren.js`: стили темы собираются без режима библиотеки Vite, и сборка CSS кладёт в `dist` один `index.css`. Ни одна точка входа на этот файл не вела — `import '@soxa-ui/theme-oren'` и `@soxa-ui/theme-oren/setup` работают как раньше. Из конца `index.css` пропал служебный комментарий сборщика `/*$vite$:1*/`.
- b099a91: Ряд тегов в режиме `scroll` больше не срезает бок кольца фокуса у тегов на краю прокрутки: у первого тега в режиме выбора и у последнего, докрученного до конца ряда. Место под кольцо — внутренний отступ ряда по строке, поэтому в самостоятельном ряду `scroll` теги стоят на 0.25rem дальше от его края. В поле Select (`tags_overflow: 'scroll'`) теги остаются на прежнем месте, вплотную к краю ряда.
- 1d4551c: Table: перестановка колонки в reorderPreview: 'head' на большой таблице без окна стоит столько же, сколько до живой перестановки. Плагин жеста пишет ширину взятого шапке, а не корню (в column — корню), и в обработчике указателя не читает стиль после записи; тема oren поднимает шапку над телом и без закрепления, и заголовок, ставший слоем, не сверяется с полем чекбокса каждой строки. Линия места без движения и в none больше не перекладывает таблицу на каждой смене места.
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
