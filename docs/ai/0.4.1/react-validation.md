# React / Next.js 0.4.1 validation

The exact published packages passed the strict type/template checks, production
builds and Chromium interactions in the release-validation record. SSR frameworks
also check raw HTML, initial request state and hydration. This is scripted recipe
validation, not an independent AI-authoring or desktop-client evaluation.

React Tabs retains its documented active-panel SSR omission and bounded panel references. Other historical Select/DatePicker and Calendar exceptions are rejected.
