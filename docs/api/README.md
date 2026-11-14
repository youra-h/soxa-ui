# Component API documentation

The library generates the public contract. The website combines that data with explanations,
examples, keyboard behavior and limitations. API tables are generated; prose is authored once
per component or concept, rather than once per framework.

## Read the API from a published version

`@soxa-ui/setup/api.json` is a static JSON export. It does not execute setup, import a UI
framework or need a browser. Install the exact library version the website documents:

```sh
npm install --save-exact @soxa-ui/setup@<library-version>
```

Read it at website build time, for example in Node:

```js
import { readFileSync } from 'node:fs'

const api = JSON.parse(
  readFileSync(new URL(import.meta.resolve('@soxa-ui/setup/api.json')), 'utf8'),
)
if (api.schemaVersion !== 1) throw new Error('Unsupported API metadata schema')

const component = api.components.find((entry) => entry.id === 'button')
const contract = api.contracts[component.contract]

console.log(api.libraryVersion)
console.table(
  contract.props.map((prop) => ({
    name: contract.frameworks.vue.props[prop.name],
    type: prop.type,
    default: prop.hasDefault ? prop.default : 'No default',
  })),
)
```

The artifact is included in the existing setup tarball and follows its version. The website
does not need this repository, descriptor internals, a GitHub checkout or TypeScript at build
time. This task does not release a package: the export becomes available from npm with the
release containing it. A local setup build already produces it.

For a versioned index, selective AI retrieval and checked consumer samples, see the
[public documentation source](../ai/README.md). Its library version and documentation
revision are pinned independently; the website keeps its own pages and localization.

## Artifact format (schema version 1)

The [committed contract](generated/contract.json) contains the same API data as the package.
Only the packaged artifact adds `libraryVersion`, read from the setup manifest on each build.
Keeping the checked-in data independent of that version lets Changesets prepare a release
without manually editing generated documentation.

