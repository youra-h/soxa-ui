# Tree

Tree presents folders, categories or collapsible navigation sections. Pass nested
`items` with a stable, unique `value` for every node. The same key identifies a node
when its parent, label or position changes. In navigation mode, set `mode="none"`
and give leaf nodes a native `href`.

```vue
<script setup lang="ts">
import { Tree } from '@soxa-ui/vue'
import type { ITreeNode } from '@soxa-ui/core'

const items: readonly ITreeNode[] = [
  {
    value: 'accounts',
    text: 'Accounts',
    children: [
      { value: 'overview', text: 'Overview', href: '/accounts' },
      { value: 'billing', text: 'Billing', href: '/accounts/billing' },
    ],
  },
  { value: 'support', text: 'Support', href: '/support' },
]
</script>

<template>
  <Tree aria-label="Account navigation" :items="items" :expanded="['accounts']" mode="none" guides>
    <template #item-icon="{ branch }">
      <span aria-hidden="true">{{ branch ? '▣' : '▪' }}</span>
    </template>
  </Tree>
</template>
```

- `expanded` contains the keys of open branches. Focus returns to an ancestor
  when its branch closes around the focused item.
- In `single` mode, `value` is one key. In `multiple` mode, it is an array of
  independently selected keys. Closing a branch preserves its selected nodes.
- `item-icon` supplies a node icon or avatar. `item-indicator-icon` replaces
  the disclosure chevron. Both receive `item`, `branch`, `expanded`, and
  `loading`. Use `item` to replace the label or add secondary text. In Web Components, use light DOM
  samples such as `<template slot="item-icon">`. Each row receives its own copy.
- Set `hasChildren: true` for a deferred branch and pass `loadChildren`. The
  loader receives `{ value, text, signal }` and returns the children. Replacing
  the input or unmounting aborts pending loads. A branch that finishes loading
  after collapse has its children ready for the next expansion.
- Wrap fixed-height rows in `Virtual` for large trees. The window is calculated
  over visible rows. Ancestors keep their group ownership even when their rows
  scroll out of the window.

Up and Down move through visible nodes. Right opens a branch or moves into it.
Left closes a branch or returns to its parent. Horizontal arrows follow the
writing direction. Home and End move to the bounds. Typing moves to the matching
label, and Space changes the selection. Enter follows a leaf link or operates
on the focused node.

## Collection model

The input is flattened into the existing Collection Engine, with one item per
key. Items retain their parent key and sibling order. The tree extension
produces a depth-first `batch.shown` projection that omits collapsed descendants.
Selection still sees the full collection. Drawing and keyboard navigation use
the same projection, so collapsing branches does not recreate or deselect
their contents.

The adapters share the existing `ItemRow`, selection, collection lifecycle,
typeahead, and drawing mechanisms. Tree owns its group semantics, disclosure,
and roving focus.
