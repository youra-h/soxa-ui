# Replay the independent consumer evidence

Copy this directory into a new external directory, outside any library checkout.
Use Node 24.20.0 and npm 11.19.0. All package dependencies are pinned. Install and
build in that copy; do not use workspace aliases or library source directories.

```sh
npm install --no-audit --no-fund
npx playwright install chromium
npm run typecheck
npm run build
npm start
```

Keep that production server running on localhost:3127. In a second terminal in
the external copy run `npm run verify`. It writes final-browser-result.json and
final-ssr.html. It verifies functional behavior and the exact documented Tabs
SSR and inactive-panel reference limitations; it does not assert complete ARIA
validity. Run `npm run verify:all-references` to replay the original strict
reference assertion, which is expected to fail at the inactive Schedule tab's
missing panel target in published 0.3.0. Stop the server afterward.

The retained application is independently authored. For portable replay, the two
verifier imports were changed from an already-installed Playwright runtime's
machine path to the public playwright package. The replay manifest adds its exact
1.64.1 dev dependency and verification scripts; application/framework/Soxa pins
are unchanged. Prettier normalizes formatting. These retained-source adaptations
are distinct from the original recorded browser results and package-lock hash.
react-validation.json records both original verifier byte hashes and normalized
retained source hashes. The original exercise never read the repository.

The retained replay verifier also waits for an observed client action before typing
(the original warm-server exercise could race hydration on a cold replay), and
records failed network requests alongside console/page errors. The original
byte snapshots and independent results are kept distinct from these harness
corrections. The application and generated library attributes are unchanged.
