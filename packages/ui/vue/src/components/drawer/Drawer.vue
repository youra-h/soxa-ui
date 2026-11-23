<script lang="ts">
import Backdrop from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import SetupDrawer from './setup.component'

/**
 * `inheritAttrs: false` обязателен: корень шаблона — `<teleport>`, и Vue
 * считает корневым узлом именно его. Автоматический перенос атрибутов уходил
 * бы в телепорт и до панели не доезжал — ни `class`, ни `data-*`, ни события.
 * Поэтому переносим вручную, на панель: корень выезжающей панели — она.
 */
export default { ...SetupDrawer, inheritAttrs: false, components: { Backdrop, Button, Icon } }
</script>

<template>
	<teleport :to="target" :disabled="contained">
		<!--
			Анатомия — как у модального окна: подложка и панель — соседи, а не
			обёртка и содержимое. Подложка стоит в DOM раньше панели: слой у них
			один (одно число `z-index` инлайном), и панель рисуется поверх просто
			порядком. Нажатие по подложке для плагинов слоя — нажатие мимо корня.

			`contained` выключает телепорт: панель и подложка остаются на месте,
			в разметке родителя, и тема ставит их в ближайший позиционированный
			предок. Цели телепорта тогда нет — `target` не действует.

			Открытость — `visible`: закрытая панель спрятана, а не размонтирована,
			и состояние содержимого переживает закрытие. Въезд и выезд — переход
			темы: `data-open` у панели и подложки говорит ей, куда ехать.
		-->
		<template v-if="rendered">
			<!--
				Номер слоя у подложки тот же, что у панели, открытость и место —
				тоже: она гаснет вместе с панелью и внутри контейнера накрывает
				только его. Пометки владельцем у неё нет — для своей панели она мимо.
			-->
			<Backdrop
				:classes="backdropClasses"
				:visible="visible"
				:styles="layout_backdropStyles"
				:dataset="backdropDataset"
			/>

			<!--
				Корень — сама панель: на ней слой (`data-layer`), пометка
				владельцем, край (`so-drawer--placement-*`), размер
				(`--so-drawer-width`, `--so-drawer-height`), `data-open`,
				`data-swiping` и `data-contained`. Сдвиг во время жеста
				(`--so-swipe-offset`) плагин жеста пишет в неё сам. `tabindex="-1"`
				— фокус встаёт на саму панель, когда внутри нечего фокусировать.

				Порядок в DOM — полоса, заголовок, тело, подвал, потом кнопка
				закрытия: фокус при открытии попадает на первый контрол
				содержимого, а крестик — последняя остановка Tab.
			-->
			<component
				ref="rootElement"
				:is="tag"
				v-show="visible"
				:class="classes"
				:style="layout_styles"
				tabindex="-1"
				v-bind="{ ...attrs, ...aria, ...dataset, ...dismiss_ownerAttribute, ...$attrs }"
			>
				<!--
					Полоса у края, за которую тянут, — пока жест включён. Она
					говорит, что панель можно смахнуть, и сама ничего не делает:
					потребитель её не адресует, скринридеру она не нужна
					(`aria-hidden`). Закрыть без перетаскивания — крестик,
					подложка и Escape.
				-->
				<div v-if="handleRendered" class="so-drawer__handle" aria-hidden="true" />

				<!--
					Заголовок рисуется всегда: на него панель ссылается
					`aria-labelledby`, и `id` для этой ссылки он берёт из
					`titleAria`. Вокруг слота нет пробелов: пустой заголовок тема
					сворачивает по `:empty`.
				-->
				<h2 class="so-drawer__title" v-bind="titleAria"><slot name="title" /></h2>

				<!-- Тело — прокручивается оно, шапка и подвал остаются на месте -->
				<div class="so-drawer__body">
					<slot />
				</div>

				<!-- Подвал — ряд действий. Пустой тема сворачивает по `:empty` -->
				<div class="so-drawer__footer"><slot name="footer" /></div>

				<!--
					The close button sits in the header corner on the line-end
					side. It asks the drawer to close: a `close:before` subscriber
					can cancel that. Where focus returns is up to the focus
					plugin. It is mounted only while on (`v-if`), not hidden with
					`visible`: the theme relies on its absence from the DOM, and a
					hidden button would still assemble its instance and plugins.
					It has no view and no size — the theme paints it by context.
				-->
				<Button
					v-if="closable"
					embedded="drawer.close"
					type="button"
					class="so-drawer__close"
					@click="drawer.requestClose('button')"
					v-bind="closeAria"
				>
					<slot name="close-icon">
						<Icon embedded="drawer.close-icon" :tag="closeIconTag" />
					</slot>
				</Button>
			</component>
		</template>
	</teleport>
</template>
