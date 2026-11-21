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
} from '@soxa-ui/vue'
import { h, type Component } from 'vue'

import type { TPreview } from './previews'

/** Glyphs as `roleIcon` components, made once: Icon's `tag` is the root, not a role. */
const CHECK = roleIcon('check')
const ARROW_RIGHT = roleIcon('arrowRight')

/**
 * Scenario markup the previews lack: slot content to check.
 *
 * A scenario refers to a fixture by key (`fixture`); without a key it draws
 * its component's preview, with the same attribute set: the scenario's
 * starting props, `ctrl` with the instance and the journal's listeners. Slots
 * are not properties, metadata cannot give them, and each framework has its
 * own markup: so fixtures live in the framework's host, and the scenarios
 * that look at them in the shared package. The keys are the same for every
 * host.
 *
 * A fixture without a scenario, or a scenario without a fixture, is an error:
 * nobody draws the first, the second silently drops out of the menu (see
 * `__tests__/scenarios.spec.ts`).
 */
export const FIXTURES: Record<string, TPreview> = {
	'select-separators': (bind) =>
		h(Select, { ...bind, open: true }, () => [
			h(Select.Group, { label: 'First' }, () =>
				h(Select.Item, { value: 'a', text: 'Apple' }),
			),
			h(Select.Separator),
			h(Select.Group, { label: 'Second' }, () =>
				h(Select.Item, { value: 'b', text: 'Banana' }),
			),
		]),
	'list-box-separators': (bind) =>
		h(ListBox, { ...bind }, () => [
			h(ListBox.Group, { label: 'First' }, () =>
				h(ListBox.Item, { value: 'a', text: 'Apple' }),
			),
			h(ListBox.Separator),
			h(ListBox.Group, { label: 'Second' }, () =>
				h(ListBox.Item, { value: 'b', text: 'Banana' }),
			),
		]),
	'alert-dialog-footer': (bind) =>
		h(AlertDialog, bind, {
			title: () => 'Custom question',
			default: () => 'Custom description',
			footer: () => h('button', { type: 'button', 'data-audit-footer': '' }, 'Custom footer'),
		}),
	'avatar-fallback': (bind) => h(Avatar, bind, { fallback: () => h(Icon, { tag: CHECK }) }),
	'badge-anchor': (bind) =>
		h(Badge, bind, {
			anchor: () =>
				h(
					Button,
					{ onClick: () => document.dispatchEvent(new Event('badge-anchor-click')) },
					() => 'Inbox',
				),
		}),
	'a11y-persistent-toasts': (bind) => h(Toasts, bind),
	'a11y-invalid-input': (bind) =>
		h(Field, { label: 'Account', invalid: true, error: 'Enter a valid email' }, () =>
			h(Input, bind),
		),
	'a11y-invalid-number-input': (bind) =>
		h(Field, { label: 'Account', invalid: true, error: 'Enter a valid email' }, () =>
			h(NumberInput, bind),
		),
	'a11y-invalid-textarea': (bind) =>
		h(Field, { label: 'Account', invalid: true, error: 'Enter a valid email' }, () =>
			h(Textarea, bind),
		),
	'a11y-invalid-date-input': (bind) =>
		h(Field, { label: 'Account', invalid: true, error: 'Enter a valid email' }, () =>
			h(DateInput, bind),
		),
	'a11y-invalid-date-picker': (bind) =>
		h(Field, { label: 'Account', invalid: true, error: 'Enter a valid email' }, () =>
			h(DatePicker, bind),
		),
	// Probes in all three slots: the scenario finds them by `data-probe` and
	// checks their order; `default` prints what came in the scope
	'button-slot-labels': (bind) =>
		h(Button, bind, {
			leading: () => h('span', { 'data-probe': 'leading' }, 'L'),
			default: ({ text }: { text: string }) => h('span', { 'data-probe': 'default' }, text),
			trailing: () => h('span', { 'data-probe': 'trailing' }, 'T'),
		}),

	// Icons at the edges; the long label comes from the scenario's `text` prop
	'button-slot-icons': (bind) =>
		h(Button, bind, {
			leading: () => h(Icon, { tag: CHECK }),
			trailing: () => h(Icon, { tag: ARROW_RIGHT }),
		}),

	// A label around a control: the text from the scenario's `text` prop, the
	// control in the `default` slot
	'label-check-box': (bind) => h(Label, bind, () => h(CheckBox)),

	'label-switch': (bind) => h(Label, bind, () => h(Switch)),

	// The radio's root is a `label`, and HTML forbids a `label` inside a `label`:
	// inside the label the radio is drawn with `tag="span"`. The group around it
	// gives the shared `name`
	'label-radio': (bind) =>
		h(RadioGroup as Component, null, () =>
			h(Label, bind, () => h(RadioGroup.Item, { value: 'a', tag: 'span' })),
		),
}
