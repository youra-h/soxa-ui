<script lang="ts">
import { Button } from '../button'
import { Calendar } from '../calendar'
import { DateInput } from '../date-input'
import { Frame } from '../frame'
import { Icon } from '../icon'
import SetupDatePicker from './setup.component'

export default { ...SetupDatePicker, components: { Button, Calendar, DateInput, Frame, Icon } }
</script>

<template>
	<div
		ref="rootElement"
		v-if="rendered"
		v-show="visible"
		:id="id"
		:class="classes"
		v-bind="{ ...attrs, ...rootAria, ...dataset }"
	>
		<!--
			DatePicker combines a date field with a calendar panel, anchored to the
			root. The panel starts below it and flips above near the viewport edge.
			Single mode has no root field frame; --mode-range makes the root that frame.

			The root receives the DatePicker id, consumer attributes and rootAria. In
			range mode it is the named group of endpoint fields; in single mode the
			field itself is the group and rootAria is empty. Dataset carries the states.

			Only the current mode renders. Fields, calendar and engine are core-owned
			instances passed via ctrl/engine. Core distributes size, variant, disabled,
			locale, limits and value; markup only binds the resulting context.
		-->

		<!--
			Одна дата. Поле — готовый DateInput: коробка, части, кольцо фокуса и
			ошибка — его. Кнопки очистки и календаря — в его слотах `clear` и
			`trailing`, в этом порядке: обёртку слотов у конца поля держит тема
			DateInput.

			Поле и есть группа частей, поэтому имя DatePicker (`aria_label`,
			`aria_labelledBy`, `aria_describedBy`) уходит ему: так оно дойдёт и до
			частей там, где группы скринридер не объявляет.

			Набор `aria` DatePicker ложится на поле атрибутами, поверх его
			собственного: в нём ещё и то, что DatePicker'у даёт поле формы
			`Field`, — ссылки на подпись и справку и ошибка (`aria-invalid`).
		-->
		<DateInput
			v-if="mode === 'single'"
			embedded="date-picker.field"
			class="so-date-picker__field"
			:ctrl="picker.field"
			:aria_label="aria_label"
			:aria_labelledBy="aria_labelledBy"
			:aria_describedBy="aria_describedBy"
			v-bind="aria"
		>
			<!--
				Кнопка очистки — DatePicker'а, а не поля: DatePicker сам поле (база
				`TClearable`) и очищает своё значение целиком, а `clear` шлёт он, в обоих
				режимах одинаково. Поле своей кнопки не рисует — `clearable` ему не
				уходит, — а место у конца поля даёт его слот `clear`, первым, перед
				кнопкой календаря.

				Кнопка — та же, что у полей: по `clearable`, выключена вместе с
				DatePicker, `readonly` её не гасит. Имя ядро собирает с именем
				DatePicker (`clearAria`), очищает его команда `clear`. Клик не
				всплывает до корня. Своя кнопка — слот `clear` DatePicker'а с его
				командой в scope: заменяет встроенную целиком. Вида у кнопки нет —
				тема красит её по контексту (`.so-date-picker__clear`).
			-->
			<template #clear>
				<slot name="clear" :clear="ctrl.clear">
					<Button
						embedded="date-picker.clear"
						type="button"
						v-if="clearable"
						class="so-date-picker__clear"
						:size="size"
						:disabled="disabled"
						@click.stop="ctrl.clear()"
						v-bind="clearAria"
					>
						<Icon embedded="date-picker.clear-icon" :tag="clearIconTag" :size="size" />
					</Button>
				</slot>
			</template>

			<template #trailing>
				<!--
					Кнопка календаря. Вида нет: тема красит её по контексту, как
					очистку Select. Пока панель открыта, она нажата (`data-selected`).
					Связку с панелью (`aria-haspopup`, `aria-expanded`,
					`aria-controls`) и имя кнопка получает набором `triggerAria`, а
					выключена она, когда открыть панель нельзя — у выключенного и
					только для чтения. Нажатие ловит плагин открытия на корне.
					Значок — слот `trigger-icon`, по умолчанию иконка роли
					`calendar` — без своего размера: по кеглю кнопки.
				-->
				<Button
					embedded="date-picker.trigger"
					type="button"
					class="so-date-picker__trigger"
					:size="size"
					:disabled="!openable"
					v-bind="{ ...triggerAria, ...triggerDataset }"
				>
					<slot name="trigger-icon">
						<Icon embedded="date-picker.trigger-icon" :tag="calendarIconTag" />
					</slot>
				</Button>
			</template>
		</DateInput>

		<!--
			Диапазон: поле начала, тире, поле конца и кнопки — одна коробка на
			корне. Поля внутри без своей рамки (тема, по контексту), кнопки — после
			поля конца, а не в его слоте: они работают со всем периодом, а не с
			концом. Тире — для глаза, скринридеру оно не нужно: поля называют свои
			концы сами — именами `names_start` и `names_end`, выходами плагина имён
			DatePicker от локали.
		-->
		<template v-else>
			<DateInput
				embedded="date-picker.start"
				class="so-date-picker__start"
				:ctrl="picker.start"
				:aria_label="names_start"
			/>
			<span class="so-date-picker__dash" aria-hidden="true">–</span>
			<DateInput
				embedded="date-picker.end"
				class="so-date-picker__end"
				:ctrl="picker.end"
				:aria_label="names_end"
			/>
			<!--
				Кнопка очистки — одна на период, перед кнопкой календаря: период —
				одно значение, и очищает она оба конца, в том числе набранные не до
				конца. Та же кнопка и тот же слот `clear`, что у одной даты.
			-->
			<slot name="clear" :clear="ctrl.clear">
				<Button
					embedded="date-picker.clear"
					type="button"
					v-if="clearable"
					class="so-date-picker__clear"
					:size="size"
					:disabled="disabled"
					@click.stop="ctrl.clear()"
					v-bind="clearAria"
				>
					<Icon embedded="date-picker.clear-icon" :tag="clearIconTag" :size="size" />
				</Button>
			</slot>
			<Button
				embedded="date-picker.trigger"
				type="button"
				class="so-date-picker__trigger"
				:size="size"
				:disabled="!openable"
				v-bind="{ ...triggerAria, ...triggerDataset }"
			>
				<slot name="trigger-icon">
					<Icon embedded="date-picker.trigger-icon" :tag="calendarIconTag" />
				</slot>
			</Button>
		</template>

		<!--
			Панель — Frame, телепорт в `body`: поверхность, кромка и тень — как у
			панелей Select и Popover. Открытость — `visible` панели, как у Select:
			закрытая панель прячется, а не размонтируется. Подложки и крестика нет
			— нажатие мимо закрывает панель. Подвал — только при `confirmable`, и
			рисует его календарь (ниже).

			Якорь — корень: панель встаёт под ним от его начала, а у нижнего края
			окна — над ним (сторону выбирает `TAnchorPlugin`). Панель
			телепортирована, поэтому `dismiss_ownerAttribute` помечает её
			владельцем — иначе нажатие в календарь считалось бы нажатием мимо.

			На панель ложится набор `panelAria`: `role="dialog"`, `aria-modal`,
			имя и `id`, на который ссылается `aria-controls` кнопки. `tabindex="-1"`
			— фокус встаёт на саму панель, когда внутри нечего фокусировать.

			`panelDataset` — `data-*` панели: признак «тянут» (`data-swiping`), по
			которому тема снимает переход, пока панель идёт за пальцем. Набор
			отдельный от `panelAria`: ARIA и `data-*` не смешиваются. Открытость
			(`data-open`) Frame пишет сам, сторону после flip (`data-placement`) —
			плагин якоря, сдвиг во время жеста (`--so-swipe-offset`) — плагин жеста.
		-->
		<Frame
			@bundle:create="ids_bindPanel"
			embedded="date-picker.frame"
			class="so-date-picker__panel"
			tabindex="-1"
			:visible="visible && open"
			strategy="fixed"
			:anchor_anchor="rootElement"
			:anchor_offset="4"
			v-bind="{ ...panelAria, ...panelDataset, ...dismiss_ownerAttribute }"
		>
			<!--
				Полоса, за которую панель тянут, — пока жест включён. Она говорит,
				что панель можно смахнуть, и сама ничего не делает: потребитель её
				не адресует, скринридеру она не нужна (`aria-hidden`). Стоит она у
				края со стороны поля (`data-placement`), ставит её тема. Закрыть без
				перетаскивания — Escape, выбор и нажатие мимо.
			-->
			<div v-if="handleRendered" class="so-date-picker__handle" aria-hidden="true" />

			<!--
				Содержимое — обёртка календаря, и прокручивается она, а не панель:
				пока жест включён, плагин жеста отдаёт касание вдоль оси панели
				жесту (`touch-action`), и прокручиваемую саму панель палец бы не
				прокрутил. Своя прокрутка у содержимого касание оставляет себе.

				Календарь — готовый Calendar над экземпляром и движком ядра
				DatePicker. Своей поверхности у него нет, её даёт панель. Содержимое
				дня — слот `item` DatePicker, отданный календарю под тем же именем,
				с его scope `{ item, text }`.
			-->
			<!--
				The calendar is mounted from the panel's first opening on
				(`contentRendered`): a picker nobody opened is a field with a
				button. Closing hides the panel and keeps the calendar.
			-->
			<div class="so-date-picker__content">
				<Calendar
					v-if="contentRendered"
					embedded="date-picker.calendar"
					class="so-date-picker__calendar"
					:ctrl="calendar"
					:engine="engine"
				>
					<template v-if="$slots.item" #item="{ item, text }">
						<slot name="item" :item="item" :text="text" />
					</template>

					<!--
						Подвал — только при `confirmable`: выбор в календаре тогда
						черновик, и значением его делает «OK» (`confirm()` ядра).
						«Отмена» закрывает панель, а черновик сбрасывает само закрытие —
						как у Escape и нажатия мимо. «Отмена» первой, «OK» — последней
						остановкой Tab, как в календаре Android. Пока диапазон выбран
						наполовину, «OK» выключена (`confirmDisabled`).

						Текст — строки локали, выходы плагина имён (`names_cancel`,
						`names_confirm`). Вида нет: тема красит кнопки по контексту, как
						кнопки листания.
					-->
					<template v-if="confirmable" #footer>
						<Button
							embedded="date-picker.cancel"
							type="button"
							class="so-date-picker__cancel"
							:size="size"
							:text="names_cancel"
							@click="picker.open = false"
						/>
						<Button
							embedded="date-picker.confirm"
							type="button"
							class="so-date-picker__confirm"
							:size="size"
							:disabled="confirmDisabled"
							:text="names_confirm"
							@click="picker.confirm()"
						/>
					</template>
				</Calendar>
			</div>
		</Frame>
	</div>
</template>
