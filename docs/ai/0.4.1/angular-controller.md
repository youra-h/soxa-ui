# Controllers, refs and component lifetime

The Controller component (`examples/angular/src/app/controller.ts`) creates one TButton from @soxa-ui/core for each Angular component instance. [ctrl]="button" connects that model to TButtonComponent; ordinary template outputs remain available. Mutable controllers belong to the component/request, never a server module singleton.

The example subscribes to change:text with a named function. DestroyRef.onDestroy removes exactly that function via events.off. Angular tears down its adapter bindings when the conditional @if removes the component. Three mount/action/unmount cycles are checked; each new instance begins at zero. Register only application-owned subscriptions and release them with the owning scope.

An Angular template reference such as #button on a Soxa component refers to its Angular component instance; on a plain native element it refers to that element. A typed viewChild(TButtonComponent) query returns the component instance or undefined; read it only after the view exists and handle removal by @if. A query with read: ElementRef selects the host DOM ref instead. Neither ref is the core model. Prefer public ctrl for core state and ordinary bindings/outputs for common controls; do not call assembly or adapter runtime helpers.

Use afterNextRender for browser-only DOM work; it does not run during SSR. The maintained form uses it only to expose a hydration readiness marker. State needed for server markup is initialized before rendering, with the same values on client and server.
