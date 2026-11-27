<script setup lang="ts">
import { ref } from 'vue'
import { Button, Stepper } from '@soxa-ui/vue'

const ports = [
	{
		code: 'SGSIN',
		ship: 'Maersk Sealand',
		route: '214E / Tuas',
		status: 'Departed',
		date: '17 May',
		detail: 'Captain',
		value: 'M. Walberg',
		done: true,
		title: 'Singapore',
		summary: 'Cargo loaded and cleared for departure.',
	},
	{
		code: 'LKCMB',
		ship: 'MSC Aurora',
		route: '088W / SAGT',
		status: 'Departed',
		date: '22 May',
		detail: 'Containers',
		value: '4 × 40 HC',
		done: true,
		title: 'Colombo',
		summary: 'Containers transferred to MSC Aurora.',
	},
	{
		code: 'EGPSD',
		ship: 'MSC Aurora',
		route: '088W / Med Sea',
		status: 'Arrived',
		date: '26 May',
		detail: 'Delay',
		value: '+1 day',
		done: false,
		title: 'Port Said',
		summary: 'Through the Suez Canal on 26 May at 18 knots, now a day behind.',
	},
	{
		code: 'NLRTM',
		ship: 'MSC Aurora',
		route: '088W / ECT Delta',
		status: 'ETA',
		date: '03 Jun',
		detail: 'Customs',
		value: 'Pending',
		done: false,
		title: 'Rotterdam',
		summary: 'Unload at ECT Delta and clear customs.',
	},
	{
		code: 'DEHAM',
		ship: 'DB Cargo',
		route: '4410 / CTA',
		status: 'ETA',
		date: '06 Jun',
		detail: 'Onward',
		value: 'Rail',
		done: false,
		title: 'Hamburg',
		summary: 'Final rail handover at Container Terminal Altenwerder.',
	},
]

const stages = [
	{
		id: 'resolution',
		name: 'Resolution',
		done: true,
		info: 'Rollback was selected as the lowest-risk resolution.',
	},
	{
		id: 'scoping',
		name: 'Scoping',
		done: true,
		info: 'The change affects six api-gateway pods.',
	},
	{
		id: 'execution',
		name: 'Execution',
		done: false,
		info: 'Roll api-gateway back to v2.14.1 across six pods.',
	},
	{
		id: 'verification',
		name: 'Verification',
		done: false,
		info: 'Check error rate and latency against the baseline.',
	},
	{
		id: 'approval',
		name: 'Approval',
		done: false,
		info: 'Ask the incident lead to confirm recovery.',
	},
	{
		id: 'summary',
		name: 'Summary',
		done: false,
		info: 'Record the outcome and the follow-up actions.',
	},
]

const infoOpen = ref<string>()
function toggleInfo(id: string) {
	infoOpen.value = infoOpen.value === id ? undefined : id
}
</script>

<template>
	<h1 class="pg__page-title">Stepper · примеры</h1>

	<section class="stepper-example" aria-labelledby="stepper-route-title">
		<h2 id="stepper-route-title">Маршрут доставки</h2>

		<Stepper class="route-steps" value="EGPSD" :interactive="false" aria-label="Shipping route">
			<Stepper.Item
				v-for="port in ports"
				:key="port.code"
				:value="port.code"
				:text="port.code"
				:completed="port.done"
			>
				<template #leading>
					<strong>{{ port.ship }}</strong>
					<span>{{ port.route }}</span>
				</template>

				<template #indicator>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.55"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="4" r="2" />
						<path
							d="M12 6v14M9 10h6M4 13v2a8 8 0 0 0 16 0v-2M2 15l2-2 2 2m12 0 2-2 2 2"
						/>
					</svg>
				</template>

				<template #separator="{ active }">
					<svg
						v-if="active"
						viewBox="0 0 100 10"
						preserveAspectRatio="none"
						fill="none"
						stroke="currentColor"
					>
						<path
							d="M0 5 Q3 0 6 5 T12 5 T18 5 T24 5 T30 5 T36 5 T42 5 T48 5 T54 5 T60 5 T66 5 T72 5 T78 5 T84 5 T90 5 T96 5 L100 5"
						/>
					</svg>
				</template>

				<template #details>
					<dl class="route-steps__facts">
						<div>
							<dt>{{ port.status }}</dt>
							<dd>{{ port.date }}</dd>
						</div>
						<div>
							<dt>{{ port.detail }}</dt>
							<dd>{{ port.value }}</dd>
						</div>
					</dl>
				</template>
			</Stepper.Item>

			<template #content="{ previous, next, canPrevious, canNext }">
				<div class="route-steps__current">
					<Stepper.Content v-for="port in ports" :key="port.code" :value="port.code">
						<h3>{{ port.title }}</h3>
						<p>{{ port.summary }}</p>
					</Stepper.Content>
					<div class="stepper-example__actions">
						<Button text="Previous" :disabled="!canPrevious" @click="previous()" />
						<Button text="Next" :disabled="!canNext" @click="next()" />
					</div>
				</div>
			</template>
		</Stepper>
	</section>

	<section class="stepper-example" aria-labelledby="stepper-runbook-title">
		<h2 id="stepper-runbook-title">Этапы устранения инцидента</h2>

		<Stepper
			class="runbook-steps"
			value="execution"
			orientation="vertical"
			aria-label="Incident stages"
		>
			<Stepper.Item
				v-for="stage in stages"
				:key="stage.id"
				:value="stage.id"
				:text="stage.name"
				:completed="stage.done"
			>
				<template #indicator="{ completed }">
					<span>{{ completed ? '✓' : '' }}</span>
				</template>

				<template #details>
					<button
						type="button"
						class="runbook-steps__info"
						:aria-label="'Info: ' + stage.name"
						:aria-expanded="infoOpen === stage.id"
						:aria-controls="'stepper-demo-info-' + stage.id"
						@click="toggleInfo(stage.id)"
					>
						i
					</button>
					<p
						v-show="infoOpen === stage.id"
						:id="'stepper-demo-info-' + stage.id"
						class="runbook-steps__note"
					>
						{{ stage.info }}
					</p>
				</template>
			</Stepper.Item>

			<template #content="{ previous, next, canPrevious, canNext }">
				<div class="runbook-steps__current">
					<Stepper.Content
						v-for="(stage, index) in stages"
						:key="stage.id"
						:value="stage.id"
					>
						<span class="runbook-steps__count"
							>Step {{ index + 1 }} of {{ stages.length }}</span
						>
						<h3>{{ stage.name }}</h3>
						<p>{{ stage.info }}</p>
					</Stepper.Content>
					<div class="stepper-example__actions">
						<Button text="Previous" :disabled="!canPrevious" @click="previous()" />
						<Button text="Next" :disabled="!canNext" @click="next()" />
					</div>
				</div>
			</template>
		</Stepper>
	</section>
</template>

<style src="./stepper-examples.css"></style>
