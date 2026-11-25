# Collection preparation and bundle size

## Who is affected

Applications using Soxa components can benefit from smaller bundles when their
component imports do not require initial collection preparation.

## Before

The shared adapter assembly included preparation for `initial` in bundles for
ordinary controls such as Button. Select also bundled that preparation through
the Tags it renders for multiple selection.

## After

Keep using the same component imports, props and slots. Tabs and standalone Tags
still prepare their declared `initial` collections for SSR and hydration. Select
uses its own tag models for multiple selection.

The Web Components entry for Select still registers the public Tags element, so
that entry includes the preparation used by Tags. Individual control entries such
as `@soxa-ui/webc/button` can omit it.

## Verification

Build the same application before and after upgrading and compare the production
JavaScript for the same entry. A page with Button can exclude initial preparation.
For pages using `initial`, check the server markup, keyboard selection and
hydration. In a multiple Select, select and remove an item using the built-in
tags.
