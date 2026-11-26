<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ProgressLinear, ProgressSpinner } from '@soxa-ui/vue'
import { locale } from '../../composables/useLanguage'

type TUploadLabels = readonly [uploading: string, done: string, of: string]

const english: TUploadLabels = ['Uploading…', 'Done', 'of']
const labels: Readonly<Record<string, TUploadLabels>> = {
	'en-US': english,
	'ru-RU': ['Загрузка…', 'Готово', 'из'],
	'zh-CN': ['正在上传…', '已完成', '/'],
	'fr-FR': ['Téléversement…', 'Terminé', 'sur'],
	'es-ES': ['Subiendo…', 'Listo', 'de'],
	'ar-EG': ['جارٍ الرفع…', 'اكتمل', 'من'],
	'de-DE': ['Wird hochgeladen…', 'Fertig', 'von'],
	'he-IL': ['מעלה…', 'הושלם', 'מתוך'],
	'th-TH': ['กำลังอัปโหลด…', 'เสร็จแล้ว', 'จาก'],
	'ja-JP': ['アップロード中…', '完了', '/'],
}

const props = defineProps<{ file: File }>()
const duration = 12_000

const elapsed = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

const fraction = computed(() => Math.min(1, elapsed.value / duration))
const percent = computed(() => Math.floor(fraction.value * 100))
const uploading = computed(() => fraction.value < 1)

const text = computed(() => labels[locale.value.tag] ?? english)
const percentText = computed(() =>
	new Intl.NumberFormat(locale.value.tag, { style: 'percent' }).format(percent.value / 100),
)

const units = ['byte', 'kilobyte', 'megabyte', 'gigabyte'] as const
const size = computed(() => {
	const total = props.file.size
	const scale = Math.min(units.length - 1, Math.floor(Math.log10(Math.max(1, total)) / 3))
	const unit = units[scale]

	const formatter = new Intl.NumberFormat(locale.value.tag, {
		style: 'unit',
		unit,
		unitDisplay: 'short',
		maximumFractionDigits: scale ? 1 : 0,
	})

	const divisor = 1000 ** scale

	return {
		transferred: formatter.format(Math.floor(total * fraction.value) / divisor),
		total: formatter.format(total / divisor),
	}
})

onMounted(() => {
	const started = performance.now()

	timer = setInterval(() => {
		elapsed.value = performance.now() - started

		if (!uploading.value) clearInterval(timer)
	}, 100)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
	<div class="upload-progress">
		<div class="upload-status">
			<span>{{ uploading ? text[0] : text[1] }}</span>
			<span class="upload-percent">
				{{ percentText }}
				<span v-if="uploading" aria-hidden="true">
					<ProgressSpinner size="sm" indeterminate />
				</span>
			</span>
		</div>
		<ProgressLinear :value="percent" :max="100" variant="accent" :aria_label="file.name" />
		<div class="upload-size">
			<bdi>{{ size.transferred }}</bdi> {{ text[2] }} <bdi>{{ size.total }}</bdi>
		</div>
	</div>
</template>

<style scoped>
.upload-progress {
	display: grid;
	gap: 0.375em;
	margin-block-start: 0.25em;
}

.upload-status,
.upload-percent {
	display: flex;
	align-items: center;
	gap: 0.375em;
}

.upload-status {
	justify-content: space-between;
}

.upload-percent {
	font-variant-numeric: tabular-nums;
}

.upload-size {
	font-size: 0.875em;
	color: var(--so-neutral-700);
}
</style>
