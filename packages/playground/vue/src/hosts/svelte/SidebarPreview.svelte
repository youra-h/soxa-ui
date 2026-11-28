<script lang="ts">
	import { Icon, Sidebar, roleIcon } from '@soxa-ui/svelte'
	import { SIDEBAR_GROUPS } from '@soxa-ui/playground-shared'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
	const groups = SIDEBAR_GROUPS.map((group) => ({
		label: group.label,
		items: group.items.map((item) => ({ ...item, iconTag: roleIcon(item.icon) })),
	}))
</script>

<Sidebar aria_label="Редакция «Поле»" {...bind}>
	{#each groups as group (group.label)}
		<div class="pg-sidebar-group" role="group" aria-label={group.label}>
			<div class="so-sidebar-group__label">{group.label}</div>
			{#each group.items as item (item.text)}
				<Sidebar.Item
					text={item.text}
					aria-current={item.current ? 'page' : undefined}
					data-selected={item.current ? 'true' : undefined}
				>
					{#snippet leading()}<Icon tag={item.iconTag} size="lg" />{/snippet}
				</Sidebar.Item>
			{/each}
		</div>
	{/each}
</Sidebar>
