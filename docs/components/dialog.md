# Dialog

Dialog is modal by default. Set `modal=false` for a persistent window that leaves the page
available to the pointer, keyboard and screen readers. Opening or closing it does not move
focus; Tab follows the document order. The window has `role="dialog"`, keeps its accessible
name from the title, omits `aria-modal`, and has no visible backdrop or page scroll lock.

`modal` can change while the window is open. Enabling it moves focus into the dialog and
applies modal effects; disabling it releases only this dialog's effects and preserves the
current focus. Another open modal dialog can still block the page. Existing themes continue
to position and paint the same panel; no new theme variables or CSS classes are required.

`dismissible` controls outside presses and Escape independently. With its default `true`,
an outside press requests closing; Escape requests closing only when focus is inside the
non-modal window. Use `dismissible=false` for consent that must wait for an explicit action.
The close button remains controlled by `closable`; all user closure requests retain
`close:before`. The `alert` option uses `alertdialog` only while `modal=true`.

## Backdrop appearance

With Oren, set the backdrop on `Dialog`, `AlertDialog`, or `Drawer` with the
`backdrop` prop. Oren uses `dim` by default. Use `blur` for the tint with
background blur, or `none` for a transparent backdrop. Oren uses `3px` by default for
blur. Override `--so-backdrop-blur` to set the radius.

The shared backdrop element has the `.so-backdrop` class and precedes the panel.

The modal still manages focus and outside presses with a transparent backdrop.
For example, `<Dialog backdrop="none" :dismissible="false">` keeps focus
inside the dialog and ignores outside presses.

## Cookie consent with the Vue package

Install a library version containing the non-modal Dialog feature, plus its compatible Oren
theme. The example imports the public npm packages. This feature does not exist in 0.3.0;
preparing these source changes does not publish a new version.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { Button, Dialog } from '@soxa-ui/vue'
import '@soxa-ui/theme-oren'

const visible = ref(true)

function acceptCookies() {
  // Persist the consent according to the application's policy.
  visible.value = false
}
</script>

<template>
  <Dialog
    v-model:visible="visible"
    :modal="false"
    :dismissible="false"
    :closable="false"
    placement="bottom"
    :width="360"
    class="cookie-consent"
  >
    <template #title>Cookies</template>
    We use cookies to remember your preferences.
    <template #footer>
      <Button @click="acceptCookies">Accept cookies</Button>
    </template>
  </Dialog>
</template>

<style>
.cookie-consent {
  margin-inline-start: 0;
}
</style>
```

The theme keeps the panel fixed to the viewport. `placement="bottom"` chooses the lower
edge; the application class aligns it to the start edge (left in LTR, right in RTL).
It retains the theme's viewport limits on narrow screens.

## Other adapters

| Adapter        | Non-modal input                                                                      |
| -------------- | ------------------------------------------------------------------------------------ |
| React          | `<Dialog modal={false} dismissible={false} title="Cookies">...</Dialog>`             |
| Solid          | `<Dialog modal={false} dismissible={false} title="Cookies">...</Dialog>`             |
| Svelte         | `<Dialog modal={false} dismissible={false}>...</Dialog>` with the title snippet      |
| Angular        | `<div so-dialog [modal]="false" [dismissible]="false">...</div>` with `slot="title"` |
| Web Components | Set `dialog.modal = false` on `<div is="so-dialog">` before showing it               |

The core controller accepts `new TDialog({ modal: false })` and emits `change:modal`.
See the [generated public contract](../api/generated/contract.json) for each adapter's
props, events and model bindings.
