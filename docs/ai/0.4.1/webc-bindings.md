# Properties and events

Use typed element properties for application values, items, locale and controllers.
String attributes are not a substitute for objects or arrays. Multiword input
attributes use kebab case (lazy-mount); plugin input aria_label keeps its public
spelling. Native HTML aria-label is a different attribute. Boolean flag presence
enables a flag; use el.disabled = false rather than disabled="false".
There is no tag property to switch a registered element's native tag.

The checked form sets select.items, select.value and picker.value before inserting
the complete subtree. Listen to so:change:value, whose detail is the core
{ newValue, oldValue } payload. This is different from native input/change events.
The native DOM listener API does not infer CustomEvent payload types from the
so: name; check instanceof CustomEvent and narrow detail in application code.
The attached input listener demonstrates this without casting a DOM Event.
Application state is updated by the event; reverse writes assign element.value.

All component event names have the so: prefix, including so:action:press and
so:hide:before. Multi-argument events put an array in detail; consult the exact
API event signature rather than treating every detail as a value payload.
The before event is cancelable: event.preventDefault() cancels the core action.
Events from application-authored elements bubble; those of generated internal
parts/data items do not. Listen to the owning Select or Calendar value event.

The button with type="submit" is a native submitter, and the native fields
participate in FormData. In 0.4.1 Select's named text input submits the visible
text (Moscow), while select.value is the domain code (msk). The sample explicitly
synchronizes its own hidden destinationCode field for that code. Do not assume
all component values equal the native field's submitted text. The DatePicker
submits its single ISO date under departure. No native form reset synchronization
is claimed by this recipe.

Visible Label text wraps Input and CheckBox in the example; verify both the
accessible name and click-to-focus behavior. Name the Select with aria_label and
DatePicker with aria_label="Departure". DatePicker is a group with multiple date
segments, not one text input. Keep library-generated links/roles and keyboard
handling; consult webc-validation for the bounded ARIA observations of 0.4.1.
