# Controllers, root refs and cleanup

CtrlExample creates new TButton inside its Solid component body and passes it as
ctrl. Bodies execute once for that mounted instance: no React useRef/useMemo
wrapper is needed. Module-scope mutable controllers would be shared across SSR
requests. Do not give the same property competing writers through a prop and ctrl.

onMount registers change:text with the controller's event bus and onCleanup
removes the same callback. onMount is browser-only; subscriptions and timers you
create need symmetric cleanup. The adapter owns its binding/plugin lifetime.
There is no public ctrl.destroy() to call in this release.

ref receives the component root Element, not the core controller. Its callback
stores the reference; the native Focus controller action narrows to HTMLElement
before focus(). For Input this is the component root and may not be the nested
native field. Use the supported field/controller contract instead of assuming
every root ref is an input. Keep browser DOM work out of server initialization.

The validation remounts the controller three times and navigates away/back in
SolidStart. Each instance starts at zero and one action produces one change event.
This checks observable cleanup behavior; it is not a heap-leak benchmark.
