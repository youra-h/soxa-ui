# @soxa-ui/theme-base

**The shared layer of Soxa UI themes: what the components need in any theme — a reset of the
library's own nodes, the writing-direction sign, the structure of the components with its numbers
in variables, and the layout plugins that measure what CSS cannot. The CSS is plain CSS, no
preprocessor, no Tailwind.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

## Who needs it

Theme authors — [Make your own theme](#make-your-own-theme) below walks through it. If you use a
ready theme such as [`@soxa-ui/theme-oren`](https://www.npmjs.com/package/@soxa-ui/theme-oren),
you do not install this package yourself: the theme depends on it, its stylesheet carries the CSS
of this package, and its behavior installs the plugins of this package.

## What is inside

- **A reset of the library's nodes.** Box sizing, margins, borders, and the font and color of
  buttons and fields — only for elements with a `so-*` class and the inner nodes of the components.
  The page itself is left alone: no rules for `html`, `body`, headings, lists or your own buttons.
  The components inherit the font and line height of the page.
- **The writing-direction sign** `--so-dir-sign`: `1` left to right and `-1` right to left, taken
  from the nearest `dir` attribute. A theme mirrors arrows, gradients and offsets by multiplying by
  it — `:dir()` does not survive minification, and a `[dir]` selector on an ancestor does not see
  the nearest `dir`.
- **The structure of the components** — layout and mechanics: where a part stands, what catches a
  click, cursors, how a disabled component fades. For every component: Label, Field, Icon, Switch,
  CheckBox, RadioGroup, Button, Input, Textarea, NumberInput, Tabs, Tags, Accordion, ListBox, Menu,
  Select, Popover, Tooltip, Dialog, Drawer, Scroller, Slider, Rating, ProgressLinear,
  ProgressSpinner, Skeleton, Pagination, Calendar, DateInput, DatePicker, Toasts, DragAndDrop and
  Table. Without a theme they are bare but working: a switch toggles by a click on its track, a
  label toggles its control, the slots of a button and of a field stay at its edges, a bar of tabs
  stands on its side of the panel with its slots at its edges and the tabs aligned between them, a
  row of tags scrolls, a collapsed accordion section takes no
  room, a closed panel lets clicks through, the body of a dialog scrolls under a header and a footer
  that stay in place, a drawer stands at its edge, the thumbs of a slider sit at the ends of the
  travel and a click sets the value under the pointer, a click on a star sets its number, a scroller
  pages to the start of an item, the cells of a pagination are as tall as a button, a calendar lays
  its days out in seven columns, a date picker opens its panel at the field, toasts stand in their
  corner of the window, stacked behind the front one when they cascade, and a table with known
  column widths is as wide as their sum, scrolls sideways in its window when wider than its place,
  and keeps a sticky head at the top of the scroll with the rows passing under it unseen.
- **The size scales** — heights, paddings, gaps and font sizes per size — as variables on the
  document root with defaults, such as `--so-button-height-sm` or `--so-caption-gap-lg`. A theme
  sets its own numbers there, an application on an ancestor of its area.
- **The layout plugins** (`@soxa-ui/theme-base/setup`) — data any theme needs and CSS cannot
  compute: the place of the active tab, the height of a sticky table head and of the front toast in
  a stack. They write it into CSS variables; a theme installs them with its behavior.

It has no look: no colors, borders, radii, shadows, no names of a theme's variants or views — those
are the theme's. Where the layout counts on a number of the look — the border width of a field, the
width of the fade at the edge of a scrolling row of tags or of a scroller, the thickness of a group
separator, the edge of a slider thumb — the theme sets it in a variable, and without a theme it is
zero. The surface of an overlay panel is the theme's too: the theme paints the panel with
`--so-panel-surface`, and this package announces it as the surface of the place inside the panel.
The surface of the page is announced by the theme and that of a card by the application, in
`--so-place-surface`: the sticky head of a table takes it as its opaque underlay. Every variable a
theme may set or read is listed with its meaning in `theme-variables.json`: those this package
reads — the ones a theme sets, and those the library and the layout plugins write, such as the size
of a dialog or the height of a sticky table head — and those a theme may only read, such as the
current height of a field or the place of the active tab.

The gestures work without a theme too: while a panel, a drawer or a toast is being swiped, or a
table column is being dragged by its header, this package keeps it under the pointer. The theme
only animates what comes after: the return when it is let go, the leave when it is swiped away.

## Make your own theme

A theme is a package with three entry points: its stylesheet, the type declarations of the values
its design offers, and its behavior. The structure comes from this package; the theme adds the look
on top of it and never styles the page. The steps go in the order to follow, and each says what
proves it is done.

### 1. The package

The library — `@soxa-ui/core`, `@soxa-ui/setup` and the rest — shares one version, and this
package has a version of its own. A theme depends on the library by a range, `^` and the library
version it is built against: the `so-*` classes, the `data-*` attributes and the `--so-*`
variables are what a theme is written against, and a release that breaks them falls outside that
range: before `1.0` a breaking change bumps the minor version (`0.3.1` → `0.4.0`). On this package a
theme depends by its exact version, with no `^`: its CSS goes into the theme's stylesheet and its
plugins run with the theme's behavior, so both have to come from one release. And it is a
dependency, not a dev dependency: the behavior of the theme imports its plugins at run time.

```json
{
  "name": "my-theme",
  "type": "module",
  "style": "./dist/index.css",
  "types": "./index.d.ts",
  "exports": {
    ".": { "types": "./index.d.ts", "default": "./dist/index.css" },
    "./setup": { "types": "./dist/setup/index.d.ts", "default": "./dist/setup/index.js" }
  },
  "files": ["dist", "index.d.ts"],
  "dependencies": { "@soxa-ui/theme-base": "<theme-base version>" },
  "peerDependencies": {
    "@soxa-ui/core": "^<library version>",
    "@soxa-ui/setup": "^<library version>"
  }
}
```

The application plugs the theme in as one stylesheet and one behavior object:

```ts
import { useTheme } from '@soxa-ui/setup'
import theme from 'my-theme/setup'

import 'my-theme'

useTheme(theme)
```

Where the stylesheet goes depends on the build: an import from a module, as above, with Vite,
Next.js, SvelteKit and SolidStart; `@import 'my-theme';` in `src/styles.css` with Angular CLI; `css`
in `nuxt.config.ts` with Nuxt. The behavior is imported from a module in every build — step 6 has
it bring the values of the theme along.

### 2. The stylesheet: this package first

Import this package first in the theme's stylesheet and build the stylesheet into one file, with
the CSS of this package inside it:

```css
@import '@soxa-ui/theme-base';
```

Its rules live in the cascade layer `so`, each part of it in a sub-layer of its own named after its
file — `so.reset` first, then `so.direction`, `so.button` and the rest — and the first line of the
package declares their order before any rule. A later sub-layer wins over an earlier one whatever
the specificity, so the order holds however the layer is cut into files: a theme that ships a
stylesheet per component cuts its built sheet by these sub-layers, and an application may load the
pieces in any order. Any rule of the theme in a later layer, or outside layers, overrides this
package without fighting specificity. A theme built with Tailwind puts the package into
Tailwind's `base` layer, where preflight used to be, so it stays below the application's
utilities — and imports Tailwind in parts, without preflight, which would reset the whole page:

```css
@layer theme, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/utilities.css' layer(utilities) source(none);
@import '@soxa-ui/theme-base' layer(base);
```

Done when everything that works on a page with this package alone still works with your
stylesheet: your rules add the look and take no mechanics away.

### 3. The variables

[`theme-variables.json`](https://github.com/youra-h/soxa-ui/blob/main/packages/themes/base/theme-variables.json)
is the contract, with the meaning of every variable, in two sections.

`base-reads` — every variable this package reads. Four kinds:

- **Scales and geometry** with a default on `:root`, such as `--so-button-height-sm` or
  `--so-switch-inset`. Set only those where your numbers differ, on `:root`.
- **Numbers of your look the layout counts on** — `--so-input-border` and the other field borders,
  `--so-tags-fade`, `--so-scroller-fade`, `--so-group-separator-width`, `--so-slider-thumb-border`.
  Zero without a theme; set each where you draw that look.
- **Surfaces.** Paint the overlay panels with `--so-panel-surface` and set it on them; set
  `--so-place-surface` on `:root` to the color of your page. Without them a sticky table head has
  no underlay, and the rows show through it.
- **Written by the library and by the layout plugins** — the size of a dialog, the positions of
  slider thumbs, the swipe offset of a panel, the height of a sticky table head. Do not set them;
  read them if your look needs them.

`theme-reads` — what a theme may read on top of that, and never sets:

- **The writing-direction sign** `--so-dir-sign`.
- **The current step of a block** — the scale value of the component's own size, and what is
  derived from it: `--so-input-height`, `--so-slider-thumb-size`, `--so-slider-halo-size`,
  `--so-radio-control-size`, the step of a toast in a stack `--so-toasts-lift`. Draw from these
  when your look has to match the size of the part.
- **Written by plugins and not read by this package** — the place of the active tab
  (`--so-tabs-active-pos` and the rest of `TTabsViewPlugin`, step 6), the ghost of a column being
  resized and the width of a column being dragged in a table.

Read nothing else of this package: a variable that is not in the contract is part of its inner
mechanics and may change. The check `theme-reads` (step 7) fails on it.

Your own variables follow the same scheme, `--so-*`, as every name in the document's global
namespace: a variable of the application with the same name would replace yours by inheritance.

### 4. The look

The published [class and data-attribute reference](./theme-contract.json) lists roots, parts,
modifiers and datasets with their meanings, DOM scopes, values and emission sources. The
[variable reference](./theme-variables.json) keeps its separate two-section contract. Both JSON
files can also be imported from the corresponding package subpaths.

Literal roots and parts are exact class names. Modifier patterns append to the concrete block:
`so-<block>--size-<value>` uses the library sizes `sm`, `normal`, `lg`, `xl`, `2xl`;
`variant`, `view`, `shape` and `animation` values belong to the theme. The `dynamic` section
maps computed source expressions to their bounded families; these are checked alongside literal
emissions in all six adapters. Global scheme selection, `data-so-theme`, belongs to the
application and theme; `data-so-motion` controls the library's motion policy.

Boolean and state modifiers are data attributes: `data-readonly`, `data-required`,
`data-clearable`, `data-editable`, `data-open`, `data-closable`,
`data-indeterminate` and `data-ready-animation`. There are no parallel state classes.
Layout and mode classes include their prop names: `--orientation-horizontal`,
`--mode-range` and `--alignment-center`. Existing string-valued data contracts
such as `data-align` and `data-placement` retain their meaning.

Datasets may bind to an inner row, panel, trigger or input segment; use each entry's scope.
Boolean false is the string `"false"`, so use an explicit value selector. Only null/undefined
remove a TDataset attribute; gesture flags documented as presence-only disappear outside the gesture.
For example, style a selected list row through its part and state:

```css
.so-select-item[data-selected='true'] .so-button__text {
  font-weight: 600;
}
```

Style the `so-*` classes and the `data-*` state attributes the library emits, with the same
selectors as the structure in `src/components/`. The rules every theme keeps:

- **Only the library's nodes.** Every selector addresses an element with a `so-*` class, in its
  subject or in an ancestor. A node without a class inside a part is named through the class of its
  component (`.so-input > input`); there are no rules for everything inside a part (`.so-x *`) —
  slot content belongs to the application. Outside the library's nodes a theme sets only custom
  properties, plus `color-scheme` on `:root` and in the block of a scheme, which stands on the
  attribute `data-so-theme` (`[data-so-theme='my-theme-dark']`).
- **State from `data-*`, never from `aria-*`** — and not from the native `disabled` attribute: the
  core duplicates every state into `data-*` on any tag, so an accessibility fix never changes the
  look.
- **Disabled fades once.** This package fades a disabled part with its whole subtree by
  `opacity: var(--so-disabled-opacity)`. Do not fade it yourself; set the variable to change the
  amount.
- **Mirror with the sign**, multiplying by `--so-dir-sign`: no `:dir()` and no `[dir]` selectors.
- **Movement only behind the gate.** Sliding, travelling, turning, resizing over time go into rules
  under the gate of the library's motion mode; without it the value changes at once. Color, opacity
  and shadow transitions are not movement and need no gate:

  ```css
  @media (prefers-reduced-motion: no-preference) {
    :where(:root:not([data-so-motion='reduce'])) .so-switch__track--thumb {
      transition: inset-inline-start 200ms;
    }
  }

  :where(:root[data-so-motion='full']) .so-switch__track--thumb {
    transition: inset-inline-start 200ms;
  }
  ```

  Following the pointer is not movement: during a swipe or a column drag this package puts the part
  under the pointer by `translate`. Give that `translate` no transition while the part is held
  (`[data-swiping='true']`, `[data-dragging='true']`), and write your own `translate` only for what
  comes after — a closed layer leaving, `@starting-style` of an arrival — taking the offset from
  the same variable.

- **Keyframes named `so-*`**, like the variables.
- **Hover through the label.** A hover rule of CheckBox, Switch and a radio item also matches when
  the text of its `Label` is hovered: `:is(:hover, :where(.so-label:hover > .so-label__control *))`.
- **No per-cell rule of Table at rest.** A rule multiplied by every body cell of a Table stands
  under an attribute the table carries only during a gesture (`[data-reorder-preview]`), with the
  chain "root > body > row", and no rule has `:has()` on the table root.

Values of the look are modifiers with a prefix: `so-button--view-filled`,
`so-button--variant-accent`, `so-skeleton--shape-circle`, `so-skeleton--animation-wave`. A block
without a modifier is the default look.

### 5. The values of the look: `index.d.ts`

The library declares no `variant`, `view`, `shape` or `animation` values: the theme does, by
augmenting the registries of `@soxa-ui/core`, and the props of every component take exactly these
names. A registry the theme leaves empty gives its prop the type `never`.

```ts
export {}

declare module '@soxa-ui/core' {
  interface IComponentVariants {
    accent: true
  }

  interface IButtonViews {
    filled: true
    outlined: true
  }
}
```

The registries: `IComponentVariants`, `IButtonViews` (also the rows of ListBox and Accordion and the
pills of Tags), `ITabsViews`, `ICheckBoxViews`, `IRadioGroupViews`, `ISkeletonShapes`,
`ISkeletonAnimations`. Declare every modifier your CSS has, and nothing it does not have.

The augmentation works once the file is in the application's program, and the package name brings
it there only from a module of TS. The stylesheet is not always imported from one: Angular CLI and
Nuxt take it from their configs, and there `variant="accent"` fails the type check. So the
declarations of `./setup`, which every application imports, reference this file (step 6): the
values reach the types wherever the stylesheet is plugged in, and the list of values stays in one
place.

### 6. The behavior: `./setup`

A theme hands over its plugins as one `defineTheme` object, and `useTheme` registers them for every
component of their type, including those drawn as parts of other components. This package has no
`defineTheme` of its own — the application plugs in one theme — so the theme installs the layout
plugins of this package in its object:

```ts
/// <reference types="my-theme" preserve="true" />

import { TTable, TTabs, TToasts } from '@soxa-ui/core'
import { defineTheme } from '@soxa-ui/setup'
import { TTableHeadPlugin, TTabsViewPlugin, TToastsFrontPlugin } from '@soxa-ui/theme-base/setup'

export default defineTheme({
  name: 'my-theme',
  plugins: [
    { type: TTabs, plugins: [TTabsViewPlugin] },
    { type: TTable, plugins: [TTableHeadPlugin] },
    { type: TToasts, plugins: [TToastsFrontPlugin] },
  ],
})
```

The reference on top names the theme's own package: its `types` is `index.d.ts`, and the
declarations of `./setup` bring the values of step 5 along. Keep `preserve="true"` — tsc drops a
plain reference from the declarations it emits, as it drops `import type {}`. Done when the built
`dist/setup/index.d.ts` carries the reference.

- **`TTabsViewPlugin`**, on Tabs, writes on the bar `.so-tabs__bar` — the list of tabs with the
  slots `leading` and `trailing` at its edges: `--so-tabs-active-pos` and `--so-tabs-active-size`
  — the place and the length of the active tab along the main axis, from the edge of the bar;
  `--so-tabs-gap-pos` and `--so-tabs-gap-size` — a gap in a line along the bar under it;
  `--so-tabs-active-moving: 1` while the mark moves to a newly active tab. The place is measured
  from the bar because this package positions it and not the list, so draw the mark on the bar:
  a slot and the room left by `center` are already in the place. Once the node is measured, it
  adds `data-ready-animation="true"` to the root. Only the theme reads these (the
  `theme-reads` section of the contract): it draws the mark of the active tab — a stripe, a card —
  from them. The plugin lifts the moving flag when the CSS transitions of the bar's own
  pseudo-elements have ended, so a mark that moves is a `::before` or `::after` of the bar, with a
  duration that depends on the flag — `calc(var(--so-tabs-active-moving, 0) * 200ms)` moves it to
  a new tab and puts it in place at once on a resize. Without the plugin the variables are not
  there: a mark drawn from them is not drawn, and only what the theme draws by `data-selected` of
  the tab shows the active one.
- **`TTableHeadPlugin`**, on Table, writes `--so-table-head-height` on the table root while
  `stickyHead` is on: this package keeps the focused cell below the sticky head by that height and
  lays the head's opaque backing over all of it. Without it the offset and the backing are one row
  of the head: a head wrapped into several rows covers the focus and is backed under its first row
  only.
- **`TToastsFrontPlugin`**, on Toasts, writes `--so-toasts-front-height` on the region while the
  toasts cascade: this package gives the toasts behind the height of the front one, and the theme
  may transition it. Without it they take the height of the stack cell — the same height, with no
  transition.

A plugin whose data only your own look needs belongs to your theme, in the same list.

### 7. Check it

The checks of this package run on the built CSS of every theme in the
[repository](https://github.com/youra-h/soxa-ui): a package in `packages/themes/` with a
`vite.config.ts` that builds its stylesheet — the file `style` of its manifest names, with every
rule of the theme — is picked up by `npm run test --workspace=@soxa-ui/theme-base` by itself. Outside the repository the same rules
hold — each check is a rule of step 3 or 4:

- `theme-reads` — every `--so-*` variable your stylesheet reads is your own or in the contract;
- `sealed` — every selector addresses a `so-*` node; outside them only custom properties and
  `color-scheme`; only wrapping at-rules, `@layer`, `@keyframes` and `@property`;
- `motion` — movement only behind the gate, no `scroll-behavior: smooth`;
- `variable-prefix` and `keyframes-prefix` — the names `--so-*` and `so-*`, in the stylesheet and
  in the behavior;
- `disabled` — a disabled rule takes its opacity only from `--so-disabled-opacity`;
- `label-hover` — the label context next to `:hover` in every hover rule of CheckBox, Switch and a
  radio item;
- `table-reorder` — per-cell rules of Table under the gesture attribute, no `:has()` on its root.

[`@soxa-ui/theme-oren`](https://github.com/youra-h/soxa-ui/tree/main/packages/themes/oren) is a
complete theme built on these steps: Tailwind and Sass inside, two color schemes, its own values.

## Layer order next to Tailwind

A stylesheet that brings the `so` layer to the top level — this package imported as is, or a theme
that does so — goes into the application's cascade by the order in which layers first appear. If
the application uses Tailwind, name the order before any stylesheet loads, so that `so` stays below
`components` and `utilities` and a utility class on a component still wins:

```css
@layer theme, base, so, components, utilities;
```

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [The package's own notes](https://github.com/youra-h/soxa-ui/blob/main/packages/themes/base/AGENTS.md)
  — layers, the reset, the direction sign, the variable contract, the layout plugins and the checks
  every theme passes (in Russian).

## License

[MIT](https://github.com/youra-h/soxa-ui/blob/main/LICENSE)

## Breadcrumbs

Breadcrumbs provides an ordered navigation trail with native links, localized accessible names
and an overflow menu. See the [API and examples](../../../docs/api/breadcrumbs.md).

## Shared radius and spacing settings

The base declares optional settings in [settings.css](./src/settings.css) with `initial`.
For a custom property this means unset, so a consuming `var()` can use its fallback.
An empty token list (`--setting: ;`) would suppress that fallback. A visual theme supplies
the radius, spacing unit and family multipliers; the base retains structural fallbacks.

- `--so-radius`: shared corner radius. Visual themes read it at the styled node,
  after an optional final override such as `--so-input-radius` or `--so-list-box-radius`.
  Round indicators and explicit circle/square shapes keep their shape. Oren preserves
  relative radii: larger panels use 4/3 of the shared radius; small inner corners use less.
- `--so-spacing`: shared spacing unit, with a structural fallback of 0.25rem.
- `--so-<family>-scale-<size>`: spacing multiplier for `field`, `control`,
  `collection`, `message` or `surface`, and `sm`, `normal`, `lg`, `xl`, `2xl`.
- `--so-<component>-spacing-scale`: optional multiplier overriding that component's family.

Resolve calculations on the component, rather than in root aliases, so changing a setting
on a subtree affects its components. Exact component lengths override calculated defaults
and are never multiplied again. Font sizes, heights, minimum pointer targets, viewport
offsets and circular shapes keep their own contracts. Values already expressed in em
continue to follow their surrounding font.

Input, DateInput, NumberInput, Textarea, Select, DatePicker, Field and Label use `field`.
Button and small controls use `control`; lists, menus, tabs, tags, tables, calendars,
accordions and breadcrumbs use `collection`. Alert and Toasts use `message`.
Overlay panels and other standalone surfaces use `surface`. A multiplier affects only
spacing that a component actually has. An overlay follows settings at its DOM target;
set shared settings on the document or on its teleport container when needed.

### Migration for direct variable reads

Spacing variables that previously held fixed root defaults now describe optional final
overrides. Setting an existing variable to a length still wins, including zero. When a
custom theme reads one directly, supply a fallback or use the component's computed CSS
property. For example, replace `gap: var(--so-input-slot-spacing)` with
`gap: var(--so-input-slot-spacing, calc(var(--so-spacing, 0.25rem) * var(--so-input-spacing-scale, var(--so-field-scale-normal, 1))))`
for an independently styled normal field. Choose the appropriate size when styling others.
The same optional-override rule applies to `--so-code-block-radius`; use
`var(--so-code-block-radius, calc(var(--so-radius, 0px) * 4 / 3))`.
The full variable list and descriptions are in [theme-variables.json](./theme-variables.json).

Alert uses the original compact Toasts spacing as its message reference: 0.875rem block
padding, 1rem inline padding and 0.125rem between title and description at normal size.
The message scale multiplies these defaults. `--so-alert-padding` remains an exact CSS
padding shorthand; `--so-alert-body-gap` overrides only the title-to-description gap.
