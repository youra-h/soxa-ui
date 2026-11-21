# Compound components and snippets

Import Accordion once and use Accordion.Item inside it. The header snippet reads
its real scope: text and selected. Selecting the header updates selected and its
rendered open/closed label. children is the default content snippet; a named slot
becomes a snippet prop, for example Select item({ text }). Consult each generated
API record for the slot's actual scope rather than inventing parameter names.

A hyphenated slot is an attribute, not a snippet identifier. Declare a legal
snippet name outside the component and pass it to the published key. The recipe
declares optionLeading({ item }: { item: ISelectItem }) and passes
item-leading={optionLeading} to Select. Its scope contains item, so the example
reads item.text; it does not assume this slot has the default item slot scope. Do not rename published item-*
keys to camelCase. Load api-svelte-select before selecting a slot.

The items prop supplies Select option text during SSR, including the selected
Kazan text in this recipe. Markup collection items join in the browser. Ordinary
portal panels are browser mounted, so do not assume their listbox/popup content
or compound item registration is present in the initial server HTML.
