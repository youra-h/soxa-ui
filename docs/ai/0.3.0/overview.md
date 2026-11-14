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

This initial corpus contains generated component API and one Vue Button example.
It does not establish full framework, SSR, theme or accessibility-guide coverage.
Read the coverage matrix before treating an absent guide as supported behavior.
Contributor instructions describe working inside the library and are a separate
audience; they must not be mixed into application installation instructions.
