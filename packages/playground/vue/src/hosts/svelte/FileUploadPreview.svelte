<script lang="ts">
	import { FileUpload } from '@soxa-ui/svelte'
	import type { TPreviewProps } from './previews'

	const bind: TPreviewProps = $props()
</script>

<FileUpload {...bind} />
