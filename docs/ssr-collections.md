# Initial collections for server rendering

Tabs and Tags can receive their initial collection as plain data through
`initial`. This lets the server know the selected or active item and document
links before it serializes the first child. The same declaration must be used
for the first client render.

## Vue Tabs

```vue
<script setup lang="ts">
import { Tabs } from '@soxa-ui/vue'

const initial = {
  items: [
    { value: 'general', text: 'General' },
    { value: 'privacy', text: 'Privacy', id: 'privacy-tab', _: { active: true } },
  ],
  panels: [
    { value: 'general', id: 'general-panel' },
    { value: 'privacy', id: 'privacy-panel' },
  ],
}
</script>

<template>
  <Tabs :initial="initial" aria_label="Settings">
    <template #content>
      <Tabs.Content :initial="0">General settings</Tabs.Content>
      <Tabs.Content :initial="1">Privacy settings</Tabs.Content>
    </template>
  </Tabs>
</template>
```

With no explicit items in its default slot, Tabs renders the declared items.
If custom item markup is needed, use `<Tabs.Item :initial="0" />` and
`<Tabs.Item :initial="1" />` in that slot. An item's number indexes `items`;
a panel's number indexes `panels`. These are declaration positions, not item
values or the current position after collection edits.

## React and Next.js

The declaration is serializable and can be passed from a Next.js Server
Component. No application-specific Suspense wrapper is required.

```tsx
import { Tabs } from '@soxa-ui/react'

export default function Settings() {
  return (
    <Tabs
      aria_label="Settings"
      initial={{
        items: [
          { value: 'general', text: 'General' },
          { value: 'privacy', text: 'Privacy', _: { active: true } },
        ],
        panels: [{ value: 'general' }, { value: 'privacy' }],
      }}
      content={
        <>
          <Tabs.Content initial={0}>General settings</Tabs.Content>
          <Tabs.Content initial={1}>Privacy settings</Tabs.Content>
        </>
      }
    />
  )
}
```

The initial server HTML has the Privacy tab active, one tab stop and reciprocal
tab/panel ID references. Hydration preserves the server nodes; ordinary clicks
and keyboard navigation use the collection engine thereafter.

## Source and lifetime

- `items` is required. Tabs may also declare `panels`; panel declarations take
  `value` and an optional document `id`.
- Item state belongs in metadata: `_: { active: true }` for Tabs and
  `_: { selected: true }` for Tags. Other item properties, such as `text` and
  `disabled`, stay on the item object.
- Use plain serializable data. Functions, class instances, cyclic values and
  symbol keys are rejected. Resolve asynchronous application data before
  passing the declaration.
- `initial` and the ordinary `items` prop cannot be supplied together.
- A part using an initial position gets its `value`, state and `id` from the
  declaration. Do not also set conflicting values on that part.
- The declaration is captured once per native mount lifetime. Subsequent
  changes use the normal collection API; changing `initial` does not reset
  user selection or recreate removed items.
- An external `engine` must already contain the matching models and metadata.
  Rendering and abandoning a prepared view preserves those models; an
  accepted view writes its tab links and button names into them, as an
  ordinary mount does. Each
  server request must still have the application ownership and isolation it
  normally requires.

This path does not discover arbitrary undeclared items inside user components.
The ordinary declarative API remains available, but using it alone does not
provide the server with a complete collection before child rendering.

Prepared React assemblies are confirmed on acceptance. Abandoned assemblies
are released through collection transactions; a late Suspense retry rebuilds
the temporary view using the same source data. The expiry mechanism cleans
up resources and does not define when a server response is complete.

[Implementation and lifecycle](./agents/prepared-assembly.md),
[acceptance tests, memory checks and measurements](../tools/ssr-acceptance/INTEGRATION.md).
