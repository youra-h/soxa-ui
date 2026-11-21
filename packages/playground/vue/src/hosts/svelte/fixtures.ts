import ListBoxSeparators from './ListBoxSeparators.svelte'
import SelectSeparators from './SelectSeparators.svelte'
import AlertDialogFooter from './AlertDialogFooter.svelte'
import AvatarFallback from './AvatarFallback.svelte'
import BadgeAnchor from './BadgeAnchor.svelte'
import A11yPersistentToasts from './A11yPersistentToasts.svelte'
import A11yInvalidInput from './A11yInvalidInput.svelte'
import A11yInvalidNumberInput from './A11yInvalidNumberInput.svelte'
import A11yInvalidTextarea from './A11yInvalidTextarea.svelte'
import A11yInvalidDateInput from './A11yInvalidDateInput.svelte'
import A11yInvalidDatePicker from './A11yInvalidDatePicker.svelte'
import ButtonSlotIcons from './ButtonSlotIcons.svelte'
import ButtonSlotLabels from './ButtonSlotLabels.svelte'
import LabelCheckBox from './LabelCheckBox.svelte'
import LabelRadio from './LabelRadio.svelte'
import LabelSwitch from './LabelSwitch.svelte'
import type { TPreview } from './previews'

/**
 * Разметка сценариев, которой нет у превью: содержимое слотов под проверку —
 * в Svelte.
 *
 * Ключи и разметка — те же, что у хостов Vue и React: сценарии в общем пакете
 * ищут в сцене одно и то же, на каком бы фреймворке её ни нарисовали. Слот по
 * умолчанию в Svelte — сниппет `children`, остальные слоты — сниппеты с теми же
 * именами.
 */
export const FIXTURES: Record<string, TPreview> = {
	'list-box-separators': ListBoxSeparators,
	'select-separators': SelectSeparators,
	'alert-dialog-footer': AlertDialogFooter,
	'badge-anchor': BadgeAnchor,
	'avatar-fallback': AvatarFallback,
	'a11y-persistent-toasts': A11yPersistentToasts,
	'a11y-invalid-input': A11yInvalidInput,
	'a11y-invalid-number-input': A11yInvalidNumberInput,
	'a11y-invalid-textarea': A11yInvalidTextarea,
	'a11y-invalid-date-input': A11yInvalidDateInput,
	'a11y-invalid-date-picker': A11yInvalidDatePicker,
	'button-slot-labels': ButtonSlotLabels,
	'button-slot-icons': ButtonSlotIcons,
	'label-check-box': LabelCheckBox,
	'label-switch': LabelSwitch,
	'label-radio': LabelRadio,
}
