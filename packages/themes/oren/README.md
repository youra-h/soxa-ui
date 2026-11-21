# @soxa-ui/theme-oren

**The oren theme: CSS for the BEM classes and `data-*` attributes of Soxa UI, in a light and a
dark scheme.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

The library emits `so-*` classes and `data-*` state attributes; a theme styles them. It never styles
`aria-*`, so an accessibility fix cannot break the look. A theme also declares the set of values
its design offers — `variant`, `view`, `shape`, `animation` — and the library takes those names
from it, not the other way round.

## Install

```bash
npm install @soxa-ui/theme-oren
```

The theme is built on [`@soxa-ui/theme-base`](https://www.npmjs.com/package/@soxa-ui/theme-base),
the shared layer of Soxa UI themes, and depends on it: the stylesheet carries its CSS, and the
behavior installs its layout plugins. npm installs it with the theme; you do not import it
yourself. To make a theme of your own on the same layer, see
[Make your own theme](https://github.com/youra-h/soxa-ui/tree/main/packages/themes/base#make-your-own-theme).

## Usage

The theme comes in two parts: the stylesheet and the behavior. The behavior is plugged in once, in
the application's entry point:

```ts
import { useTheme } from '@soxa-ui/setup'
import oren from '@soxa-ui/theme-oren/setup'

useTheme(oren)
```

`./setup` installs the plugins whose values the theme's CSS reads — the layout plugins of the shared
layer. Without it the styles are in place, but what CSS takes from plugin variables is not drawn:
there is no bar under the active tab, the card of the active tab does not move to a new one, focus
in a table body slips under a sticky head that wraps into several rows, and the toasts behind the
front one of a stack take its height at once, with no transition.

The stylesheet goes where the build takes styles from:

- **Vite** — Vue, React, Svelte, Solid, Web Components: `import '@soxa-ui/theme-oren'` in the
  entry module, next to `useTheme`;
- **Next.js** — the same import in the root layout, `app/layout.tsx`;
- **SvelteKit** — the same import in the root layout, `src/routes/+layout.svelte`;
- **SolidStart** — the same import in `src/app.tsx`;
- **Angular CLI** — `@import '@soxa-ui/theme-oren';` in `src/styles.css`, the file listed in
  `styles` of `angular.json`. Not an `import` in `main.ts`: Angular CLI puts CSS imported from a
  module into a chunk the page never loads;
- **Nuxt** — `css: ['@soxa-ui/theme-oren']` in `nuxt.config.ts`.

The values of the theme — `variant`, `view`, `shape`, `animation` — come with the behavior: the
declarations of `@soxa-ui/theme-oren/setup` reference them, so `variant="accent"` type-checks
however the stylesheet is plugged in.

### Only the components you use

The stylesheet `@soxa-ui/theme-oren` carries every component. Next to it lies a stylesheet per
component, `@soxa-ui/theme-oren/<component>.css`, named after the component in kebab case:
`button.css`, `list-box.css`, `date-picker.css`. Each one carries the shared part — the tokens and
the color schemes, the reset of the library's nodes, the size scales — and the parts of its
component, the inner ones included: `select.css` brings Input, Tags and Button, because Select
draws its field, its tags and its rows with them. Take the stylesheets of the components your pages
use, wherever the whole stylesheet would go — with Angular CLI in `src/styles.css`:

```css
@import '@soxa-ui/theme-oren/button.css';
@import '@soxa-ui/theme-oren/select.css';
@import '@soxa-ui/theme-oren/dialog.css';
```

The bundler puts a file several stylesheets share once, and the order of the imports does not
matter: the shared part declares the order of the cascade layers before any rule. A component you
put into a slot of another — a Button in the footer of a Dialog — is yours to import as well.

### Tailwind CSS 4

Put Preflight in a separate `reset` layer before Oren's `base` layer. Use one CSS entry:

```css
@layer theme, reset, base, components, utilities;
@import 'tailwindcss/theme.css' layer(theme);
@import 'tailwindcss/preflight.css' layer(reset);
@import 'tailwindcss/utilities.css' layer(utilities);
@import '@soxa-ui/theme-oren';
```

For component stylesheets, replace the last import with the components you use:

```css
@import '@soxa-ui/theme-oren/button.css';
@import '@soxa-ui/theme-oren/input.css';
@import '@soxa-ui/theme-oren/select.css';
```

Keep `useTheme(oren)` in your application setup as shown above. With Vite and the official
`@tailwindcss/vite` plugin, import this entry once from your entry module, for example
`import './styles.css'`. With Nuxt and that plugin, register the same entry:

```ts
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  css: ['~/assets/css/styles.css'],
  vite: { plugins: [tailwindcss()] },
})
```

Remove any other full `@import 'tailwindcss'` entry: it places Preflight directly in `base`,
where its `padding: 0` outranks the nested `base.so.button` and `base.so.select` rules. Moving
imports around does not change that layer priority. The separate `reset` layer preserves Oren's
control sizes and Select option padding, while `utilities` still overrides the theme.

Set the page font on `html` or `body`. Avoid an unlayered global `button, input { font: inherit }`:
it overrides the component font-size scale, including Input. This recipe covers layer ordering;
arbitrary global rules and conflicting Tailwind theme tokens can still change the result.

The [Vite + Vue consumer example](https://github.com/youra-h/soxa-ui/tree/main/tools/install-smoke/projects/vue-tailwind) builds both
full and component stylesheets independently, with Preflight and Tailwind utilities.

### Your CSS wins

Every rule of the theme lives in a cascade layer: the structure in Tailwind's layer `base`, the
look in `components`. Your CSS outside layers and the utilities of your own Tailwind override the
theme without fighting its specificity — `<Button class="rounded-none">` takes the utility, and a
rule `.so-button { … }` of your stylesheet needs no extra weight.

A page reset outside layers wins the same way: `button { background-color: transparent }` of a
reset or of Tailwind 3 preflight takes the fill off every Button. Import such a reset into a layer
of its own before the theme — a layer named first is the weakest:

```css
@import 'modern-normalize' layer(reset);
@import '@soxa-ui/theme-oren';
```

The dark scheme is switched on with an attribute on the root element:

```html
<html data-so-theme="oren-dark"></html>
```

## The page is yours

The theme styles only the nodes of Soxa UI — elements with a `so-*` class. It ships no page reset:
Tailwind's preflight is not part of it, and outside the components it sets nothing but CSS
variables and the `color-scheme` of each scheme. Your headings, lists, links, buttons and the
`body` margin stay as your own styles leave them. The components inherit the font and the line
height of the page, so set them on the page, and bring your own reset if your markup relied on the
one the theme used to apply:

```css
html {
  font-family: system-ui, sans-serif;
  line-height: 1.5;
}

body {
  margin: 0;
}
```

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [The theme's own notes](https://github.com/youra-h/soxa-ui/blob/main/packages/themes/oren/AGENTS.md)
  — scales, step roles, semantic tokens, color schemes (in Russian).

## License

[MIT](https://github.com/youra-h/soxa-ui/blob/main/LICENSE)

## Breadcrumbs

Breadcrumbs provides an ordered navigation trail with native links, localized accessible names
and an overflow menu. See the [API and examples](../../../docs/api/breadcrumbs.md).

## Shared geometry

Set these variables after importing the theme, on the document or a component subtree:

```css
:root {
  --so-radius: 0.5rem;
  --so-spacing: 0.25rem;
  --so-field-scale-2xl: 1.75;
  --so-message-scale-2xl: 1.5;
}
.my-input {
  --so-input-radius: 2px;
  --so-input-spacing-scale: 1.25;
  --so-input-slot-spacing: 6px; /* Exact final length, unaffected by the multiplier. */
}
```

A component radius override wins over the shared radius. Oren's shared radius is 0.375rem;
large panels and message cards keep their 4/3 proportion, while circular shapes stay round.
Input and DateInput share the field scale; Alert and Toasts share the message scale.

| Family                       | sm    | normal | lg    | xl   | 2xl  |
| ---------------------------- | ----- | ------ | ----- | ---- | ---- |
| field, control               | 0.75  | 1      | 1.25  | 1.5  | 1.75 |
| collection, message, surface | 0.875 | 1      | 1.125 | 1.25 | 1.5  |

The families remain independently configurable. Multipliers affect spacing, with exact
local length overrides taking priority. Fonts, control heights and pointer-target minima
retain their size scales. See the [base theme migration notes](../base/README.md#shared-radius-and-spacing-settings)
when a custom theme directly reads the old fixed-default spacing variables.

The message spacing reference comes from Toasts: normal Alert and Toasts use 14px block
padding, 16px inline padding and a 2px title-to-description gap at the default root size.
Alert keeps its own text-size scale; component-specific exact overrides still take priority.
