# Controlled values and events

Application state uses Svelte 5 $state. Input value is a normal prop, not a
bindable prop in 0.4.1: pass value={name} and assign event.newValue inside
onChangeValue. The payload has oldValue and newValue, not a DOM target value.
Input is string-valued. CheckBox can emit boolean or undefined; use its public
ICheckBoxProps['value'] type rather than assuming every callback is boolean.
Select and DatePicker examples likewise use public value property types.

Library events are callback props such as onChangeValue and onActionClick.
Native DOM clicks use onclick. Avoid Vue v-model and Vue event syntax, and do
not substitute the deprecated Svelte on: syntax. A form submit handler prevents
the native navigation; Button type="submit" participates in it. Reset name
writes application state and updates the input without a second DOM writer.

Use Label with nested Input/CheckBox for a visible accessible name. Keep explicit
aria_label on Select and DatePicker; their generated records describe the naming
contract. Date strings use YYYY-MM-DD and this recipe fixes timeZone="UTC" so
server and browser interpret dates consistently. The checked keyboard sequence
covers checkbox Space, Select ArrowDown/End/Enter/Escape and calendar arrow/Enter.
No general accessibility audit is implied by those checks.
