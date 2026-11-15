# Install and register standalone Angular

The reproducible package manifest (`examples/angular/package.json`) pins Angular packages to 22.2.5, TypeScript to 6.0.2, RxJS to 7.8.2 and every Soxa/theme/icon package to 0.3.0. Angular 22.2+ is the adapter peer minimum; these recipes verify the pinned combination only. Use a Node runtime supported by Angular CLI (checked with Node 24).

Install @angular/forms at the same version as @angular/core. Import each standalone T?Component in the consuming component's imports. Angular selectors are attributes: `<button so-button>`, `<div so-input>` and `<span so-check-box>`. An unimported attribute may silently remain ordinary HTML. Soxa controls that render children need a non-void host; `<input so-input>` is invalid.

Put provideAttrs() in the shared application config's providers, as in app.config.ts (`examples/angular/src/app/app.config.ts`). Route/component providers cannot replace the application's renderer. The helper forwards field attributes/listeners to the inner native input while class/style stay on the host.

Register useTheme(oren) and useIcons(material) once in the shared module, outside request handlers. Import the theme setup in TypeScript so theme values also reach AOT checking. Load CSS through global styles (`examples/angular/src/styles.css`), listed in angular.json; importing CSS from main.ts leaves Angular CLI's stylesheet chunk unloaded. Component sheets include their shared dependencies and avoid loading the entire theme against the default initial bundle budget.

The attached CLI config (`examples/angular/angular.json`), compiler config (`examples/angular/tsconfig.json`), application compiler config (`examples/angular/tsconfig.app.json`), browser entry (`examples/angular/src/main.ts`) and HTML (`examples/angular/src/index.html`) are reusable. Run npm run typecheck (ngc with strictTemplates, strict TS and skipLibCheck=false) and npm run build; ordinary tsc cannot check Angular templates.
