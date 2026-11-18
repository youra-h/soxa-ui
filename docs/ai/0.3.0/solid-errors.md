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
options cannot. Closed portal triggers may reference targets absent from raw SSR;
the exact findings and strict type/build outcomes are documented in
solid-validation. Never claim complete framework/a11y coverage from this sample.

In exact 0.3.0, raw SSR has two missing aria-controls targets: the Destination
Select list and the Choose date panel. After calendar open/close, one hidden
Calendar dialog retains aria-labelledby ending in -picker-0 with no target.
These are measured release limitations. A later source fix does not change
the immutable npm 0.3.0 bytes, and this corpus does not apply that fix locally.
