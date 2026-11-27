<script lang="ts">
import { StepperContentDescriptor, TStepperContentExtension } from '@soxa-ui/setup'
import type { IStepperContent } from '@soxa-ui/core'
import {
	createVueAdapterContext,
	useAdapter,
	useEmits,
	useExpose,
	useProps,
	VueElevatorFactory,
	type SetupContext,
} from '../../../adapter'
import type { UseProps } from '../../../types/common'

export type StepperContentProps = UseProps<typeof StepperContentDescriptor, IStepperContent>

export default {
	name: '_StepperContent',
	props: useProps(StepperContentDescriptor()),
	emits: useEmits(StepperContentDescriptor()),
	expose: useExpose(),
	setup(props: StepperContentProps, { emit }: SetupContext) {
		const adapter = createVueAdapterContext(StepperContentDescriptor(), {
			ctrl: props.ctrl,
			props,
		}).use(TStepperContentExtension, { elevator: VueElevatorFactory })

		return useAdapter(adapter, props, emit)
	},
}
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered && active"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...dataset, ...aria }"
	>
		<slot />
	</component>
</template>
