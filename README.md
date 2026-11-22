<p align="center">
  <img src="brand/banner.png" alt="Soxa UI — One core. Your framework." width="880">
</p>

# Soxa UI

See the [migration guide](docs/migration-to-soxa.md) for the npm scope change.

**UI components with the logic written once: a framework-agnostic core and thin adapters that
render it in Vue, React, Angular, Svelte, Solid and Web Components.**

[![CI](https://github.com/youra-h/soxa-ui/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/youra-h/soxa-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@soxa-ui/core?label=npm)](https://www.npmjs.com/org/soxa-ui)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Status:** Stable `0.4.2` is the current release under npm `latest`.
> Alert, AlertDialog, Avatar and Separator are included across all six adapters.
> Every released component in [the component table](#components) is available in all six adapters:
> Vue, React, Angular, Svelte, Solid and Web Components. The public API has been frozen since the first beta;
> breaking changes require an explicit owner decision and migration guidance.
> Components, themes and icon packs have independent releases; compatible fixes use patch versions.

## What it is

The behavior of a Soxa UI component lives in a headless core with no framework in it: component
models in plain TypeScript that own their state, events, collections and ARIA. Behavior that needs
the DOM — focus, keyboard, overlay — comes as plugins, and the component contract (props, events,
slots) is declared once, in a descriptor. Thin adapters for Vue, React, Angular, Svelte, Solid and
Web Components connect that model to a framework and render the markup: BEM classes `so-*` and
`data-*` state attributes. The look comes from a theme, shipped as a separate package.

## Why Soxa UI

- **Logic is written once.** Behavior lives in the core, plugins and collection extensions, and an
  adapter only wires it up. Reactivity and lifecycle hooks stay in the adapter layer of each
  package; ESLint rules and tests keep them out of components.
- **One contract for every framework.** Props, events and slots are declared in the descriptor, and
  every adapter derives its API from it. Names match across frameworks; only the spelling follows
  each one's conventions: `@change:text` in Vue, `onChangeText` in React.
- **Two equal ways to drive a component.** Configure it in the template, or create a core instance,
  pass it as `ctrl` and work with it from code: both sides see the same state and events. Plugins
  are reachable from the instance too, through the `bundle:create` event.
- **Collections are an engine, not an array.** Tabs, Accordion, ListBox, Select, Tags and
  RadioGroup run on the same engine with pluggable extensions: selection, activation, order,
  filtering. Every insert, update, remove, move and clear first emits a cancellable `*:before`
  event, and items come from the `items` prop or from markup. Calendar is a collection too: its
  days are items, built from the months on screen. A Table is two: rows and columns.
- **Accessibility from the WAI-ARIA Authoring Practices.** Tabs, Tags, Accordion, Select, Switch,
  RadioGroup, Slider, Rating, NumberInput, Popover, Tooltip, Dialog, AlertDialog, Drawer, Calendar, DatePicker
  and Table take roles and relations from their APG patterns, and ProgressLinear and
  ProgressSpinner use the `progressbar` role. Select implements the Combobox keyboard model, and
  Tabs the Tabs one: arrow keys and Home/End with automatic activation, and a single Tab stop. ARIA
  is computed outside the framework and rendered with the markup, so it is in place from the first
  render.
- **Themes and icon packs are pluggable contracts.** A theme styles `so-*` classes and `data-*`
  attributes, never `aria-*`, so an accessibility fix does not break the look. An icon pack is
  plain data for a fixed set of roles, with no bundler-specific imports.
- **Rules are enforced, not just written down.** TypeScript runs in `strict` mode with no escape
  hatches: `as any`, `as unknown as X`, non-null `!` and `@ts-ignore` fail CI. Key architectural
  rules have guard tests, and the playground layout is checked in real Chromium, not in jsdom.

## Installation

Install the adapter for your framework, `@soxa-ui/setup`, a theme and an icon pack. The adapter
depends on the core packages (`@soxa-ui/core`, `@soxa-ui/plugins`, `@soxa-ui/setup`), but packages
you import directly must also be direct dependencies of your application. The entry point below
imports `useIcons` and `useTheme` from `@soxa-ui/setup`, so install it explicitly.

| Framework      | Install                                       | Requires                    |
| -------------- | --------------------------------------------- | --------------------------- |
| Vue            | `npm install @soxa-ui/vue @soxa-ui/setup`     | Vue `^3.5.21`               |
| React          | `npm install @soxa-ui/react @soxa-ui/setup`   | React / React DOM `^19.3.0` |
| Angular        | `npm install @soxa-ui/angular @soxa-ui/setup` | Angular `^22.2.0`           |
| Svelte         | `npm install @soxa-ui/svelte @soxa-ui/setup`  | Svelte `^5.55.10`           |
| Solid          | `npm install @soxa-ui/solid @soxa-ui/setup`   | Solid `^1.9.13`             |
| Web Components | `npm install @soxa-ui/webc @soxa-ui/setup`    | —                           |

The theme and the icon pack are the same for every adapter.

**Themes**

| Package               | What it does                                                                                                                                                                                        | Install                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `@soxa-ui/theme-base` | The shared layer of every theme: a reset of the library's own nodes, the structure and layout of the components, the layout plugins. No look of its own. Install it directly only to write a theme. | comes with a theme                |
| `@soxa-ui/theme-oren` | Styles the components on top of the shared layer: colors, light and dark schemes, borders, focus ring, states, motion.                                                                              | `npm install @soxa-ui/theme-oren` |

**Icons** — one pack is enough; each draws the same icon roles.

| Package                   | Icons                                                        | License                       | Install                               |
| ------------------------- | ------------------------------------------------------------ | ----------------------------- | ------------------------------------- |
| `@soxa-ui/icons-material` | [Material Symbols](https://fonts.google.com/icons) by Google | package MIT, icons Apache-2.0 | `npm install @soxa-ui/icons-material` |
| `@soxa-ui/icons-lucide`   | [Lucide](https://lucide.dev)                                 | package MIT, icons ISC        | `npm install @soxa-ui/icons-lucide`   |

The adapter and the core packages it brings share one version; keep your direct `@soxa-ui/setup`
dependency on that same version. A theme and an icon pack have versions of their own and declare
the range of library versions they work with, which npm checks on install. Then plug in the theme
and the icons at the application entry point, as shown below.

Components are available at `0.4.2`; both supplied themes remain at `0.4.1`. Both icon packs are at `0.3.1`, with
their existing icons and compatibility with the stable component release. npm checks each pack's declared library compatibility when installing it.

## Compatibility and support

**`0.3.0` is the first stable release.** The public API has been frozen since the first beta;
`0.x` does not mean that an update may silently break an application or a custom theme.

### Versions and the public contract

Compatible fixes and additions use a **patch** release (`0.3.0` to `0.3.1`). An incompatible
change uses a **minor** release (`0.3.x` to `0.4.0`) and requires a separate maintainer decision
for that change. Its changelog must explain what breaks and how to update. Raising a minimum
supported framework version or dropping a supported browser is also an incompatible change.
These rules apply to releases starting at `0.3.0`.

The public contract includes:

- exports and types from the package's supported entry points, including the programmatic core API;
- component props, events, slots and their documented behavior and defaults;
- theme-facing `so-*` classes, `data-*` attributes and `--so-*` CSS custom properties, including
  their meaning and the parts they describe.

Removing or renaming one of these, narrowing accepted values or changing its meaning is a
breaking change. For example, a custom theme using `.so-button` must not lose its styling in a
patch update. Changing private implementation details is compatible only while the public
contract and behavior remain intact. Files outside supported package entry points are internal;
deep imports into source files are not supported. Internal markup is not a separate customization
API, but changing it must still preserve public parts, styling hooks and behavior.

Core, setup, plugins and adapters share one version: keep directly installed packages from that
group on the same version. Themes and icon packs have independent versions; their declared
library dependency ranges specify compatibility. Check the changelog of each package you update.

### Deprecation and migration

Start with the [version-specific upgrade instructions](docs/upgrade/README.md) before updating.

A deprecation notice names the replacement, shows how to migrate and states the release planned
for removal in the documentation and changelog; applicable TypeScript APIs also use `@deprecated`.
For example, a notice about a renamed prop must show both the old and the replacement usage.
Deprecation by itself does not remove an API.

There is no automatic compatibility alias or mandatory number of transitional releases. The
maintainer decides whether a transition is needed, and its duration, with each breaking change.
Removal follows the minor-release rule above and includes migration instructions. No calendar-based
LTS or maintenance period for older release lines is promised.

### Supported environments

The framework ranges in the installation table are the adapter's `peerDependencies`, not an
open-ended promise about future major framework versions. React requires matching React and React
DOM ranges; Angular requires the listed range for `common`, `core`, `forms` and `platform-browser`.
CI checks the lower bounds in its minimum-version jobs, and installation tests exercise built
packages in clean framework projects.

The browser target is current evergreen Chrome, Edge, Firefox and Safari, including mobile
browsers. Automated layout and interaction tests run in Playwright Chromium and WebKit, with
mobile viewport and touch scenarios where the engine supports them. Firefox is not part of the
automated browser matrix. Engine-specific skips remain, and WebKit emulation is not a test on a
physical iPhone or a guarantee for every historical Safari version. See the
[accessibility coverage and limitations](ACCESSIBILITY.md#supported-environments).

Oren requires modern CSS, including `color-mix()` and `oklch()`. Individual CSS feature thresholds
are not minimum browser versions verified for the whole library; older browsers are not covered
by the current-browser policy. A custom theme does not by itself extend runtime browser support.
The Web Components adapter includes the customized built-in elements polyfill needed by Safari;
see its [runtime notes](packages/ui/webc/README.md).

## What it looks like

The examples use Vue and are based on the adapter tests and the playground.

Compound components name their parts with a dot:

```vue
<script setup lang="ts">
import { Accordion } from '@soxa-ui/vue'
</script>

<template>
  <Accordion mode="multiple">
    <Accordion.Item text="First" value="a" :selected="true">
      <p>Content A</p>
    </Accordion.Item>
    <Accordion.Item text="Second" value="b">
      <p>Content B</p>
    </Accordion.Item>
  </Accordion>
</template>
```

The same component can be driven from code — pass a core instance as `ctrl`:

```vue
<script setup lang="ts">
import { TButton } from '@soxa-ui/core'
import { TActionPlugin, TPluginBundle } from '@soxa-ui/plugins'
import { Button } from '@soxa-ui/vue'

const btn = new TButton({ text: 'Save', variant: 'accent' })

// Plugins are reachable from the instance, without the template
btn.events.on('bundle:create', (bundle: unknown) => {
  if (bundle instanceof TPluginBundle) {
    bundle.get(TActionPlugin)?.events.on('press', () => {
      btn.disabled = true // the rendered button updates
    })
  }
})
</script>

<template>
  <Button :ctrl="btn" />
</template>
```

The application plugs in a theme and an icon pack. The theme comes in two parts: the stylesheet and
its behavior (`./setup`) — the plugins whose values its CSS reads, such as the bar under the active
tab:

```ts
import { createApp } from 'vue'
import { useIcons, useTheme } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'
import App from './App.vue'

import '@soxa-ui/theme-oren'
import oren from '@soxa-ui/theme-oren/setup'

useIcons(material)
useTheme(oren)

createApp(App).mount('#app')
```

Angular CLI and Nuxt plug the stylesheet in their own way instead — `@import` in `src/styles.css`
and `css` in `nuxt.config.ts`; where it goes in each build is in
[packages/themes/oren/README.md](packages/themes/oren/README.md#usage). The values of the theme reach
the types with `./setup` either way.

The dark scheme is switched on with `<html data-so-theme="oren-dark">`.

Motion — panels sliding in, thumbs travelling, indicators running — follows the system's
reduced-motion setting by default. An application that wants motion regardless, or never, sets one
mode for the whole library at its entry point: `useMotion('full')` or `useMotion('reduce')` from
`@soxa-ui/plugins`.

Language and the strings the library draws itself — names of buttons without text (close, scroll,
clear) and of fields nothing else names — come as one value, a locale, from the nearest
`LocaleProvider` up the tree. The tag goes to Intl (date labels, first day of the week, the date
field format, table sorting), the strings are plain data with a `{name}` slot where a part's name
goes. Change the provider's locale and components pick it up without remounting; a nested provider
gives its subtree another language, and the server renders parallel requests each in its own:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { LocaleProvider } from '@soxa-ui/vue'
import { ruRU, zhCN } from '@soxa-ui/plugins'

const current = ref(ruRU) // current.value = zhCN switches on the fly
</script>

<template>
  <LocaleProvider :locale="current">
    <RouterView />
  </LocaleProvider>
</template>
```

Ready locales cover the six official UN languages (`enUS`, `ruRU`, `zhCN`, `frFR`, `esES`,
`arEG`). Any other is an object of type `TLocale` the application writes itself, or one built over
a ready locale: `extendLocale(enUS, { tag: 'mn-MN', translations: { modal: { close: 'Хаах' } } })`.

## Components

The component set, as the playground shows it. **Frameworks** says which adapters already have the
component: `*` — all six, a list — only those, `-` — none yet. **Release** is the first stable
release that includes the component in at least one adapter. `0.3.0` is the first stable release;
`next` — already in `main`, ships with the next release; `future` — queued for development.

| Component       | What it is                                                                                                    | Frameworks | Release |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ---------- | ------- |
| Button          | Button: text, icons in slots, four views                                                                      | *          | 0.3.0   |
| Input           | Text field with slots for icons and buttons                                                                   | *          | 0.3.0   |
| NumberInput     | Number field in the locale's format: step and bounds, arrow keys, − and + buttons with hold                   | *          | 0.3.0   |
| CheckBox        | Checkbox with a third, indeterminate state                                                                    | *          | 0.3.0   |
| Switch          | Switch: the same value as a checkbox, a different metaphor                                                    | *          | 0.3.0   |
| Label           | Control label: clicking the text toggles the control, and the text is its accessible name                     | *          | 0.3.0   |
| Slider          | Slider: a number or a range, set by dragging, with keys or with a screen reader gesture                       | *          | 0.3.0   |
| Rating          | Rating with stars: set by click, drag or arrow keys, halves, hover preview, read-only display                 | *          | 0.3.0   |
| RadioGroup      | One option out of several: native radio buttons sharing a `name`                                              | *          | 0.3.0   |
| Select          | Select field: an input plus a list in an overlay, the Combobox pattern                                        | *          | 0.3.0   |
| Calendar        | Month grids: pick a single date, several dates or a range                                                     | *          | 0.3.0   |
| DateInput       | Date and time field typed in parts in the locale's format, selected and copied as a whole                     | *          | 0.3.0   |
| DatePicker      | Date field and a calendar in a panel: a single date or a range                                                | *          | 0.3.0   |
| Popover         | Panel at a trigger with any content: a non-modal dialog                                                       | *          | 0.3.0   |
| Tooltip         | Hint for an element, shown on hover and on keyboard focus                                                     | *          | 0.3.0   |
| Dialog          | [Modal or non-modal window](docs/components/dialog.md), centered or at an edge                                | *          | 0.3.0   |
| AlertDialog     | [Modal confirmation](docs/components/alert-dialog.md) with localized default actions and a replaceable footer | *          | 0.4.0   |
| Drawer          | Panel that slides in at an edge of the screen or a container, can be swiped away                              | *          | 0.3.0   |
| Toasts          | Pop-up notifications shown from code: a queue, auto-dismiss with a pause, swipe to close                      | *          | 0.3.0   |
| Scroller        | Single-row strip of any content, paged with two buttons                                                       | *          | 0.3.0   |
| ListBox         | List with single or multiple selection                                                                        | *          | 0.3.0   |
| Table           | Table: columns as data, sorting by column headers, row selection with checkboxes                              | *          | 0.3.0   |
| Tabs            | Tabs: a tab list and panels linked by value                                                                   | *          | 0.3.0   |
| Tags            | Tag set: close buttons, optional selection                                                                    | *          | 0.3.0   |
| Accordion       | Sections that expand one at a time or several at once                                                         | *          | 0.3.0   |
| CodeBlock       | Read-only source with syntax highlighting, file tabs, line numbers and customizable copying                   | *          | 0.3.0   |
| Icon            | Icon from the registered pack, by role                                                                        | *          | 0.3.0   |
| ProgressLinear  | Linear progress indicator: the share done, or an indeterminate animation while it is unknown                  | *          | 0.3.0   |
| ProgressSpinner | Circular progress indicator: the share done, or an indeterminate animation while it is unknown                | *          | 0.3.0   |
| Skeleton        | Placeholder while content loads                                                                               | *          | 0.3.0   |
| DragAndDrop     | Drag and drop of collection items                                                                             | *          | 0.3.0   |
| Virtual         | Window for long lists: ListBox and Table inside render only the visible items                                 | *          | 0.3.0   |
| Pagination      | Page navigation: page numbers with gaps, previous and next, first and last                                    | *          | 0.3.0   |
| Menu            | Action menu at a button or on right click: submenus, checkbox and radio items                                 | *          | 0.3.0   |
| Textarea        | Multi-line text field that grows with its content                                                             | *          | 0.3.0   |
| Field           | Field wrapper: description, error message and invalid state linked to the control                             | *          | 0.3.0   |
| Alert           | Inline message with composable content, optional actions and localized dismissal                              | *          | 0.4.0   |
| Badge           | Counter or status mark, on its own or over another element                                                    | *          | 0.3.0   |
| Avatar          | [User picture with initials or a custom fallback, plus overlapping groups](docs/api/avatar.md)                | *          | 0.4.0   |
| Breadcrumbs     | Path to the current page, collapsing a long trail                                                             | *          | 0.3.0   |
| Separator       | [Horizontal and vertical semantic or decorative boundary](docs/api/separator.md)                              | *          | 0.4.0   |
| ToggleButton    | Button with a persistent pressed state                                                                        | *          | 0.3.0   |
| ToggleGroup     | Toggle buttons with single or multiple selection                                                              | *          | 0.3.0   |
| Tree            | Hierarchy with expandable branches, selection and keyboard navigation by level                                | -          | future  |
| Stepper         | Steps of a multi-step form: done, current, with an error; linear or free order                                | -          | future  |
| FileUpload      | File picker and drop zone with type, size and count limits                                                    | -          | future  |
| Splitter        | Panels with a draggable border: size limits, keyboard, collapsing                                             | -          | future  |

A new component comes to Vue first and moves to the other adapters after that.

## Repository structure

```
packages/
  core/             headless component models: components, collection engine, facades, extensions
  setup/            code shared by adapters, in two layers:
    protected/      mechanics: define, naming, registry, adapter context and exchange
    content/        what fills the library up: descriptors, adapter extensions, icon roles
  plugins/          runtime behavior installed into TPluginBundle: DOM, focus, keyboard, overlay
  ui/
    vue/            Vue adapter
    react/          React adapter
    angular/        Angular adapter
    svelte/         Svelte adapter
    solid/          Solid adapter
    webc/           Web Components adapter: Custom Elements
  themes/base/      shared layer of themes: reset, structure of the parts, layout plugins, checks
  themes/oren/      oren theme: CSS for the BEM classes and data-*, light and dark schemes
  icons/material/   Material icons implementing the ICON_ROLES contract
  icons/lucide/     Lucide icons implementing the ICON_ROLES contract
  playground/
    shared/         framework-free playground data: component registry, prop descriptions, enums
    vue/            Vue playground app
tools/
  eslint/           local ESLint rule (soxa/no-explicit-any) and tests for the lint blocks
  vite/             shared Vite library build config for the packages
  published-imports/  check that built packages declare every package they import
  install-smoke/    built packages installed into a clean project of every framework, run in Chromium
  agent-flow/       provider-independent ClickUp task workflow
docs/               architecture overview
```

## Development

Node `^22.12.0 || ^24 || >=26`, npm workspaces.

```bash
npm install
npm run dev         # playground, with the theme rebuilt on change
npm run test:core   # core tests (Vitest)
npm run test:vue    # Vue adapter tests
npm run lint        # ESLint
```

The playground's overview page shows every component. A component page renders each prop twice —
from props and from a core instance passed as `ctrl` — with the code for both. Components are drawn
by the framework picked in the header (Vue, React, Angular, Svelte, Solid, Web Components); the
framework is the first segment of the address, `#/react/button`. The playground's pages, layout and
tests are described in [packages/playground/README.md](packages/playground/README.md). The rest of
the commands are listed in [AGENTS.md → Commands](AGENTS.md#commands).

## Roadmap

The goal is one component set with the same behavior, accessibility and look in all six targets.
On the way there:

- more themes and icon packs on the same contracts.

## Documentation

- [SSR collections](docs/ssr-collections.md) — initial Tabs/Tags data, server HTML and hydration.

- [Component API metadata](docs/api/README.md) - generated props, events, slots and framework bindings for documentation websites.

- [docs/architecture.md](docs/architecture.md) — architecture overview: layers, descriptors,
  plugins, collections, adapters (English and Russian).
- [AGENTS.md](AGENTS.md) — project rules and conventions, mostly in Russian.
- [packages/themes/base/README.md](packages/themes/base/README.md#make-your-own-theme) — how to
  make your own theme on the shared layer, step by step.
- [packages/themes/base/AGENTS.md](packages/themes/base/AGENTS.md) — the shared layer of themes:
  layers, the reset, the direction sign, the layout plugins, the checks every theme passes (in
  Russian).
- [packages/themes/oren/AGENTS.md](packages/themes/oren/AGENTS.md) — the oren theme: scales, color
  schemes, tokens (in Russian).
- [packages/playground/README.md](packages/playground/README.md) — the playground: hosts of the
  frameworks, pages, layout, tests.
- [ACCESSIBILITY.md](ACCESSIBILITY.md) — accessibility commitment, known limitations and how to
  report a barrier.
- [CONTRIBUTING.md](CONTRIBUTING.md) — how to report issues and propose changes.

## License

[MIT](LICENSE)
