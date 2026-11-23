# Show a blurred dialog and soft notifications in Vue

Save the `release-appearance` and `toast-actions` examples as
`ReleaseAppearance.vue` and `ToastActions.vue` at the project root.

Open the dialog to see the tinted, blurred backdrop. Press Escape to close it
and return focus to its opener. Use the two notification buttons to compare
the inherited soft view and the outlined override. Call `useToasts()` inside
a component that is rendered under Toasts so it can find its manager.
