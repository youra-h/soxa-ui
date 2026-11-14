<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { TButton } from '@soxa-ui/core'
import { Button } from '@soxa-ui/vue'
// Keep the controller raw; its event bus already drives the adapter.
const ctrl = new TButton({ text: 'Controller action' })
const clicks = ref(0)
const mounted = ref(false)
const count = () => {
	clicks.value++
}
onMounted(() => {
	ctrl.events.on('change:text', count)
	mounted.value = true
})
onUnmounted(() => ctrl.events.off('change:text', count))
</script>
<template>
	<section aria-label="Controller example">
		<Button
			:ctrl="ctrl"
			type="button"
			@action:click="
				ctrl.text =
					ctrl.text === 'Controller action'
						? 'Controller action again'
						: 'Controller action'
			"
		/>
		<output>Controller clicks: {{ clicks }}</output>
		<span v-if="mounted" data-testid="mounted">Mounted</span>
	</section>
</template>