| Field                      | Meaning                                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`            | Version of this data format. Consumers must check it before rendering.                                              |
| `libraryVersion`           | Exact setup version; present in the packaged artifact.                                                              |
| `typeContext`              | `library-without-theme`: no application theme augments the type program.                                            |
| `components`               | Public descriptor-backed components, their stable kebab-case IDs, available frameworks and source descriptors.      |
| `components[].contract`    | Key in `contracts` for the complete component surface, including collection facades.                                |
| `components[].frameworks`  | Only supported public exports; Angular and statically registered Web Components also include actual CSS selectors.  |
| `contracts[id].source`     | Repository-relative primary descriptor path. `components[].sources` also records facade paths and roles.            |
| `contracts[id].props`      | Writable component, adapter and built-in plugin inputs. Protected state is excluded.                                |
| `contracts[id].events`     | Explicitly published events, with their callback signatures; property triggers do not add events.                   |
| `contracts[id].slots`      | Only the component's own slots, descriptions and typed scope members. Slots do not inherit from parent descriptors. |
| `contracts[id].frameworks` | Syntax for props, events, models and slots, keyed by canonical names.                                               |
| `plugins`                  | Publicly exported built-in plugin definitions, in the same contract format.                                         |

Properties have `name` (the shared public prop name), `canonicalName` (the descriptor's name),
`type`, `required` and `hasDefault`. If a default exists, `default` is its **display expression**,
not an executable value: `false`, `undefined`, `""`, arrays and objects remain distinct.
Functions are displayed by name and are never called. `declaredType`, when present, preserves
the source annotation; `values` lists literal string/number choices found by TypeScript.
Descriptions come from source JSDoc or slot declarations; missing explanations are not invented.

`type` is a TypeScript display string. References such as
`import("@soxa-ui/core").TValuePayload<string>` name public types; `declaredType` can also
contain source type parameters. These strings are documentation, not standalone declarations
to compile. Generic constraints and intentional `unknown`/`any` in source contracts remain
visible. For example, a change payload carries `oldValue` and `newValue`; it is not the value
carried by a model update.

Theme-owned types need context: `variant`, `view`, `shape` and `animation` get values through
theme augmentation. An unaugmented type can resolve to `undefined`. Display its declared type
and explain the theme contract instead of presenting that as a prohibition on theme values.
The artifact does not claim to enumerate the values of a consumer's theme.

### Framework names and delivery

For Button's explicitly declared `change:text`, the generated bindings are:

| Framework      | Event binding                                 | Model update                                      |
| -------------- | --------------------------------------------- | ------------------------------------------------- |
| Vue            | `@change:text`                                | `@update:text` (`v-model:text` uses this channel) |
| React          | `onChangeText`                                | No separate model channel                         |
| Angular        | `(soChangeText)`                              | `(textChange)` (used by `[(text)]`)               |
| Solid          | `onChangeText`                                | No separate model channel                         |
| Svelte         | `onChangeText`                                | No separate model channel                         |
| Web Components | `addEventListener('so:change:text', handler)` | No separate model channel                         |

Event names and models come from the adapters' real profiles and `TSurface`. Angular's `tag`
is not a bindable input: its root is the consumer's element. `ctrl` is declared by its base.
The other framework prop bindings do not imply that native Web Components properties are
string HTML attributes; assign structured values to element properties.

Vue and callback adapters deliver the event's argument list. Angular's `$event` and Web
Components' `CustomEvent.detail` carry its single argument, a tuple for multiple arguments,
or `undefined` for no arguments. Model outputs carry the property's new value, independently
of the explicit public event and its payload.

The default slot is `default` in the shared contract and `children` in React, Solid and
Svelte. Angular accepts static projected content and scoped `<ng-template slot="name">`
templates (import `SlotDirective`). Svelte slots whose names contain a hyphen are snippet
props, for example `item-leading={content}` with a separately declared `content` snippet.
Web Components use unnamed content or the `slot` attribute. **Web Components do not deliver
scope objects to light-DOM slots**; the canonical scope describes the other adapters' data
contract. Do not turn scope members into nonexistent HTML slot parameters.

`components[].frameworks` determines availability. Framework bindings on a contract explain
the naming strategies and do not add a component export to an unsupported adapter.

### Built-in and external plugins

Properties of plugins included by a component descriptor are direct component props, with
their namespace (for example `aria_label`). They already appear in the component's contract.
Plugins installed by the application use the existing `pluginProps` bag and `plugin:event`
envelope instead. Their events do not become new component events:

```vue
<Button :pluginProps="{ timer_ms: 500 }" @plugin:event="handlePluginEvent" />
```

This example assumes the application has installed a plugin declaring `timer_ms`; assigning
the bag alone does not install it. The envelope is `{ name, args }`, for example
`{ name: 'timer:tick', args: [500] }`. The generated plugin catalog covers the exported library
definitions, not plugins that an application may register in the future.

## How the website should look

Keep one page per component, with a framework switch, and assemble it from:

1. A short explanation of what the component does and when to use it (authored Markdown).
2. Installation/imports and a minimal working example for the selected framework (authored,
   checked examples using published packages).
3. Component parts and composition examples (authored).
4. Props, defaults, explicit events, model bindings and slots (rendered from this artifact).
5. Keyboard behavior, accessible naming, native form behavior and limitations (authored).
6. Links to related components and concepts (authored).

Concept guides explain `ctrl`, collections, plugins, themes and locale separately. Helpers
without descriptors, including `LocaleProvider`, belong in those guides; this artifact is
not a complete reference of every utility exported by every package.

Markdown pages belong to the separate website repository. Do not create six handwritten API
tables under component source folders. The library owns the contract and its delivery;
the website owns routes, localization, rendering, prose, examples and `llms.txt`.

## Maintain and verify

```sh
npm run generate:api             # update the committed contract from source
npm run check:api-docs           # fail on drift without modifying files
npm run test:api-docs            # public coverage, types, defaults and naming
npm run typecheck:api-docs
npm run build --workspace=@soxa-ui/setup   # after core and plugins have been built
npm run check:api-package        # verify packaged data and the current version
```

The generator lives in [tools/api-docs](../../tools/api-docs). It discovers the existing
Angular component manifests to reuse their descriptor/facade wiring, then checks exports
of all six adapters without importing their UI runtime. Properties and event names come
from the runtime descriptors; value types come from the inferred TypeScript contracts.
Collection setters absent from a constructor props interface are read from the descriptor's
instance type. When a component exposes a facade, its public component props take precedence
over the facade's internal instance types (for example Select accepts item data, not only
already constructed item instances).

The setup build regenerates the packaged data from source and stamps the current version.
CI checks the committed snapshot, generator invariants, its types and the packaged artifact.
The snapshot has deterministic ordering and contains neither timestamps nor checkout paths.
Additions preserve existing fields; an incompatible schema change must increment
`schemaVersion`. Library API changes still follow the beta freeze and Changesets rules.

## Comparable implementations

Inspected on 2026-11-09:

- [Reka UI's generator](https://github.com/unovue/reka-ui/blob/v2/docs/scripts/autogen.ts)
  extracts props, events and slots into generated fragments;
  [its Select page](https://github.com/unovue/reka-ui/blob/v2/docs/content/docs/components/select.md)
  includes those fragments alongside explanations and examples.
- [MUI's Button metadata](https://github.com/mui/material-ui/blob/master/docs/pages/material-ui/api/button.json)
  separates structured API data, including defaults and imports, from page prose.
- [Radix's Select page](https://github.com/radix-ui/website/blob/main/data/primitives/docs/components/select.mdx)
  demonstrates a component page combining anatomy, examples, API and keyboard behavior.

The recommendation for Soxa combines structured data with authored pages because the library
has six adapters and an independently versioned website. It does not depend on the website
choosing VitePress, Nuxt or another renderer.

## Component guides

- [Avatar](avatar.md): user images, exact initials, custom fallbacks and explicit group overflow.

- [Breadcrumbs](breadcrumbs.md): native navigation links, overflow, localization and slots.

- [CodeBlock](code-block.md): safe code display, snippets, copying, line numbers and themes.

- [Alert](alert.md): inline urgency, content slots and reversible dismissal.
- [Separator](separator.md): horizontal and vertical semantic or decorative boundaries.
