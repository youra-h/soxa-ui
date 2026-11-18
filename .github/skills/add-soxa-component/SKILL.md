---
name: add-soxa-component
description: Add or wire a Soxa library component across its model, descriptor, six adapters, theme, metadata, exports and checks. Use for new components and missing layer wiring, including collections and compound parts.
argument-hint: 'component name (e.g. Badge)'
---

# Add a Soxa component

Read the working repository's AGENTS.md and applicable area instructions first.
Then use the public [contributor route](../../../docs/contributing/README.md).
It is pinned to a source revision and is separate from published consumer docs;
verify its baseline against the task checkout before copying an example.

1. Establish the consumer contract and existing component pattern. Follow
   [model/descriptor](../../../docs/contributing/model.md).
2. For collections or parts, follow [collections](../../../docs/contributing/collections.md).
   Collections are implemented in all six adapters, not only Vue.
3. Follow [adapters](../../../docs/contributing/adapters.md) for Vue, React,
   Angular, Solid, Svelte and Web Components. Use each framework's runtime helpers.
4. Complete [theme, metadata and inventories](../../../docs/contributing/themes.md).
5. Run applicable [quality gates](../../../docs/contributing/quality.md), add the
   appropriate changeset and review the complete diff for parity and readability.

Use the existing [Button walkthrough](../../../docs/contributing/button-walkthrough.md)
for a simple component. Do not add a public component solely to validate instructions.
[Select anatomy](./references/complex-component.md) remains the compound example.
The [collection reference](./references/collection-component.md) adds the detailed
Vue wiring, not an adapter availability restriction.

Preserve the frozen public API. A specific breaking change and changes under
`packages/setup/protected/` each require the appropriate explicit authorization.
This skill grants neither. Keep behavior in core/plugins/shared setup rather than
component-local framework workarounds. Do not release packages as a side effect.
