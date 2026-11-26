---
'@soxa-ui/core': patch
'@soxa-ui/plugins': patch
'@soxa-ui/setup': patch
'@soxa-ui/angular': patch
'@soxa-ui/react': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
'@soxa-ui/vue': patch
'@soxa-ui/webc': patch
'@soxa-ui/theme-base': patch
'@soxa-ui/theme-oren': patch
---

Add Splitter with resizable and collapsible panels, pointer and keyboard interaction, and customizable handles for horizontal and vertical layouts.

Share the orientation type across components that support horizontal and vertical layouts.

Configure handle spacing, exact thickness and grip visibility. The handle exposes a named `icon` slot for an optional decorative icon.

Delay the Splitter hover highlight until the pointer rests on the divider for 100 ms. Themes can configure the delay with `--so-splitter-hover-delay`.
