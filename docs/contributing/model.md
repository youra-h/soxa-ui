# Model and descriptor

Read [setup](../agents/setup.md) and [accessibility](../agents/a11y.md) for the
canonical mechanisms. Use [Button's model](../../packages/core/src/components/custom/button/button.class.ts),
[types](../../packages/core/src/components/custom/button/types.ts) and
[descriptor](../../packages/setup/content/descriptors/components/button.descriptor.ts)
as the minimal working example rather than copying a placeholder implementation.

## Core model

Add `types.ts`, a class and `index.ts` under `packages/core/src/components/custom/`.
Choose the nearest semantic base, not a component that only looks similar.
Interfaces use `I`, shared type aliases use `T`; concrete adapter types such as
`ButtonProps` have no prefix.

Declare own props/events in the model contract. Defaults belong to the class's
typed `TDefaultValues`, with own defined keys in its second parameter and
undefined defaults in its third. Preserve inherited defaults. Read them through
the actual constructor so subclasses can override them. Setters compare stored
values, update derived sets and emit the declared payload; Button's `change:view`
carries `{ oldValue, newValue }`, not a bare string. Include own state in `getProps()`.
Keep framework imports and DOM operations out of core. Runtime imports within
core use relative paths, avoiding its own barrel.

Appearance values are theme registries: Button's `IButtonViews` extends
`TThemeRegistry`, and `TButtonView` extracts its keys. Core defaults `view` to
undefined and emits a prefixed modifier when set; adapters do not select an Oren
value. Semantic behavior values can be closed unions. See [theming](../agents/theming.md).

## Descriptor is the public contract

Add a file in `packages/setup/content/descriptors/components/` and export its
factory through the component barrel. Use `defineDescriptor(() =>
defineComponent({ ... }))`, with `ctor`, a called parent descriptor factory,
inline `contribution` and plugin definitions. Do not introduce contribution
mirrors or handwrite an adapter's prop/event/slot contract.

Prop `type` is the runtime constructor; the value type is inferred from `ctor`.
`triggers` refresh state and do not publish consumer events. Declare public events
explicitly in `contribution.events`. Defaults come from the model, not another
adapter fallback. Protected outputs are readable state, not writable inputs.

Slots are not inherited. Declare precisely those rendered, including `default`;
typed scope values use `defineType<T>(constructor)`. Slot content and its text
fallback must both work. Framework spelling is derived from the shared contract.

## Accessibility and ownership

Core/plugins produce separate `aria`, `dataset` and `attrs` sets. Place each on
the correct semantic node synchronously, including SSR; CSS selects classes/data,
not ARIA. Visible labels use Label; accessible names use the naming plugin.
Locale follows the subtree's LocaleProvider.

A control decides its focus target in its descriptor: the root or a plugin rule
for the real field/tab stop. Update the focus-target guard when the root genuinely
holds focus. Do not repeat local DOM searches in adapters. Use mount-derived ids
and linkage plugins so server/client ids agree. Bind listeners and frames to the
element lifecycle with complete cleanup. Assembly/disposal must work without DOM
globals on the server.

A mount releases its context/plugins, not an application-owned `ctrl`. Verify
controller writes and prop updates after mount, prop removal, remount and cleanup.
