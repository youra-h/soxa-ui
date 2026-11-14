# Vue/Nuxt 0.3.0 consumer validation

Checked on 2026-11-14 with exact published Soxa packages. No current library
source, workspace aliases, API casts or ClientOnly wrappers were used.

## Repeatable integration

Run npm run test:ai-docs and npm run check:ai-docs. The first has 28 offline
checks, including registration and nested Nuxt delivery. The second builds 389
corpus records (63 Vue API records), verifies release-source paths/API digest and
lockfile versions, and creates separate npm consumers.

- Vue 3.5.32 / Vite 8.2.2 / TypeScript 6.0.2: strict types, production build,
  Chromium form and retained minimal Button sample passed.
- Nuxt 4.6.3 / Vue 3.5.44 / TypeScript 6.0.3: strict types, universal production
  build, hydrated Chromium interactions and JavaScript-disabled SSR passed.
- Both: Input label click/focus, named models and typed change payload, CheckBox
  Space, Select custom slot and arrows/End/Enter/Escape, DatePicker calendar
  ArrowRight/Enter changing 2026-11-14 to 2026-11-15, Accordion scoped header,
  keyboard submission/Tab and three ctrl action/unmount/remount cycles passed.
- Fresh SSR requests after browser changes: initial form/controller state,
  unique ids, resolvable ARIA references and server-rendered icons passed.
  Runtime console warnings/errors, page exceptions and request failures are
  fatal; none occurred, including hydration warnings.

[Integration evidence](./validation-smoke.json) records pins, runtime,
source/runner hashes and lock digests. Locks/builds remain in the printed temporary
consumer directory; they are not committed. CI runs the maintained integration
runner without building the library.

## Independent empty-context exercise

A fresh agent received only an exported corpus and an empty consumer directory.
Repository/sibling code, private memory and external documentation were forbidden.
It read seven Vue guides and generated Input/CheckBox/Select/DatePicker/
Accordion.Item API records, then authored a different weekend-workshop form and
seat controller.

[Independent report](./validation-consumer/validation.json) records exact input
corpus/document hashes, packages, commands, errors/fixes and source/config/lock
hashes. Input was a pre-commit snapshot: base docsRevision does not mean those
draft bytes were already public at that commit. Input hashes identify the bytes
read. Final source filenames/prose/navigation were refined after that snapshot.

The independent UI passed Vite 7.3.1 and Nuxt 4.3.1 strict types/builds with Vue
3.5.30, TypeScript 5.9.3, Soxa 0.3.0 and Chromium 145.0.7632.6. Models, typed
newValue/oldValue, labels, custom/scoped slots, actual keyboard date changes,
submission and three ctrl cleanup/remount cycles passed; Nuxt also passed SSR
without JS and fresh state across requests. Runtime diagnostic arrays are empty
in [browser evidence](./validation-consumer/browser-results.json). One browser
test fix narrowed an ambiguous status-role locator. Environment/npm failures are
recorded; there were no public API type errors or contract misunderstandings.

The report's sourceHashes identify original validated bytes; snapshotHashes identify
source snapshots under validation-consumer/sources after Git normalizes CRLF to LF,
with .txt appended to original paths. They are
immutable one-time validation evidence, not maintained recipes or CI fixtures.
Restore original filenames into an external folder, install each package.json
and run the recorded commands to reproduce. Locks, node_modules, browser binaries
and builds are excluded. Lock digests identify this run; future transitive
resolutions can differ.

## Limits

Chromium and the stated scenarios do not establish every component/browser or a
full assistive-technology audit. The maintained Nuxt build reports a client chunk
above 500 kB; that build-size warning remains visible. Runtime/hydration diagnostics
fail the check. Independent teardown checks observe cleanup/fresh counters rather
than instrumenting event-listener memory. No package, website, release or deployment
was changed by this documentation task.
