# Compound components and slots

Import Accordion once and use Accordion.Item inside it, with stable item values.
The default item slot is panel content; #header replaces header text and exposes
text, selected and item. The recipe retains readable header text. Select's
#item="{ text }" customizes option content without replacing keyboard behavior.
Consult api-vue-accordion-item and api-vue-select for exact scopes; React render
props and Svelte snippets are different syntax.
Let components own roles, focus and state attributes. Do not nest interactive
buttons inside options/headers or rebuild ARIA-managed parts as custom toggles.
The checked keyboard path uses Enter, arrows, Escape and focus navigation.
