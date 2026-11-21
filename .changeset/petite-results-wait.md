---
'@soxa-ui/theme-base': minor
'@soxa-ui/theme-oren': minor
---

Add shared radius and spacing settings with component overrides and purpose-specific size multipliers. Breaking: spacing variables and CodeBlock radius are now optional final overrides instead of fixed root defaults. Custom themes reading these variables directly must add var() fallbacks or read computed CSS properties; explicit local length overrides continue to win. Alert now uses the compact Toasts spacing reference. See the theme-base README migration guide.
