# Versioned public documentation source

This directory is the library-owned source format for small, versioned AI
documentation records. The initial release directory is **0.3.0**. The separate
website owns its routes, localization, prose pages, rendering and public
`llms.txt` endpoints. This format supplies metadata, a minimal shared overview,
Vue/Nuxt and React/Next.js consumer recipes and generated API records; it does not replace those pages.

The source language is English. This is public consumer documentation, not the
repository's agent workflow. Never publish private memory, task history,
credentials, machine paths or internal operational instructions here. Public
repository rules can inform new prose only after checking them against the
documented release. Do not ship repository AGENTS files or skills wholesale.

## Two independent revisions

- `libraryVersion` is the exact published component-library version. For the
  first corpus it is 0.3.0, with release Git revision
  `9ae988633936a03e291e8e414028456fe1039c6b`. npm's setup `gitHead` and
  the public `v0.3.0` tag were checked on 2026-11-14.
- `docsRevision` is a full Git commit SHA supplied by the consumer, identifying
  the documentation source and builder downloaded together. Documentation may
  improve after the library release without publishing new library packages.
  The website must pin that SHA in its own configuration or lock.
- Theme and icon versions are independent. A recipe records their exact package
  versions in `packages` when used; it must verify peer compatibility and theme
  augmentation. The minimal headless Button example uses neither; the Vue/Nuxt recipes use
  Oren and Material 0.3.0 with verified peer compatibility.
- The installed `@soxa-ui/setup/api.json` must match both the manifest's exact
  version and its SHA-256. The API is already published in setup 0.3.0.
  The current checkout's generated API, `latest`, a range, and a silent fallback
  to another release are not sources for this corpus.

The schema version describes the documentation interchange format, independently
of the library's API artifact schema. Incompatible format changes increment it.
Add a release directory for another library version; never retarget 0.3.0 to 0.4.0.

## Get the source without a library checkout

After the documentation commit is public, replace `<full-docs-commit-sha>`
with its immutable 40-character SHA. These commands run in a new consumer
directory, outside any library workspace:

```sh
curl -fL https://raw.githubusercontent.com/youra-h/soxa-ui/<full-docs-commit-sha>/tools/ai-docs/fetch.mjs -o fetch.mjs
node fetch.mjs --revision <full-docs-commit-sha> --version 0.3.0 --out source
mkdir api-source
cd api-source
npm init -y
npm install --ignore-scripts --save-exact @soxa-ui/setup@0.3.0
cd ..
node source/tools/ai-docs/cli.mjs --manifest source/docs/ai/0.3.0/manifest.json --package api-source/node_modules/@soxa-ui/setup --revision <full-docs-commit-sha> --out corpus-0.3.0
```

The downloader fetches only the selected release manifest, its declared prose and
examples, and the two builder modules. Every request uses the same full SHA; a
missing file or wrong version fails before source files are written. It records
that SHA in `source/revision.json`. It does not download the repository's benchmarks,
private memory, agent instructions or other release directories. A full GitHub
archive by SHA also works, but is unnecessarily large for normal consumption.

The builder needs only Node 22.12+ and the two source directories
`docs/ai` and `tools/ai-docs`. It imports no library runtime, framework,
TypeScript or sibling checkout. npm validates package integrity; the builder
additionally checks the exact API bytes. The manifest records the tarball URL
and npm integrity for auditing. Keep the consumer's package lock.

Use an empty output directory for every build, preventing stale files from an
older corpus. Library development can call the same CLI via
`npm run build:ai-docs -- <the four options above>`. Write local output
under a `dist/` directory, which Git ignores.

The website can build this at CI time and publish the resulting files under its
own versioned URLs. Future MCP can use the same index/files. Neither requires a
new npm documentation export, a running documentation server or a library release.
This task does not publish an archive, merge a PR, deploy the website or implement
MCP transport. The source becomes publicly fetchable once its commit is pushed;
select an owner-reviewed commit for production consumption.

## Manifest schema 1

`0.3.0/manifest.json` is validated by `tools/ai-docs/corpus.mjs`.

