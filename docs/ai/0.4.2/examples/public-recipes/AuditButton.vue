<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@soxa-ui/vue'
import { TButton } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import { TTextAuditPlugin } from './text-audit'

const surfaceEvent = ref('none')
const props = defineProps<{ ctrl: TButton; custom: boolean; prefix: string | undefined }>()
const emit = defineEmits<{ bundle: [plugin: TTextAuditPlugin]; press: [] }>()
function onBundle(value: unknown) {
	if (!(value instanceof TPluginBundle)) return

	const plugin = value.get(TTextAuditPlugin)
	if (plugin) emit('bundle', plugin)
}
</script>
<template>
	<div>
		<Button
			:ctrl="props.ctrl"
			type="button"
			:view="custom ? 'soft' : 'outlined'"
			:variant="custom ? 'studio' : 'accent'"
			:plugin-props="prefix === undefined ? {} : { audit_prefix: prefix }"
			@bundle:create="onBundle"
			@plugin:event="surfaceEvent = $event.name"
			@action:press="emit('press')"
		/>
		<output data-testid="surface-event">{{ surfaceEvent }}</output>
	</div>
</template>
