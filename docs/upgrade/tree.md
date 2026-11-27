# Tree adoption

## Who is affected

Applications can adopt Tree for navigation or selection in nested collections.
Themes can style Tree rows using the same navigation and indicator attributes
available on existing list components.

## Before

Themes could use `data-highlighted` for the active navigation target and
`data-indicator` for the side reserved for an indicator in ListBox and Select.

## After

Tree emits `data-highlighted` and `data-indicator` on its item and row.
Scope Tree styles to its component parts. In navigation mode, a Tree item can
stay highlighted after activation. In selection mode, `data-indicator` also
controls the position reserved for the selection mark.

See the [Tree documentation](../components/tree.md) for usage in applications.

## Verification

Activate a node in navigation mode and check that its row receives
`data-highlighted="true"`. Render a selectable Tree with `indicator="start"`
or `indicator="end"` and check the selection mark position.