| Field                               | Meaning                                                                                                                                                   |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`                     | Documentation schema, currently 1.                                                                                                                        |
| `libraryVersion`, `libraryRevision` | Exact published library version and full release commit.                                                                                                  |
| `language`                          | English source, `en`. Website translations are maintained separately.                                                                                     |
| `api`                               | Existing setup JSON export, exact version, SHA-256, tarball URL and npm integrity.                                                                        |
| `packages`                          | Exact package pins for the included example; list themes/icons independently when used.                                                                   |
| `coverage`                          | All six adapters, each with generated API and guide status `pending`, `sample` or `ready`. API records only exist for supported public component exports. |
| `contributorGuides`                 | Separate contributor coverage; initially `pending`. No contributor files are published yet.                                                               |
| `documents`                         | Authored records below.                                                                                                                                   |

Each authored record has:

| Field                 | Meaning                                                                                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`, `title`, `path` | Unique stable kebab-case ID, display title, relative UTF-8 source path inside this release directory.                                        |
| `audience`            | `consumer` for application usage or `contributor` for library development. Required.                                                         |
| `framework`           | `vue`, `react`, `angular`, `solid`, `svelte`, `webc`, or `all` for shared concepts. Nuxt/Next.js etc. belong in their adapter's topics.      |
| `topic`, `component`  | Kebab-case topic and API component ID, or `null` for shared material.                                                                        |
| `status`              | `sample` is a narrow demonstrated slice; `ready` needs the guide's own checks. Neither declares whole-framework coverage.                    |
| `sources`             | Public repository paths at the exact documented release revision, used to verify claims. The authored text's own origin uses `docsRevision`. |
| `related`             | IDs of authored or generated API records, never website routes.                                                                              |
| `links`               | Declared HTTPS links used in prose; relative Markdown links are rejected. Related records use `related`.                                     |
| `examples`            | Unique ID, relative file path and code-fence language. Code is loaded from the actual checked sample, not a second pasted copy.              |

Paths cannot escape the release directory, including through symlinks. Broken
local files and related IDs fail the build. Source URLs point at full commits;
release paths are checked in the integration test. The validator checks external
URL syntax; it does not guarantee availability of arbitrary third-party sites.
Review each source and its claim before marking authored coverage ready.

## Build output and selective retrieval

- `index.json`: corpus provenance, package pins, coverage and document metadata,
  with relative document file paths. It contains no full API tables or example code.
- `documents/<id>.json`: one complete record, including its text, source URLs,
  content SHA-256 and example code with SHA-256. API records additionally expose
  structured `api`, with the selected adapter's actual import/selector, bindings,
  props/defaults/events/models/slots, and unaugmented theme type context.
- `bundles/consumer-<framework>.txt`: shared consumer documents, that adapter's
  guides, examples and API. Contributor bundles are generated only when contributor
  records exist. Bundles are bulk views; normal retrieval starts with the index.

API IDs are `api-<framework>-<component>`. These are generated from the existing
published artifact, including collection contracts. No props, defaults, payload
types or binding names are transcribed manually. Canonical API slot scope describes
other adapters' data; Web Components light-DOM slots do not receive scope objects,
and their record has `scopedSlots: false`. Built-in plugin catalogs and helpers
without component descriptors are not separately chunked in this initial source.

For example, load the small index, select a record, then read only that file:

```js
import { readFileSync } from 'node:fs'
import { selectDocuments } from './source/tools/ai-docs/corpus.mjs'

const index = JSON.parse(readFileSync('./corpus-0.3.0/index.json', 'utf8'))
const matches = selectDocuments(index, {
  version: '0.3.0',
  audience: 'consumer',
  framework: 'vue',
  component: 'button',
  topic: 'api',
})
const button = JSON.parse(
  readFileSync(new URL(matches[0].file, new URL('./corpus-0.3.0/', import.meta.url)), 'utf8'),
)
console.log(button.api)
```

Version, audience and framework are mandatory. Unknown versions/frameworks,
missing guides, unknown components and empty contributor coverage produce errors;
there is no silent fallback to another adapter, version or audience.
A framework query also includes shared records. `framework: all` selects only
shared records. Read `coverage` before presenting results as complete documentation.
Related records are hints, not automatic context expansion.

## Verify and extend

```sh
npm run test:ai-docs
npm run check:ai-docs
```

