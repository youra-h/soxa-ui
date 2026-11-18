# Replace icon roles in 0.4.1

Install the icon pack and setup directly when your application imports them.
Icons are data implementing named roles. At startup, call `useIcons(material)`
with the complete `@soxa-ui/icons-material` namespace, then
`useIcons({ close })` with `close` from `@soxa-ui/icons-lucide`. The second call
replaces that role and retains the others. The attached configuration does this
before rendering. Registrations are shared; changing an icon pack is not a
per-component theme prop and is not documented here as a reactive replacement
of icons already rendered.

`ICON_ROLES` is the published role inventory in `@soxa-ui/setup`.
`missingIconRoles(pack)` checks a candidate pack against that release's inventory.
The inspection script checks both installed 0.3.1 packs instead of maintaining
another handwritten list. A partial override is valid after a complete pack.
Without a role the library renders a placeholder and warns; silence is not proof
of a successful icon registration.

For custom artwork, provide a `TIconSource` from setup: `viewBox` and an SVG
`body` without the outer `<svg>`. Use trusted application-owned SVG data. Follow
`--so-icon-color`/`currentColor` where recoloring is intended. This needs neither
`?raw` bundler imports nor a framework template compiler. The attached configuration
also contains a typed application-owned source as an alternative close role.

Use each adapter's Icon/role syntax from its API and framework recipe. SVG is
decorative when adjacent text supplies the meaning; an icon-only control needs
an accessible name on that control. The example names the standalone demonstration
icon and verifies that its SVG body matches the registered replacement. This
checks one role, not visual equivalence of every glyph in a custom pack.
