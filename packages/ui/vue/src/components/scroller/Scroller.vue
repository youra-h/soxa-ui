<script lang="ts">
import { Button } from '../button'
import { Icon } from '../icon'
import SetupScroller from './setup.component'

export default { ...SetupScroller, components: { Button, Icon } }
</script>

<template>
	<component
		ref="rootElement"
		:is="tag"
		v-if="rendered"
		v-show="visible"
		:class="classes"
		v-bind="{ ...attrs, ...aria, ...dataset }"
	>
		<!--
			Scroller — лента произвольного содержимого в одну строку, которую
			двигают две кнопки. Корень — ряд из трёх мест: кнопка «назад»,
			вьюпорт, кнопка «вперёд».

			Кнопки стоят СНАРУЖИ вьюпорта намеренно: роль ряда у первого
			потребителя (`role="listbox"` у тегов) приходит на вьюпорт, а
			листбокс владеет только опциями — кнопке внутри него места нет.

			Обработчиков нажатия здесь нет: клики ловит плагин слушателем на
			корне и зовёт команды ядра. Связка «нажали ⇄ листаем» иначе
			повторилась бы в каждом из шести адаптеров.

			`data-can-prev` и `data-can-next` приезжают в `dataset` — по ним
			тема гасит подсказку у края и снимает обе кнопки, когда листать
			нечего. `dir` приходит в `attrs` сам.
		-->

		<!--
			Кнопка «назад». Вида разметка ей не передаёт: значения вида
			объявляет тема, и красит она кнопку по контексту
			(`:where(.so-scroller__prev)`), как крестики и кнопку «…» у Tags.

			Выключенность считает ядро — «выключена лента или упёрлись в
			начало»: тема корень не гасит, и `disabled` обязан доехать до
			кнопок разметкой.

			Значок — иконка роли `arrowRight`, та же, что у «вперёд»: своей
			роли для «влево» в контракте иконок нет, и стрелку «назад»
			зеркалит тема. В RTL зеркалится вторая — это тоже её дело.
		-->
		<!-- Both arrows opt out of Firefox restoring disabled before hydration. -->
		<Button
			embedded="scroller.prev"
			type="button"
			autocomplete="off"
			class="so-scroller__prev"
			:size="size"
			:disabled="prevDisabled"
			v-bind="prevAria"
		>
			<slot name="prev-icon">
				<Icon embedded="scroller.prev-icon" :tag="arrowIconTag" :size="size" />
			</slot>
		</Button>

		<!--
			Вьюпорт — он же ряд: обёртки-дорожки между ним и содержимым нет.
			Это один узел с тремя обязанностями — прокручиваемый контейнер,
			строка содержимого и носитель роли от потребителя; лишний узел
			отрезал бы элементы от этой роли.

			`viewportAria` идёт ПОСЛЕ `tabindex`: значение потребителя сильнее
			нашего — ряд с roving tabindex сам решает, кому быть остановкой.

			Содержимое — слот по умолчанию, его элементы становятся прямыми
			детьми вьюпорта: по ним тема расставляет точки снапа
			(`scroll-snap-align`), а плагин считает края.
		-->
		<div class="so-scroller__viewport" :tabindex="viewportTabIndex" v-bind="viewportAria">
			<slot />
		</div>

		<!-- Кнопка «вперёд» — зеркальная пара «назад», см. комментарий выше. -->
		<Button
			embedded="scroller.next"
			type="button"
			autocomplete="off"
			class="so-scroller__next"
			:size="size"
			:disabled="nextDisabled"
			v-bind="nextAria"
		>
			<slot name="next-icon">
				<Icon embedded="scroller.next-icon" :tag="arrowIconTag" :size="size" />
			</slot>
		</Button>
	</component>
</template>
