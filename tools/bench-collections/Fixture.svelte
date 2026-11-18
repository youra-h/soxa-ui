<script lang="ts">
  import { Tabs, Tags } from '@soxa-ui/svelte'
  import { Tabs as ArkTabs } from '@ark-ui/svelte/tabs'
  import { Listbox, createListCollection } from '@ark-ui/svelte/listbox'
  import type { Spec } from './data'
  let { spec:s }: { spec:Spec } = $props()
  const props=$derived(s.mode==='initial'?{initial:s.source}:s.mode==='data'?{items:s.items}:{})
</script>
{#if s.library==='ark'}
  {#if s.kind==='tabs'}
    <ArkTabs.Root defaultValue="v1" lazyMount unmountOnExit><ArkTabs.List aria-label="Items">{#each s.items as item (item.value)}<ArkTabs.Trigger value={item.value}>{item.text}</ArkTabs.Trigger>{/each}</ArkTabs.List>{#each s.items as item,i (item.value)}<ArkTabs.Content value={item.value}>Panel {i}</ArkTabs.Content>{/each}</ArkTabs.Root>
  {:else}
    <Listbox.Root collection={createListCollection({items:s.items,itemToString:item=>item.text,itemToValue:item=>item.value})} defaultValue={['v1']}><Listbox.Content aria-label="Items">{#each s.items as item (item.value)}<Listbox.Item {item}><Listbox.ItemText>{item.text}</Listbox.ItemText></Listbox.Item>{/each}</Listbox.Content></Listbox.Root>
  {/if}
{:else if s.kind==='tabs'}
  {#if s.mode==='declarative'}
    <Tabs aria_label="Items">{#each s.items as item,i (item.value)}<Tabs.Item value={item.value} text={item.text} active={i===1}/>{/each}{#snippet content()}{#each s.items as item,i (item.value)}<Tabs.Content value={item.value}>Panel {i}</Tabs.Content>{/each}{/snippet}</Tabs>
  {:else}
    <Tabs {...props} aria_label="Items">{#snippet content()}{#each s.items as item,i (item.value)}<Tabs.Content {...(s.mode==='initial'?{initial:i}:{value:item.value})}>Panel {i}</Tabs.Content>{/each}{/snippet}</Tabs>
  {/if}
{:else}
  {#if s.mode==='declarative'}<Tags mode="single" aria_label="Items">{#each s.items as item,i (item.value)}<Tags.Item value={item.value} text={item.text} selected={i===1}/>{/each}</Tags>{:else}<Tags {...props} mode="single" aria_label="Items"/>{/if}
{/if}
