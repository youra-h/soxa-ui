# Universal SvelteKit rendering

Keep SSR enabled. The checked layout uses a module script for static theme/icon
registrations and an instance script for children. Mutable form state and TButton
controllers live in component instance scripts. Never place them in a process
singleton or module variable: requests must receive independent initial state.

The attached routes render Recipes at / and a separate /away page. A client
navigation away destroys the controller and portal wiring; returning creates
fresh state and one subscription. Do not disable SSR or wrap the entire form
in a client-only condition to avoid hydration findings.

No document/window access runs during server initialization. Browser side effects
and subscriptions belong in onMount with symmetric cleanup. The fixture checks
raw HTML without JS, two fresh requests after client changes, unique ids,
initial values/icons, hydration diagnostics and route navigation.

Closed Select and DatePicker portals are browser-mounted. In 0.4.2 their
triggers omit references to absent targets. Calendar removes references to an
unmounted month-picker label. The smoke requires zero dangling references in
SSR, after hydration and popup open/close, and after returning to the route.
