# @soxa-ui/core

**Headless component models with no framework in them: components, the collection engine, facades
and extensions.**

Part of [Soxa UI](https://github.com/youra-h/soxa-ui) — UI components with the logic written once: a
framework-agnostic core and thin adapters that render it in Vue, React, Angular, Svelte, Solid and
Web Components.

A core component owns its state, events, ARIA and collection membership, and knows nothing about
the DOM. Rendering it is the job of an adapter (`@soxa-ui/vue` and its siblings); behavior that
needs the DOM comes from `@soxa-ui/plugins`.

## Install

```bash
npm install @soxa-ui/core
```

## Usage

A component works on its own — this is the same instance an adapter renders when it is passed as
the `ctrl` prop:

```ts
import { TButton } from '@soxa-ui/core'

const button = new TButton({ text: 'Save' })

button.events.on('change:text', ({ newValue, oldValue }) => console.log(newValue, oldValue))
button.text = 'Saved'
button.disabled = true
```

Property change notifications carry `TValuePayload<T>`: `{ newValue, oldValue }`. Read `newValue`
when returning a changed value to a component prop. Object values retain their references; events
do not deep-clone or freeze them. Collection lists and markup attribute sets use shallow container
snapshots, keeping the identities of the objects inside them. A mutable object reference is not a
historical copy.

Cancelable `change:*:before` events keep their `TChangeEvent` contract (`value`, `oldValue`,
`preventDefault()`). Model updates such as Vue's `update:value` still carry the value itself.
Collection operations with multiple arguments and invalidation signals without arguments retain
their own contracts.

A collection is an engine with extensions, not an array:

```ts
import { TTabs, createEngineTabs } from '@soxa-ui/core'

const tabs = new TTabs()
const engine = createEngineTabs({ owner: tabs, items: [{ value: 'a' }, { value: 'b' }] })

// the item list, its length and lookups come from the batch extension
engine.extensions.batch.items.length // 2

// every write is announced before the storage changes, and can be cancelled
engine.extensions.plain.events.on('item:remove:before', (e) => e.preventDefault())
```

## Documentation

- [Soxa UI README](https://github.com/youra-h/soxa-ui#readme) — what the library is and how it is
  put together.
- [Architecture overview](https://github.com/youra-h/soxa-ui/blob/main/docs/architecture.md) —
  layers, descriptors, plugins, collections, adapters.

## License

Soxa-owned code in this package is under the [Soxa Runtime License](LICENSE-SOXA-RUNTIME).
Use and redistribution in applications are free, including for commercial use.
Changes to the covered implementation require written permission.

The first day of the week by region, which the calendar uses when a locale does not name it, is
[Unicode CLDR](https://cldr.unicode.org/) data — CLDR 48, `weekData.firstDay` of
[cldr-json](https://github.com/unicode-org/cldr-json) 48.2.0, © Unicode, Inc., licensed under the
[Unicode License v3](https://www.unicode.org/license.txt); its text ships with the package as
`LICENSE-Unicode-3.0`. The package keeps only the regions whose week does not start on Monday.

The placeholders of empty date parts in the date input (`дд.мм.гггг`, `mm/dd/yyyy`) by language
are [React Spectrum](https://github.com/adobe/react-spectrum) data —
`packages/react-stately/src/datepicker/placeholders.ts` at commit `d0110f7`, based on the strings
of `<input type="date">` in Chrome and Firefox, © 2020 Adobe, licensed under the
[Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0); its text ships with the
package as `LICENSE-Apache-2.0`. The package keeps only the table of the year, month and day
placeholders.

## Breadcrumbs

Breadcrumbs provides an ordered navigation trail with native links, localized accessible names
and an overflow menu. See the [API and examples](../../docs/api/breadcrumbs.md).
