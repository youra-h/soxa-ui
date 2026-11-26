<script lang="ts">
import Setup from './setup.component'

export default { ...Setup }
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		:style="panelStyle"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<slot />
	</component>
</template>
