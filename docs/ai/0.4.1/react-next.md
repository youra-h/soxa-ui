# Next.js App Router and SSR

The checked Next.js pin is 16.2.3 with React/React DOM 19.3.0. Install these exact
versions plus react-installation's Soxa pins, TypeScript types and @types/node@24.10.0.
Use strict Bundler resolution, jsx=react-jsx and Next's generated types.
Run next typegen, tsc --noEmit, next build --webpack, then next start.

The attached layout is a Server Component. Import Oren CSS there. Its Providers
module starts with 'use client' and registers theme/icons at module scope.
This client module executes during server HTML rendering and in the browser,
in the same environment as the library Client Components. Registration performed
only in the Server Component's setup registry does not configure that environment.

page.tsx can import Tabs and reference Tabs.Item/Tabs.Content with serializable
props and React element content. These are references to Client Components;
their interactive implementation executes inside the client boundary and is also
prerendered to HTML. Importing from an RSC does not make their hooks or browser
behavior server-only. Do not call a component implementation as an ordinary function.

client-form.tsx starts with 'use client'. It imports the shared typed form, whose
hooks, event callbacks, render functions and per-mount controller are created
inside that boundary. Do not pass these functions or controller instances across
the server-to-client serialization boundary. Shared recipe modules need no extra
directive when imported exclusively beneath this client entry.

The server renders the initial fields, theme, icons and Tabs tab triggers. Select option
panels and the DatePicker calendar use portals and mount on the client; do not
expect their interactive panel content in raw server HTML. Use items data for
Select's initial selected text. Keep initial values deterministic across server
and browser; the example fixes the date and timeZone="UTC". Keep SSR enabled.
Fresh requests must start with independent form/controller values and unique ids.

In 0.4.1 Select and DatePicker omit aria-controls while their portal targets
are absent, and Calendar removes the label reference to an unmounted month-picker
heading. These fixes do not resolve the separate React Tabs SSR limitation:
even initially active Tabs.Content is absent without JavaScript, and raw SSR
contains two missing Tabs panel targets. After hydration only the inactive
panel target remains absent; switching tabs moves that single gap. The smoke
checks this exact Tabs-only boundary and rejects other reference gaps.
Application code must not rewrite generated ARIA to conceal a library defect.
