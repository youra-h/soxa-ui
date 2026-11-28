<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Field, Switch } from '@soxa-ui/vue'
import type { IPreviewHost } from '@soxa-ui/playground-shared'
import PreviewStage from './PreviewStage.vue'

defineProps<{ host: IPreviewHost }>()

const collapsed = ref(false)
const offcanvas = ref(false)
const bind = computed(() => ({
	collapse: offcanvas.value ? 'offcanvas' : 'icon',
	collapsed: collapsed.value,
}))

const schedule = [
	{ date: '2026-12-01', label: '1 декабря', title: 'Репортаж из зимнего сада' },
	{ date: '2026-12-03', label: '3 декабря', title: 'Интервью с реставратором' },
	{ date: '2026-12-05', label: '5 декабря', title: 'Путеводитель по книжной ярмарке' },
]
</script>

<template>
	<section class="pg-sidebar-demo" aria-label="Редакция «Поле»">
		<div class="pg-sidebar-demo__layout">
			<PreviewStage :host="host" component="sidebar" :bind="bind" />
			<div class="pg-sidebar-demo__workspace">
				<header class="pg-sidebar-demo__bar">
					<strong>Рабочая область</strong>
					<Field label="Скрывать целиком" position="end" size="sm">
						<Switch
							:value="offcanvas"
							size="sm"
							@update:value="offcanvas = Boolean($event)"
						/>
					</Field>
					<Button
						:text="collapsed ? 'Развернуть панель' : 'Свернуть панель'"
						:aria-expanded="!collapsed"
						size="sm"
						@click="collapsed = !collapsed"
					/>
				</header>
				<div class="pg-sidebar-demo__content">
					<h2>Календарь публикаций</h2>
					<ul class="pg-sidebar-demo__schedule">
						<li v-for="publication in schedule" :key="publication.date">
							<time :datetime="publication.date">{{ publication.label }}</time>
							<span>{{ publication.title }}</span>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</section>
</template>
