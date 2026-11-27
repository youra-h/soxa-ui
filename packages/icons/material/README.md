# @soxa-ui/icons-material

**Material icons implementing the Soxa UI icon-role contract.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

An icon pack is an implementation of a contract, not a bag of SVG files: the library asks for a
fixed set of roles (`step`, `check`, `checkIndeterminate`, `close`, `arrowDown`, `arrowRight`,
`arrowsOutward`, `arrowsInward`, `calendar`, `arrowUpward`, `star`, `minus`, `plus`, `error`,
`notification`, `info`, `success`, `warning`), and a pack provides them as plain data — a `viewBox` and the body
of the `<svg>`. The root element is built by the adapter, so it can set the size, the classes and
`aria-hidden`; there is no bundler-specific import and no runtime template compiler.

## Install

```bash
npm install @soxa-ui/icons-material
```

## Usage

The application registers the pack once, in its entry point:

```ts
import { useIcons } from '@soxa-ui/setup'
import * as material from '@soxa-ui/icons-material'

useIcons(material)
useIcons({ close: myCloseIcon }) // a single role, on top of the pack
```

Without a registered pack the components render an empty placeholder and report the missing role
once — a missing icon must not bring the whole application down.

## Color

An icon is painted with a reference to the icon color of the theme, with the color of the source
SVG as the fallback: `fill="var(--so-icon-color, #1f1f1f)"`. Without a theme rule an icon is
`#1f1f1f`, the color it was drawn with; a theme recolors every icon of any pack by setting
`--so-icon-color` (the oren theme gives an icon the color of the text where it stands), and a rule
for a place — the mark of a checkbox, say — is stronger than that default. The reference is an SVG
presentation attribute rather than a `style`: any CSS rule of a theme still overrides it, and a
Content Security Policy without `'unsafe-inline'` styles does not strip it. An icon of your own
(`useIcons({ close: myCloseIcon })`) takes the color of the theme when it is painted the same way.

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [Architecture overview](https://github.com/youra-h/soxa-ui/blob/main/docs/architecture.md) —
  layers, descriptors, plugins, collections, adapters.

## License

The code of the package is [MIT](https://github.com/youra-h/soxa-ui/blob/main/LICENSE).

The icons are [Material Symbols](https://fonts.google.com/icons) by Google, © Google, licensed
under the [Apache License, Version 2.0](https://www.apache.org/licenses/LICENSE-2.0); its text
ships with the package as `LICENSE-Apache-2.0`. The icons are changed from the source SVG files:
the root `<svg>` element is dropped together with its size, its `fill` becomes a reference to the
icon color of the theme with the source color as the fallback, and a glyph may be rotated —
`arrowDown` is `chevron_right` turned down.
