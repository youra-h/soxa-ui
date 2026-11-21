# Published 0.4.2 validation

On 2026-11-21 all six adapter recipes passed their strict type/template checks,
production builds and Chromium interactions with exact published packages.
Applicable Vue/Nuxt, React/Next, Angular, Svelte/SvelteKit and Solid/SolidStart
SSR checks passed within their documented bounds. Shared theme/plugin recipes
passed. Web Components check server HTML enhancement, not framework SSR.

The attached JSON records API provenance, exact package pins and example input
hashes. Worktree hashes identify the tested inputs; the earlier Git base alone
does not prove it contains these later documentation files. Historical 0.4.1
evidence has not been relabelled as this release's validation.

The retained React/Next Tabs recipe still omits active panel content in raw SSR:
two missing panel references before hydration and one inactive panel reference
afterward remain explicit limits. No general SSR/accessibility claim is made.
Build observations include Vite chunk-size and Angular bundle-budget warnings.

The npm tarball passed bin/stdio lifecycle, SDK retrieval for all three exact
versions and a Vue Select/DatePicker consumer (types, production, Chromium).
An isolated VS Code 1.147.0 profile discovered all nine packaged MCP tools and
called list_versions and get_component for Select 0.4.2 through its real MCP
client. This is not an AI-authoring evaluation or published-registry test.
Linux and minimum-Node package checks run separately in CI; their outcome must
be read from that run. Coverage remains sample; contributor guides pending.
