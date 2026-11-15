# React and Next.js validation

The checked library packages are published npm 0.3.0, with immutable API provenance
from the manifest. Framework pins: React/React DOM 19.3.0, Next.js 16.2.3,
Vite 8.2.2, plugin-react 6.0.1 and TypeScript 6.0.2.

The external smoke checks strict types (including a negative prop guard),
production builds, typed field callbacks and reverse value updates, accessible
labels, checkbox Space, Select keyboard choice/dismissal, date change by keyboard,
scoped slots, form submit, StrictMode and three controller remount cycles.
Next checks raw HTML with JavaScript disabled, theme/icons, unique ids,
independent initial values on fresh requests, hydration and ARIA references.
Console warnings/errors, page exceptions and failed requests fail the scenario.

Known published limitation: even active Tabs.Content is absent from raw SSR HTML
until client mount. The smoke records the exact four absent aria-controls targets:
Select list, DatePicker panel and the two Tabs panels. After hydration only the
inactive unmounted Tabs panel is absent; switching tabs must replace that gap.
Labels and descriptions must always resolve. This is sample coverage, not a claim
of complete SSR accessibility. A separate library follow-up tracks active Tabs SSR:
[Tabs SSR follow-up](https://app.clickup.com/t/1an4hvw5ykt).

Commands: npm run test:ai-docs; npm run check:ai-docs;
npm run check:ai-docs:react; targeted ESLint and Prettier; English comment guard;
git diff --check. The React/Next smoke passed on 2026-11-15. The first strict run
found CheckBox's value includes undefined; the recipe now uses the public
ICheckBoxProps value type. No package API or version was changed.

Independent consumer exercise and final input hash evidence are being collected
before this draft is marked ready. The exercise receives only exported corpus
records and an empty external consumer, with no repository or memory context.
