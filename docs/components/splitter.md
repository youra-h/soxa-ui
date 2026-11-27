# Splitter

Use Splitter to resize adjacent areas, such as a file tree and editor. It is available in all
six adapters. The `panels` array declares the IDs, initial sizes and optional size limits.
Sizes are percentages of the available panel space. Declare panels in the same order as
their rendered parts and place a handle between each pair.

```vue
<script setup lang="ts">
import { Splitter } from '@soxa-ui/vue'

const panels = [
  { id: 'files', defaultSize: 30, minSize: 20, maxSize: 60, collapsible: true },
  { id: 'editor', defaultSize: 70, minSize: 40 },
]
</script>

<template>
  <Splitter :panels="panels">
    <Splitter.Panel panel="files">Files</Splitter.Panel>
    <Splitter.Handle panel="files" aria_label="Files" />
    <Splitter.Panel panel="editor">Editor</Splitter.Panel>
  </Splitter>
</template>
```

The handle references the preceding panel and uses its size as the current value. Provide an
accessible name for each handle. Drag it or focus it and use the arrow keys along the active
axis. Enter collapses or restores a panel marked `collapsible`. Use
`orientation="vertical"` to stack panels.

See the [generated API contract](../api/generated/contract.json) for the owner, panel and
handle and the [upgrade guide](../upgrade/splitter.md) for shared orientation types.
