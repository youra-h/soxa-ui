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
		:title="text || undefined"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<span class="so-sidebar-item__leading" aria-hidden="true">
			<slot name="leading" />
		</span>
		<span class="so-sidebar-item__text">
			<slot :text="text">{{ text }}</slot>
		</span>
	</component>
</template>
