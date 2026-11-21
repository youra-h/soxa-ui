# Controllers, DOM refs and lifetime

CtrlExample creates a TButton from @soxa-ui/core and passes it as Button ctrl.
The controller is a model, while the React ref receives the component's DOM root
Element (null on removal), not the controller or necessarily an input element.
For focus use the field's public contract or a suitably narrowed DOM reference.

The useRef initialization holds one controller per mounted subtree. Do not put
mutable controllers in module scope in an SSR application: users and requests
must not share form state. Do not construct an event subscription during render.

The effect subscribes to change:text and its cleanup removes that exact handler.
React StrictMode can set up, clean up and set up effects again; cleanup must be
symmetric. The button mutates ctrl.text directly and the adapter reflects it.
The click count demonstrates one notification per change across three complete
unmount/remount cycles. Props and ctrl address the same model: avoid two writers
for the same state. The adapter owns its wiring; application code cleans up only
subscriptions and resources it creates.
