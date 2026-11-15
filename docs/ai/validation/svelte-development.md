# Svelte development validation

Checked on 2026-11-16 (Asia/Yekaterinburg; UTC timestamp is in the structured
record). [Structured evidence](./svelte-development.json) records all exact
package versions, source/tool/input/API/tarball/lock digests and separate outcomes.

The consumer and harness source is commit
`bd3e7127eb8d0ff923b5728698fcdcd452aa38be`. Packed library sources exactly match
main commit `5a6b0429452e0d84d43dc7bf916e8bba13a2999a`; tracked worktree/index
and untracked-package checks enforce that provenance before packaging. No
library source or package versions were changed for this validation.

## Published baseline and development proof

| Source                                                   | Strict templates                                                              | Production/runtime                         | ARIA references                                                                                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Exact published 0.3.0                                    | Failed: Teleport TS2440, one error and zero warnings in each consumer         | Passed CSR, universal Kit SSR and Chromium | Historical two raw SSR controls gaps and one hidden Calendar label gap remain explicitly bounded                                    |
| Unpublished development tarballs from the revision above | Passed Svelte and Kit: zero errors and warnings; numeric Button text rejected | Passed CSR, universal Kit SSR and Chromium | Zero dangling controls/labels/descriptions before hydration, hydrated before interaction, open/closed popups and after route return |

The maintained scenarios check controlled input and programmatic reset, old/new
payloads, Label focus, checkbox Space, Select ArrowDown/End/Enter/Escape,
DatePicker keyboard selection, scoped snippets, theme, Save and three controller
remounts. SvelteKit also checks two independent no-JavaScript requests after
client mutations, unique IDs, hydration and route away/back teardown. Browser
console warnings/errors and page errors are zero, including the independent
popup open/close probe.

The tarballs carry the current workspace numbers: core/plugins/setup/Svelte,
Oren and theme-base 0.4.0; Material icons 0.3.1. They are **unpublished development
artifacts**, distinct from npm packages with those numbers. The complete seven
package closure is installed once per package from tarballs; npm peers,
lock origins, exact versions and integrities are checked. The installed
setup development API bytes must match the built API SHA-256. Independent
framework versions retain the exact fixture pins.

The 0.3.0 corpus still uses the exact published setup API with SHA-256
`869aa23426237c0b130466cd0de9fa0ff8e960412a99e058de824c9be02104dd`.
The development API is audit metadata and is never a published-corpus input.
No release directory or documentation version was retargeted.

## Reproduce

```sh
npm run build
npm run check:ai-docs:svelte:development -- --skip-build
npm run check:install -- svelte sveltekit
npm run check:ai-docs:svelte
```

The development command without `--skip-build` performs the package build itself.
Both consumer modes copy the same tracked examples to fresh temporary projects
outside the monorepo. Only temporary manifests receive development tarball specs;
the tracked recipes retain their exact npm 0.3.0 pins. Each run prints its retained
consumer directory and writes evidence.json. Keep those projects and locks for
inspection. The last command intentionally exits nonzero for immutable published
TS2440 while still exercising production and runtime diagnostics.

The SvelteKit fixture now keeps its canonical config as sveltekit-config.json;
npm prepare copies it to tsconfig.json before checking/building. This preserves
SvelteKit's generated `$app/tsconfig` inheritance after installation and avoids
an unresolved config when repository guards inspect examples before installation.
No shared guard was weakened.

## Independent consumer

A fresh-context validator received only seven selectively exported public records
(installation, bindings, composition, Button/Input/CheckBox/Label API), their
configuration examples and the development tarballs. It authored a different
newsletter signup with controlled email, old/new payloads, consent, disabled
Subscribe, action/reset and theme. No private memory or library sources were
available to that validation context.

It then reread the final committed records at the source revision above and
repeated strict checking, the negative numeric Button guard, production build
and Chromium interactions. Strict check: zero errors and warnings with
skipLibCheck false; negative guard: one expected consumer error and zero warnings.
Label, keyboard, controlled state/payloads, Button action/reset and theme passed,
with zero console warnings/errors or page errors. Exact selected record and
source file hashes, package/tarball versions, command outcomes and the retained
consumer lock digest are in the independent section of the structured evidence.
This independent scenario covers CSR Chromium, not SSR or a full accessibility
audit; maintained SvelteKit checks supply the separate SSR evidence.

## Other verification and remaining gate

The full package build, standard Svelte and SvelteKit tarball installation smoke,
33 corpus tests, 78 source-path guard tests and three Web Components waiting
queue tests passed. The last two reproduce the checks that failed on the original
PR: the fixture configuration is corrected here, and the queue implementation
fix was already in main. Targeted ESLint, Prettier, English-comment guard and
`git diff --check` passed. Shared consumer helpers were unchanged.

As checked on 2026-11-16, npm latest is still Svelte 0.4.0 with gitHead
`2ee52165b717c89c5b48be01ce83eca8ed648ac2`, preceding these fixes. A separately
authorized fixed published release and a corresponding exact-version corpus
still need published-package validation. Development success does not establish
strict readiness of immutable 0.3.0. Coverage remains a tested sample, and this
work does not release packages, merge, deploy or provide full adapter coverage.
