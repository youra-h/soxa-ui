# Programmatic control in 0.3.0

Choose a public core class for the adapter component, construct a raw object
per mounted control, and pass it through `ctrl`. The example uses `TButton` from
`@soxa-ui/core`. Change its public `text` property and listen to `change:text`;
the adapter renders the model's state. Keep the model outside deep reactive
wrappers. A framework or DOM ref is not a promise of the core model API.

Give each value one owner. With an external ctrl, keep its changing state on
that ctrl; do not mirror the same property through props/models. Mount-time
props can seed non-default values but are not a synchronization contract.
Use one controller per concurrently mounted component. A retained controller
can be remounted after its previous view has gone away; the example does this
three times. Do not destroy application-owned state just because its view unmounts.

`events.on` returns void. Retain the handler and use `events.off` with that same
function when its application owner unmounts. The adapter cleans up the bundle
it creates, while application listeners, timers and observers remain your
responsibility. Subscribe before mounting if you need `bundle:create`.
That payload is `unknown` on the core bus; narrow with `instanceof TPluginBundle`
from the public plugins package. The bundle belongs to that mount; do not keep
using its plugins after teardown, or supply a replacement bundle to a component.

DOM-dependent work waits for the relevant element readiness announcement.
`element:ready` reports the root in an animation frame; `element:removed`
reports its removal. `ready` is model availability, not a promise for all async
plugins or completed layout. SSR does not announce a DOM node. Core events and
plugin events are different contracts: get a plugin from the bundle for its
operations, or use adapter events. The example handles Vue `action:press` to
change ctrl.text and subscribes to the core `plugin:event` transport.

For binding syntax, imports and framework-specific cleanup, retrieve the related
Vue, React, Angular, Svelte, Solid or Web Components controller record. Their
version-specific SSR and type limits still apply. The attached Vue example
validates the shared technique; it does not revalidate those other adapters.
