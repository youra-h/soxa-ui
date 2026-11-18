# Changes documented by the 0.4.1 corpus

Component packages, Base and Oren are pinned to 0.4.1. Material and Lucide
remain at 0.3.1; their version is independent. All API records come from the
published setup artifact, not the development checkout.

## Components added in 0.4.0

- Alert: inline messages with theme variants, content, actions and dismissal.
- AlertDialog: modal confirmations with localized default actions and replaceable
  action content. Application code owns the operation after the user's choice.
- Avatar: image loading with initials or custom fallback content.
- AvatarGroup: the public Avatar.Group part and standalone export for overlapping
  avatars and an explicit overflow count.
- Separator: horizontal/vertical, semantic/decorative boundaries.

Each has generated API for all six adapters. Read the selected adapter's record
for actual imports, props, defaults, events and slots; a class name alone does
not establish an adapter's binding syntax. This corpus does not claim runnable
showcases for these five components. Existing travel-form and shared recipes
retain sample coverage; website guides and demos are maintained separately.

## Fixes in 0.4.1

The release fixes Select/DatePicker references to absent portal targets, Calendar
month-picker label references, DateInput Intl-space normalization, Vue Calendar
hydration state, strict Svelte Teleport declarations, large Web Components
connection queues, local theme inheritance by teleported panels and Oren's
anchored-panel/sticky-header surface. Consumer checks cover their stated recipe
scenarios, not every regression path of these fixes.

React Tabs still omits the initially active content in raw SSR. Its two absent
SSR panel targets and one inactive hydrated panel target remain explicit limits.
Web Components remain browser enhancement, not framework SSR.
