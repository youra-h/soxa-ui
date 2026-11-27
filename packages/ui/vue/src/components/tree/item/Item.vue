<script lang="ts">
import { Icon } from '../../icon'
import { ItemRow } from '../../item-row'
import SetupTreeItem from './setup.component'

export default { ...SetupTreeItem, components: { Icon, ItemRow } }
</script>

<template>
	<component
		:is="href && !branch ? 'a' : tag"
		ref="rootElement"
		:class="classes"
		:href="href && !branch ? href : undefined"
		v-bind="{ ...attrs, ...aria, ...dataset, ...containerAttrs, ...controlAttrs }"
	>
		<!-- Virtual can keep the item and its group outside the visible row window. -->
		<ItemRow
			v-if="entry.row"
			tag="div"
			embedded="tree.row"
			class="so-tree-item__row"
			:size="size"
			:variant="variant"
			v-bind="dataset"
		>
			<template #leading>
				<span
					:class="branch ? 'so-tree-item__toggle' : 'so-tree-item__spacer'"
					aria-hidden="true"
				>
					<slot
						v-if="branch"
						name="indicator-icon"
						:item="ctrl"
						:branch="true"
						:expanded="expanded"
						:loading="loading"
					>
						<span class="so-tree-item__chevron"></span>
					</slot>
				</span>
				<span
					v-if="indicator === 'start'"
					class="so-tree-item__selection-indicator"
					aria-hidden="true"
				>
					<Icon
						v-if="selected"
						embedded="tree.selection-indicator"
						:tag="selectionIconTag"
						:size="size"
					/>
				</span>
				<slot
					name="icon"
					:item="ctrl"
					:branch="branch"
					:expanded="expanded"
					:loading="loading"
				/>
			</template>
			<slot
				:item="ctrl"
				:text="text"
				:selected="selected"
				:branch="branch"
				:expanded="expanded"
				:loading="loading"
				>{{ text }}</slot
			>
			<template v-if="indicator === 'end'" #trailing>
				<span class="so-tree-item__selection-indicator" aria-hidden="true">
					<Icon
						v-if="selected"
						embedded="tree.selection-indicator"
						:tag="selectionIconTag"
						:size="size"
					/>
				</span>
			</template>
		</ItemRow>
		<span v-else class="so-tree-item__accessible-name">{{ text }}</span>
		<div v-if="expanded" role="group" class="so-tree-item__group">
			<template v-for="child in entry.children" :key="child.key">
				<div
					v-if="child.kind === 'filler'"
					class="so-tree__filler"
					aria-hidden="true"
					:style="child.style"
				></div>
				<!-- Forward consumer slots to data-backed descendants at every depth. -->
				<TreeItem v-else :ctrl="child.item" :entry="child">
					<template v-if="$slots.default" #default="scope">
						<slot
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
							:text="scope.text"
							:selected="scope.selected"
						/>
					</template>
					<template v-if="$slots['icon']" #icon="scope">
						<slot
							name="icon"
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
						/>
					</template>
					<template v-if="$slots['indicator-icon']" #indicator-icon="scope">
						<slot
							name="indicator-icon"
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
						/>
					</template>
				</TreeItem>
			</template>
		</div>
	</component>
</template>
