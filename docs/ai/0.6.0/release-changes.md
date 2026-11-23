# Upgrade from Soxa UI 0.5.0 to 0.6.0

Upgrade the component packages and the supplied Base and Oren themes to
`0.6.0`. Use `0.3.3` for either supplied icon pack you install.

## Update custom modal backdrop selectors

Dialog, AlertDialog and Drawer expose the shared `.so-backdrop` element.
Replace selectors that use `.so-dialog__backdrop`, `.so-alert-dialog__backdrop`
or `.so-drawer__backdrop`. To target only the Drawer backdrop, match the panel
that follows it using `.so-backdrop:has(+ :where(.so-drawer))`.

Test outside presses and focus in each modal after changing its CSS.
The transparent Oren backdrop still participates in modal behavior.

## Choose an appearance in Oren

Set `backdrop` on Dialog, AlertDialog or Drawer. Oren defaults to `dim`,
accepts `blur` for tinted blur, and uses `none` for transparency. Use
`--so-backdrop-blur` to override its default radius of `3px`.

Set `view` to `outlined`, `filled` or `soft` on Toasts to choose the default
appearance. Pass `view` to `show()` to override it for one notification.
See `oren-configuration` for theme setup and `vue-appearance` for a Vue example.
