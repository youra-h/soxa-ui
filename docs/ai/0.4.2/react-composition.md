# Children, parts and scoped render slots

React's children supplies the default slot when the component declares one.
Named slots are props; a scoped slot accepts a render function. In the attached
form, Select's item callback receives text, and Accordion.Item's header callback
receives text and selected. Use the generated slot scope for each component:
ordinary DOM children or a guessed render prop are not interchangeable.

Accordion owns Accordion.Item. The item's children is panel content, while header
renders the disclosure button's contents. Keep its built-in keyboard, selection
and ARIA wiring. Tabs similarly uses Tabs.Item and a content slot containing
Tabs.Content. Do not replace these parts with hand-built buttons.

Render functions run on the client boundary in Next.js. Pass only serializable
props and React element content from a Server Component, as react-next shows.
For complex custom slots that expose controllers or ARIA spread objects, follow
that component's generated contract rather than copying a different slot shape.
