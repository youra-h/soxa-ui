# Use a raw Vue controller

Create a Button controller with `new TButton(...)` from `@soxa-ui/core`
and pass it through the adapter's `ctrl` prop. Keep the controller raw
and use a Vue ref for state rendered by your component. Subscribe on mount
and remove the same subscription on unmount.

Save the `controller` example as `CtrlExample.vue` at the project root.