The first command runs offline validator/retrieval tests with small artificial API
fixtures. The second installs exact published 0.3.0 packages in a temporary consumer
directory, copies only public documentation/tool files, builds all API records,
checks release source paths, typechecks/builds the attached Vue and Nuxt
recipes and tests their form models/events, slots, keyboard and controller
remount lifecycle in Chromium. Nuxt also checks universal SSR without JS,
initial state across requests, unique ids/ARIA references and hydration. It needs npm access and the repository's Playwright
Chromium (`npx playwright install chromium`). CI runs both. It does not build
or install the current library checkout.

The initial matrix is deliberate: 63 of 65 published components have Vue exports and generated API;
the retained headless Button, Vue/Nuxt and React/Next recipes are checked. Other
framework guides retain their own coverage; shared extension/theme-authoring recipes
are now sample, and contributor instructions remain pending. API presence alone is not evidence of runnable recipes.

Start Vue/Nuxt consumption with [vue-start](./0.3.0/vue-start.md). The separate
records cover installation, bindings/events, composition/slots, ctrl/lifecycle,
Nuxt SSR and common mistakes; their related IDs lead to generated API records.
The shared Recipes and CtrlExample sources are used by both consumer scenarios.
Validation evidence is recorded in [validation](./0.3.0/validation.md).

The smoke prints its retained temporary project directory so its lockfiles and
builds can be inspected. Every Soxa package is pinned to 0.3.0, resolves from
npm once, and is checked in the lock. Vite uses Vue 3.5.32; Nuxt 4.6.3 uses
Vue 3.5.44. This does not imply support for every framework/runtime version.

For a new guide, reuse a checked example file, cite public release sources, add
related IDs and update only its real coverage. For another release, obtain its
published setup API, verify npm provenance/release revision, record its exact digest
and independently selected package pins, then run the external checks for that
release. Do not hand-edit generated API records.

React/Next.js consumption starts with [react-start](./0.3.0/react-start.md).
Run `npm run check:ai-docs:react` for its separate published-package smoke;
the existing `check:ai-docs` retains Vue/Nuxt verification. React recipes cover a
form, scoped slots, controller cleanup and Next SSR/RSC boundaries; coverage
remains sample. See [React validation](./0.3.0/react-validation.md) for evidence.

Angular consumption starts with [angular-start](./0.3.0/angular-start.md).
Run `npm run check:ai-docs:angular` for exact published 0.3.0 standalone CSR
and Angular SSR recipes: strict ngc/AOT, negative template guard, production
build, model/events, Forms, scoped slots, keyboard, controller teardown and hydration.
Coverage remains sample. See [Angular validation](./0.3.0/angular-validation.md).

Svelte/SvelteKit consumption starts with [svelte-start](./0.3.0/svelte-start.md).
Run `npm run check:ai-docs:svelte` for exact published consumers. This diagnostic
currently fails strict declarations (published Teleport TS2440); it is deliberately
not added to the shared CI job until the owner resolves the release blocker.
Runtime coverage is sample, not full typed readiness. See
[Svelte validation](./0.3.0/svelte-validation.md) for the tested limits.

Svelte record navigation: [installation](./0.3.0/svelte-installation.md),
[bindings](./0.3.0/svelte-bindings.md), [composition](./0.3.0/svelte-composition.md),
[controller](./0.3.0/svelte-controller.md), [SvelteKit](./0.3.0/svelte-sveltekit.md),
and [errors](./0.3.0/svelte-errors.md). Generated API is reached by related record IDs.

### Svelte development validation

The published 0.3.0 diagnostic remains separate and intentionally exits nonzero
on its immutable Teleport TS2440 declarations. Fixes in the development branch
do not change those npm bytes or the 0.3.0 corpus/API pins.

Run `npm run check:ai-docs:svelte:development` to build the current checkout,
pack its full Soxa dependency closure and install it into new temporary Svelte
and SvelteKit consumers. After an explicit `npm run build`, use
`npm run check:ai-docs:svelte:development -- --skip-build`. The command verifies
that package sources match the fetched `origin/main`, checks npm peers, each
tarball's integrity and exact version, unique package copies, the installed
development API digest, strict positive and negative templates, production,
keyboard/controllers and universal SSR/hydration/navigation. Every ARIA reference
must resolve in SSR and hydrated/open/closed states; published exceptions are
never accepted in this mode. CI runs this development check after building.

