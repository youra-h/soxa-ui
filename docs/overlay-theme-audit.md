# Overlay theme audit: issues #885 and #888

Checked against source based on `7e3821a72` (2026-11-17).
This is a source and browser audit, not verification of an npm release.

[PR #887](https://github.com/youra-h/soxa-ui/pull/887) introduced
`TFrameThemePlugin` for every Frame, rather than only Web Components Menu.
It also addresses the Vue Popover example in
[issue #888](https://github.com/youra-h/soxa-ui/issues/888).
That issue concerns published 0.3.0; passing source tests do not prove those
installed packages contain the fix. No second implementation is needed.

## Inventory

The six adapters are Vue, React, Solid, Svelte, Angular and Web Components.
The inventory follows every component that renders or moves a layer.

| Component / part                                            | Theme source                                    | Browser coverage in all six adapters                                                             |
| ----------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Menu, Popover, Tooltip, Select, DatePicker                  | Nearest anchor theme, through Frame             | Initial open, dynamic theme, explicit panel override, scope removal, closed update and reopening |
| Menu.Submenu                                                | Anchor in the parent menu panel, through Frame  | Nested opening and subsequent theme changes                                                      |
| Menu.PopoverItem                                            | Anchor in the parent menu panel, through Frame  | Lazy first opening and subsequent theme changes                                                  |
| Popover with `contained`                                    | DOM ancestry                                    | Initial open and theme changes without a copied attribute                                        |
| Breadcrumbs overflow                                        | Embedded Menu anchor, through Frame             | First overflow opening and theme changes                                                         |
| Calendar month/year picker, standalone or inside DatePicker | Contained Popover and DOM ancestry              | First picker opening and theme changes                                                           |
| Frame                                                       | Anchor when supplied; otherwise target ancestry | Shared plugin unit tests; browser checks through all anchored consumers above                    |
| Dialog, AlertDialog, Drawer, Toasts                         | Target ancestry                                 | Explicit themed target and subsequent theme changes                                              |
| Other components and ordinary parts                         | DOM ancestry                                    | Source inventory: no independent portal to escape the theme boundary                             |

The shared plugin's unit tests additionally cover replacing/moving the anchor,
adding/removing a nearer scope, equal-value explicit writes, cleanup,
already-bound installation and shadow-host ancestry. These are unit checks,
not a browser matrix for every lifecycle edge case.

## Reproduction guard

[`layer-theme.spec.ts`](../packages/playground/vue/browser/layer-theme.spec.ts)
contains the actual Vue consumer shape from #888: a Popover with a trigger
slot forwarding `triggerAria` and `triggerDataset`, and an Input in its panel.
It opens by clicking the trigger while `html` uses `oren` and the local
boundary uses `oren-dark`. The panel and Input must retain the local surface
token, which must differ from the document token.

The host matrix also opens initially closed panels after changing local and
document themes in opposite directions, then closes and reopens them.
Matching document and scene themes must not hide a regression.

## Layers without an anchor

Automatic anchor inheritance does not apply to Dialog, AlertDialog, Drawer,
Toasts or a Frame without an anchor. Their default target is `body`; a local
wrapper around the declaration is not their rendered ancestor. Use the existing
`target` selector for a mounted container under the intended theme. Prefer a
container outside clipping or transformed ancestors for viewport layers.

For example, declare a portal target before mounting a Vue application:

```html
<div id="local-overlays" data-so-theme="oren-dark"></div>
```

```vue
<Dialog target="#local-overlays" :visible="shown">
  <template #title>Settings</template>
  <Input aria_label="Name" />
</Dialog>
```

The same `target` selector works for AlertDialog, Drawer and Toasts across
all six adapters. Ancestor theme changes reach the layer by ordinary CSS
inheritance. This is an explicit target contract, not automatic inheritance
from the declaration site.

Copying `data-so-theme` preserves a named boundary. Arbitrary inline variables
or custom descendant selectors are not copied across portals. SSR without a
DOM, physical mobile devices and published consumer builds are outside this
audit's browser evidence.

## Validation

The expanded suite has 121 passing cases in Chromium and 121 in WebKit
through the Windows Docker runner. The 10 shared-plugin unit tests, playground
Vue typecheck, ESLint and formatting checks pass. Temporarily removing
`FrameThemePluginDescriptor` from Frame makes the exact #888 guard fail
(`oren-dark` expected, theme attribute absent); restoring it makes the guard
pass. The temporary mutation is not part of this change.

The first remote WebKit job could not launch: `ubuntu-latest` selected
Ubuntu 26.04 while its restored browser required `libicudata.so.74`. The
browser matrix is pinned to Ubuntu 24.04 and its cache key now includes that
Ubuntu release and runner architecture to prevent incompatible reuse.

## Re-run

```sh
npm run test:plugins -- frame-theme.plugin.spec.ts
npm run test:layout -- layer-theme.spec.ts
npm run test:layout:webkit -- layer-theme.spec.ts
```

The last command uses the repository's Docker runner on Windows. This follow-up
changes tests, documentation and the browser CI environment; no package
changeset is required.
The implementation remains the shared fix from #887.
