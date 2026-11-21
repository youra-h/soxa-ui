# State, callback props and accessible fields

TravelRecipes.tsx owns form values in React state. A Soxa onChangeValue callback
receives a TValuePayload<T> with newValue and oldValue, not a DOM ChangeEvent.
The typed Input handler updates the value prop and its audit output together.
Select and DatePicker state types come from ISelectProps and IDatePickerProps;
do not assume every value is a string. Use api-react-input, api-react-check-box,
api-react-select and api-react-date-picker for their complete contracts.

Choose a single application state owner: values plus change callbacks here, or a
controller as in react-controller. Do not mix a second DOM onChange writer into
the same field. A native form onSubmit still receives React's form event.
The Reset name action demonstrates a later prop update reaching the field.

A visible native label uses htmlFor and the Input id; Label wraps CheckBox and
provides its visible accessible name. Select and DatePicker use aria_label in this
small recipe; application copy must explain the field to users. A DatePicker is a
group of editable date parts, not a native input. Preserve built-in keyboard and
ARIA behavior; do not override ids or roles of generated internal parts.
