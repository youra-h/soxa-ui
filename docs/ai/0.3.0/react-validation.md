# React and Next.js validation

Published Soxa packages are exact 0.3.0, with immutable API provenance in the
manifest. Framework pins: React/React DOM 19.3.0, Next.js 16.2.3, Vite 8.2.2,
plugin-react 6.0.1, TypeScript 6.0.2; Node 24.20.0, npm 11.19.0.

The maintained external smoke passes strict types with skipLibCheck=false and
ES2024 declarations (target ES2022), a negative prop guard, production builds,
typed field callbacks and reverse value updates, accessible labels, checkbox
Space, Select keyboard choice/dismissal, date change by keyboard, scoped slots,
form submit and three controller unmount/remount cycles. It also runs Vite's
development server so StrictMode exercises repeated effect setup/cleanup.
Next checks raw HTML with JavaScript disabled, theme/icons, unique ids,
independent initial values on fresh requests, hydration and ARIA references.
Console warnings/errors, page exceptions and failed requests fail the scenario.
Vue/Nuxt smoke remains separate and passes.

Commands: npm run test:ai-docs (30 tests); npm run check:ai-docs;
npm run check:ai-docs:react; targeted ESLint and Prettier; English comment guard;
git diff --check. Checks ran on 2026-11-15. The first strict run found CheckBox's
value includes undefined; the recipe now uses ICheckBoxProps['value']. No package
API or version was changed. Vite reports a bundle-size advisory for the complete
sample import graph; this is distinct from a browser console diagnostic.

## Exact published limitations

Raw Next SSR contains four absent aria-controls targets: Select's list,
DatePicker's panel and both Tabs panels. Even active Tabs.Content is absent until
client mount. Hydrated Tabs unmounts inactive contents; switching tabs changes
which single inactive tab references an absent panel. This is tracked separately
in [the Tabs SSR follow-up](https://app.clickup.com/t/1an4hvw5ykt).

After the date keyboard scenario, one closed, display:none Calendar month-picker
popover retains aria-labelledby to its unmounted *-picker-0 heading. It remains
hidden after 1.5 seconds. The maintained smoke requires that precise hidden
role=dialog owner inside DatePicker, with no additional missing labels or
visible-owner gaps. See [the Calendar label follow-up](https://app.clickup.com/t/1an4hvw5ykx).

The maintained verifier checks these bounded observations, including exact counts,
owner roles, attributes and target suffixes. It does not claim complete ARIA
validity, SSR panel availability or full framework coverage. Application examples
do not rewrite generated ARIA attributes or disable SSR.

## Independent fresh consumer exercise

A separate agent started with no inherited context, only the exported corpus and
an empty external npm project. It could inspect published package declarations;
it could not read repository sources, memory or the maintained fixture. It built
a different workshop registration form with typed Input/CheckBox events, visible
labels, scoped Accordion and a server-imported Tabs tree. Its source/config and
original/final browser results are retained in validation-react-consumer.

The first input snapshot was exported before the source commit; its docsRevision
was the base checkout SHA and is not claimed as an immutable source identity.
The original declared-content hashes, bundle byte hash and failing all-reference
result remain evidence. The exercise found Next's PromiseWithResolvers declaration
needs ES2024 lib with skipLibCheck=false, and next typegen uses jsx=react-jsx.
Both corrections are in the maintained instructions and runner. Windows shell
policy/BOM problems were exercise harness fixes, not library changes.

The agent then read the corrected exported records at immutable documentation
commit 6d1e3a8e104a5a5ace18814aa009bfceea5b2a2c, reran strict types, production
build and browser checks on its independently authored application. Removing the
negative prop guard produced TS2322; restoring @ts-expect-error passed. Functional
SSR, callbacks, checkbox, submit, reverse prop updates, Accordion, Tabs activation,
fresh reload isolation, icons/CSS, unique ids and clean console passed. The final
verifier records exactly two absent Tabs SSR targets and one inactive hydrated
target; original strict all-reference evidence remains failing. It does not
exercise Select/DatePicker and does not claim complete ARIA validity.

react-validation.json records pins, commands, normalized source SHA-256 values,
original snapshot identity, exact final corpus input byte hashes, declared content
hashes and outcomes. Final-corpus hashes identify exported bytes, separately from
normalized repository source hashes. Browser evidence contains no private paths.

The retained validation-react-consumer README gives external replay commands.
Both the original strict and final bounded browser verifier are included, with
portable public Playwright imports and exact replay pin 1.64.1. Original verifier
byte hashes and normalized retained-source hashes are recorded separately.

A fresh external replay of those retained files passed install, strict typecheck,
production build and the final verifier; the strict original verifier reproduced
the expected inactive Schedule target failure. A cold hydration race in the replay
harness was corrected by waiting for an observed public action/state update before
typing. Failed requests are recorded with console/page diagnostics. This adaptation
is documented separately from the original independent byte snapshots.
