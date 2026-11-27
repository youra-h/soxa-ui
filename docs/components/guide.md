# Guide

Guide is a guided tour for an interface. Its ordered `steps` array can contain a centered panel, a panel next to a DOM element, and a panel next to a point in the viewport.

```vue
<script setup lang="ts">
import { TGuide } from '@soxa-ui/core'
import { Button, Guide } from '@soxa-ui/vue'

const sceneEvents = new EventTarget()
const guide = new TGuide({
  steps: [
    { id: 'welcome', title: 'Meet the editor', mode: 'modal' },
    {
      id: 'toolbar',
      title: 'Editor toolbar',
      anchor: { element: '#editor-toolbar' },
      placement: 'bottom-start',
    },
    {
      id: 'cube',
      title: 'Select the cube',
      anchor: { point: { x: 480, y: 260 } },
      placement: 'end',
      advanceOn: { source: sceneEvents, event: 'cube:selected' },
    },
  ],
})

// Call from the application's object selection handler.
function cubeSelected() {
  sceneEvents.dispatchEvent(new Event('cube:selected'))
}
</script>

<template>
  <Button @click="guide.start()">Start tour</Button>
  <Guide :ctrl="guide" />
</template>
```

- Give each step a unique `id`. `start(id?)` starts at the first step or an explicit step. While running, `previous()`, `next()`, and `goTo(id)` navigate. `next()` on the last step closes the guide and emits `complete`. `close()` dismisses the tour.
- Set `anchor.element` to a CSS selector or a function that returns an element from the mounted page. A missing element leaves the panel centered until the target appears. The guide scrolls a resolved element into view.
- `anchor.point` takes viewport coordinates in CSS pixels. Project a WebGL object to the canvas and convert the projection to viewport coordinates. Replace the step in `guide.steps` with the same `id` to update its point while it is active. The current step and an unchanged `advanceOn` subscription are retained.
- `advanceOn` is optional. It listens to an `EventTarget` only while that step is open and mounted. It accepts native DOM events and application events. Back and Next remain available while the guide waits for an event.
- Steps are nonmodal by default so that the highlighted control remains usable. With `mode: 'modal'`, Guide shows a backdrop and traps focus inside the panel. Set `backdrop` to `none`, `dim`, or `blur` to override the default appearance. An explicit `dim` or `blur` also displays a backdrop on nonmodal steps. The backdrop has a rounded cutout around an element and a circular cutout around a point. Nonmodal steps leave the page interactive.
- The close button appears in the upper corner. Set `closable: false` to hide it. Escape inside the panel requests dismissal and restores focus to the opening element when available.
- A guide can also be supplied declaratively with the `steps` prop and the layer's `visible` prop. With an external `ctrl`, write state through that instance.

Guide is available in all six adapters. See the [generated API contract](../api/generated/contract.json)
for framework bindings and the [upgrade guide](../upgrade/guide.md) for adoption details.
