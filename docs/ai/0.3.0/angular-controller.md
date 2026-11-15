# Controllers, refs and component lifetime

The Controller component (`examples/angular/src/app/controller.ts`) creates one TButton from @soxa-ui/core for each Angular component instance. [ctrl]="button" connects that model to TButtonComponent; ordinary template outputs remain available. Mutable controllers belong to the component/request, never a server module singleton.

The example subscribes to change:text with a named function. DestroyRef.onDestroy removes exactly that function via events.off. Angular tears down its adapter bindings when the conditional @if removes the component. Three mount/action/unmount cycles are checked; each new instance begins at zero. Register only application-owned subscriptions and release them with the owning scope.

An Angular template reference on the host (#button) names the host element unless it requests an exported directive. For a component instance use a typed viewChild(TButtonComponent) query; read it only after the view exists, and handle undefined while an @if removes it. ElementRef is a DOM ref, not the core model. Prefer public ctrl for core state and ordinary bindings/outputs for common controls; do not call assembly or adapter runtime helpers.

Use afterNextRender for browser-only DOM work; it does not run during SSR. The maintained form uses it only to expose a hydration readiness marker. State needed for server markup is initialized before rendering, with the same values on client and server.
