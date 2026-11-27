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
  when its branch closes around the focused item. Pass an empty array to close
  all branches, or the keys of every branch to open them all.
- In `none` mode, clicking a node highlights it until another node is
  activated. The whole branch row opens or closes its group and keeps its
  highlight on repeated clicks.
- In `single` mode, `value` is one key. In `multiple` mode, it is an array of
  independently selected keys. The disclosure arrow opens or closes the branch.
  Clicking the rest of the row toggles selection and keeps the current expansion.
- Set `indicator="start"` or `indicator="end"` to reserve space for a check mark
  on each row. The start position is just after the disclosure arrow. A selected row
  shows the mark. The default is `none`, and
  navigation mode hides the mark.
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
label. Enter follows a leaf link, opens or closes a branch in navigation mode,
or toggles selection. Space also toggles selection.

## Load children on demand

Use a deferred branch when its children are available from a separate endpoint.
Tree calls the loader when that branch first opens and awaits an array of nodes.

```vue
<script setup lang="ts">
import { Tree } from '@soxa-ui/vue'
import type { ITreeNode, TTreeLoadChildren } from '@soxa-ui/core'

const items: readonly ITreeNode[] = [{ value: 'accounts', text: 'Accounts', hasChildren: true }]

const loadChildren: TTreeLoadChildren = async ({ value, signal }) => {
  const key = encodeURIComponent(String(value))
  const response = await fetch('/api/tree/' + key + '/children', { signal })
  if (!response.ok) throw new Error('Could not load children: ' + response.status)

  return response.json()
}
</script>

<template>
  <Tree aria-label="Accounts" :items="items" :load-children="loadChildren" />
</template>
```

## Add a checkbox to a row

Use the `item-icon` slot for a checkbox on a node without `href`. The example
stores permissions in the application and lets a click on the checkbox update
the permission independently of branch disclosure.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { CheckBox, Tree } from '@soxa-ui/vue'
import type { ITreeNode, TTreeKey } from '@soxa-ui/core'

const items: readonly ITreeNode[] = [
  {
    value: 'users',
    text: 'User management',
    children: [
      { value: 'read-users', text: 'View users' },
      { value: 'edit-users', text: 'Edit users' },
    ],
  },
]

const checked = ref(new Set<TTreeKey>())

function setChecked(key: TTreeKey, value: boolean) {
  if (value) checked.value.add(key)
  else checked.value.delete(key)
}
</script>

<template>
  <Tree aria-label="Permissions" :items="items" :expanded="['users']" mode="none">
    <template #item-icon="{ item, branch }">
      <span v-if="!branch" @click.stop>
        <CheckBox
          :aria_label="item.text"
          :value="checked.has(item.value)"
          @update:value="setChecked(item.value, $event)"
        />
      </span>
    </template>
  </Tree>
</template>
```

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
