<script lang="ts">
	import { Splitter } from '@soxa-ui/svelte'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
</script>

<Splitter {...bind} class="pg-splitter-preview">
	<Splitter.Panel panel="files">
		<div class="pg-splitter-preview__pane">
			<strong>Файлы</strong>
			<code>App.vue</code>
		</div>
	</Splitter.Panel>
	<Splitter.Handle panel="files" size="sm" aria_label="Файлы" />
	<Splitter.Panel panel="editor">
		<div class="pg-splitter-preview__pane">
			<strong>Редактор</strong>
			<code>&lt;Splitter /&gt;</code>
		</div>
	</Splitter.Panel>
	<Splitter.Handle panel="editor" size="lg" aria_label="Редактор" />
	<Splitter.Panel panel="preview">
		<div class="pg-splitter-preview__pane">
			<strong>Вывод</strong>
			<code>Сборка готова</code>
		</div>
	</Splitter.Panel>
</Splitter>
