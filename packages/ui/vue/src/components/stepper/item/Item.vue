<script lang="ts">
import { Icon } from '../../icon'
import SetupStepperItem from './setup.component'

export default { ...SetupStepperItem, components: { Icon } }
</script>

<template>
	<li
		ref="rootElement"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...dataset, ...containerAttrs }"
	>
		<div v-if="$slots.leading" class="so-stepper-item__leading">
			<slot
				name="leading"
				:value="value"
				:number="stepper_number"
				:active="active"
				:completed="completed"
				:error="error"
			/>
		</div>
		<component
			:is="stepper_interactive ? 'button' : 'span'"
			class="so-stepper-item__trigger"
			v-bind="{ ...aria, ...controlAttrs }"
			:type="stepper_interactive ? 'button' : undefined"
			:disabled="stepper_interactive && !stepper_canActivate ? true : undefined"
			@click="stepper_interactive && !$event.defaultPrevented && activate()"
		>
			<span class="so-stepper-item__indicator" aria-hidden="true">
				<slot
					name="indicator"
					:value="value"
					:number="stepper_number"
					:active="active"
					:completed="completed"
					:error="error"
				>
					<Icon
						v-if="active"
						embedded="stepper.step-icon"
						class="so-stepper-item__step-icon"
						:tag="stepIconTag"
						:size="size"
					/>
					<Icon
						v-else-if="error || completed"
						embedded="stepper.status-icon"
						:tag="error ? errorIconTag : checkIconTag"
						:size="size"
					/>
					<template v-else>{{ stepper_number }}</template>
				</slot>
			</span>
			<span class="so-stepper-item__body">
				<span class="so-stepper-item__label">
					<slot
						:value="value"
						:number="stepper_number"
						:active="active"
						:completed="completed"
						:error="error"
						>{{ text }}</slot
					>
				</span>
				<span v-if="description || $slots.subtitle" class="so-stepper-item__description">
					<slot
						name="subtitle"
						:value="value"
						:number="stepper_number"
						:active="active"
						:completed="completed"
						:error="error"
						>{{ description }}</slot
					>
				</span>
			</span>
		</component>
		<span v-if="stepper_hasSeparator" class="so-stepper-item__separator" aria-hidden="true">
			<slot
				name="separator"
				:value="value"
				:number="stepper_number"
				:active="active"
				:completed="completed"
				:error="error"
			/>
		</span>
		<div v-if="$slots.details" class="so-stepper-item__details">
			<slot
				name="details"
				:value="value"
				:number="stepper_number"
				:active="active"
				:completed="completed"
				:error="error"
			/>
		</div>
	</li>
</template>
