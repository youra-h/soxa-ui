<script lang="ts">
import {
	TCollectionItemExtension,
	TreeItemCollectionDescriptor,
	TreeItemDescriptor,
} from '@soxa-ui/setup'
import type { TTreeItem, TTreeRenderItem } from '@soxa-ui/core'
import {
	createVueAdapterContext,
	joinBindings,
	useAdapter,
	useCollectionAdapter,
	useEmits,
	useExpose,
	useProps,
	VueElevatorFactory,
	type SetupContext,
} from '../../adapter'
import type { TEmits, TProps, UseProps } from '../../types/common'
import { ItemRow } from '../item-row'

type IconScope = { item: TTreeItem; branch: boolean; expanded: boolean; loading: boolean }
type _RowScope = IconScope & { text: string; selected: boolean }

type TreeItemProps = UseProps<typeof TreeItemDescriptor, TTreeItem>

export default {
	name: 'TreeRow',
	expose: useExpose(),
	components: { ItemRow },
	emits: [
		...useEmits(TreeItemDescriptor()),
		...useEmits(TreeItemCollectionDescriptor()),
	] as TEmits,
	props: {
		...(useProps(TreeItemDescriptor()) as TProps),
		...(useProps(TreeItemCollectionDescriptor()) as TProps),
		entry: { type: Object as () => TTreeRenderItem, required: true },
	},
	setup(props: TreeItemProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(TreeItemDescriptor(), { ctrl: props.ctrl, props })
		const collectionAdapter = createVueAdapterContext(
			TreeItemCollectionDescriptor(),
			{ props },
			{ bundle: adapter.bundle },
		).use(TCollectionItemExtension, { adapter, elevator: VueElevatorFactory })

		const collectionBinding = useCollectionAdapter(collectionAdapter, props, emit)
		const itemBinding = useAdapter(adapter, props, emit)

		return joinBindings(itemBinding, collectionBinding)
	},
}
</script>

<template>
	<component
		:is="href && !aria['aria-expanded'] ? 'a' : tag"
		ref="rootElement"
		:class="classes"
		:href="href && !aria['aria-expanded'] ? href : undefined"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
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
					:class="aria['aria-expanded'] ? 'so-tree-item__toggle' : 'so-tree-item__spacer'"
					aria-hidden="true"
				>
					<slot
						v-if="aria['aria-expanded']"
						name="indicator-icon"
						:item="entry.item"
						:branch="true"
						:expanded="aria['aria-expanded'] === 'true'"
						:loading="aria['aria-busy'] === 'true'"
					>
						<span class="so-tree-item__chevron"></span>
					</slot>
				</span>
				<slot
					name="icon"
					:item="entry.item"
					:branch="Boolean(aria['aria-expanded'])"
					:expanded="aria['aria-expanded'] === 'true'"
					:loading="aria['aria-busy'] === 'true'"
				/>
			</template>
			<slot
				:item="entry.item"
				:text="text"
				:selected="selected"
				:branch="Boolean(aria['aria-expanded'])"
				:expanded="aria['aria-expanded'] === 'true'"
				:loading="aria['aria-busy'] === 'true'"
				>{{ text }}</slot
			>
		</ItemRow>
		<span v-else class="so-tree-item__accessible-name">{{ text }}</span>
		<div v-if="aria['aria-expanded'] === 'true'" role="group" class="so-tree-item__group">
			<template v-for="child in entry.children" :key="child.key">
				<div
					v-if="child.kind === 'filler'"
					class="so-tree__filler"
					aria-hidden="true"
					:style="child.style"
				></div>
				<TreeRow v-else :ctrl="child.item" :entry="child">
					<template v-if="$slots.default" #default="scope: _RowScope">
						<slot
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
							:text="scope.text"
							:selected="scope.selected"
						/>
					</template>
					<template v-if="$slots['icon']" #icon="scope: IconScope">
						<slot
							name="icon"
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
						/>
					</template>
					<template v-if="$slots['indicator-icon']" #indicator-icon="scope: IconScope">
						<slot
							name="indicator-icon"
							:item="scope.item"
							:branch="scope.branch"
							:expanded="scope.expanded"
							:loading="scope.loading"
						/>
					</template>
				</TreeRow>
			</template>
		</div>
	</component>
</template>
