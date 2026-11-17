# Compound parts, children and live slot scope

Use the public dotted parts, for example Accordion.Item inside Accordion.
Its ordinary children form the panel body. Its header prop is a function receiving
a live scope. Read scope.text and scope.selected in JSX so opening the item
updates the existing header. Do not destructure the scope in the callback body:
that can rerun the entire render function and replace focused elements.

Select in this recipe uses items data, giving SSR enough information to render
the selected Kazan text before client panels exist. Its item={(scope) =>
<span>{scope.text}</span>} customizes the option. Scope shape comes from the
generated api-solid-select record. Markup Select.Item options live in the portal
and join the collection on the client; do not assume they supply SSR selection.

Use Solid's Show to mount/unmount application subtrees. The example toggles
CtrlExample through Show, so each new instance owns a new controller and listener.
Do not construct JSX eagerly and reuse it under unrelated owners or requests.
Do not import the adapter's private rendering/context helpers into an app.

Tabs are a separate pattern: Tabs.Item belongs to the list, and Tabs.Content
belongs to the content prop, matching its value. This recipe does not validate
Tabs SSR; consult its API and release-specific evidence before extending the
sample. There is no invented parent selection API in these examples.
