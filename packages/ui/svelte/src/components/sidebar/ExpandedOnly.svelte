<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements'

	const { children, ...attrs }: HTMLAttributes<HTMLDivElement> = $props()
</script>

<div {...attrs} data-so-sidebar-expanded-only>
	{@render children?.()}
</div>
