<script lang="ts">
	import { Stepper, type StepperProps } from '@soxa-ui/svelte'
	import { STEPPER_ITEMS } from '@soxa-ui/playground-shared'
	const props: StepperProps = $props()
</script>

<Stepper {...props} items={props.items ?? STEPPER_ITEMS} />
