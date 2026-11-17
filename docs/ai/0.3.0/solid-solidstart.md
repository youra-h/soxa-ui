# SolidStart universal rendering and hydration

The complete SolidStart project has client/server entries, a Router with
FileRoutes, and home/away routes. Keep SSR enabled. Use the SolidStart compiler's
solid export condition on both sides, rather than a client-only wrapper or a
browser build imported into Node. No React use-client directive is used.

Static theme/icon registrations run once in app.tsx's imported setup module.
Signals and TButton controllers live inside component bodies. Independent
requests and a return navigation start from the same empty name, unchecked policy,
Kazan selection, fixed date and zero controller count.

The server renders the form and selected text; portaled options and calendar
mount in the browser. Stable initial props, locale and UTC keep server/browser
inputs consistent. onMount is the place for browser work; onCleanup removes
application subscriptions on disposal. A ref callback alone is not a license to
read document/window while rendering.

The smoke checks HTML with JavaScript disabled, two independent requests after
client mutations, unique ids, icons/theme, hydration diagnostics, interactive
state, and client navigation away/back. Missing portal ARIA targets are recorded
as release limits in solid-errors/solid-validation, not hidden by disabling SSR.
