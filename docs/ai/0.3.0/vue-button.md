# Minimal Vue Button example

Start with a Vue 3 application. Install the exact adapter and setup versions:

```sh
npm install --save-exact @soxa-ui/vue@0.3.0 @soxa-ui/setup@0.3.0
```

The attached App.vue example imports only the published adapter and renders a
headless Button. Its visible text provides the accessible name. The action:click
binding is the explicit Soxa event from the versioned API. Native button keyboard
behavior is retained. The counter demonstrates that the binding reaches Vue state.

No theme or icons are required for this headless example. To style it, select a
compatible independently versioned theme and follow that theme's installation
instructions; do not infer its version from the library number.

This is a client-side Vue sample. It is not a Nuxt, SSR, form submission, styling
or complete Button accessibility recipe. These guides remain separate work.
The generated Vue Button API is the source for prop defaults, typed event payloads,
model updates and slots; do not copy a handwritten API table into this document.
