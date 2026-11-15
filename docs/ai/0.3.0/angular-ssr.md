# Angular SSR and hydration

The same application config (`examples/angular/src/app/app.config.ts`) is shared by browser and server, including provideAttrs() and provideClientHydration(). main.server.ts (`examples/angular/src/main.server.ts`) bootstraps with the server BootstrapContext; server config (`examples/angular/src/app/app.config.server.ts`) adds provideServerRendering and server routes (`examples/angular/src/app/app.routes.server.ts`). The Node server (`examples/angular/src/server.ts`) serves the built assets and Angular request handler.

Keep theme/icon registration at module scope once per process; create form state and controllers inside application components for each render. Do not access window, document or DOM refs during server construction. Use afterNextRender for browser DOM work. Keep initial data and conditional structure consistent across server and client, and use valid HTML so the browser does not repair nesting before hydration. Do not add random or time-based IDs.

Run ngc with strictTemplates and the production build, then test HTML with JavaScript disabled and hydrate a fresh browser context. Verify initial values after a previously mutated browser session, unique IDs, accessible labels and keyboard operation. Select and DatePicker overlay content follows the published portal lifecycle and may be absent in raw HTML; do not force a client-only whole-page wrapper to hide a hydration failure.

The attached config permits only localhost and 127.0.0.1 and binds its sample Node server to loopback for local reproduction. Configure deployment hosts separately. This recipe does not publish an application. Exact observed HTML/reference limitations and the independent reconstruction are recorded in validation (`angular-validation.md`).
