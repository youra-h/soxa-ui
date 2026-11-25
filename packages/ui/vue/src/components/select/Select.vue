<script lang="ts">
import { Frame } from '../frame'
import { Input } from '../input'
import { Icon } from '../icon'
import Tags from '../tags/Tags.vue'
import { SelectItem } from './item'
import { SelectGroup } from './group'
import SetupSelect from './setup.component'

export default {
	...SetupSelect,
	components: { Frame, Input, Icon, Tags, SelectItem, SelectGroup },
}
</script>

<template>
	<div
		ref="rootElement"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...dataset, ...containerAttrs, ...attrs }"
	>
		<!--
				The field is a ready `Input`, not an `<input>` of its own: it has the
				`leading`/`trailing` slots for icons, and the styles. The whole ARIA
				set of the combobox (`role="combobox"`, `aria-expanded`,
				`aria-controls`, `aria-activedescendant`, `aria-autocomplete`) lives
				in `field.aria` (`TSelect`, `TSelectExtension`,
				`TSelectKeyboardPlugin`), and `Input.vue` puts it on its inner
				`<input>` itself.

				`:ctrl="field"`, not a set of props: the text, the placeholder and the
				combobox ARIA belong to the separate `TInput` instance (`field`) that
				Select owns (`TSelect.field`, `TSelectExtension`). No `:value` or
				`:placeholder` next to it — they would be second copies. `disabled`,
				`size`, `variant`, `readonly`, `required`, `name`, `clearable` and
				the error (`invalid`) are carried by the instance too: Select keeps them
				in sync itself. The clear button gets its name from the field's names
				plugin. `id` is a prop of `TIdPlugin`, not of the core: Select hands
				its own `id` (the app's or the form field's) to the field, and `Input`
				puts it on its `<input>`.

				Select's own `aria` set — the name (`aria_label`, `aria_labelledBy`),
				the description, `aria-invalid` — goes as attributes to `Input`, which
				hands them to its `<input>` over the combobox set: the name and the
				description belong to the focused element. The consumer's attributes go
				over both.

				The field draws the clear button — first in its end slot, before the
				arrow. Its `clear` command clears the field, and `TSelectExtension`
				drops the choice by its event: there is no button here.

				The nested `Input`'s `readonly` is Select's, driven by `editable`.
				Select-only (`editable: false`, the default) keeps the field readonly;
				`editable: true` lifts it and lets the user type. What typing does is
				`editableMode`'s, decided whole in `TEditablePlugin`: the markup knows
				nothing of highlighting and filtering, so all adapters behave the same.

				`readonly` turns off the native `required` of the nested `<input>`
				(the browser does not validate a readonly field), so `TInput` sets
				`aria-required` in `field.aria` explicitly — otherwise the screen
				reader would not hear the state (`TInput._syncInputAccessibility()`).
			-->
		<slot name="field" :field="field">
			<Input
				embedded="select.field"
				class="so-select__field"
				:ctrl="field"
				:id="id"
				v-bind="{ ...aria, ...controlAttrs }"
			>
				<!-- Input's slots are relayed outward as they are -->
				<template #leading>
					<!--
						The tags are a second component with its own collection, not
						markup: "option ⇄ tag" lives whole in `TSelectTagsExtension`. Only
						in `multiple` — in `single` `tags` is empty, and the slot gets the
						same field.

						The `tags` slot hands over the tags instance and its collection —
						what the built-in `Tags` takes as `:ctrl` and `:engine`: a row of
						one's own gets the link ready and lays out the tags as it needs.
					-->
					<slot v-if="tags" name="tags" :tags="tags" :engine="tags_engine">
						<Tags
							embedded="select.tags"
							class="so-select__tags"
							:ctrl="tags"
							:engine="tags_engine ?? undefined"
						/>
					</slot>
					<slot name="leading" />
				</template>

				<!--
					A clear button of one's own — the field's `clear` slot relayed with
					the field's scope: the `clear` command clears the field, and the
					choice drops by its event. The slot goes to the field only when Select
					has it: otherwise the field draws its own button by `clearable`.
				-->
				<template v-if="$slots.clear" #clear="{ clear }">
					<slot name="clear" :clear="clear" />
				</template>

				<template #trailing>
					<!--
						The arrow is decorative: `aria-expanded` on the field already says
						the panel's state. Icon is hidden from the screen reader by default.

						The class is on the wrapper, not on the icon: the theme turns the
						arrow by `.so-select[data-open] .so-select__arrow`. On `Icon` an
						icon replaced through the slot would silently stop turning.
					-->
					<span class="so-select__arrow">
						<slot name="arrow-icon">
							<Icon embedded="select.arrow" :tag="arrowIconTag" :size="size" />
						</slot>
					</span>

					<slot name="trailing" />
				</template>
			</Input>
		</slot>

		<!--
			The panel is teleported, so it lies outside the field's subtree. Two
			consequences: its anchor is Select's root, and `dismiss_ownerAttribute`
			marks Select as its owner — otherwise a press inside the panel would count
			as a press outside and close it.

			Openness is `visible` (v-show), not `rendered` (v-if), and it matters:
			the options join the collection on mounting and leave it on unmounting.
			Hidden by `v-if`, the panel would empty the collection on closing, and
			the choice with it — the field's value. `v-show` sets `display: none`,
			which also takes the panel out of the accessibility tree.

			The template does not compute the panel's side: the core turns Select's
			`placement` into `panelPlacement` and `panelFlip`, and at the window's
			edge `TAnchorPlugin` picks the side, unless `placement` forbade the flip.

			`panelDataset` — the panel's `data-*` from Select: "being pulled"
			(`data-swiping`), by which the theme drops the transition while the panel
			follows the finger. Openness (`data-open`) Frame writes itself — it is
			its layer's visibility — and the side after a flip (`data-placement`) the
			anchor plugin. The gesture plugin writes the offset during the gesture
			(`--so-swipe-offset`) into the panel itself.
		-->
		<Frame
			@bundle:create="ids_bindPanel"
			embedded="select.frame"
			:visible="visible && open"
			strategy="fixed"
			:anchor_anchor="rootElement"
			:anchor_placement="panelPlacement"
			:anchor_flip="panelFlip"
			:anchor_matchWidth="autoFitWidth"
			:anchor_offset="4"
			class="so-select__panel"
			v-bind="{ ...panelDataset, ...dismiss_ownerAttribute }"
		>
			<!--
				The bar the panel is pulled by — while the gesture is on. It says the
				panel can be swiped and does nothing itself: the consumer does not
				address it, and the screen reader does not need it (`aria-hidden`). It
				stands at the edge on the field's side (`data-placement`), placed by the
				theme. A direct child of the panel and outside the list: in
				`[role=listbox]` the screen reader would take it for an option, and the
				gesture plugin knows the bar only at the panel itself. Closing without
				dragging is Escape and a press outside.
			-->
			<div v-if="handleRendered" class="so-select__handle" aria-hidden="true" />

			<div class="so-select__list" v-bind="listAria">
				<slot>
					<!--
						The options' slots are static and get the item through the scope —
						dynamic names resolve only in Vue (see Tabs.vue). The relay is whole:
						each option slot has its `item-<slot>`, whose scope is the option
						slot's scope plus the option. The option draws its mark itself while
						its slot is not given — so the mark's slot goes to it only when Select
						has it.

						The options are what the collection draws, by the grouping's sections
						(`drawnSections`), as in ListBox: a group with a label — in
						`SelectGroup`, options without a group — right in the list, and
						between neighboring sections, while Select asks for it
						(`groupSeparators`), a mute separator (`aria-hidden`, not
						`separator`: ARIA lets only options and groups into a `listbox`). The
						sections follow the shown order — the arrows highlight the options as
						they stand on screen. Without groups there is one section — no wrapper,
						no separator. A filter that removed all options of a group removes its
						section with the label.

						A section has its entries in order, keyed by the entry's key. Without
						a window these are all its shown options — what the filter left. A
						hidden option unmounts but stays in the collection — the data own the
						composition, not the markup (`owned` in `TCollectionExtension`).
						Dropping the filter brings it back with its choice.

						In the window of the `Virtual` wrapper (a list without groups) — the
						visible options and fillers in place of the skipped ones: a `div`
						under `aria-hidden` whose height the theme takes from its style. One
						loop for options and fillers, as in ListBox: loops by blocks would
						remount an option moving from block to block. The relay is written
						for the options of a group and for those without one: their wrappers
						differ.

						The slots are relayed only when Select has any of them: the relay
						refers to the loop's `entry`, and Vue redraws an item with such
						slots on every redraw of its owner (AGENTS.md, Pitfalls) — every
						option on every opening of the panel.
					-->
					<!--
						Options from data are mounted from the panel's first opening on
						(`contentRendered`): a closed Select nobody opened builds its
						field and an empty list. Closing hides the panel and keeps them.
						The slot itself is not conditional: options in markup enter the
						collection only mounted, and without them the closed field would
						lose the selected text and the value.
					-->
					<template v-if="contentRendered">
						<template v-for="(section, index) in drawnSections" :key="section.key">
							<div
								v-if="groupSeparators && index > 0"
								class="so-select__separator"
								aria-hidden="true"
							></div>
							<SelectGroup v-if="section.group" :label="section.group.label">
								<template v-for="entry in section.entries" :key="entry.key">
									<div
										v-if="entry.kind === 'filler'"
										class="so-select__filler"
										aria-hidden="true"
										:style="entry.style"
									></div>
									<SelectItem
										v-else-if="
											!(
												$slots.item ||
												$slots['item-leading'] ||
												$slots['item-trailing'] ||
												$slots['item-indicator-icon']
											)
										"
										:ctrl="entry.item"
									/>
									<SelectItem v-else :ctrl="entry.item">
										<template #leading>
											<slot name="item-leading" :item="entry.item" />
										</template>
										<template #default="{ text, selected }">
											<slot
												name="item"
												:item="entry.item"
												:text="text"
												:selected="selected"
											/>
										</template>
										<template #trailing>
											<slot name="item-trailing" :item="entry.item" />
										</template>
										<template
											v-if="$slots['item-indicator-icon']"
											#indicator-icon="{ selected }"
										>
											<slot
												name="item-indicator-icon"
												:item="entry.item"
												:selected="selected"
											/>
										</template>
									</SelectItem>
								</template>
							</SelectGroup>
							<template v-else>
								<template v-for="entry in section.entries" :key="entry.key">
									<div
										v-if="entry.kind === 'filler'"
										class="so-select__filler"
										aria-hidden="true"
										:style="entry.style"
									></div>
									<SelectItem
										v-else-if="
											!(
												$slots.item ||
												$slots['item-leading'] ||
												$slots['item-trailing'] ||
												$slots['item-indicator-icon']
											)
										"
										:ctrl="entry.item"
									/>
									<SelectItem v-else :ctrl="entry.item">
										<template #leading>
											<slot name="item-leading" :item="entry.item" />
										</template>
										<template #default="{ text, selected }">
											<slot
												name="item"
												:item="entry.item"
												:text="text"
												:selected="selected"
											/>
										</template>
										<template #trailing>
											<slot name="item-trailing" :item="entry.item" />
										</template>
										<template
											v-if="$slots['item-indicator-icon']"
											#indicator-icon="{ selected }"
										>
											<slot
												name="item-indicator-icon"
												:item="entry.item"
												:selected="selected"
											/>
										</template>
									</SelectItem>
								</template>
							</template>
						</template>
					</template>
				</slot>

				<slot v-if="shown.length === 0" name="empty" />
			</div>
		</Frame>
	</div>
</template>
