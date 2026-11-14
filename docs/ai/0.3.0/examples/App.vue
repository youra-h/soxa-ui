<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@soxa-ui/vue'

const count = ref(0)
</script>

<template>
	<Button text="Increment" @action:click="count++" />
	<output aria-live="polite">Count: {{ count }}</output>
</template>
