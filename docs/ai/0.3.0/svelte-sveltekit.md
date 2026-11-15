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

Closed Select and DatePicker triggers reference portal targets mounted only in
the browser. The checked 0.3.0 raw SSR therefore has two missing aria-controls targets. After opening and
closing DatePicker, a hidden Calendar dialog retains aria-labelledby pointing
at an unmounted picker label. These observations are bounded in the smoke;
they are not complete ARIA validity. The diagnostic command also fails strict
types because of published Teleport declarations. See svelte-validation.
