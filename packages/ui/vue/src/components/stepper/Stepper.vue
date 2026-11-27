<script lang="ts">
import StepperItem from './item/Item.vue'
import SetupStepper from './setup.component'

export default { ...SetupStepper, components: { StepperItem } }
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...dataset, ...aria }"
	>
		<ol class="so-stepper__list" role="list">
			<slot>
				<template v-for="item in shown" :key="item.uid">
					<slot name="item" :item="item">
						<StepperItem :ctrl="item" />
					</slot>
				</template>
			</slot>
		</ol>
		<slot
			name="content"
			:value="value"
			:next="next"
			:previous="previous"
			:canNext="stepper_canNext"
			:canPrevious="stepper_canPrevious"
		/>
	</component>
</template>
