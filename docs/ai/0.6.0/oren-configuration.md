# Oren 0.6.0 appearance

Import `@soxa-ui/theme-oren` for styles. Register its behavior with
`useTheme(oren)` from `@soxa-ui/setup`, with `oren` imported from
`@soxa-ui/theme-oren/setup`, before mounting. Importing the setup entry also loads
the theme's type augmentation for backdrop and toast views.

Use `data-so-theme="oren"` or `data-so-theme="oren-dark"` on the document
element to cover overlays and notifications rendered outside the local subtree.
Oren light is the default.

Use `backdrop="blur"` on a modal to use the default `3px` blur. To change it
for a particular backdrop, set `--so-backdrop-blur` on that element. Scope
the selector with the adjacent panel when only one modal type should change.

```css
.so-backdrop:has(+ :where(.so-dialog)) {
  --so-backdrop-blur: 6px;
}
```

Set `view="soft"` on Toasts for tinted notifications. Set `view: 'outlined'`
for a single message in `show()` to give it an outline. Clearing the item
controller's own `view` restores the current manager view. Check both Oren
color schemes when choosing these values for your app.
