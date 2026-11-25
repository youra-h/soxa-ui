<script lang="ts">
import TagsItem from './item/Item.vue'
import SetupTags from './setup.component'

export default { ...SetupTags, components: { TagsItem } }
</script>

<template>
	<div
		ref="rootElement"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<!--
			`dataset` next to `aria`: the overflow mode goes to the theme through
			`data-overflow`, and the row's layout (wrapping, scrolling) is all its
			business.

			The `default` slot gets the shown tags (`shown`): markup of one's own
			lays them out as it needs — in a strip, in a row with a tail in a panel.
			Each tag is drawn there exactly once, as here: a second drawing would
			overwrite its record in the bundles' registry.
		-->
		<slot :shown="shown">
			<!--
				The items' slots are static and get the item through the scope —
				dynamic names resolve only in Vue (see ListBox/Tabs). The relay is
				whole: each tag slot has its `item-<slot>`, whose scope is the tag
				slot's scope plus the tag. The tag draws its close icon itself while
				the slot is not given — so the icon's slot goes to it only when the set
				has it.

				`shown`, not `items`: what the filter left. A hidden item unmounts but
				stays in the collection — the data own the composition, not the markup
				(`owned` in `TCollectionExtension`). Dropping the filter brings it back.

				The slots are relayed only when the set has any of them: the relay
				refers to the loop's `item`, and Vue redraws an item with such slots on
				every redraw of its owner (AGENTS.md, Pitfalls).
			-->
			<template v-for="item in shown" :key="item.uid">
				<TagsItem
					v-if="
						!(
							$slots.item ||
							$slots['item-leading'] ||
							$slots['item-trailing'] ||
							$slots['item-close-icon']
						)
					"
					:ctrl="item"
				/>
				<TagsItem v-else :ctrl="item">
					<template #leading>
						<slot name="item-leading" :item="item" />
					</template>
					<template #default="{ text, selected }">
						<slot name="item" :item="item" :text="text" :selected="selected" />
					</template>
					<template #trailing>
						<slot name="item-trailing" :item="item" />
					</template>
					<template v-if="$slots['item-close-icon']" #close-icon>
						<slot name="item-close-icon" :item="item" />
					</template>
				</TagsItem>
			</template>
		</slot>
	</div>
</template>
