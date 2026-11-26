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
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<span v-if="thumbShown" class="so-splitter__grip" aria-hidden="true">
			<slot name="icon" />
		</span>
	</component>
</template>
