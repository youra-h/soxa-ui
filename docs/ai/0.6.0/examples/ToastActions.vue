<script setup lang="ts">
import { Button, useToasts } from '@soxa-ui/vue'

const { show } = useToasts()

function showSoft() {
	show({ text: 'Itinerary saved', type: 'success' })
}

function showOutlined() {
	show({ text: 'Itinerary shared', type: 'success', view: 'outlined' })
}
</script>

<template>
	<Button text="Show soft notification" @click="showSoft" />
	<Button text="Show outlined notification" @click="showOutlined" />
</template>
