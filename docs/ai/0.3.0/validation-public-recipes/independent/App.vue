<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { TButton } from '@soxa-ui/core'
import type { TPluginEvent } from '@soxa-ui/core'
import { Icon, Tabs, Switch, Label, roleIcon } from '@soxa-ui/vue'
import { useMotion } from '@soxa-ui/plugins'
import { TTextAuditPlugin } from './text-audit'
import AuditButton from './AuditButton.vue'

const closeIcon = roleIcon('close')
const props = defineProps<{ custom: boolean }>()
// Raw controller owned by this parent, preserved across the child's mounts.
const ctrl = new TButton({ text: 'Queue report' })
const shown = ref(true)
const prefix = ref<string | undefined>('screen')
const audit = ref('none')
const notifications = ref(0)
const staleRecords = ref(-1)
const checked = ref(false)
let plugin: TTextAuditPlugin | undefined
let retired: TTextAuditPlugin | undefined
let mutations = 0
let presses = 0
function press() {
	ctrl.text = 'Report queued ' + ++presses
}
function receive(event: TPluginEvent) {
	if (event.name !== 'audit:record') return

	const record = event.args[0]
	if (
		typeof record !== 'object' ||
		record === null ||
		!('prefix' in record) ||
		!('text' in record)
	)
		return

	audit.value = String(record.prefix) + ':' + String(record.text)
	notifications.value++
}
function toggle() {
	if (shown.value) retired = plugin
	shown.value = !shown.value
}
function mutate() {
	ctrl.text = 'Report changed ' + ++mutations
	staleRecords.value = retired?.records ?? -1
}
onMounted(() => ctrl.events.on('plugin:event', receive))
onUnmounted(() => ctrl.events.off('plugin:event', receive))
</script>
<template>
	<main>
		<h1>{{ custom ? 'Studio theme' : 'Oren' }} recipes</h1>
		<button type="button" @click="toggle">Toggle control</button>
		<button type="button" @click="mutate">Change controller</button>
		<button type="button" @click="prefix = undefined">Reset plugin prop</button>
		<button type="button" @click="prefix = 'updated'">Update plugin prop</button>
		<button type="button" @click="useMotion('reduce')">Reduce motion</button>
		<button type="button" @click="useMotion('full')">Full motion</button>
		<button type="button" @click="useMotion('system')">System motion</button>
		<AuditButton
			v-if="shown"
			:ctrl="ctrl"
			:custom="props.custom"
			:prefix="prefix"
			@bundle="plugin = $event"
			@press="press"
		/>
		<output data-testid="audit">{{ audit }}</output>
		<output data-testid="notifications">{{ notifications }}</output>
		<output data-testid="stale">{{ staleRecords }}</output>
		<Icon :tag="closeIcon" aria_label="Replacement close icon" />
		<section aria-label="Direction example">
			<Label text="Enabled"><Switch v-model:value="checked" /></Label>
		</section>
		<Tabs aria_label="Example pages">
			<Tabs.Item value="first" text="First" active />
			<Tabs.Item value="second" text="Second" />
			<template #content>
				<Tabs.Content value="first">First page</Tabs.Content>
				<Tabs.Content value="second">Second page</Tabs.Content>
			</template>
		</Tabs>
	</main>
</template>
