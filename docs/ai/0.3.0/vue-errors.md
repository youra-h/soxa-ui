# Troubleshooting this release

- Unknown model: use the generated named channel, never bare v-model.
- Handler receives an object: change:value gets a value payload; update:value
  gets the raw value. Neither is a native input DOM event.
- Theme value rejected: import Oren setup from TypeScript and verify one copy
  of each Soxa package. Do not cast away errors or widen types.
- Empty icons: register one role icon package before rendering, on SSR too.
- Checkbox label warning: use tag="span" inside Label; avoid nested labels.
- Controller updates disappear: keep ctrl raw/per instance and avoid competing
  prop/model and controller ownership of the same value.
- Duplicate callbacks: retain the on handler and off it on unmount.
- Hydration warning: compare initial state, locale, timezone and ids.

Run typecheck and production build, then check accessible names, keyboard and
console. Keep exact locks and report a 0.3.0 defect with a small reproduction
instead of silently switching to main/latest.
