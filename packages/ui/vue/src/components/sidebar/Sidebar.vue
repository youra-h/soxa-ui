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
		<div class="so-sidebar__content" :inert.attr="offcanvasHidden ? true : undefined">
			<slot :collapsed="collapsed" />
		</div>
	</component>
</template>
