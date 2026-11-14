# Versioned public documentation source

This directory is the library-owned source format for small, versioned AI
documentation records. The initial release directory is **0.3.0**. The separate
website owns its routes, localization, prose pages, rendering and public
`llms.txt` endpoints. This format supplies metadata, a minimal shared overview,
a sample recipe and generated API records; it does not replace those pages.

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
  augmentation. The initial headless example uses neither.
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
curl -fL https://github.com/youra-h/soxa-ui/archive/<full-docs-commit-sha>.tar.gz -o source.tar.gz
mkdir source
tar -xzf source.tar.gz --strip-components=1 -C source
mkdir api-source
cd api-source
npm init -y
npm install --ignore-scripts --save-exact @soxa-ui/setup@0.3.0
cd ..
node source/tools/ai-docs/cli.mjs --manifest source/docs/ai/0.3.0/manifest.json --package api-source/node_modules/@soxa-ui/setup --revision <full-docs-commit-sha> --out corpus-0.3.0
```

The builder needs only Node 22.12+ and the two archive directories
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
checks release source paths, typechecks/builds the attached Vue sample and tests
click plus Enter in Chromium. It needs npm access and the repository's Playwright
Chromium (`npx playwright install chromium`). CI runs both. It does not build
or install the current library checkout.

The initial matrix is deliberate: 63 of 65 published components have Vue exports and generated API;
only one Vue installation example is demonstrated. Other framework guide coverage,
Nuxt/SSR, themes/extensions/ctrl and contributor instructions remain pending in the
existing AI Docs tasks. Their API presence alone is not evidence of runnable recipes.

For a new guide, reuse a checked example file, cite public release sources, add
related IDs and update only its real coverage. For another release, obtain its
published setup API, verify npm provenance/release revision, record its exact digest
and independently selected package pins, then run the external checks for that
release. Do not hand-edit generated API records.
