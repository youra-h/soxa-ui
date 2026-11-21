# Fields, models and events

Use v-model:value, including boolean CheckBox values. Bare v-model expands
to modelValue, which is unsupported. A named model expands to :value plus
@update:value; the update payload is the new raw value. @change:value gets
a TValuePayload<T> object: read .newValue (with .oldValue), not event.target.value. The checked
handler is typed from published core. Consult generated API for exact channels.
Select values may include arrays; DatePicker values may include calendar ranges.
The recipe uses published prop types instead of narrowing those unions.
Dates are date strings such as 2026-11-14, not JavaScript Date objects.

Label wraps CheckBox with tag="span", avoiding nested labels. Input uses a
native visible label and explicit stable id. Input's default wrapper is a div,
so do not put it inside Label. aria_label names the interactive field of
composite Select/DatePicker; a placeholder is not an accessible name.
Keep descriptions outside visible labels. Pass booleans with bindings.
Disabled blocks interaction; readonly preserves reading/focus while preventing
editing where supported. Choose the actual component contract rather than CSS.
Use type="submit" for submission and type="button" for other form buttons;
listen to form submit so keyboard submission works too.
