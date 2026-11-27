<script setup lang="ts">
import { computed, onUnmounted, ref, shallowRef, watch } from 'vue'
import { createEngine, isEventSource } from '@soxa-ui/core'
import { TPluginBundle } from '@soxa-ui/plugins'
import { CodeBlock, Field } from '@soxa-ui/vue'
import {
	createInstance,
	isEmptyField,
	previewProps,
	type IPreviewHost,
	type TComponentEntry,
	type TInstance,
	type TInstanceProps,
	type TPreviewEventSink,
	type TPropControl,
} from '@soxa-ui/playground-shared'
import PropControl from './PropControl.vue'
import PreviewColumns from './PreviewColumns.vue'
import CodeView from './CodeView.vue'

const controlError = ref('')

const props = defineProps<{
	entry: TComponentEntry
	control: TPropControl
	/** Хост фреймворка, выбранного в шапке: он и рисует обе колонки. */
	host: IPreviewHost
	/**
	 * Куда отдать события колонки. Обе колонки рисуют один компонент и
	 * отдают одинаковые имена, и без пометки нельзя понять, чьё событие пришло.
	 */
	sink: (column: 'props' | 'instance') => TPreviewEventSink
}>()

/**
 * Значение строки — с тем, что превью задаёт компоненту само (`initial`):
 * подпись кнопки, плейсхолдер поля. Поле показывает то же, что колонки. Без
 * значения превью — с умолчанием декларации.
 */
const value = shallowRef<unknown>(
	Object.hasOwn(props.control, 'initial') ? props.control.initial : props.control.default,
)

/**
 * Значение превью своего пропа владелец свойства получает при создании, а не
 * разметкой второй колонки: разметку рядом с `ctrl` сборка пишет экземпляру
 * при каждом монтировании, и смена фреймворка вернула бы ему значение превью
 * поверх набранного. Свойству компонента его отдаёт конструктор экземпляра,
 * свойству коллекции — конструктор фасада, а плагину — запись на
 * `bundle:create`: значение строки начинается с него.
 */
const initialProps: TInstanceProps = Object.hasOwn(props.control, 'initial')
	? { [props.control.name]: props.control.initial }
	: {}

/**
 * Экземпляр ядра для правой колонки.
 *
 * Создаётся один раз на строку: у каждого пропа свой компонент, и общий
 * экземпляр склеил бы соседние строки — правка `size` меняла бы и превью
 * `variant`. Строка переживает смену фреймворка (её ключ от него не зависит),
 * и экземпляр вместе с ней: хост другого фреймворка получает тот же `ctrl`.
 */
const instance = shallowRef(
	createInstance(props.entry, props.control.scope === 'component' ? initialProps : {}),
)

const isCollectionRow = props.control.scope === 'collection'

/**
 * Движок правой колонки — только для коллекционных строк, и строится сразу.
 *
 * Раньше стенд ждал его событием `engine:create`: превью создавало движок
 * внутри себя, и до монтирования достать его было нечем. Теперь движок можно
 * собрать снаружи и отдать пропом `engine` — стенд строит его сам, ещё до
 * первого рендера превью, тем же способом, каким это делает любой потребитель
 * библиотеки.
 *
 * Уровня `createEngine` достаточно, и он один на все коллекции: состав
 * деталей у каждой свой, а недостающее — `selection` с единственным
 * редактируемым коллекционным пропом `mode`, `accordion`, вид календаря,
 * `factory`… — доставит фасад стенда при сборке, своим же конструктором.
 * Готовый выбор уровня `createEngineSelection` календарю не годится: выбор у
 * него свой, дат, а стандартный занял бы его место. Компонент получает тот же
 * движок — и в колонке пропом, и в колонке инстансом.
 */
const engine = isCollectionRow ? createEngine() : null

