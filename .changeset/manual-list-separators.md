---
'@soxa-ui/core': patch
'@soxa-ui/setup': patch
'@soxa-ui/plugins': patch
'@soxa-ui/vue': patch
'@soxa-ui/react': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
'@soxa-ui/angular': patch
'@soxa-ui/webc': patch
'@soxa-ui/theme-base': patch
---

Add `Select.Separator` and `ListBox.Separator` to separate groups written in markup. A separator hides when filtering leaves no shown content on one of its sides, including adjacent separators and list edges.

Record the manual separator emission sites in the existing theme class contract.
