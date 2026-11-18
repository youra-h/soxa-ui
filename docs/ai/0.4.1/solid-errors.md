# Solid release-specific mistakes and limits

If SSR reports browser-only APIs, first verify the Solid compiler and the package's
solid condition. Do not alias to current library source or disable SSR. If typing
rejects a variant, load the theme's setup/type augmentation. Generated API is
unaugmented and cannot enumerate every theme's values.

If an update stops propagating, move the signal/props read into JSX. If a scoped
slot loses focus on updates, read scope fields inside JSX instead of destructuring
in the callback body. If remounts duplicate actions, clean up the application's
listener using the exact same callback. Do not add React render/effect rules.

Use public root refs and ctrl separately; do not assume Input's root is its input.
Select item data can supply selected text on the server; portal-only markup
options cannot. In 0.4.1 closed Select/DatePicker triggers do not reference absent
portal targets, and Calendar removes labels for unmounted picker headings.
The smoke rejects dangling references in SSR and hydrated/open/closed states.
These scenarios do not establish complete framework or accessibility coverage.