/**
 * Фасад коллекции правой колонки — тонкая обёртка над тем же движком.
 *
 * Строится сразу и с тем же владельцем, что получит настоящий компонент:
 * `instance.value` — это и есть тот инстанс, который уйдёт ему пропом `ctrl`
 * и станет внутри `adapter.instance`. Один владелец на обе стороны — фасад
 * дополняет движок владельческими расширениями сразу, своим же
 * конструктором, а не ждёт, пока это сделает превью.
 *
 * Без `owner` было бы иначе: `TAccordionCollectionFacade` и соседи трогают
 * владельческое расширение в собственном конструкторе (`this.extensions
 * .accordion.events`), а `completeEngine` довешивает его только при известном
 * `owner`. Оба фасада ссылаются на один и тот же `instance.value` — второго
 * владельца тут нет.
 */
const facade: TInstance | null = engine ? createFacade(engine) : null

function createFacade(withEngine: unknown): TInstance {
	const collectionDescriptor = props.entry.collectionDescriptor

	// Коллекционная строка без дескриптора коллекции — ошибка манифеста стенда.
	if (!collectionDescriptor) {
		throw new Error(
			`[playground] ${props.entry.id}: у коллекционного пропа нет collectionDescriptor`,
		)
	}

	const Ctor = collectionDescriptor().ctor as new (props: object, options: object) => TInstance

	// Фасад есть только у коллекционной строки: значение превью её пропа — ему
	return new Ctor(initialProps, { engine: withEngine, owner: instance.value })
}

/**
 * Bundle правой колонки — последний, пришедший событием `bundle:create`.
 *
 * Плагины собирает адаптер при монтировании превью, и тому, у кого на руках
 * только инстанс, их отдаёт одно это событие на шине самого инстанса — у
 * адаптера любого фреймворка. Своего bundle стенд не собирает: набор плагинов
 * — инвариант компонента, а не его параметр. Перемонтирование колонки (смена
 * фреймворка или пакета иконок) собирает новый bundle со свежими плагинами —
 * поэтому значение пишется при каждом его появлении, а не только при смене.
 */
let bundle: TPluginBundle | null = null

if (props.control.scope === 'plugin') {
	const events: unknown = instance.value.events

	if (isEventSource(events)) {
		events.on('bundle:create', (created: unknown) => {
			if (!(created instanceof TPluginBundle)) return

			bundle = created
			write(value.value)
		})
	}
}

/**
 * Куда писать проп: коллекционный — в фасад, плагинный — в свой плагин под
 * именем без неймспейса, остальные — в инстанс.
 *
 * Пустое поле — проп не задан, и правило у него то же, что у связки в первой
 * колонке (`TLine.reset`): свойство получает умолчание декларации, а без
 * умолчания (`mode` фасадов) остаётся как есть. Значим ключ, а не значение:
 * объявленное `undefined` (`aria_label`) тоже умолчание. Запись `undefined`
 * мимо этого правила дала бы значение вне типа свойства — у ProgressLinear
 * шкалу без конца (`aria-valuemax="undefined"`), у Tooltip подсказку без
 * задержки.
 */
function write(next: unknown): void {
	const control = props.control
	const empty = isEmptyField(next)

	if (empty && !Object.hasOwn(control, 'default')) return

	const written = empty ? control.default : next

	if (control.scope === 'plugin') {
		// Плагина может не быть: превью `frame` и слоёв — заглушка на
		// ComponentView, и в её bundle нет ни якоря, ни доступного имени
		const plugin = bundle?.get(control.plugin.ctor)

		if (plugin) Reflect.set(plugin, control.plugin.name, written)

		return
	}

	const target = isCollectionRow ? facade : instance.value

	if (target) target[control.name] = written
}

watch(value, write)

onUnmounted(() => instance.value.destroy?.())

/** Приёмники событий колонок — по одному на строку, а не на каждую отрисовку. */
const propSink = props.sink('props')
const instanceSink = props.sink('instance')

/**
 * Пропсы превью — обеим колонкам, но без своего пропа строки: его колонки
 * получают каждая по-своему — пропом и экземпляром. Стёртое поле поэтому даёт
 * в обеих умолчание декларации, как и код под ними, а не значение превью в
 * одной из них.
 */
const preview = computed(() => previewProps(props.entry.id, props.control.name))

