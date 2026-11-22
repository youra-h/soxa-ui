# @soxa-ui/icons-lucide

## 0.3.2

### Patch Changes

- Updated dependencies [dd6ea64]
- Updated dependencies [9688944]
- Updated dependencies [1a52ea6]
- Updated dependencies [2598c1b]
- Updated dependencies [5b88716]
  - @soxa-ui/setup@0.5.0

## 0.3.1

### Patch Changes

- Graduate the approved beta packages to stable versions.

## 0.3.1-beta.0

### Patch Changes

- Updated dependencies [5f7f821]
- Updated dependencies [8e68380]
- Updated dependencies [5ba63f4]
- Updated dependencies [f6c476e]
- Updated dependencies [eec067c]
- Updated dependencies [274d746]
  - @soxa-ui/setup@0.4.0-beta.0

## 0.3.0

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- 82d69a5: Add the copy icon for custom actions and CodeBlock.
- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- Updated dependencies [53fb45f]
- Updated dependencies [21e6143]
- Updated dependencies [ab9735f]
- Updated dependencies [a15bae2]
- Updated dependencies [0909342]
- Updated dependencies [ba29be7]
- Updated dependencies [db54848]
- Updated dependencies [1ffabcd]
- Updated dependencies [1bb3ea8]
- Updated dependencies [de65c13]
- Updated dependencies [9c002f7]
- Updated dependencies [7327698]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [1c78107]
- Updated dependencies [ac39aa9]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/setup@0.3.0

## 0.3.0-beta.1

### Minor Changes

- 1c78107: Publish Soxa UI packages under the `@soxa-ui` scope. Replace the previous npm scope in every dependency and import (including theme CSS, theme setup, icons, and TypeScript module augmentations) with `@soxa-ui/<package>`. Keep the core, plugins, setup, and adapters on the same release. Component exports, props, events, and the `so-*`, `data-so-*`, and `--so-*` styling contracts are unchanged. See `docs/migration-to-soxa.md` for the package mapping and upgrade steps.

### Patch Changes

- Updated dependencies [1c78107]
  - @soxa-ui/setup@0.3.0-beta.1

## 0.3.0-beta.0

### Patch Changes

- d1d4764: Versioned on their own: a theme or an icon pack no longer shares the version of the library and depends on it by a range (`^` and a library version) instead of its exact version, so it keeps working with the library releases that do not break its contract. The icon packs take `@soxa-ui/setup` as a peer dependency now.
- Updated dependencies [7327698]
- Updated dependencies [7335dd6]
- Updated dependencies [28bcd83]
- Updated dependencies [e682670]
- Updated dependencies [ac39aa9]
- Updated dependencies [cfffb4b]
- Updated dependencies [0690162]
  - @soxa-ui/setup@0.3.0-beta.0

## 0.3.0-alpha.7

### Patch Changes

- Updated dependencies [26cc7e3]
- Updated dependencies [5d8b7ca]
- Updated dependencies [d278f0f]
- Updated dependencies [1a322fe]
  - @soxa-ui/setup@0.3.0-alpha.7

## 0.3.0-alpha.6

### Patch Changes

- a6a77f8: Every package declares `sideEffects`, so the application's bundler drops the modules a page does not use: a page with one button no longer pulls every component of the core, every plugin and every component of the adapter (React: 184 → 82 KB gzip of JS). The core, plugins, icons and adapters are `false`, the themes keep their stylesheets (`["*.css"]`), and `@soxa-ui/webc` is `true`: importing it defines every element, as before.
- 2dec183: The repository moved to github.com/youra-h/soxa-ui: package repository, homepage and issue links point there
- Updated dependencies [101269c]
- Updated dependencies [a73c5bf]
- Updated dependencies [2dec183]
- Updated dependencies [54f5b1d]
  - @soxa-ui/setup@0.3.0-alpha.6

## 0.3.0-alpha.5

### Patch Changes

- @soxa-ui/setup@0.3.0-alpha.5

## 0.3.0-alpha.4

### Patch Changes

- Updated dependencies [6f96bae]
- Updated dependencies [8eb76c2]
- Updated dependencies [1c703ad]
  - @soxa-ui/setup@0.3.0-alpha.4

## 0.3.0-alpha.3

### Minor Changes

- bb71433: Цвет иконки — лестница приоритетов, одна для обоих пакетов и любого способа рисования: правило темы для места сильнее цвета темы по умолчанию, а тот — цвета, с которым иконка загружена. Пакеты красят рисунок ссылкой на переменную `--so-icon-color` с цветом из SVG запасным значением (атрибутом SVG, а не `style`): без темы иконка Material — `#1f1f1f`, Lucide — цвета текста, а Lucide снова рисует линиями толщиной 1.5, звезда залита. Тема oren задаёт цвет переменной, а не `fill`. Что сломалось: тема больше не заливает `fill: currentColor` свой `<svg>` в слоте кнопки и в коробке значка тоста, а своя иконка роли (`useIcons`) без покраски рисуется умолчанием SVG — чёрной. Чтобы она брала цвет темы, покрасьте её так же: `<g fill="var(--so-icon-color, currentColor)">…</g>` (у иконки линиями — `stroke`).

### Patch Changes

- Updated dependencies [582d3a6]
- Updated dependencies [28470f6]
- Updated dependencies [0471962]
- Updated dependencies [fc30695]
- Updated dependencies [64be9ca]
- Updated dependencies [fcd14b4]
- Updated dependencies [a09886b]
- Updated dependencies [7a86466]
- Updated dependencies [ad1de00]
- Updated dependencies [53a3fe6]
  - @soxa-ui/setup@0.3.0-alpha.3

## 0.3.0-alpha.2

### Patch Changes

- fc19852: Новый пакет иконок @soxa-ui/icons-lucide: роли ICON_ROLES в стиле Lucide (обводка 1.5, переведённая в залитый контур). Подключение — useIcons(lucide) вместо пакета Material.
- @soxa-ui/setup@0.3.0-alpha.2
