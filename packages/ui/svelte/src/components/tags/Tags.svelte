<script lang="ts">
	import { createSveltePreparedAdapterContext } from '../../adapter/common/collection-preparation'
	import TagsView from './TagsView.svelte'
	import { TagsItem } from './item'
	import type { TagsProps } from './base.component'

	let { ref = $bindable(), ...props }: TagsProps = $props()
</script>

<TagsView
	{...props}
	bind:ref
	create={createSveltePreparedAdapterContext}
	Item={TagsItem}
/>
