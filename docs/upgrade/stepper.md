# Stepper adoption

## Who is affected

Checkout flows, onboarding and other ordered workflows can use Stepper on every Soxa adapter.

## Before

Vue applications could use Soxa Stepper. Other adapters needed application-managed steps and panels.

## After

Import Stepper from your adapter and give each step a stable value. Use that value on the
corresponding content panel. For React, for example:

```tsx
import { Stepper } from '@soxa-ui/react'

;<Stepper
  aria_label="Checkout steps"
  value="delivery"
  items={[
    { value: 'review', text: 'Review' },
    { value: 'delivery', text: 'Delivery' },
  ]}
  content={() => <Stepper.Content value="delivery">Choose a delivery option</Stepper.Content>}
/>
```

See the [Stepper documentation](../components/stepper.md) for the entry points on each adapter.
Existing Angular ToggleGroup usage needs no migration. Its declaration bundle renames an import
alias for the same descriptor.

## Verification

Render the workflow and check that the current step exposes `aria-current="step"` and shows its
matching panel. In interactive mode, activate another step with the keyboard.
