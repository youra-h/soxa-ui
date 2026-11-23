---
'@soxa-ui/core': minor
'@soxa-ui/setup': patch
'@soxa-ui/theme-base': minor
'@soxa-ui/theme-oren': minor
'@soxa-ui/vue': patch
'@soxa-ui/react': patch
'@soxa-ui/solid': patch
'@soxa-ui/svelte': patch
'@soxa-ui/angular': patch
'@soxa-ui/webc': patch
---

Add shared modal backdrops with theme-defined views. Oren supports transparent, dimmed, and blurred backdrops for Dialog, AlertDialog, and Drawer.

Custom themes must replace .so-dialog__backdrop, .so-alert-dialog__backdrop, and .so-drawer__backdrop with .so-backdrop. For panel-specific styles, match the following panel with :has(+ .so-dialog), :has(+ .so-alert-dialog), or :has(+ .so-drawer). See [upgrading to 0.6.0](https://github.com/youra-h/soxa-ui/blob/v0.6.0/docs/upgrade/0.6.0.md).
