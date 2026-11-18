# Theme, metadata and discovery

Read [theming](../agents/theming.md), [Base](../../packages/themes/base/README.md)
and [Oren](../../packages/themes/oren/README.md). Structure belongs to Base;
colors, scales and appearance belong to Oren. Keep layer ordering, logical
direction and motion policy. Do not style the page globally or select by ARIA.

Add Base component CSS and its import/layer when structure is needed. Add Oren
styles, layer/import and registry augmentation for appearance. Inspect style
exports/build enumeration; a stylesheet alone may be unreachable. Pure style
work uses `npm run build:css --workspace=@soxa-ui/theme-oren`; theme setup behavior
also requires built dependencies.

Record roots, parts, modifiers and data attributes with emission witnesses in
[theme-contract.json](../../packages/themes/base/theme-contract.json). New variables
need [theme-variables.json](../../packages/themes/base/theme-variables.json).
Themes own appearance values and default context; never hardcode an Oren view in
an adapter. Inspect both schemes, RTL, disabled/focus, reduced motion and
component-specific states.

## Register every discovery surface

| Surface                  | Check                                                                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Core/setup               | Component indexes, custom model barrel, descriptor barrel and root reachability                                                            |
| Six UI packages          | Component/root barrels, compound parts and public types; package subpaths where supported                                                  |
| Web Components           | Native registration, root entry, individual package export and emitted entry                                                               |
| Reviewed application API | [exports.json](../../tools/public-api/exports.json); values and types checked separately                                                   |
| Generated API            | Angular manifests identify primary/facade descriptors; run `npm run generate:api`, inspect [contract.json](../api/generated/contract.json) |
| Playground/parity        | [shared registry](../../packages/playground/shared/src/registry.ts), scenarios, each renderer and browser coverage                         |
| Theme                    | Class/data/variable inventories, Oren augmentation, imports/layers, style exports and behavior registration if needed                      |
| Installation             | Relevant [install-smoke projects](../../tools/install-smoke/projects) compile public imports from packed declarations/JS                   |

See [API generation](../api/README.md) and [export checks](../../tools/public-api/README.md).
Discovery starts at Angular manifests and checks real exports across six adapters.
Events/defaults/models/slots must match the model and descriptor. Do not manually
edit generated JSON or author six copies of API tables.

Current source metadata does not update an older pinned consumer corpus. Add a
new published corpus only after its exact package API artifact is available.
