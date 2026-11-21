<script lang="ts">
import SetupSelectSeparator from './setup.component'

export default { ...SetupSelectSeparator }
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	/>
</template>
