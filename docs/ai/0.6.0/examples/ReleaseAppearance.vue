<script setup lang="ts">
import { ref } from 'vue'
import { Button, Dialog, Toasts } from '@soxa-ui/vue'
import ToastActions from './ToastActions.vue'

const visible = ref(false)
</script>

<template>
	<section aria-label="Oren appearance">
		<Button text="Open blurred dialog" @click="visible = true" />
		<Dialog v-model:visible="visible" backdrop="blur" title="Travel details">
			<p>Review your itinerary before you go.</p>
		</Dialog>
		<Toasts view="soft">
			<ToastActions />
		</Toasts>
	</section>
</template>
