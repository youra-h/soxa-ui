# Build a theme on Base 0.4.1 for Soxa 0.4.2

A theme supplies CSS, type augmentation and a behavior object. The attached
`@example/soxa-theme` is a small Button/horizontal-Tabs demonstration, not a
complete alternative to Oren. It declares `studio` and `soft` only where it draws
them. Other controls retain Base mechanics without a finished visual design.

Start the stylesheet with `@import '@soxa-ui/theme-base'`. Bundle it into the
published theme CSS. Base owns structure, size scales, reset, disabled subtree
opacity, direction signs and gesture geometry. Put your look into a later layer
(the example uses `studio`). Keep application resets earlier, and utilities
later. Scope theme selectors to library classes; page and slot typography belongs
to the application. State selectors use `data-*`, not ARIA. A false boolean
is the string `"false"`, so match `[data-selected='true']` explicitly. Check each
attribute's DOM scope in the published class/data reference before using it.

Use the two public Base JSON exports as the reference:
`@soxa-ui/theme-base/theme-contract.json` describes roots, parts, modifiers and
datasets; `@soxa-ui/theme-base/theme-variables.json` describes variable meanings.
The attached inspection script reads them from the installed package. Do not
copy a current repository contract into a 0.4.2 application. The generated setup
API has `typeContext: library-without-theme`: it cannot enumerate your theme's
values and is not a replacement for theme declarations or Base's contracts.

In the variable reference, `base-reads` includes scales/surfaces set by a theme
and geometry written by the library. Read the meaning, not just the section
name: do not overwrite plugin measurements or gesture offsets. `theme-reads`
contains additional values the theme can read. Set `--so-place-surface` to the
page/card surface and `--so-panel-surface` where your panels are painted. Use
logical sides and `--so-dir-sign` for mirrored graphics; do not invent another
RTL registry. Dim disabled controls through `--so-disabled-opacity` once.
Movement needs the document's motion gate; the minimal theme adds no movement.

Declare the theme's actual modifiers by augmenting the core registries in the
root `index.d.ts`. Import the theme behavior from TypeScript: its emitted
`/setup` declaration keeps the reference to the root types with `preserve="true"`.
The example builds inside an npm workspace so the self package reference resolves;
it then packs CSS, JS and declarations for installation in a second clean consumer.
Its independent type probe accepts `studio`/`soft` and rejects Oren's `accent`
and an invented view without importing Oren's augmentation.

The behavior uses `defineTheme` and installs `TTabsViewPlugin`, `TTableHeadPlugin`
and `TToastsFrontPlugin` from Base's public `/setup` export. It supplies shared
geometry for those components, including embedded parts. Registration is not
scoped by the theme name: only CSS selectors and attributes select a scheme.
Use one theme behavior per application configuration. Base is a runtime dependency
pinned exactly to 0.4.2; core/setup peers are compatible `^0.4.2` ranges. Custom
themes have their own versions. Runtime JS imports stay external in the theme
bundle so the consumer shares its core/setup instances.

Run the attached workspace's install, theme build, strict types and app build.
The validation also installs the packed theme in a new non-workspace consumer,
checks keyboard activation, Tabs geometry, RTL and cleanup. A full theme still
needs designs and checks for every supported component, focus/contrast, forced
colors, motion, overlay surfaces, gestures and all intended browsers.
