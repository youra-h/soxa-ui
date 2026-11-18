# Troubleshoot Angular 0.4.1 consumption

- A blank field with no compiler diagnostic: verify the standalone component import and attribute selector. Use `<div so-input>`, not `<so-input>` or `<input so-input>`.
- A runtime message requesting provideAttrs: add it to the shared application providers, not route/component providers.
- Unstyled controls: put theme CSS in global styles listed by angular.json, and register theme setup/icons once in shared code. CSS imported by main.ts does not reliably reach the page.
- An untyped output or missing event: use valueChange for the current model and soChangeValue for { oldValue, newValue }. React callback names and Vue update:value syntax are not Angular outputs.
- A strict template error after setting a single-date mode: the output retains its public union TDatePickerValue; preserve the union rather than casting it.
- Two state writers fighting: remove either the Forms binding or the value model on that control. Nullable Forms reset leaves null in the form and restores the component default.
- A scoped template renders nothing: import SlotDirective and use the exact slot/context names from the generated Angular record.
- A hydration mismatch: compare raw HTML and initial state, remove invalid nesting and browser access during construction; do not suppress the error or turn off SSR globally.
- A compiler check that accepts [text]="42": ensure ngc, strictTemplates and the component import are active; the maintained smoke deliberately verifies this negative case.

For the exact closed portal/reference observations of this release, request angular-ssr.

Use the pinned package manifest (`examples/angular/package.json`) to reproduce this release. Later library declarations must not silently redefine 0.4.1 examples. Validation (`angular-validation.md`) distinguishes tested behavior and known published defects.
