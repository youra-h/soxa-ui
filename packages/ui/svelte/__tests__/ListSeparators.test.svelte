<script lang="ts">
 import { ListBox, Select } from '@soxa-ui/svelte'
 import type { TListBoxCollection, TSelectCollection } from '@soxa-ui/core'
 const { list, select }: { list: TListBoxCollection; select: TSelectCollection } = $props()
</script>

<ListBox engine={list}>
 <ListBox.Group label="First"><ListBox.Item value="a" text="Apple" /></ListBox.Group>
 <ListBox.Separator />
 <ListBox.Group label="Second"><ListBox.Item value="b" text="Banana" /></ListBox.Group>
</ListBox>
<Select engine={select} editable editableMode="filter">
 <Select.Group label="First"><Select.Item value="a" text="Apple" /></Select.Group>
 <Select.Separator />
 <Select.Group label="Second"><Select.Item value="b" text="Banana" /></Select.Group>
</Select>
