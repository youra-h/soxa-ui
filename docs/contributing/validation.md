# Contributor guide validation

Checked on 2026-11-18 against source revision
`f0a55f79e07c1655398db49f39ecdaaf5d387173` (component packages 0.4.0).
The existing Button is the representative example. No public component, API,
package version or generated library artifact was changed.

| Check                                                                                   | Result                                                                                                                       |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `node tools/contributor-docs/check.mjs`                                                 | Pass: eight modules, 84 local links, 52 pinned source witnesses, all six Button adapters                                     |
| Negative probes                                                                         | Rejected missing module, incorrect source hash, missing adapter, and incorrect component version; original manifest restored |
| `node --check tools/contributor-docs/check.mjs`                                         | Pass                                                                                                                         |
| `npx eslint tools/contributor-docs/check.mjs`                                           | Pass                                                                                                                         |
| Prettier on contributor docs/tool, modified skill/reference and AI documentation README | Pass                                                                                                                         |
| `npm run test:ai-docs`                                                                  | 37 passed; existing consumer delivery remains separate                                                                       |
| `git diff --check`                                                                      | Pass                                                                                                                         |

The walkthrough verifies source completeness, export inventories and generated
API availability. The adapter test files are source witnesses, not runtime test
results from this change. No component runtime, SSR/hydration, full package build,
browser layout or installation suite was run for this documentation-only change.
The [implementation checklist](./quality.md) lists when each is required.

The 0.3.0 consumer corpus retains its exact release sources and pending
release-specific contributor coverage. This new contributor route is a separate
source-pinned repository guide. It does not add a 0.4.0 npm corpus or automatically
publish website routes. Remote PR checks are reported by the PR itself and are
not represented as local evidence in this document.
