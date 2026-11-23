<script lang="ts">
import Backdrop from '../../adapter/backdrop/Backdrop'
import { Button } from '../button'
import { Icon } from '../icon'
import SetupDialog from './setup.component'

/**
 * `inheritAttrs: false` обязателен: корень шаблона — `<teleport>`, и Vue
 * считает корневым узлом именно его. Автоматический перенос атрибутов уходил
 * в телепорт и до окна не доезжал — ни `class`, ни `data-*`, ни события.
 * Поэтому переносим вручную, на панель: корень окна — она.
 */
export default { ...SetupDialog, inheritAttrs: false, components: { Backdrop, Button, Icon } }
</script>

<template>
	<teleport :to="target">
		<!-- The modal backdrop precedes its panel; non-modal dialogs leave the page accessible. -->
		<template v-if="rendered">
			<Backdrop
				v-if="modal"
				:classes="backdropClasses"
				:visible="visible"
				:styles="layout_backdropStyles"
				:dataset="backdropDataset"
			/>

			<!--
				Корень — сама панель: на ней слой (`data-layer`), пометка
				владельцем, место (`so-dialog--placement-*`), размер
				(`--so-dialog-width`, `--so-dialog-height`), `data-open` и
				`data-maximized`.
				Без пометки плагины не нашли бы слой окна, и нажатие в список
				Select внутри закрыло бы окно. `tabindex="-1"` — фокус встаёт
				на саму панель, когда внутри нечего фокусировать.

				Порядок в DOM — заголовок, тело, подвал, потом кнопки. В строку
				заголовка кнопки переносит тема, областями сетки. Поэтому фокус
				при открытии попадает на первый контрол содержимого, а не на
				«развернуть», а крестик остаётся последней остановкой Tab.
				Обёртки, которая собрала бы заголовок с кнопками, нет: она
				вернула бы кнопки в начало.
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
					Заголовок рисуется всегда: на него окно ссылается
					`aria-labelledby`, и `id` для этой ссылки он берёт из
					`titleAria`. Вокруг слота нет пробелов: пустой заголовок
					тема сворачивает по `:empty`.
				-->
				<h2 class="so-dialog__title" v-bind="titleAria"><slot name="title" /></h2>

				<!--
					Тело — прокручивается оно, шапка и подвал остаются на месте.
					`id` — для `aria-describedby` предупреждения.
				-->
				<div class="so-dialog__body" v-bind="bodyAria">
					<slot />
				</div>

				<!-- Подвал — ряд действий. Пустой тема сворачивает по `:empty` -->
				<div class="so-dialog__footer"><slot name="footer" /></div>

				<!--
					The maximize button is a toggle: one name, the state in
					`aria-pressed`. Two icons, one shown — by the window state,
					like the CheckBox mark: "maximize" while the window is not
					maximized, and "restore size" once it is.

					The header buttons are mounted only while on (`v-if`), not
					hidden with `visible`: the theme relies on their absence from
					the DOM, and a hidden button would still assemble its instance
					and plugins in every dialog. They have no view and no size —
					the theme paints them by context.
				-->
				<Button
					v-if="maximizable"
					embedded="dialog.maximize"
					type="button"
					class="so-dialog__maximize"
					@click="dialog.toggleMaximized()"
					v-bind="maximizeAria"
				>
					<slot v-if="maximized" name="restore-icon">
						<Icon embedded="dialog.restore-icon" :tag="restoreIconTag" />
					</slot>
					<slot v-else name="maximize-icon">
						<Icon embedded="dialog.maximize-icon" :tag="maximizeIconTag" />
					</slot>
				</Button>

				<!--
					Кнопка закрытия — в углу шапки со стороны конца строки. Она
					просит окно закрыться: отменить закрытие может подписчик
					`close:before`. Куда вернуть фокус, решает плагин фокуса.
				-->
				<Button
					v-if="closable"
					embedded="dialog.close"
					type="button"
					class="so-dialog__close"
					@click="dialog.requestClose('button')"
					v-bind="closeAria"
				>
					<slot name="close-icon">
						<Icon embedded="dialog.close-icon" :tag="closeIconTag" />
					</slot>
				</Button>
			</component>
		</template>
	</teleport>
</template>
