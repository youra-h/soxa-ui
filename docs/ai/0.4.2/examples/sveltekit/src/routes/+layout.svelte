<script module lang="ts">
	import { useTheme, useIcons } from '@soxa-ui/setup'
	import oren from '@soxa-ui/theme-oren/setup'
	import * as material from '@soxa-ui/icons-material'
	import '@soxa-ui/theme-oren'

	// Static registries can be shared by requests; mutable controllers cannot.
	useTheme(oren)
	useIcons(material)
</script>
<script lang="ts">
	import type { LayoutProps } from './$types'
	let { children }: LayoutProps = $props()
</script>
{@render children()}
