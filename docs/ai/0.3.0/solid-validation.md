# Published Solid consumer validation

Run npm run check:ai-docs:solid from the documentation source checkout.
The tool copies standalone recipe inputs to new temporary projects outside the
monorepo and installs exact published packages. No library source, build output,
workspace alias or private memory participates in their resolution.

The retained workspace contains npm locks, installed published artifacts,
production builds and evidence.json. Evidence identifies the documentation
revision, Node version, package origins/integrities and lock digests. Runtime
warnings/errors, failed requests and hydration exceptions fail the check.
A successful check is bounded to these scenarios and package pins.

Checked on Node 24.20.0 and Chromium on Windows. Both projects passed strict
TypeScript with skipLibCheck=false, production compilation and the bounded
browser suite. All seven installed Soxa packages resolve once at 0.3.0 from npm;
npm ls reports no peer errors. Framework/compiler pins are in solid-installation.

The suite checks typed controlled values and payloads, reverse prop updates,
visible-label focus, Space/Select/calendar keyboard actions, live Accordion and
Select scopes, root-ref focus, form submission, three controller remounts, client
navigation away/back, unique ids, icons, and two fresh no-JS SSR requests.
The negative disabled prop remains rejected. Browser diagnostics are unfiltered.

Full ARIA validity is not claimed: raw SSR has exactly two missing aria-controls
targets for closed Select/DatePicker portals. Hydrated calendar open/close retains
one hidden dialog's missing aria-labelledby target. Roles, labels, target suffixes,
classes and hidden state are bounded explicitly; additional gaps fail the smoke.
These immutable 0.3.0 observations do not establish current-development behavior.

The attached structured evidence measures corrected immutable source
7ccbde9db519476a26a8e40839cf2e3eddbe8d7c. Public SHA download delivered
108 files (173595 bytes); its downloaded builder produced 418 records using
published setup@0.3.0. Recipe-input hashes and exported corpus-byte hashes are
recorded separately. Later evidence-only edits do not retarget that snapshot.

The initial e5a005fc2b428963e6974a58bf3366bedbfc3723 snapshot warmed the route
with its readiness GET and did not establish cold-route SSR. An independent
consumer found that its first SolidStart response could be empty. The maintained
app now wraps lazy route children in Solid Suspense; the smoke disables the HTTP
probe and checks the first no-JS home response before testing hydration.
The initial warm-only evidence remains at the archived revision/path in JSON.
This was an application setup/documentation correction, not a Soxa runtime patch.

An agent with no library source or project memory built a different SolidStart
workshop signup from the exported consumer JSON. After reading the corrected
immutable source, all 16 checks passed: strict/negative types, production, cold
no-JS SSR, form/callback/reverse updates, keyboard Select/Calendar, live Accordion
focus, root refs, explicit subscription cleanup, three remounts, route teardown,
request isolation, unique ids/icons and clean browser diagnostics.

The independent source, portable verifier, lock, original response and input
hashes are retained under validation-solid-consumer. Original evidence is kept
separately from a fresh external replay of the formatted retained files.
That replay also passed all 16 checks and npm ls, with the same bounded release
ARIA observations. The fixture changes a disposed controller after removing its
listener to test observable cleanup; this is not a heap-leak audit.