// Пропсы превью первыми, поверх — пресет, поверх него — собственное значение
// строки: оно перекрывает оба, а не наоборот
const propBind = computed(() => ({
	...preview.value,
	...props.control.preset,
	...(isEmptyField(value.value) ? {} : { [props.control.name]: value.value }),
}))

const instanceBind = computed(() => ({
	...preview.value,
	// Пресет разметкой, рядом с `ctrl`: сборка применяет написанные пропы и к
	// инстансу, и к фасаду коллекции (`applyInitialProps`), а `mode`
	// у компонентной строки иначе записать некуда — своего движка у неё нет
	...props.control.preset,
	ctrl: instance.value,
	// Отдаём собственный движок пропом — компонент допривяжет к нему свой
	// `owner` сам, а `engine:create`, который он при этом эмитит, идёт в общий
	// журнал событий как обычно, без отдельного перехвата
	...(engine ? { engine } : {}),
}))
</script>

<template>
	<section class="pg-prop">
		<!--
			Шапка строки — поле формы `Field`: имя пропа — его подпись, описание —
			подсказка, редактор — контрол. Подпись и подсказку поле связывает с
			редактором само: `for` подписи — на его `<input>`, `id` подсказки — в
			его `aria-describedby`. Имя — код, поэтому подпись рисует слот
			`label-content`, а `label` нужен, чтобы она вообще рисовалась.

			Подпись — над контролом, сторона поля по умолчанию (`top`): имя,
			редактор и подсказка идут столбцом, в любом окне одинаково. С
			подписью в начале строки имя стояло слева, а редактор с подсказкой —
			справа от него, и что к чему относится, читалось хуже. Контрол —
			фиксированной ширины (`styles.css`): select и input стоят в одну
			вертикаль, а не по содержимому, и на широком экране редактор не
			тянется во всю строку. Подсказка — под контролом, где её ставит тема.

			Кроме строки с переключателем: Switch узок, и под именем он стоял
			один в пустой строке. У него подпись в начале строки (`start`) — имя,
			за ним переключатель, — а подсказка под обоими, от начала строки, как
			у остальных строк. На всю строку её тянет стенд (`styles.css`): тема
			ставит подсказку под колонкой контрола.

			Редактор — прямо в слоте, без обёртки: состояние контрола тема читает
			с прямого ребёнка `.so-field__control`.
		-->
		<Field
			class="pg-prop__head"
			:class="{ 'pg-prop__head--json': control.kind === 'json' }"
			:position="control.kind === 'switch' ? 'start' : 'top'"
			size="sm"
			:label="control.name"
			:helper="control.description"
			:error="controlError"
			:invalid="Boolean(controlError)"
		>
			<template #label-content>
				<code class="pg-prop__name">{{ control.name }}</code>
			</template>

			<template v-if="control.notice" #helper-content>
				{{ control.description }}
				<span class="pg-prop__notice">{{ control.notice }}</span>
			</template>

			<PropControl :control="control" v-model="value" @update:error="controlError = $event" />
		</Field>
		<CodeBlock
			v-if="control.sourceTitle"
			:code="JSON.stringify(value, null, 2)"
			:title="control.sourceTitle"
			language="json"
			maxHeight="22rem"
		/>

		<PreviewColumns
			:host="host"
			:component="entry.id"
			:prop-bind="propBind"
			:instance-bind="instanceBind"
			:prop-sink="propSink"
			:instance-sink="instanceSink"
		>
			<template #prop-code>
				<CodeView
					v-if="host.snippets"
					:name="`${entry.label}-${control.name}`"
					:code="host.snippets.propSnippet(entry, control.name, value, control.preset)"
					:extension="host.snippets.extension"
				/>
			</template>

			<template #instance-code>
				<CodeView
					v-if="host.snippets"
					:name="`${entry.label}-${control.name}-instance`"
					:code="host.snippets.instanceSnippet(entry, control, value)"
					:extension="host.snippets.extension"
				/>
			</template>
		</PreviewColumns>
	</section>
</template>
