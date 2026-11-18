# Published 0.4.1 validation

Validation date: 2026-11-18. The attached machine-readable record retains the
release/API provenance, exact installed library origins and lock digests, recipe
and tool hashes, and checked consumer scenarios. Framework pins remain in each
recipe or its smoke driver. Historical 0.3.0 evidence does not validate 0.4.1.

All six adapter recipes passed strict types, production builds and Chromium.
Vue/Nuxt, React/Next, Angular, Svelte/SvelteKit and Solid/SolidStart include their
applicable SSR checks. Shared themes/plugins and the MCP SDK consumer passed.
The MCP test constructs the Vue form from records received over the protocol;
this is not an interactive AI-authoring evaluation or a verified desktop setup.

React Tabs still omits initially active panel content in raw SSR: two Tabs-only
aria-controls gaps before hydration and one inactive-panel gap afterward remain
bounded. Select/DatePicker portal and hidden Calendar-label exceptions from
0.3.0 are rejected by the 0.4.1 drivers. Svelte strict declarations pass without
skipLibCheck. Web Components test server-authored HTML enhancement, not SSR.

The Web Components root registration and React Vite builds emit Vite chunk-size
warnings. Angular emits its initial-bundle warning. These are retained build
observations, not browser-console diagnostics. No bundle-size or complete
framework/accessibility coverage is claimed. New component APIs are generated
and retrieved for all adapters; runnable new-component showcases are not included.

The retained evidence identifies worktree inputs by hashes and records the Git
base separately. It must not be interpreted as proof that a release tag contains
these later documentation sources. CI repeats both versioned corpora on the
documentation PR. Desktop clients, WebKit for this release's recipes, independent
AI consumers and every regression path of the patch fixes remain outside this run.
