# Wire all six adapters

Start from each adapter's current Button, then compare its Tabs setup for a
collection. Paths and tests are in the [walkthrough](./button-walkthrough.md).
Read the relevant reference before editing: [React](../../packages/ui/react/AGENTS.md),
[Solid](../../packages/ui/solid/AGENTS.md), [Svelte](../../packages/ui/svelte/AGENTS.md),
[Angular](../../packages/ui/angular/AGENTS.md), [Web Components](../../packages/ui/webc/AGENTS.md).
Vue's shared rules are in [setup](../agents/setup.md).

| Adapter        | Assembly and view                                                                                                | Acceptance checks                                                                                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vue            | base props/emits, setup, `.vue`, barrel; descriptor-derived types; `createVueAdapterContext` and `useAdapter`    | Return live bindings whole; use `extendBinding`/`joinBindings`, never snapshot with a spread. Root ref and three sets reach their semantic nodes.                                           |
| React          | base types, setup hook, JSX, barrel; `useComponent` or collection `useAdapterContext` factory                    | No context per render or component-local framework hooks. Put `forwardProps` before adapter ref. Preserve StrictMode cleanup and external ctrl. Setup hooks stay internal.                  |
| Angular        | `manifest.ts`, setup, class/template, barrel; descriptor re-exported as `descriptor`                             | Generate AOT inputs/outputs and typed surfaces. Attribute selector uses the native consumer host; host template does not duplicate the root. Verify with `ngc`, not only `tsc`.             |
| Solid          | base types, setup, JSX, barrel; `createSolidAdapterContext`                                                      | Reactive props/state stay in accessors. Use `Root`, root/part helpers and adapter flow helpers; preserve hydration windows and live slot scope.                                             |
| Svelte         | base types, setup, `.svelte`, barrel; props getter, `$props.id()` mount id and root receiver feed adapter wiring | Preserve runes/live reads and `createSvelteAdapterContext`. Use adapter `Dynamic`/root helpers; slots are snippets and forwarded attributes remain reactive.                                |
| Web Components | setup, template, `Name.element.ts`, barrel; `ElementBase`, `defineElement`, `createWebcAdapterContext`           | Native customized built-in and matching registration/`is` selector; preserve light DOM, reconnect ownership and property/attribute distinctions. Check root and individual subpath exports. |

The profile supplies framework names; the shared exchange supplies writes, state
and events. Built-in plugin props use their namespace; application-installed
plugins use `pluginProps` and `plugin:event`. Do not duplicate exchange loops in
components or implement shared behavior six times.

Respect `rendered` and `visible`, root classes/style and consumer attributes/ref.
An inner input's sets go on the input, not blindly on its wrapper. Optional absent
parts do not mount. Use adapter slot, click-action, teleport and elevator helpers.
Preserve native forms instead of adding a wrapper that changes form behavior.

Default slots map to children in callback/snippet adapters. Web Components have
unscoped light-DOM slots, not typed scope objects. Angular scoped templates use
the supported slot directive. Inspect generated API for actual event/model names.

After changing a descriptor or Angular template queries, run
`npm run generate --workspace=@soxa-ui/angular` and commit metadata. Check a second
generation for drift. Register component/part barrels in every adapter. Update
the reviewed public export inventory; assembly helpers do not automatically
become application API.
