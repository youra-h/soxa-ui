<script setup lang="ts">
import { watch } from 'vue'
import { TGuide, type IGuideStep } from '@soxa-ui/core'
import { Button, Guide } from '@soxa-ui/vue'
import { useTheme } from '../composables/useTheme'

const props = defineProps<{ narrow: boolean }>()
const guide = new TGuide()
const settingsEvents = new EventTarget()
const { dark } = useTheme()

watch(dark, () => settingsEvents.dispatchEvent(new Event('schemechange')))
watch(
	() => props.narrow,
	() => guide.close(),
)

function headerAnchor(name: string): { element: () => Element | null } {
	return { element: () => document.querySelector(`.pg__header [data-guide-anchor="${name}"]`) }
}

const wideSteps: readonly IGuideStep[] = [
	{
		id: 'framework',
		title: 'Фреймворк',
		description: 'Здесь можно переключить фреймворк, на котором отрисовано превью.',
		anchor: headerAnchor('framework'),
		placement: 'bottom',
	},
	{
		id: 'motion',
		title: 'Анимация движения',
		description: 'Настройка управляет движением компонентов на стенде.',
		anchor: headerAnchor('motion'),
		placement: 'bottom',
	},
	{
		id: 'language',
		title: 'Язык компонентов',
		description: 'Меняет встроенные подписи, формат чисел и дат.',
		anchor: headerAnchor('language'),
		placement: 'bottom',
	},
	{
		id: 'scheme',
		title: 'Тёмная схема',
		description: 'Переключите схему, чтобы перейти к следующему шагу.',
		anchor: headerAnchor('scheme'),
		placement: 'bottom-end',
		advanceOn: { source: settingsEvents, event: 'schemechange' },
	},
]

const settingsStep: IGuideStep = {
	id: 'settings',
	title: 'Настройки стенда',
	description: 'В узком окне настройки фреймворка, языка и оформления находятся за этой кнопкой.',
	anchor: headerAnchor('settings'),
	placement: 'bottom-end',
}

function start(): void {
	const { clientWidth, clientHeight } = document.documentElement

	guide.steps = [
		{
			id: 'welcome',
			title: 'Знакомство со стендом',
			description: 'Посмотрим на настройки Playground и подсветим точку в области превью.',
			mode: 'modal',
		},
		...(props.narrow ? [settingsStep] : wideSteps),
		{
			id: 'point',
			title: 'Точка в области превью',
			description: 'Так можно указать на объект в WebGL по его экранным координатам.',
			anchor: {
				point: { x: Math.round(clientWidth * 0.58), y: Math.round(clientHeight * 0.48) },
			},
			placement: 'bottom',
		},
	]
	guide.start('welcome')
}
</script>

<template>
	<Button size="sm" view="plain" type="button" aria-haspopup="dialog" @click="start">
		Обзор
	</Button>
	<Guide :ctrl="guide" />
</template>
