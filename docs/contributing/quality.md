# Quality gates and maintenance

## Guide-only validation

Run `node tools/contributor-docs/check.mjs` and
`npx prettier --check docs/contributing tools/contributor-docs`. The checker verifies
local links, source revision, hashes and Button's six adapter source/test pairs,
API/export/theme witnesses. It does not execute component tests or a browser.

## Component implementation checks

Use [build/version rules](../agents/build.md) and the target revision's CI for
exact commands. Implementation needs behavior and types across affected layers.

1. Add focused default/setter/event/invariant tests. Run `npm run test:core`,
   `npm run test:setup`, and `npm run test:plugins` when plugins change. Test
   server assembly/disposal without DOM globals, state/event delivery and ownership.
2. Add and run `npm run test:vue`, `test:react`, `test:angular`, `test:solid`,
   `test:svelte`, `test:webc`. Cover props and ctrl updates, slots/fallback,
   native attributes/forms, ref, events and teardown. Include supported server
   and hydration cases; CSR alone cannot establish SSR parity. Repair console
   warnings/Angular diagnostics rather than weakening their guards.
3. Generate Angular metadata and API. Inspect intended changes, rerun for drift.
   Run `npm run check:api-docs`, `npm run test:api-docs` and
   `npm run typecheck:api-docs`.
4. Run targeted ESLint/Prettier and manually review logical blocks. Run
   `npm run build`, then matching CI type checks: core/setup `tsc --noEmit`,
   Vue `vue-tsc`, React/Solid `tsc`,
   `npm run check --workspace=@soxa-ui/svelte` and Angular
   `ngc -p packages/ui/angular/tsconfig.json`. Build declarations before checks
   resolving built neighbors. Angular checks templates and AOT as well as TS.
5. After build, run `npm run check:published-imports`, `npm run check:public-api`,
   `npm run check:client-directive`, `npm run check:api-package` and relevant
   `npm run check:install -- <projects>`. Confirm declared runtime/peer imports
   and React client directives survive packaging. Source alias tests alone do
   not validate what consumers install.
6. For styles/layout run `npm run test:theme`, `npm run test:layout` and applicable
   parity scenarios. See [browser testing](../../packages/playground/AGENTS.md)
   for Chromium/WebKit, including the Windows WebKit route. Do not substitute
   one browser for another. Inspect appearance as well as computed invariants.
   Overlays/dates need their focus, keyboard, portal/locale and hydration cases.

Choose checks by actual changes and report results/unrun coverage separately.
Guide-only structural validation does not imply the full checklist passed. A new
component needs the complete applicable path before claiming six-adapter parity.

## Changeset decision

Library components share a fixed Changesets version; themes/icons are independent.
Compatible fixes/additions use patch for each affected package. A specifically
authorized break before 1.0 uses minor with English upgrade instructions.
Tests/tools-only changes inside a library package need an empty changeset.
Docs/skills/tools outside packages, including this walkthrough, need none.
Do not edit versions/CHANGELOG by hand or release as a component-work side effect.

## Updating this guide

When architecture, helpers, discovery, theme contracts or CI change, review the
module and skill entry together. Prefer canonical reference links over copied
implementations. To move the baseline, inspect the source diff, update the full
`sourceRevision` and package version in the manifest/entry, regenerate witnesses
from that revision, rerun the checker and affected checks, and report limitations.
Do not just refresh hashes to hide drift. Keep the 0.3.0 consumer manifest and
API provenance unchanged. Publish no private memory, credentials, task history
or personal procedures.
