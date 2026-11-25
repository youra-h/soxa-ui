<script lang="ts">
	import { createSveltePreparedAdapterContext } from '../../../adapter/common/collection-preparation'
	import TagsItemView from './TagsItemView.svelte'
	import type { TagsItemProps } from './base.component'

	let { ref = $bindable(), ...props }: TagsItemProps = $props()
</script>

<TagsItemView
	{...props}
	bind:ref
	create={createSveltePreparedAdapterContext}
/>
