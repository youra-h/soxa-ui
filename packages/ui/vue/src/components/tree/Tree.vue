<script lang="ts">
import TreeRow from './TreeRow.vue'
import SetupTree from './setup.component'

export default { ...SetupTree, components: { TreeRow } }
</script>

<template>
	<component
		v-if="rendered"
		v-show="visible"
		:is="tag"
		ref="rootElement"
		:class="classes"
		v-bind="{ ...attrs, ...aria, ...dataset, ...$attrs }"
	>
		<template v-for="entry in layout" :key="entry.key">
			<div
				v-if="entry.kind === 'filler'"
				class="so-tree__filler"
				aria-hidden="true"
				:style="entry.style"
			></div>
			<TreeRow v-else :ctrl="entry.item" :entry="entry">
				<template v-if="$slots.item" #default="scope">
					<slot
						name="item"
						:item="scope.item"
						:branch="scope.branch"
						:expanded="scope.expanded"
						:loading="scope.loading"
						:text="scope.text"
						:selected="scope.selected"
					/>
				</template>
				<template v-if="$slots['item-icon']" #icon="scope">
					<slot
						name="item-icon"
						:item="scope.item"
						:branch="scope.branch"
						:expanded="scope.expanded"
						:loading="scope.loading"
					/>
				</template>
				<template v-if="$slots['item-indicator-icon']" #indicator-icon="scope">
					<slot
						name="item-indicator-icon"
						:item="scope.item"
						:branch="scope.branch"
						:expanded="scope.expanded"
						:loading="scope.loading"
					/>
				</template>
			</TreeRow>
		</template>
		<slot v-if="!layout.length" name="empty" />
	</component>
</template>
