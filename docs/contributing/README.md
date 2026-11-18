# Author a Soxa library component

Audience: contributors and agents changing the library itself. For application
usage, use the separate [versioned consumer corpus](../ai/README.md).

This guide describes source revision `f0a55f79e07c1655398db49f39ecdaaf5d387173`
(component package version **0.4.0**). It does not describe installed 0.3.0
packages and is not part of the 0.3.0 consumer manifest. Check out that revision
for the exact source map, or revalidate the guide against your target revision.
The guide's own revision is the Git commit from which you read these files.
[manifest.json](./manifest.json) records the source baseline, modules and
hashed witnesses. Read this public source directly from a Git checkout or
GitHub at a full commit SHA; no private project context is needed.

## Choose a reading route

Start with the intended consumer contract: imports, props, events, slots,
controller ownership, native behavior and the CSS surface. A new public
component needs an agreed product scope. Do not create one to test this guide.

| Kind                            | Read in order                                                                   | Existing example                |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------- |
| Simple visual component         | start, model, adapters, themes, quality                                         | Button                          |
| Collection owner or item        | start, model, collections, adapters, themes, quality                            | Tabs and Tabs.Item              |
| Compound with internal controls | start, model, collections, adapters, themes, quality                            | Select and its field/tags       |
| Overlay                         | start, model, adapters, themes, quality; overlay reference                      | Frame, Popover, Dialog          |
| Date control                    | start, model, collections as needed, adapters, themes, quality; dates reference | Calendar, DateInput, DatePicker |
| Headless provider               | start, model, adapters, quality; explicitly omit visual/theme work              | Virtual                         |

Modules: [model and descriptor](./model.md), [collections and parts](./collections.md),
[six adapters](./adapters.md), [themes and inventories](./themes.md),
[quality and maintenance](./quality.md). Read [architecture](../architecture.md)
before choosing a new abstraction. Conditional references:
[overlays](../agents/overlay.md), [dates](../agents/dates.md),
[component patterns](../agents/patterns.md).

## Boundaries

Core owns behavior and values. Plugins own DOM operations. Setup content declares
contracts and wires lifecycles. Adapters translate framework lifecycles, reactivity,
slots and attributes; they do not decide component behavior. Themes own appearance.
Vue, React, Angular, Solid, Svelte and Web Components all need an explicit parity
review. A framework-specific failure is not evidence about the other five.

Public API has been frozen since beta: exports, types, props, events, slots,
`so-*` classes, `data-*` attributes and `--so-*` variables are contracts. A breaking
change needs a specific maintainer decision and consumer migration instructions
before implementation. Release authorization does not authorize a new break.
Changes under `packages/setup/protected/` require separate explicit maintainer
authorization; normal components use existing setup content mechanisms. Do not
hide a limitation there behind a component-local workaround.

Code comments, commits and changesets are English. Explain public contracts,
ownership and non-obvious lifecycle constraints; preserve readable logical blocks.
This guide contains no task-board, hosting or personal workflow.

## Worked acceptance example

Follow the existing **Button**, without adding or modifying a public component.
The [walkthrough](./button-walkthrough.md) maps every required layer to actual
files, including six adapter tests, generated API, inventories and release
classification. Run `node tools/contributor-docs/check.mjs` to verify the map
and guide links against the pinned source. This is structural evidence;
runtime test evidence must be reported separately.

Recorded results and limits: [validation](./validation.md).
