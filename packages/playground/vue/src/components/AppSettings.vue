<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Field, Select, Switch } from '@soxa-ui/vue'
import { useTheme } from '../composables/useTheme'
import { useIconPack } from '../composables/useIconPack'
import { useLanguage } from '../composables/useLanguage'
import { useMotionMode, type TMotionOffReason } from '../composables/useMotionMode'
import { FRAMEWORKS, isFramework } from '../hosts'
import { frameworkOf, withFramework } from '../navigation'

const { theme, dark, themes } = useTheme()
const { pack, packs, apply } = useIconPack()
const { mode, modes, offReason, choose } = useMotionMode()
const { language, languages, choose: chooseLanguage } = useLanguage()

/** Чем выключено движение — в плашке рядом с переключателем. */
const OFF_REASONS: Record<TMotionOffReason, string> = {
	system: 'так просит система',
	stand: 'режимом стенда',
}

/**
 * Плашка, пока движение выключено: пропавшая анимация иначе выглядит поломкой
 * компонента. Тот же текст — в `title`: в тесной шапке плашка режет его
 * многоточием.
 */
const motionOff = computed(
	() =>
		offReason.value &&
		`Движение выключено — ${OFF_REASONS[offReason.value]}. «${modes.full}» вернёт его`,
)

const route = useRoute()
const router = useRouter()

/** Фреймворк превью — первый сегмент адреса. */
const framework = computed(() => frameworkOf(route))

/**
 * Сменить фреймворк: меняется первый сегмент адреса, остаток пути тот же.
 * Пропсы, выставленные на странице, остаются у оболочки — заново рисуются
 * только сцены.
 */
function chooseFramework(value: unknown): void {
	if (isFramework(value) && value !== framework.value) {
		router.push(withFramework(route.path, value))
	}
}
</script>

<template>
	<div class="pg__settings">
		<!--
			Настройки стенда — контролы шапки. Компонент один на два места: в
			широком окне он в шапке, в узком — в панели настроек (`AppHeader.vue`).
			Обёртка в шапке своей коробки не даёт (`display: contents`): контролы и
			плашка остаются flex-элементами шапки, и на этом держатся правила
			плашки. В панели обёртка ставит их столбцом (styles.css, «Каркас»)

			Контрол с подписью — поле формы `Field`, подпись сбоку: её `for` поле
			ведёт на `<input>` контрола само, и подпись — его имя. Колонки поля
			задаёт стенд (`--so-field-columns`): в шапке подпись рядом с
			контролом, в панели — над ним
		-->

		<!--
			Фреймворк — первым из контролов: он решает, чем нарисованы все
			компоненты страницы. Плашка движения остаётся у своего переключателя
		-->
		<Field
			class="pg__control"
			position="start"
			size="sm"
			label="Фреймворк"
			data-guide-anchor="framework"
		>
			<Select :value="framework" size="sm" @update:value="chooseFramework($event)">
				<Select.Item
					v-for="item in FRAMEWORKS"
					:key="item.id"
					:value="item.id"
					:text="item.label"
				/>
			</Select>
		</Field>

		<p v-if="motionOff" class="pg__motion-off" :title="motionOff">{{ motionOff }}</p>

		<Field
			class="pg__control"
			position="start"
			size="sm"
			label="Анимация движения"
			data-guide-anchor="motion"
		>
			<Select :value="mode" size="sm" @update:value="choose($event)">
				<Select.Item
					v-for="(label, value) in modes"
					:key="value"
					:value="value"
					:text="label"
				/>
			</Select>
		</Field>

		<Field
			class="pg__control"
			position="start"
			size="sm"
			label="Язык"
			data-guide-anchor="language"
		>
			<Select :value="language" size="sm" @update:value="chooseLanguage($event)">
				<Select.Item
					v-for="(entry, value) in languages"
					:key="value"
					:value="value"
					:text="entry.label"
				/>
			</Select>
		</Field>

		<Field class="pg__control" position="start" size="sm" label="Тема">
			<Select :value="theme" size="sm" @update:value="theme = String($event)">
				<Select.Item
					v-for="item in themes"
					:key="item.id"
					:value="item.value"
					:text="item.label"
				/>
			</Select>
		</Field>

		<Field class="pg__control" position="start" size="sm" label="Иконки">
			<Select :value="pack" size="sm" @update:value="apply(String($event))">
				<Select.Item
					v-for="item in packs"
					:key="item.id"
					:value="item.id"
					:text="item.label"
				/>
			</Select>
		</Field>

		<Field
			class="pg__control"
			position="start"
			size="sm"
			label="Тёмная"
			data-guide-anchor="scheme"
		>
			<Switch :value="dark" size="sm" @update:value="dark = Boolean($event)" />
		</Field>
	</div>
</template>
