<script lang="ts">
import SetupListBoxSeparator from './setup.component'

export default { ...SetupListBoxSeparator }
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
