<script lang="ts">
	import { TREE_PREVIEW_PROPS } from '@soxa-ui/playground-shared'
	import { Tree } from '@soxa-ui/svelte'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
</script>

<Tree {...TREE_PREVIEW_PROPS} {...bind} />
