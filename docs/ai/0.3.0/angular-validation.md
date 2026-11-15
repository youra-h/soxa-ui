# Angular 0.3.0 validation

The maintained consumer uses exact published npm packages, never workspace aliases.
Angular/CLI/build/compiler/forms/SSR are 22.2.5, TypeScript 6.0.2, RxJS 7.8.2,
Express 5.1.0 and every Soxa package, theme and icon pack is 0.3.0.
The reusable package.json records all direct pins. The checked local runtime is
Node 24.20.0 / npm 11.19.0; CI uses its configured Node 24 runtime.

Run `npm run test:ai-docs` (32 offline corpus tests), then
`npm run check:ai-docs:angular`. The latter creates external CSR and SSR
applications, copies the public example sources, installs exact npm dependencies,
checks root versions/registry URLs and one copy of each Soxa package in the lock,
and retains/prints the temporary project paths and package locks. It runs ngc
with strictTemplates, strict TypeScript, skipLibCheck=false and extended diagnostics
as errors. Changing the imported Button's text input to a number must fail ngc;
the source is restored before the production build. Ordinary tsc is not the
Angular template check.

The browser verifies visible Label names, Input model and oldValue/newValue
payloads, signal-to-input updates, CheckBox Space, Select keyboard choice/Escape,
DatePicker keyboard date choice/close/Escape, scoped Accordion header updates,
Forms reset/disabled/touched, save action and three controller remounts. It checks
theme color-scheme, unique IDs, all ARIA ID references, failed requests, page errors
and console warnings/errors. CSR and hydrated dynamic SSR exercise the same sources.
SSR routes use RenderMode.Server, so two fresh requests also verify initial values
without JavaScript after a mutated browser session. The maintained production
initial bundles are about 840 kB CSR / 876 kB SSR browser assets, below 1 MB.

The published release has two bounded observations; **complete ARIA validity is
not claimed**:

- Raw SSR has one closed Select combobox `aria-controls` target ending in `-list`
  absent because its portal mounts in the browser. Its visible label is supplied
  by Label. The exact missing reference kind/role/visibility is checked; hydrated
  Select references resolve after interaction.
- Hydrated closed Calendar has one hidden picker dialog with `aria-labelledby`
  ending in `-picker-0` whose heading is absent. This is the existing release
  defect tracked at https://app.clickup.com/t/1an4hvw5ykx. The smoke asserts its
  exact hidden dialog, class set and DatePicker ancestry and rejects additional
  gaps; no console or hydration diagnostics are suppressed.

`npm run check:ai-docs` and `npm run check:ai-docs:react` also passed as Vue/Nuxt
and React/Next regressions. Their existing bundler size advisories remain visible;
Angular ngc has no warnings. The CLI default 500 kB initial warning budget remains active: maintained CSR/SSR and independent builds emit the expected size advisory while staying below the unchanged 1 MB hard error limit. Install-script advisories
from npm 11 concern third-party native dependencies and do not alter package pins.

The independent empty-context reconstruction, its immutable exported input IDs
and hashes, retained sources, exact commands/errors and outcomes are recorded in
angular-validation.json. This evidence is distinct from the maintained smoke;
consumer API comes from the published 0.3.0 artifact and release revision
9ae988633936a03e291e8e414028456fe1039c6b.

The empty-context agent built a distinct Library collection reservation app from
16 exported records, with no private memory or repository access. Its 14 checks,
strict ngc negative guard, production dynamic SSR and zero browser diagnostics
passed. It discovered the initial attached prerender route and selected Server
mode; the corrected immutable SSR record was separately re-read. The retained
source in validation-angular-consumer was replayed in a new external project: ngc,
production build and all 14 checks passed again. DatePicker, controller and slots
are covered by the maintained smoke, not this distinct reconstruction.
