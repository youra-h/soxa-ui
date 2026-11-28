<script lang="ts">
	import { Sidebar } from '@soxa-ui/svelte'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
</script>

<div class="pg-sidebar-preview">
	<div class="pg-sidebar-preview__main">Рабочая область</div>
	<Sidebar aria_label="Рабочая область" {...bind}>
		<strong class="pg-sidebar-preview__label">Проекты</strong>
		<Sidebar.Item text="Обзор">
			{#snippet leading()}◈{/snippet}
		</Sidebar.Item>
		<Sidebar.Item text="Настройки">
			{#snippet leading()}⚙{/snippet}
		</Sidebar.Item>
	</Sidebar>
</div>
