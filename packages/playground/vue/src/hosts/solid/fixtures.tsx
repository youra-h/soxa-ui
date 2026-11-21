import {
	AlertDialog,
	Avatar,
	Badge,
	Button,
	CheckBox,
	DateInput,
	DatePicker,
	Field,
	Icon,
	Input,
	Label,
	ListBox,
	Select,
	NumberInput,
	RadioGroup,
	Switch,
	Textarea,
	Toasts,
	roleIcon,
} from '@soxa-ui/solid'
import type { TPreview } from './previews'

/**
 * Разметка сценариев, которой нет у превью: содержимое слотов под проверку —
 * в Solid.
 *
 * Ключи и разметка — те же, что у хостов Vue, React и Svelte: сценарии в общем
 * пакете ищут в сцене одно и то же, на каком бы фреймворке её ни нарисовали.
 * Слот по умолчанию в Solid — `children`, остальные слоты — пропы с теми же
 * именами. Пропсы — вызовом сигнала (`{...bind()}`), как у превью.
 */

/** Глифы — компонентом на роль, один раз: `tag` у Icon — корень, а не роль. */
const CHECK = roleIcon('check')
const ARROW_RIGHT = roleIcon('arrowRight')

export const FIXTURES: Record<string, TPreview> = {
	'select-separators': (bind) => (
		<Select {...bind()} open>
			<Select.Group label="First">
				<Select.Item value="a" text="Apple" />
			</Select.Group>
			<Select.Separator />
			<Select.Group label="Second">
				<Select.Item value="b" text="Banana" />
			</Select.Group>
		</Select>
	),
	'list-box-separators': (bind) => (
		<ListBox {...bind()}>
			<ListBox.Group label="First">
				<ListBox.Item value="a" text="Apple" />
			</ListBox.Group>
			<ListBox.Separator />
			<ListBox.Group label="Second">
				<ListBox.Item value="b" text="Banana" />
			</ListBox.Group>
		</ListBox>
	),
	'alert-dialog-footer': (bind) => (
		<AlertDialog
			{...bind()}
			title={<>Custom question</>}
			footer={
				<button type="button" data-audit-footer>
					Custom footer
				</button>
			}
		>
			Custom description
		</AlertDialog>
	),
	'avatar-fallback': (bind) => <Avatar {...bind()} fallback={<Icon tag={CHECK} />} />,
	'badge-anchor': (bind) => (
		<Badge
			{...bind()}
			anchor={
				<Button onClick={() => document.dispatchEvent(new Event('badge-anchor-click'))}>
					Inbox
				</Button>
			}
		/>
	),
	'a11y-persistent-toasts': (bind) => <Toasts {...bind()} />,
	'a11y-invalid-input': (bind) => (
		<Field label="Account" invalid error="Enter a valid email">
			<Input {...bind()} />
		</Field>
	),
	'a11y-invalid-number-input': (bind) => (
		<Field label="Account" invalid error="Enter a valid email">
			<NumberInput {...bind()} />
		</Field>
	),
	'a11y-invalid-textarea': (bind) => (
		<Field label="Account" invalid error="Enter a valid email">
			<Textarea {...bind()} />
		</Field>
	),
	'a11y-invalid-date-input': (bind) => (
		<Field label="Account" invalid error="Enter a valid email">
			<DateInput {...bind()} />
		</Field>
	),
	'a11y-invalid-date-picker': (bind) => (
		<Field label="Account" invalid error="Enter a valid email">
			<DatePicker {...bind()} />
		</Field>
	),
	// Метки во всех трёх слотах: сценарий ищет их по `data-probe` и сверяет
	// порядок, а в `default` печатает то, что пришло в scope
	'button-slot-labels': (bind) => (
		<Button
			{...bind()}
			leading={<span data-probe="leading">L</span>}
			trailing={<span data-probe="trailing">T</span>}
		>
			{(scope: { text: string }) => <span data-probe="default">{scope.text}</span>}
		</Button>
	),

	// Иконки по краям — подпись длинная, из пропа `text` сценария
	'button-slot-icons': (bind) => (
		<Button {...bind()} leading={<Icon tag={CHECK} />} trailing={<Icon tag={ARROW_RIGHT} />} />
	),

	// Подпись вокруг контрола: текст — из пропа `text` сценария, контрол — в
	// слоте по умолчанию
	'label-check-box': (bind) => (
		<Label {...bind()}>
			<CheckBox />
		</Label>
	),

	'label-switch': (bind) => (
		<Label {...bind()}>
			<Switch />
		</Label>
	),

	// Корень радио — `label`, а `label` в `label` HTML запрещает: внутри
	// подписи радио рисуется с `tag="span"`. Группа вокруг — ради общего `name`
	'label-radio': (bind) => (
		<RadioGroup>
			<Label {...bind()}>
				<RadioGroup.Item value="a" tag="span" />
			</Label>
		</RadioGroup>
	),
}
