# Angular 0.4.1 consumer entry point

Use the published @soxa-ui/angular **0.4.1** API. This is a checked sample of Angular consumption, not complete framework coverage. Start with installation (`angular-installation.md`), then bindings (`angular-bindings.md`), composition (`angular-composition.md`), controllers (`angular-controller.md`), SSR (`angular-ssr.md`) and troubleshooting (`angular-errors.md`).

For shared component purpose, accessibility and theme concepts, read overview (`overview.md`). Exact props, outputs and slots are generated records with IDs such as api-angular-input, api-angular-label and api-angular-date-picker. Request only the records needed for the interface. Do not substitute another adapter's spelling.

The standalone consumer (`examples/angular/src/app/app.ts`) implements a travel form, model and event outputs, template-driven Select, reactive Input, DatePicker, a scoped Accordion header and controller teardown. Its shared config works in CSR and Angular SSR. Copy the attached sources into an external Angular CLI application, keeping its exact package pins and global stylesheet. See validation (`angular-validation.md`) for the checked matrix and known limits.
