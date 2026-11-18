<script setup lang="ts">
import { ref } from 'vue'
import type { IDatePickerProps, ISelectProps, TValuePayload } from '@soxa-ui/core'
import { Accordion, Button, CheckBox, DatePicker, Input, Label, Select } from '@soxa-ui/vue'
import CtrlExample from './CtrlExample.vue'

const name = ref('')
const accepted = ref(false)
const city = ref<ISelectProps['value']>('kzn')
const date = ref<IDatePickerProps['value']>('2026-11-14')
const lastChange = ref('')
const submitted = ref(false)
const mounted = ref(true)
const cities = [
	{ value: 'kzn', text: 'Kazan' },
	{ value: 'msk', text: 'Moscow' },
]

function changed(payload: TValuePayload<string>) {
	lastChange.value = payload.newValue
}
</script>
<template>
	<main>
		<h1>Travel preferences</h1>
		<form @submit.prevent="submitted = true">
			<label for="traveler-name">Traveler name</label>
			<Input id="traveler-name" v-model:value="name" @change:value="changed" />
			<Label text="Accept travel policy"
				><CheckBox tag="span" v-model:value="accepted"
			/></Label>
			<Select v-model:value="city" :items="cities" aria_label="Destination">
				<template #item="{ text }"
					><span>{{ text }}</span></template
				>
			</Select>
			<DatePicker v-model:value="date" aria_label="Departure" timeZone="UTC" />
			<Button type="submit" text="Save preferences" variant="accent" />
			<output data-testid="values">{{ name }}|{{ accepted }}|{{ city }}|{{ date }}</output>
			<output data-testid="change">{{ lastChange }}</output>
			<output v-if="submitted">Preferences saved</output>
		</form>
		<Accordion>
			<Accordion.Item value="help" text="Travel help">
				<template #header="{ text, selected }"
					>{{ text }}: {{ selected ? 'open' : 'closed' }}</template
				>
				<p>Bring your travel documents.</p>
			</Accordion.Item>
		</Accordion>
		<Button type="button" text="Toggle controller" @action:click="mounted = !mounted" />
		<CtrlExample v-if="mounted" />
		<!-- @vue-expect-error Boolean prop types must reach the consumer template. -->
		<Button v-if="false" :disabled="'yes'" />
	</main>
</template>
