# Controlled signals and callback events

Solid component bodies execute once per instance. Use createSignal in the body,
read accessors inside JSX (value={name()}), and pass onChangeValue to update
application state from event.newValue. The payload also contains oldValue; it is
not a DOM input event. The sample Input writes lastChange separately so changes
from typing can be distinguished from Reset name updating its prop.

CheckBox, Select and DatePicker signals use the public core props' value types.
Do not force checkbox callbacks to boolean: undefined is part of its public type.
Dates use YYYY-MM-DD; timeZone="UTC" prevents server/browser zone differences for
this example. Do not replace an app callback with Vue v-model or React hooks.

Library callbacks use names such as onChangeValue and onActionClick. Native form
submission uses onSubmit and preventDefault. Button type="submit" participates in
the form; the reset action explicitly has type="button".

Keep reactive reads in JSX. Do not destructure reactive wrapper props, save
props.value in an ordinary local, or call a signal once before rendering when you
need later updates. A wrapper should return <Input value={props.value}
onChangeValue={props.onChangeValue} />. Use Solid's splitProps/mergeProps when
splitting/defaulting a props object is needed. Never add a second writer directly
to the nested DOM input.

Label wraps Input and CheckBox to give each a visible accessible name. Select
and DatePicker have explicit aria_label props. Use related generated API for
naming props rather than copying DOM attributes to an assumed internal element.
The browser checks label focus, checkbox Space, Select arrows/End/Enter/Escape
and calendar ArrowRight/Enter/Escape; these scenarios are not a complete a11y audit.
