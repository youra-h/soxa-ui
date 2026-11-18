# Button: a complete source walkthrough

This is a read-only acceptance example against the source revision in
[manifest.json](./manifest.json). It introduces no new public component or API.
The checker verifies pinned file hashes and semantic inventory membership.
It is not a runtime, layout, SSR or hydration test result.

## Follow the component

1. Read the [model](../../packages/core/src/components/custom/button/button.class.ts)
   and [types](../../packages/core/src/components/custom/button/types.ts): inherited
   Textable behavior, native button tag, undefined theme-owned view, setter payload
   and class/ARIA output. The [model test](../../packages/core/__tests__/button.spec.ts)
   is the starting regression suite.
2. Read the [descriptor](../../packages/setup/content/descriptors/components/button.descriptor.ts):
   parent factory, view trigger, explicit event and typed default slot scope.
   Compare the custom/core and descriptor barrels with the manifest witnesses.
3. Follow each adapter below from assembly to markup, component barrel and package
   root. The existing tests exercise its actual binding; read them before copying.

| Adapter | Assembly                                                                    | View                                                                        | Export                                                             | Test                                                       |
| ------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| vue     | [setup](../../packages/ui/vue/src/components/button/setup.component.ts)     | [view](../../packages/ui/vue/src/components/button/Button.vue)              | [barrel](../../packages/ui/vue/src/components/button/index.ts)     | [spec](../../packages/ui/vue/__tests__/button.spec.ts)     |
| react   | [setup](../../packages/ui/react/src/components/button/setup.component.ts)   | [view](../../packages/ui/react/src/components/button/Button.tsx)            | [barrel](../../packages/ui/react/src/components/button/index.ts)   | [spec](../../packages/ui/react/__tests__/button.spec.tsx)  |
| angular | [setup](../../packages/ui/angular/src/components/button/setup.component.ts) | [view](../../packages/ui/angular/src/components/button/button.component.ts) | [barrel](../../packages/ui/angular/src/components/button/index.ts) | [spec](../../packages/ui/angular/__tests__/button.spec.ts) |
| solid   | [setup](../../packages/ui/solid/src/components/button/setup.component.ts)   | [view](../../packages/ui/solid/src/components/button/Button.tsx)            | [barrel](../../packages/ui/solid/src/components/button/index.ts)   | [spec](../../packages/ui/solid/__tests__/button.spec.tsx)  |
| svelte  | [setup](../../packages/ui/svelte/src/components/button/setup.component.ts)  | [view](../../packages/ui/svelte/src/components/button/Button.svelte)        | [barrel](../../packages/ui/svelte/src/components/button/index.ts)  | [spec](../../packages/ui/svelte/__tests__/button.spec.ts)  |
| webc    | [setup](../../packages/ui/webc/src/components/button/setup.component.ts)    | [view](../../packages/ui/webc/src/components/button/Button.element.ts)      | [barrel](../../packages/ui/webc/src/components/button/index.ts)    | [spec](../../packages/ui/webc/__tests__/button.spec.ts)    |

4. Check Angular [manifest](../../packages/ui/angular/src/components/button/manifest.ts)
   and [generated surface](../../packages/ui/angular/src/generated/button.metadata.ts).
   The manifest is also the API discovery input, not a second handwritten API table.
5. Inspect [Base structure](../../packages/themes/base/src/components/button.css),
   [Oren appearance](../../packages/themes/oren/src/components/button/_button.scss),
   their index imports and Oren type augmentation. Check the root `so-button`,
   part `so-button__text` and actual emission witnesses in the theme contract.
6. Inspect Button in [generated API](../api/generated/contract.json),
   [reviewed exports](../../tools/public-api/exports.json), Web Components package
   subpath and [playground registry](../../packages/playground/shared/src/registry.ts).
   All six framework records must refer to real public component exports.
7. Decide release impact using [quality](./quality.md). This documentation example
   changes no package and needs no changeset. A future compatible Button change
   needs patch entries for affected packages; an authorized break needs a minor
   changeset with upgrade instructions. Existing Changesets configuration is a
   witness of version grouping, not evidence of a new release.

## Reproduce and interpret

Run `node tools/contributor-docs/check.mjs` from the repository root. It verifies
the pinned source tree and the current checkout against normalized witness hashes,
so drifting examples require review. It checks links for every module and asserts
six unique adapters, public exports, API coverage, theme roots/parts and registration.

For a component implementation, follow [quality](./quality.md), including actual
tests and package builds. No new Button test is needed merely to repeat existing
implementation; this walkthrough adds completeness evidence, not a synthetic
public component. Collection/overlay/date routes require additional examples and
checks described in their modules. The Button map alone does not validate them.
