# Controllers, references and cleanup

CtrlExample creates new TButton in instance script, never module scope. It passes
the controller as ctrl to Button and changes ctrl.text from onActionClick.
SvelteKit requests and mounted components must not share mutable controllers.
Do not give the same property competing writers through props and controller.

onMount subscribes to change:text and returns cleanup calling off with the exact
same function. Each remount receives a fresh controller and starts at zero. The
adapter owns its binding/plugin lifetime; application code removes subscriptions,
timers and resources it creates. TButton exposes no public destroy method in
this release: do not invent ctrl.destroy().

Input bind:ref receives the component root Element, not necessarily its nested
input. Narrow the DOM type before using it. bind:this receives the Svelte
component instance, not that element or the Soxa controller. For form focus use
the supported field/controller contract or an explicit correctly narrowed DOM
reference; do not assume ref.focus targets the input. Browser DOM work belongs
in onMount, which does not execute during server rendering.
