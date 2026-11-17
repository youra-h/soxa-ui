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