Its evidence.json records the exact source revision, package versions and origins,
tarball/API/input/lock digests and consumer outcomes. These artifacts retain the
workspace's current version numbers; they are unpublished development builds,
not evidence that npm 0.3.0 or npm latest contains the fixes. The development API
is recorded for auditing and never fed into the published corpus builder.
See [separate development evidence](./validation/svelte-development.md).
A future fixed published release requires its own exact-version corpus and
independent published-package validation before strict readiness can be claimed.

Solid/SolidStart consumption starts with [solid-start](./0.3.0/solid-start.md).
Use [installation](./0.3.0/solid-installation.md), [bindings](./0.3.0/solid-bindings.md),
[composition](./0.3.0/solid-composition.md), [controllers](./0.3.0/solid-controller.md),
[SolidStart](./0.3.0/solid-solidstart.md) and [release limits](./0.3.0/solid-errors.md).
Run `npm run check:ai-docs:solid` for strict published 0.3.0 types, production,
keyboard/model/callbacks, scoped slots, root refs, teardown and universal SSR.
The smoke uses no workspace library sources and keeps strict declaration checking.
It retains corpus/input/lock hashes and exact bounded ARIA observations, without
turning those observations into an assertion of complete ARIA validity.
See [Solid validation](./0.3.0/solid-validation.md). Framework coverage is sample.

The [independent SolidStart consumer](./0.3.0/validation-solid-consumer/README.md)
retains a different workshop application, its exact lock and a portable verifier.
It found the initial cold-route Suspense omission; corrected-public-corpus
validation and a fresh replay passed all 16 checks. The original evidence and
raw first-response snapshot are preserved separately.

Web Components consumers start with [webc-start](./0.3.0/webc-start.md).
The eight sample records cover [registration](./0.3.0/webc-installation.md),
[properties/events](./0.3.0/webc-bindings.md), [compound slots](./0.3.0/webc-composition.md),
[connection/cleanup](./0.3.0/webc-lifecycle.md), [browser/server HTML boundaries](./0.3.0/webc-environment.md),
[release limits](./0.3.0/webc-errors.md) and [validation](./0.3.0/webc-validation.md).
Run `npm run check:ai-docs:webc` to install exact registry packages in a new
external Vite consumer, check strict/negative types and production, exercise
Chromium keyboard/form/events/layer teardown, and distinguish raw server-authored
HTML from client upgrade. Append `-- --webkit` to run the same recipe and
HTML upgrade in WebKit using the matching Playwright Linux image through Docker.
This is not framework SSR or a test of the Safari application.
The single hidden Calendar label gap and Vite chunk-size warning are retained
explicitly. Evidence includes corpus/input/API/tool/lock hashes and npm origins.
Set `SOXA_WEBC_SMOKE_DIR` to an empty output directory to retain a known location.

The [independent Web Components consumer](./0.3.0/validation-webc-consumer/README.md)
retains a different workshop signup, exact lock, corpus hashes and portable verifier.
Its 13 Chromium checks and strict/negative types passed; a replay of the formatted
retained source is recorded separately.

## Shared theme and extension recipes

The 0.3.0 shared consumer records cover [Oren configuration](./0.3.0/oren-configuration.md),
[theme authoring on Base](./0.3.0/theme-authoring.md), [icon replacement](./0.3.0/icon-replacement.md),
[programmatic control](./0.3.0/programmatic-control.md) and [external plugins](./0.3.0/external-plugins.md).
They are returned for each adapter alongside its own installation/controller recipes.
Framework coverage is unchanged: the additional runnable integration uses Vue.

Run npm run check:ai-docs:recipes for exact published-package verification. It
uses only the manifest downloader's public file list, packs a minimal theme in
an npm workspace, then installs the pack into a new non-workspace consumer.
Strict types, custom-theme negative probes, production build and Chromium cover
controller ownership, external plugin prop/event transport and teardown,
keyboard, direction, dark schemes, motion attributes and replacement icons.
See [validation and limits](./0.3.0/public-recipes-validation.md) and the
[standalone example](./0.3.0/examples/public-recipes/README.md).
The shared records remain sample; a minimal theme is not a full component theme.

## Library contributor route

For adding a component to the library, use the separate
[source-pinned contributor guide](../contributing/README.md). Its baseline is the
0.4.0 source tree, not the installed 0.3.0 API. The 0.3.0 manifest's contributor
coverage remains pending: the consumer builder must not silently return newer
source-development instructions as release-specific contributor records.
