# Soxa UI 0.3.0

Soxa is a headless UI library with framework-independent behavior and adapters for
Vue, React, Angular, Solid, Svelte and Web Components. Install published packages
for the framework you use. Keep core, setup, plugins and adapters on the same exact
library version. Themes and icon packages have independent versions; inspect their
peer dependencies before combining them with a library release.

This source documents **0.3.0**. It must not inherit APIs, examples or instructions
from the current development branch or a newer npm release. The API records come
from the published setup artifact; their framework field determines availability.

Use the component's generated props, events, models and slots for the selected
framework. A contract for one adapter is not an import recipe for another.
Theme-owned values such as variant, view, shape and animation need the selected
theme's type augmentation. The API was generated without a theme and cannot
enumerate every consumer theme's values.

This corpus contains generated component API, a minimal Vue Button sample and
checked Vue/Nuxt travel-form recipes. The vue-start record routes consumers to
installation, models/events, compound slots, controllers, SSR and troubleshooting.
These recipes establish only their stated scenario coverage; they do not establish
full framework or accessibility-guide coverage.
Read the coverage matrix before treating an absent guide as supported behavior.
Contributor instructions describe working inside the library and are a separate
audience; they must not be mixed into application installation instructions.

React and Next.js consumers start with react-start. Its related records cover
installation, typed state callbacks, scoped render slots, controllers and the
Next App Router client boundary. Framework recipe coverage remains sample.

Svelte/SvelteKit consumers start with svelte-start. Its narrow runtime recipes
cover controlled callback values, snippets and request-local controllers. Exact
0.3.0 currently has a strict declaration blocker; consult svelte-errors and
svelte-validation before interpreting sample coverage as typed readiness.

Solid/SolidStart consumers start with solid-start. Its related records cover
signals and callback props, live slot scope, per-instance controllers, root refs
and universal SSR. These checked scenarios establish sample coverage only.
