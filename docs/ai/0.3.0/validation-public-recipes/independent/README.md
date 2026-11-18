# Independent public-corpus consumer trial

A fresh agent received only the immutable public documentation at
`8e71e5e03f837a532dcab015abc48826319c783f`, fetched through its public fetch script,
and npm-published packages. It did not read the library source or private memory.
The CLI built 432 records and verified the published setup API hash. The trial
read the five shared recipes plus relevant Vue/controller/API records, copied the
public example and changed only its application labels to a report queue.

[Acceptance](./consumer-acceptance.json) records both Chromium pages, exact package
origins and integrities, controller/plugin reset and cleanup, keyboard, direction,
Tabs geometry, icon replacement and motion attributes. [Public inputs](./public-inputs.json)
retain the corpus and original example hashes. [Check records](./acceptance-checks.json)
retain command exit codes and original source/verifier/log hashes; [logs](./logs.json)
contain the successful type/build/browser outputs as base64 bytes with their original hashes. Decode an entry to restore the logical log path used by the check records. The custom theme tarball was
built from the exact public theme sources; it is not a published npm theme.

The retained [App](./App.vue) is the sole application source adaptation. To replay:

1. Fetch the public source at the revision above using its fetch script. Copy the
   complete `examples/public-recipes` directory into a new `consumer` directory.
2. Replace App with this retained copy. Restore `consumer-package.json.txt` and
   `consumer-package-lock.json.txt` as its package.json and package-lock.json.
   Run npm ci, npm run build:theme, npm run check and npm run build there.
3. Run npm pack for workspace `@example/soxa-theme`, with the parent directory as
   pack destination. Make `packed-consumer` from the same public example without
   the theme directory, replace App, and restore `packed-package.json.txt` plus
   `packed-package-lock.json.txt` under their npm filenames. The theme tarball
   must be next to this directory. Run npm ci, npm run check and npm run build.
4. From their parent directory, run this retained `verify.mjs`. It expects
   `consumer`, `packed-consumer`, `public-inputs.json` and the theme tarball there.
   Install Playwright 1.63.0 plus Chromium as test tooling, or set
   PLAYWRIGHT_MODULE to an installed Playwright module file. No library workspace
   is used by the application.

The `.json.txt` and [original verifier](./original-verify.mjs.txt) snapshots preserve
checked bytes without formatter changes. The executable [verifier](./verify.mjs)
is formatted to repository style. Its [formatted replay](./formatted-replay.json)
also passed both production pages against the same consumer. The separate
[retained hashes](./retained-hashes.json) identify these retained forms.

Limits: Vue and Chromium only. The small theme designs Button and horizontal
Tabs; the trial does not establish a complete theme, SSR, other-adapter behavior,
WebKit, contrast, forced-colors or a complete accessibility/gesture audit.
