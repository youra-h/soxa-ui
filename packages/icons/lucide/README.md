# @soxa-ui/icons-lucide

**Lucide icons implementing the Soxa UI icon-role contract.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

An icon pack is an implementation of a contract, not a bag of SVG files: the library asks for a
fixed set of roles (`step`, `check`, `checkIndeterminate`, `close`, `arrowDown`, `arrowRight`,
`arrowsOutward`, `arrowsInward`, `calendar`, `arrowUpward`, `star`, `minus`, `plus`, `error`,
`notification`, `info`, `success`, `warning`), and a pack provides them as plain data — a `viewBox` and the body
of the `<svg>`. The root element is built by the adapter, so it can set the size, the classes and
`aria-hidden`; there is no bundler-specific import and no runtime template compiler.

The pack ships only these roles, not the whole Lucide set. Lucide draws with a stroke, and so
does the pack — 1.5 units wide instead of 2; only the star is filled. A theme does not need to know
that: it colors a Lucide icon the same way it colors any other pack (see [Color](#color) below).

## Install

```bash
npm install @soxa-ui/icons-lucide
```

## Usage

The application registers the pack once, in its entry point:

```ts
import { useIcons } from '@soxa-ui/setup'
import * as lucide from '@soxa-ui/icons-lucide'

useIcons(lucide)
useIcons({ close: myCloseIcon }) // a single role, on top of the pack
```

Without a registered pack the components render an empty placeholder and report the missing role
once — a missing icon must not bring the whole application down.

## Color

An icon is painted with a reference to the icon color of the theme, with the color of the source
SVG as the fallback: `stroke="var(--so-icon-color, currentColor)"` (the star is filled the same
way). Without a theme rule an icon has the color of the text, as Lucide draws it; a theme recolors
every icon of any pack by setting `--so-icon-color`, and a rule for a place — the mark of a
checkbox, say — is stronger than that default. The reference is an SVG presentation attribute
rather than a `style`: any CSS rule of a theme still overrides it, and a Content Security Policy
without `'unsafe-inline'` styles does not strip it. An icon of your own
(`useIcons({ close: myCloseIcon })`) takes the color of the theme when it is painted the same way.

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [Architecture overview](https://github.com/youra-h/soxa-ui/blob/main/docs/architecture.md) —
  layers, descriptors, plugins, collections, adapters.

## License

The code of the package is [MIT](https://github.com/youra-h/soxa-ui/blob/main/LICENSE).

The icons are [Lucide](https://lucide.dev), © Lucide Icons and Contributors, licensed under the
ISC License; the icons Lucide derives from [Feather](https://feathericons.com) are © Cole Bemis,
licensed under the MIT License. Both texts ship with the package as `LICENSE-ISC`. The icons are
changed from the source SVG files: the stroke is 1.5 units wide instead of 2, the star is filled,
and every color becomes a reference to the icon color of the theme with the source color as the
fallback.
