# Independent consumer replay

This Library collection reservation app was reconstructed in an empty external
project using only 16 exported Angular/shared/API consumer records and public npm
declarations. It deliberately differs from the maintained travel fixture.
Original inputs, byte hashes, commands, sandbox failures and 14 observed checks
are in `../angular-validation.json`. The original wildcard prerender route was
corrected to Server mode; the independent app used Server mode and the corrected
immutable documentation record was separately re-read.

Copy this directory outside the repository before running, so Node cannot resolve
workspace dependencies. Use the pinned package.json with a supported Node 24
runtime:

```sh
npm install --no-audit --no-fund
npx playwright install chromium
npm run typecheck
npm run build
PORT=4149 npm start
```

In another terminal in that external directory:

```sh
npm run verify
node raw-a11y.mjs
```

On PowerShell, use `$env:PORT='4149'; npm.cmd start`. `CONSUMER_URL` overrides the
verifier's default `http://127.0.0.1:4149`. The verification writes local browser
results/HTML and a screenshot; those are evidence, not app dependencies. It checks
Forms, model/event synchronization, keyboard Select, labels, hydration, fresh
requests and unique IDs/ARIA references. The raw reference probe records the
closed SSR Select portal target absence. DatePicker, controller lifecycle and
scoped slots belong to the separate maintained smoke and are not claimed by
this independent example.

Retained adaptations are formatting, a pinned Playwright dev dependency, an
optional URL and failed-request diagnostics. Original byte hashes and normalized
retained hashes are distinct in the evidence. No library sources or private
project memory are needed for this replay.
