# Stepper

Use Stepper to show progress through an ordered workflow. The Vue component accepts step data
through `items` or declarative `Stepper.Item` children. Give every step a stable string or
number `value`. The active value selects the matching `Stepper.Content` panel.

```vue
<script setup lang="ts">
import { Stepper } from '@soxa-ui/vue'

const items = [
  { value: 'review', text: 'Review', completed: true },
  { value: 'delivery', text: 'Delivery' },
]
</script>

<template>
  <Stepper :items="items" value="delivery" aria_label="Checkout steps" linear>
    <template #content="{ canPrevious, canNext, previous, next }">
      <Stepper.Content value="review">Review your order</Stepper.Content>
      <Stepper.Content value="delivery">Choose a delivery option</Stepper.Content>
      <button type="button" :disabled="!canPrevious" @click="previous()">Back</button>
      <button type="button" :disabled="!canNext" @click="next()">Continue</button>
    </template>
  </Stepper>
</template>
```

Set `linear` to require previous steps to be complete before moving forward. Your application
sets each item's `completed` and `error` state based on its own validation. Use
`:interactive="false"` for a progress display with separate navigation controls and
`orientation="vertical"` to stack the steps.

Provide a group name with `aria_label` or `aria_labelledby`. Interactive step headers are
native buttons, and the current header exposes `aria-current="step"`. Both built-in
icon packs include the `step` glyph. With an older or custom pack that omits `step`,
Stepper uses `arrowRight`.

The [generated API contract](../api/generated/contract.json) lists the props, events and slots
for `stepper`, `stepper-item` and `stepper-content`.
