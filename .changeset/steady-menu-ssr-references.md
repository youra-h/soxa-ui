---
'@soxa-ui/react': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
---

Avoid an unresolved Menu trigger aria-controls reference in server-rendered React, Solid, and Svelte markup. The client restores the link when the menu mounts.
