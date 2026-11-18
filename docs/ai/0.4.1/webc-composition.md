# Compound parts and slots

Importing accordion registers its item elements too. Write the full subtree before
first insertion: a div is="so-accordion" owns div is="so-accordion-item" children;
the item's text prop labels its interactive header and its default content is the
expanding panel. Enter/Space operates the header. The checked example uses the
library Accordion rather than a custom disclosure implementation.

There is no Shadow DOM. Named light-DOM children use slot="leading" or another
published slot name; unnamed text/children are default content. A Button can keep
text="Save" and a leading icon, or use default text content to replace its text.
Content for an undeclared slot is not rendered. Slots do not receive the scope
objects shown in canonical API: generated Web Components records explicitly say
scopedSlots=false. There is no Vue slot binding, React render prop or Svelte snippet.

For owners rendering items from data, item-* slot content is a template copied
for each item, for example template slot="item-leading". A copy can inspect its
nearest typed item element's ctrl after connection. It receives no live scope
argument. This sample uses static Accordion items and Select data without a custom
item template, so it does not claim broad template lifecycle coverage.

Initial light DOM is distributed once. Mutating innerHTML on an assembled element
replaces library-owned markup; it is not an application rerender API. Change props
or replace a complete application subtree instead. Late collection items join their
owner but are not automatically moved into its rendered list; avoid guessing
internal insertion targets in a generic application recipe.
