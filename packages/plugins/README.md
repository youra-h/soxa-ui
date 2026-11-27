# @soxa-ui/plugins

**Runtime behavior installed into a plugin bundle: DOM, focus, keyboard, overlay.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

Models in `@soxa-ui/core` have no access to the DOM. Everything that needs a live node — listening
for events, moving focus, measuring and positioning an overlay, normalizing keyboard activation —
is a plugin here, written once for all six adapters.

## Component availability and DOM readiness

`TReadyPlugin` reports that a component is loaded and available: its instance exists and its
root DOM element has been announced. It maintains `instance.ready` and the model's `ready`
event. The instance itself is created before the DOM root becomes available.

| Signal                   | Meaning                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `element:ready(element)` | The bound root is announced in the next animation frame. DOM plugins can attach listeners, measure, or observe it.     |
| `element:removed()`      | An announced root was removed or replaced. DOM plugins detach their behavior.                                          |
| `ready(true / false)`    | Component availability changed. `TReadyPlugin` translates element readiness and removal into this boolean model state. |

The `element:` prefix is the public plugin namespace. Inside a plugin, subscribe to
`bundle.get(TElementPlugin)?.events.on('ready', handler)` and `'removed'` on the same bus.
The model's `ready` event carries a boolean rather than a DOM node:

```ts
import { TButton } from '@soxa-ui/core'

const button = new TButton({ text: 'Save' })

// Subscribe before mounting this controller with an adapter.
button.events.on('ready', (available) => {
  console.log(available ? 'Component available' : 'Component unavailable')
})
```

`ready` starts as `false`. Removing an announced root sets it to `false`; announcing a root
again sets it to `true`. Replacing an announced root follows the same cycle: `false`
synchronously, then `true` in the next animation frame. A binding removed before its first
announcement emits neither element event. Server rendering does not announce a DOM root.

Availability does not imply visibility or completion of every plugin's DOM handler,
asynchronous initialization, layout observation, or animation. A `ready(true)` handler can run
before other plugins' handlers of the same element announcement. The events do not replay:
when subscribing after mounting, read `instance.ready` for current availability. DOM plugins
can also read `TElementPlugin.element`, which is assigned immediately, before its announcement.

`TLayer` continues to use `instance.ready` to expose `zIndex` and `data-layer` while the
component is available; on the server or without an announced root, its exposed `zIndex` is `0`.

## Install

```bash
npm install @soxa-ui/plugins
```

An adapter assembles the bundle for you, so you rarely install this package on its own — it comes
with `@soxa-ui/setup`.

## Usage

Reach a plugin of a mounted component from its instance — the bundle announces itself on the same
event bus the template uses:

```ts
import { TButton } from '@soxa-ui/core'
import { TActionPlugin, TPluginBundle } from '@soxa-ui/plugins'

const button = new TButton({ text: 'Save' })

button.events.on('bundle:create', (bundle: unknown) => {
  if (bundle instanceof TPluginBundle) {
    // press is a normalized activation: a click, or Enter/Space on any tag
    bundle.get(TActionPlugin)?.events.on('press', () => console.log('pressed'))
  }
})
```

Add a plugin of your own to every component of a type — see
[Plugins and extensions from outside](https://github.com/youra-h/soxa-ui/blob/main/AGENTS.md):

```ts
import { usePlugins } from '@soxa-ui/setup'
import { TButton } from '@soxa-ui/core'

usePlugins(TButton, [TRipplePlugin])
```

Set the motion mode of the whole library at the entry point of the application. By default motion
follows the system's reduced-motion setting:

```ts
import { useMotion } from '@soxa-ui/plugins'

useMotion('full') // motion even when the system asks to reduce it; 'reduce' — never
```

The language and the strings of the library are one value — a locale — that comes from the
nearest `LocaleProvider` of the framework adapter. A component has neither of its own: the
language and name plugins write them on mount and on every change, so the first render — the
server one too — is already in the subtree's language. This package ships the locales and the tools
to make your own:

```ts
import { enUS, esES, ruRU, extendLocale, formatName } from '@soxa-ui/plugins'
import type { TLocale } from '@soxa-ui/plugins'

const esMX = extendLocale(esES, { tag: 'es-MX' }) // another region of a ready language
const mn: TLocale = extendLocale(enUS, { tag: 'mn-MN', translations: { modal: { close: 'Хаах' } } })

formatName(ruRU.translations.tabs.close, 'Почта') // 'Закрыть Почта'
```

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [Architecture overview](https://github.com/youra-h/soxa-ui/blob/main/docs/architecture.md) —
  layers, descriptors, plugins, collections, adapters.

## License

Soxa-owned code in this package is under the [Soxa Runtime License](LICENSE).
Use and redistribution in applications are free, including for commercial use.
Changes to the covered implementation require written permission.

## Breadcrumbs

Breadcrumbs provides an ordered navigation trail with native links, localized accessible names
and an overflow menu. See the [API and examples](../../docs/api/breadcrumbs.md).
