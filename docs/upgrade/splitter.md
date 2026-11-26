# Splitter and shared orientation

## Who is affected

Applications can adopt `Splitter` when they need to resize adjacent panels.
The component is available in all six adapters.
Existing orientation props, events and type imports continue to work.

## Before

Applications that share an orientation value across components can use the existing aliases.

```ts
import type { TProgressLinearOrientation, TTabsOrientation } from '@soxa-ui/core'

const layout: TTabsOrientation = 'horizontal'
const progress: TProgressLinearOrientation = layout
```

## After

`TOrientation` is available from `@soxa-ui/core` and accepts `'horizontal'` and `'vertical'`.
The existing aliases resolve to that same type.

```ts
import type { TOrientation } from '@soxa-ui/core'

const orientation: TOrientation = 'horizontal'
```

The `panels` prop on `Splitter` takes panel IDs and size limits as percentages of the available panel space.
The panel and handle parts reference those IDs in the same layout order.
Oren uses a 100 ms hover delay unless a theme supplies `--so-splitter-hover-delay`.

The slide plugins also accept optional configuration for the track, handle and keyboard handling.
Existing calls keep their current defaults.

## Verification

Type-check existing orientation imports after installing the new packages.
In Playground, move the Splitter handle using the pointer and the arrow keys.
Run `npm run check:compatibility` after building the workspace packages.
